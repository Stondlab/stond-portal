// Publicação agendada no Instagram (Stond)
// - POST {action:"run"} com cabeçalho x-cron-key: publica o que está na hora (chamado a cada 5 min pelo pg_cron)
// - POST {action:"now", post_id} com login da equipe: publica na hora
// - POST {action:"check", client_id} com login da equipe: confere se a conta pode publicar
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH = "https://graph.facebook.com/v23.0";
const IG_GRAPH = "https://graph.instagram.com/v23.0";
const MEDIA = `${URL_}/storage/v1/object/public/media/`;
const ORIGINS = ["https://gestao.stond.com.br", "https://portal.stond.com.br"];

const cors = (req: Request) => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(req.headers.get("origin") ?? "") ? req.headers.get("origin")! : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

async function config(key: string) {
  const { data } = await db.from("dm_config").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

type Acc = { api: string; ig_user_id: string; access_token: string };
const base = (a: Acc) => (a.api === "ig" ? IG_GRAPH : GRAPH);

async function graph(a: Acc, path: string, params?: Record<string, string>, method = "GET") {
  const u = new URL(base(a) + path);
  const body = new URLSearchParams({ ...(params ?? {}), access_token: a.access_token });
  const res = method === "GET"
    ? await fetch(`${u}?${body}`)
    : await fetch(u, { method, body });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j?.error?.error_user_msg || j?.error?.message || `HTTP ${res.status}`);
  return j;
}

const full = (u: string, client: string) => (!u ? "" : /^https?:/.test(u) ? u : MEDIA + client + "/" + u);

async function waitReady(a: Acc, id: string, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await graph(a, `/${id}`, { fields: "status_code" });
    if (s.status_code === "FINISHED") return true;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error("A Meta não conseguiu processar o arquivo (" + s.status_code + ")");
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function publish(post: any) {
  const { data: acc } = await db.from("dm_accounts").select("api,ig_user_id,access_token,active").eq("client_id", post.client_id).maybeSingle();
  if (!acc?.access_token) throw new Error("A conta do Instagram deste cliente não está conectada");
  const a = acc as Acc, ig = a.ig_user_id;
  const media = (post.media ?? []).map((m: any) => ({ ...m, u: full(m.url, post.client_id) })).filter((m: any) => m.u);
  if (!media.length) throw new Error("O post não tem imagem ou vídeo");
  const caption = post.caption ?? "";
  let creation = post.ig_container as string | null;

  if (!creation) {
    if (post.type === "story") {
      const m = media[0];
      creation = (await graph(a, `/${ig}/media`, m.kind === "video" ? { media_type: "STORIES", video_url: m.u } : { media_type: "STORIES", image_url: m.u }, "POST")).id;
    } else if (media.length > 1) {
      const kids: string[] = [];
      for (const m of media.slice(0, 20)) {
        const k = (await graph(a, `/${ig}/media`, m.kind === "video" ? { media_type: "VIDEO", video_url: m.u, is_carousel_item: "true" } : { image_url: m.u, is_carousel_item: "true" }, "POST")).id;
        if (m.kind === "video") await waitReady(a, k);
        kids.push(k);
      }
      creation = (await graph(a, `/${ig}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption }, "POST")).id;
    } else if (media[0].kind === "video") {
      const p: Record<string, string> = { media_type: "REELS", video_url: media[0].u, caption, share_to_feed: "true" };
      if (media[0].poster) p.cover_url = full(media[0].poster, post.client_id);
      creation = (await graph(a, `/${ig}/media`, p, "POST")).id;
    } else {
      creation = (await graph(a, `/${ig}/media`, { image_url: media[0].u, caption }, "POST")).id;
    }
    await db.from("posts").update({ ig_container: creation, publish_status: "publicando" }).eq("id", post.id);
  }

  if (!(await waitReady(a, creation!))) return { pending: true }; // vídeo ainda processando: tenta de novo na próxima rodada
  const pub = await graph(a, `/${ig}/media_publish`, { creation_id: creation! }, "POST");
  let permalink = null;
  try { permalink = (await graph(a, `/${pub.id}`, { fields: "permalink" })).permalink; } catch (_) { /* sem link, segue */ }
  await db.from("posts").update({
    publish_status: "publicado", status: "publicado", ig_media_id: pub.id, permalink, publish_error: null, ig_container: null,
    updated_at: new Date().toISOString(),
  }).eq("id", post.id);
  return { ok: true, id: pub.id, permalink };
}

async function runOne(post: any) {
  try {
    return await publish(post);
  } catch (e) {
    const msg = (e as Error).message;
    // container expirado ou inválido: limpa para recriar na próxima
    await db.from("posts").update({ publish_status: "erro", publish_error: msg, ig_container: null }).eq("id", post.id);
    return { error: msg };
  }
}

async function isTeam(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const u = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
  const { data } = await u.rpc("is_team");
  return data === true;
}

Deno.serve(async (req) => {
  const H = { ...cors(req), "Content-Type": "application/json" };
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: H });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return out({ error: "método" }, 405);
  const body = await req.json().catch(() => ({}));

  if (body.action === "run") {
    const key = await config("cron_key");
    if (!key || req.headers.get("x-cron-key") !== key) return out({ error: "não autorizado" }, 401);
    const { data: due } = await db.from("posts").select("*")
      .in("publish_status", ["agendado", "publicando"]).lte("publish_at", new Date().toISOString()).order("publish_at").limit(5);
    const res = [];
    for (const p of due ?? []) res.push({ id: p.id, ...(await runOne(p)) });
    return out({ ran: res.length, res });
  }

  if (!(await isTeam(req))) return out({ error: "Acesso restrito" }, 401);

  if (body.action === "now") {
    const { data: p } = await db.from("posts").select("*").eq("id", body.post_id).maybeSingle();
    if (!p) return out({ error: "Post não encontrado" }, 404);
    if (p.publish_status === "publicado") return out({ error: "Este post já foi publicado" }, 400);
    return out(await runOne(p));
  }

  if (body.action === "check") {
    const { data: acc } = await db.from("dm_accounts").select("api,ig_user_id,access_token").eq("client_id", body.client_id).maybeSingle();
    if (!acc?.access_token) return out({ ok: false, error: "Conta não conectada" });
    try {
      const lim = await graph(acc as Acc, `/${acc.ig_user_id}/content_publishing_limit`, { fields: "config,quota_usage" });
      return out({ ok: true, limit: lim.data?.[0] ?? null });
    } catch (e) {
      return out({ ok: false, error: (e as Error).message });
    }
  }
  return out({ error: "ação desconhecida" }, 400);
});
