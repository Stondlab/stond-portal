// Reconectar a conta do Instagram de um cliente (Stond)
// POST {client_id, token} com login da equipe (is_team). A Helo cola o token de usuário gerado para o app Stond.
// Só aceita token válido deste app.
// Troca por token longo, pega o token da Página e grava em dm_accounts. Nunca devolve o token.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const GRAPH = "https://graph.facebook.com/v23.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "https://gestao.stond.com.br", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const cfg = async (k: string) => (await db.from("dm_config").select("value").eq("key", k).maybeSingle()).data?.value ?? null;
async function get(path: string, params: Record<string, string>) {
  const u = new URL(GRAPH + path); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u); const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j?.error?.message || `HTTP ${r.status}`); return j;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "método" }, 405);
  const auth = req.headers.get("authorization");
  if (!auth) return json({ error: "Acesso restrito" }, 401);
  const u = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  if ((await u.rpc("is_team")).data !== true) return json({ error: "Acesso restrito" }, 401);
  try {
    const { client_id, token: raw } = await req.json();
    const token = String(raw ?? "").trim();
    const appId = await cfg("app_id"), secret = await cfg("app_secret");
    if (!appId || !secret) throw new Error("app sem configuração");
    const dbg = (await get("/debug_token", { input_token: token, access_token: `${appId}|${secret}` })).data ?? {};
    if (!dbg.is_valid || String(dbg.app_id) !== String(appId)) throw new Error("token inválido ou de outro app");
    const { data: cli } = await db.from("clients").select("handle").eq("id", client_id).maybeSingle();
    if (!cli) throw new Error("cliente não encontrado");

    let long = token;
    try { const ex = await get("/oauth/access_token", { grant_type: "fb_exchange_token", client_id: appId, client_secret: secret, fb_exchange_token: token }); if (ex.access_token) long = ex.access_token; } catch (_) { /* segue com o curto */ }
    const pages = await get("/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "100", access_token: long });
    const withIg = (pages.data ?? []).filter((p: any) => p.instagram_business_account);
    const page = withIg.find((p: any) => p.instagram_business_account.username?.toLowerCase() === cli.handle?.toLowerCase()) ?? (withIg.length === 1 ? withIg[0] : null);
    if (!page) throw new Error(`não achei a Página ligada ao @${cli.handle}`);
    await fetch(`${GRAPH}/${page.id}/subscribed_apps?subscribed_fields=feed&access_token=${encodeURIComponent(page.access_token)}`, { method: "POST" }).catch(() => {});
    const { error } = await db.from("dm_accounts").upsert({
      client_id, api: "fb", ig_user_id: String(page.instagram_business_account.id), username: page.instagram_business_account.username,
      page_id: page.id, page_name: page.name, access_token: page.access_token, token_updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return json({ ok: true, username: page.instagram_business_account.username, page: page.name, scopes: dbg.scopes ?? [] });
  } catch (e) { return json({ error: (e as Error).message }, 400); }
});
