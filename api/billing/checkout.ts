import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseServiceClient } from '../_lib/supabaseServer';

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function basicAuth(serverKey: string) {
  // Midtrans uses Basic auth: base64(serverKey + ":")
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  try {
    const serverKey = env('MIDTRANS_SERVER_KEY');
    const isProd = (process.env.MIDTRANS_IS_PROD ?? '').toLowerCase() === 'true';
    const base = isProd ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';

    const body = (typeof req.body === 'string' ? (JSON.parse(req.body) as any) : (req.body as any)) ?? {};
    const buyerName = String(body.buyerName ?? '').trim();
    const buyerEmail = String(body.buyerEmail ?? '').trim();
    const buyerPhone = String(body.buyerPhone ?? '').trim();
    const packageId = String(body.packageId ?? 'growth');
    const amount = Number(body.amount ?? 0);
    const leadId = String(body.leadId ?? '').trim() || null;
    const plan = String(body.plan ?? '').trim().toUpperCase(); // MONTHLY | LIFETIME (optional)

    if (!buyerName || !buyerEmail || !buyerPhone) return json(res, 400, { error: 'missing_buyer_fields' });
    if (!Number.isFinite(amount) || amount <= 0) return json(res, 400, { error: 'invalid_amount' });

    const planTag = plan === 'LIFETIME' ? 'LIFE' : 'MONTH';
    const orderId = `SUB-${planTag}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`.slice(0, 50);

    const snapPayload = {
      transaction_details: { order_id: orderId, gross_amount: Math.round(amount) },
      customer_details: { first_name: buyerName, email: buyerEmail, phone: buyerPhone },
      item_details: [{ id: packageId, price: Math.round(amount), quantity: 1, name: `Omnifyi POS - ${packageId}` }],
      custom_field1: leadId ?? undefined,
      custom_field2: plan || undefined,
    };

    const r = await fetch(`${base}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: basicAuth(serverKey),
      },
      body: JSON.stringify(snapPayload),
    });

    const text = await r.text();
    if (!r.ok) return json(res, 400, { error: 'midtrans_error', status: r.status, detail: text.slice(0, 1000) });

    const parsed = JSON.parse(text) as { token: string; redirect_url: string };
    const supabase = getSupabaseServiceClient();
    await supabase.from('payment_orders').insert({
      context: 'SUBSCRIPTION',
      order_id: orderId,
      gross_amount: Math.round(amount),
      status: 'PENDING',
      currency: 'IDR',
      raw: {
        packageId,
        leadId,
        buyerName,
        buyerEmail,
        buyerPhone,
        plan: plan || undefined,
        snap: { redirect_url: parsed.redirect_url },
      },
    });
    return json(res, 200, { orderId, token: parsed.token, redirectUrl: parsed.redirect_url });
  } catch (e: any) {
    return json(res, 500, { error: 'server_error', detail: e?.message || String(e) });
  }
}

