// Conectar a conta do Instagram de um cliente (Stond). Sempre com login da equipe (is_team). Nunca devolve o token.
// Dois caminhos:
// 1) Pela Página do Facebook (api "fb"): POST {client_id, token}. A Helo cola o token de usuário gerado para o app Stond.
//    Troca por token longo, pega o token da Página ligada ao @ do cliente e grava em dm_accounts.
// 2) Direto pelo Instagram, sem Página (api "ig", "Login com Instagram"):
//    POST {action:"ig_start", client_id} devolve o link de autorização do Instagram.
//    POST {action:"ig_code", client_id, code} troca o código por token longo (60 dias) e grava em dm_accounts.
//    O token é renovado pelo ig-metrics na rodada diária.
//    Precisa de dm_config ig_app_id e ig_app_secret (Painel do app Meta > Instagram > Configuração da API com login do Instagram).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const GRAPH = "https://graph.facebook.com/v23.0";
const IG_GRAPH = "https://graph.instagram.com";
const IG_REDIRECT = "https://gestao.stond.com.br/gestao/ig";
const IG_SCOPES = "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights,instagram_business_manage_comments,instagram_business_manage_messages";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "https://gestao.stond.com.br", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const cfg = async (k: string) => (await db.from("dm_config").select("value").eq("key", k).maybeSingle()).data?.value ?? null;
async function get(path: string, params: Record<string, string>, base = GRAPH) {
  const u = new URL(base + path); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u); const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j?.error?.message || j?.error_message || `HTTP ${r.status}`); return j;
}

async function igStart(client_id: string) {
  const appId = await cfg("ig_app_id");
  if (!appId) throw new Error("Falta configurar o Login com Instagram no app Stond (ig_app_id)");
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", appId);
  u.searchParams.set("redirect_uri", IG_REDIRECT);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", IG_SCOPES);
  u.searchParams.set("force_reauth", "true");
  u.searchParams.set("state", client_id + "." + crypto.randomUUID());
  return json({ ok: true, url: u.toString() });
}

async function igCode(client_id: string, rawCode: string) {
  const appId = await cfg("ig_app_id"), secret = await cfg("ig_app_secret");
  if (!appId || !secret) throw new Error("Falta configurar o Login com Instagram no app Stond (ig_app_id / ig_app_secret)");
  const code = String(rawCode ?? "").replace(/#_$/, "").trim();
  if (!code) throw new Error("código vazio");
  const { data: cli } = await db.from("clients").select("handle").eq("id", client_id).maybeSingle();
  if (!cli) throw new Error("cliente não encontrado");

  const r = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({ client_id: appId, client_secret: secret, grant_type: "authorization_code", redirect_uri: IG_REDIRECT, code }),
  });
  const short = await r.json().catch(() => ({}));
  if (!r.ok || !short.access_token) throw new Error(short?.error_message || short?.error?.message || "O Instagram recusou o código");
  const granted: string[] = String(short.permissions ?? "").split(",").filter(Boolean);

  let token = short.access_token;
  try { const ex = await get("/access_token", { grant_type: "ig_exchange_token", client_secret: secret, access_token: token }, IG_GRAPH); if (ex.access_token) token = ex.access_token; } catch (_) { /* segue com o curto */ }
  const me = await get("/v23.0/me", { fields: "user_id,username", access_token: token }, IG_GRAPH);
  const username = String(me.username ?? "");
  if (cli.handle && username && cli.handle.toLowerCase() !== username.toLowerCase())
    throw new Error(`Você entrou como @${username}, mas o cliente está cadastrado como @${cli.handle}. Saia do Instagram e entre na conta certa.`);

  const { error } = await db.from("dm_accounts").upsert({
    client_id, api: "ig", ig_user_id: String(me.user_id ?? short.user_id), username,
    page_id: null, page_name: null, access_token: token, token_updated_at: new Date().toISOString(), active: true,
  });
  if (error) throw new Error(error.message);
  if (!cli.handle && username) await db.from("clients").update({ handle: username }).eq("id", client_id);
  return json({ ok: true, username, api: "ig", scopes: granted });
}

async function fbToken(client_id: string, raw: string) {
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
  return json({ ok: true, username: page.instagram_business_account.username, page: page.name, api: "fb", scopes: dbg.scopes ?? [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "método" }, 405);
  const auth = req.headers.get("authorization");
  if (!auth) return json({ error: "Acesso restrito" }, 401);
  const u = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  if ((await u.rpc("is_team")).data !== true) return json({ error: "Acesso restrito" }, 401);
  try {
    const body = await req.json();
    const client_id = String(body.client_id ?? "");
    if (!client_id) throw new Error("cliente não informado");
    if (body.action === "ig_start") return await igStart(client_id);
    if (body.action === "ig_code") return await igCode(client_id, body.code);
    return await fbToken(client_id, body.token);
  } catch (e) { return json({ error: (e as Error).message }, 400); }
});
