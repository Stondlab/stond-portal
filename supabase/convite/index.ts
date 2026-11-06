// Convite por e-mail para o portal do cliente (Stond)
// POST {client_id, email} com login da equipe. Manda o e-mail de convite do Supabase Auth
// (modelo da Stond, remetente naoresponda@stond.com.br). Se a pessoa já tem conta, manda o link de acesso.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ORIGINS = ["https://gestao.stond.com.br", "https://portal.stond.com.br"];
const cors = (req: Request) => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(req.headers.get("origin") ?? "") ? req.headers.get("origin")! : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

Deno.serve(async (req) => {
  const H = { ...cors(req), "Content-Type": "application/json" };
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: H });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return out({ error: "método" }, 405);

  const auth = req.headers.get("authorization");
  if (!auth) return out({ error: "Acesso restrito" }, 401);
  const u = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
  const { data: team } = await u.rpc("is_team");
  if (team !== true) return out({ error: "Acesso restrito" }, 401);

  const { client_id, email: raw } = await req.json().catch(() => ({}));
  const email = String(raw ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out({ error: "E-mail inválido" }, 400);
  const { data: c } = await db.from("clients").select("id,access_token,data").eq("id", client_id).maybeSingle();
  if (!c?.access_token) return out({ error: "Cliente não encontrado" }, 400);

  const redirectTo = `https://portal.stond.com.br/?convite=${c.access_token}`;
  let kind = "convite";
  const inv = await db.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inv.error) {
    if (!/already|registered|exists/i.test(inv.error.message)) return out({ error: inv.error.message }, 400);
    const anon = createClient(URL_, ANON);
    const otp = await anon.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
    if (otp.error) return out({ error: otp.error.message }, 400);
    kind = "link";
  }
  await db.from("clients").update({ data: { ...(c.data ?? {}), email, convite_em: new Date().toISOString() } }).eq("id", c.id);
  return out({ ok: true, kind, email });
});
