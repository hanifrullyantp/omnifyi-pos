import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Public Supabase URL + anon key untuk bootstrap client di browser.
 * Env dibaca di runtime Vercel (serverless), jadi tetap jalan walau `vite build`
 * tidak menyematkan `VITE_*` ke bundle (mis. root project / preset salah).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Content-Type', 'application/json').send(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }
  const url = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '').trim();
  res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
    .send(JSON.stringify({ url: url || null, anonKey: anonKey || null }));
}
