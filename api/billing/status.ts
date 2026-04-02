import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  try {
    const serverKey = env('MIDTRANS_SERVER_KEY');
    const isProd = (process.env.MIDTRANS_IS_PROD ?? '').toLowerCase() === 'true';
    const base = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

    const orderId = String(req.query.orderId ?? '').trim();
    if (!orderId) return json(res, 400, { error: 'missing_order_id' });

    const r = await fetch(`${base}/v2/${encodeURIComponent(orderId)}/status`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: basicAuth(serverKey) },
    });
    const text = await r.text();
    if (!r.ok) return json(res, 400, { error: 'midtrans_error', status: r.status, detail: text.slice(0, 1000) });

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const transaction_status = String(parsed.transaction_status ?? '');
    const fraud_status = String(parsed.fraud_status ?? '');
    const status_code = String(parsed.status_code ?? '');
    const gross_amount = String(parsed.gross_amount ?? '');

    const paid =
      transaction_status === 'settlement' ||
      transaction_status === 'capture' ||
      transaction_status === 'success';

    return json(res, 200, { paid, transaction_status, fraud_status, status_code, gross_amount, raw: parsed });
  } catch (e: any) {
    return json(res, 500, { error: 'server_error', detail: e?.message || String(e) });
  }
}

