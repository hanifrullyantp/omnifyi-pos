import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getSupabaseServiceClient } from '../_lib/supabaseServer';

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function text(res: VercelResponse, status: number, body: string) {
  res.status(status).setHeader('Content-Type', 'text/plain').send(body);
}

function sha512Hex(s: string) {
  return crypto.createHash('sha512').update(s).digest('hex');
}

function mapOrderStatus(transactionStatus: string): 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' {
  const s = (transactionStatus || '').toLowerCase();
  if (s === 'settlement' || s === 'capture' || s === 'success') return 'PAID';
  if (s === 'expire' || s === 'expired') return 'EXPIRED';
  if (s === 'cancel' || s === 'deny' || s === 'failure') return 'FAILED';
  return 'PENDING';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return text(res, 405, 'method_not_allowed');

  try {
    const serverKey = env('MIDTRANS_SERVER_KEY');
    const body = (typeof req.body === 'string' ? (JSON.parse(req.body) as any) : (req.body as any)) ?? {};

    const orderId = String(body.order_id ?? '');
    const statusCode = String(body.status_code ?? '');
    const grossAmount = String(body.gross_amount ?? '');
    const signatureKey = String(body.signature_key ?? '');
    const transactionStatus = String(body.transaction_status ?? '');

    if (!orderId || !statusCode || !grossAmount || !signatureKey) return text(res, 400, 'missing_fields');

    const expected = sha512Hex(`${orderId}${statusCode}${grossAmount}${serverKey}`);
    if (expected !== signatureKey) return text(res, 401, 'invalid_signature');

    const supabase = getSupabaseServiceClient();
    const mapped = mapOrderStatus(transactionStatus);
    const receivedAt = new Date().toISOString();

    await supabase.from('payment_events').insert({
      order_id: orderId,
      received_at: receivedAt,
      signature_verified: true,
      transaction_status: transactionStatus,
      status_code: statusCode,
      gross_amount: grossAmount,
      payload: body,
    });

    const { data: existingOrder } = await supabase
      .from('payment_orders')
      .select('order_id, context, gross_amount, status, raw')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!existingOrder?.order_id) {
      // Unknown order_id. Acknowledge to avoid webhook retries storm.
      return text(res, 200, 'ok');
    }

    // Validate gross amount (best-effort; keep tolerant to formatting like "10000.00")
    const expectedGross = Number(existingOrder.gross_amount);
    const gotGross = Number(grossAmount);
    if (Number.isFinite(expectedGross) && Number.isFinite(gotGross) && Math.round(expectedGross) !== Math.round(gotGross)) {
      await supabase.from('payment_events').insert({
        order_id: orderId,
        received_at: receivedAt,
        signature_verified: true,
        transaction_status: transactionStatus,
        status_code: statusCode,
        gross_amount: grossAmount,
        payload: { error: 'gross_amount_mismatch', expected: expectedGross, got: gotGross, original: body },
      });
      return text(res, 200, 'ok');
    }

    if (mapped !== existingOrder.status) {
      await supabase
        .from('payment_orders')
        .update({
          status: mapped,
          paid_at: mapped === 'PAID' ? receivedAt : null,
          payment_type: String(body.payment_type ?? '') || null,
          midtrans_transaction_id: String(body.transaction_id ?? '') || null,
          acquirer: String(body.acquirer ?? '') || null,
          raw: { ...(existingOrder.raw ?? {}), webhook: body },
        })
        .eq('order_id', orderId);
    }

    if (existingOrder.context === 'SUBSCRIPTION' && mapped === 'PAID') {
      const plan = String((existingOrder.raw as any)?.plan ?? '').toUpperCase();
      const subPlan = plan === 'LIFETIME' || plan === 'LIFE' ? 'LIFETIME' : 'MONTHLY';
      const now = new Date();
      const validUntil = subPlan === 'LIFETIME' ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Best effort: tie to tenant if known in raw; otherwise create a generic subscription record.
      await supabase.from('subscriptions').insert({
        tenant_id: (existingOrder.raw as any)?.tenantId ?? null,
        owner_user_id: (existingOrder.raw as any)?.ownerUserId ?? null,
        status: 'ACTIVE',
        plan: subPlan,
        valid_until: validUntil,
        activated_at: now.toISOString(),
        last_payment_order_id: orderId,
      });
    }

    return text(res, 200, 'ok');
  } catch (e: any) {
    return text(res, 500, e?.message || 'server_error');
  }
}

