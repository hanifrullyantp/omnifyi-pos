import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseServiceClient } from '../../_lib/supabaseServer';

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function basicAuth(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

function safeShort(s: string, n: number) {
  return (s || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, n);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  try {
    const serverKey = env('MIDTRANS_SERVER_KEY');
    const isProd = (process.env.MIDTRANS_IS_PROD ?? '').toLowerCase() === 'true';
    const base = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

    const body = (typeof req.body === 'string' ? (JSON.parse(req.body) as any) : (req.body as any)) ?? {};
    const businessId = String(body.businessId ?? '').trim();
    const tenantId = String(body.tenantId ?? '').trim();
    const cashierId = String(body.cashierId ?? '').trim();
    const invoiceNumber = String(body.invoiceNumber ?? '').trim();
    const grossAmount = Number(body.grossAmount ?? 0);

    if (!businessId || !tenantId || !cashierId || !invoiceNumber) return json(res, 400, { error: 'missing_fields' });
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) return json(res, 400, { error: 'invalid_amount' });

    const orderId = `POS-${safeShort(businessId, 8)}-${safeShort(invoiceNumber, 24)}-${Date.now().toString(16).slice(-6)}`.slice(
      0,
      50,
    );

    const payload = {
      payment_type: 'qris',
      transaction_details: { order_id: orderId, gross_amount: Math.round(grossAmount) },
      custom_field1: businessId,
      custom_field2: invoiceNumber,
      custom_field3: cashierId,
    };

    const r = await fetch(`${base}/v2/charge`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: basicAuth(serverKey),
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) return json(res, 400, { error: 'midtrans_error', status: r.status, detail: text.slice(0, 1000) });

    const parsed = JSON.parse(text) as any;
    const transactionId = String(parsed.transaction_id ?? '');
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
    const qrUrl =
      actions.find((a: any) => String(a?.name ?? '') === 'generate-qr-code')?.url ??
      actions.find((a: any) => String(a?.name ?? '') === 'deeplink-redirect')?.url ??
      null;
    const qrString = String(parsed.qr_string ?? '') || null;

    const supabase = getSupabaseServiceClient();
    await supabase.from('payment_orders').insert({
      context: 'POS',
      order_id: orderId,
      tenant_id: tenantId,
      business_id: businessId,
      invoice_number: invoiceNumber,
      pos_transaction_id: null,
      gross_amount: Math.round(grossAmount),
      status: 'PENDING',
      currency: 'IDR',
      midtrans_transaction_id: transactionId || null,
      payment_type: 'qris',
      qr_string: qrString,
      qr_url: qrUrl,
      raw: { charge: parsed },
    });

    return json(res, 200, { orderId, transactionId, qrUrl, qrString, raw: parsed });
  } catch (e: any) {
    return json(res, 500, { error: 'server_error', detail: e?.message || String(e) });
  }
}

