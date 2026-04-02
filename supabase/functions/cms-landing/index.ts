/**
 * CMS landing — kontrak sama dengan src/lib/landingContent.ts
 * GET  ?action=get  — baca JSON konten (tanpa secret)
 * POST ?action=save — simpan JSON (header x-admin-secret)
 * POST ?action=upload — multipart field "file" (header x-admin-secret)
 *
 * Set secret: supabase secrets set CONTENT_ADMIN_SECRET="kata-rahasia-panjang"
 * Bucket Storage: landing-assets (buat di dashboard + public read untuk URL aset)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const LANDING_PATH = "cms/landing-content.json";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function bad(msg: string, status = 400) {
  return new Response(msg, { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return bad("Server misconfigured: missing Supabase env", 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const adminSecret = Deno.env.get("CONTENT_ADMIN_SECRET") ?? "";

  if (action === "get" && req.method === "GET") {
    const { data: blob, error } = await supabase.storage
      .from("landing-assets")
      .download(LANDING_PATH);

    if (error || !blob) {
      return json({});
    }
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return new Response(JSON.stringify(parsed), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch {
      return json({});
    }
  }

  if (action === "save" && req.method === "POST") {
    if (!adminSecret) {
      return bad("CONTENT_ADMIN_SECRET not set on server", 500);
    }
    const sent = req.headers.get("x-admin-secret");
    if (sent !== adminSecret) {
      return bad("Unauthorized", 401);
    }
    const body = await req.text();
    try {
      JSON.parse(body);
    } catch {
      return bad("Invalid JSON", 400);
    }

    const { error } = await supabase.storage
      .from("landing-assets")
      .upload(LANDING_PATH, body, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error(error);
      return bad(error.message, 500);
    }
    return json({ ok: true });
  }

  if (action === "upload" && req.method === "POST") {
    if (!adminSecret) {
      return bad("CONTENT_ADMIN_SECRET not set on server", 500);
    }
    const sent = req.headers.get("x-admin-secret");
    if (sent !== adminSecret) {
      return bad("Unauthorized", 401);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return bad("Missing file field", 400);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${crypto.randomUUID()}-${safeName}`;
    const buf = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from("landing-assets")
      .upload(path, buf, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      console.error(upErr);
      return bad(upErr.message, 500);
    }

    const { data: pub } = supabase.storage
      .from("landing-assets")
      .getPublicUrl(path);

    // Jika bucket tidak public, publicUrl akan ada tapi bisa 403. Maka kita juga sediakan signed URL.
    const signed = await supabase.storage.from("landing-assets").createSignedUrl(path, 60 * 60 * 24 * 7); // 7 hari
    const signedUrl = signed.data?.signedUrl ?? null;
    const expiresIn = signed.data?.expiresIn ?? null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    return json({ publicUrl: pub.publicUrl, signedUrl, expiresAt });
  }

  return bad("Use ?action=get|save|upload", 400);
});
