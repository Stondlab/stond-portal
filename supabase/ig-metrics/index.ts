// Métricas do Instagram puxadas do Meta (Stond)
// - POST {action:"run"} com x-cron-key: atualiza todas as contas conectadas (pg_cron, 1x por dia)
// - POST {action:"now", client_id} com login da equipe: atualiza um cliente na hora
// Grava uma linha por dia em ig_metrics: seguidores do dia e alcance, visualizações e engajamento do mês até hoje.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH = "https://graph.facebook.com/v23.0";
const IG_GRAPH = "https://graph.instagram.com/v23.0";
const ORIGINS = ["https://gestao.stond.com.br", "https://portal.stond.com.br"];
const cors = (req: Request) => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(req.headers.get("origin") ?? "") ? req.headers.get("origin")! : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

type Acc = { client_id: string; api: string; ig_user_id: string; access_token: string };
async function graph(a: Acc, path: string, params: Record<string, string> = {}) {
  const u = new URL((a.api === "ig" ? IG_GRAPH : GRAPH) + path);
  for (const [k, v] of Object.entries({ ...params, access_token: a.access_token })) u.searchParams.set(k, v);
  const res = await fetch(u);
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j?.error?.error_user_msg || j?.error?.message || `HTTP ${res.status}`);
  return j;
}

// dia e mês no fuso de São Paulo
function spDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d); // YYYY-MM-DD
}


// duração do vídeo: vem codificada no parâmetro efg da URL do arquivo
function durationOf(url?: string): number | null {
  try {
    const e = new URL(url!).searchParams.get("efg");
    if (!e) return null;
    const j = JSON.parse(atob(e.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof j.duration_s === "number" ? j.duration_s : null;
  } catch (_) { return null; }
}

async function mediaInsights(a: Acc, limit: number) {
  // is_shared_to_feed = false: Reels de teste (não aparecem no feed). Se a API não aceitar o campo, pede sem ele.
  const F = "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count,media_url,thumbnail_url";
  const list = await graph(a, `/${a.ig_user_id}/media`, { fields: F + ",is_shared_to_feed", limit: String(limit) })
    .catch(() => graph(a, `/${a.ig_user_id}/media`, { fields: F, limit: String(limit) }));
  const one = async (m: any) => {
    const metrics = m.media_product_type === "REELS"
      ? ["views", "reach", "saved", "shares", "total_interactions", "ig_reels_avg_watch_time"]
      : ["views", "reach", "saved", "shares", "total_interactions", "follows", "profile_visits"];
    const vals = await Promise.all(metrics.map(async (mt) => {
      try { const r = await graph(a, `/${m.id}/insights`, { metric: mt }); return [mt, r.data?.[0]?.values?.[0]?.value ?? r.data?.[0]?.total_value?.value ?? null]; }
      catch (e) { return [mt, "erro: " + (e as Error).message]; }
    }));
    return { ...m, insights: Object.fromEntries(vals) };
  };
  const all = list.data ?? [], items: any[] = [];
  for (let i = 0; i < all.length; i += 6) items.push(...(await Promise.all(all.slice(i, i + 6).map(one))));
  return items;
}

// guarda os números de cada post em ig_media (para o diagnóstico da gestão)
async function saveMedia(a: Acc, items: any[]) {
  const n = (v: unknown) => (typeof v === "number" ? v : null);
  const rows = items.map((m) => {
    const I = m.insights ?? {};
    const fmt = m.media_product_type === "REELS" ? "reels" : m.media_type === "CAROUSEL_ALBUM" ? "carrossel" : m.media_type === "VIDEO" ? "video" : "foto";
    return {
      ig_media_id: m.id, client_id: a.client_id, ts: m.timestamp, format: fmt,
      caption: (m.caption ?? "").slice(0, 500), permalink: m.permalink, thumb: m.thumbnail_url || (m.media_type !== "VIDEO" ? m.media_url : null) || null,
      in_feed: m.media_product_type === "REELS" && typeof m.is_shared_to_feed === "boolean" ? m.is_shared_to_feed : null,
      duration_s: m.media_type === "VIDEO" ? durationOf(m.media_url) : null,
      views: n(I.views), reach: n(I.reach), likes: n(m.like_count), comments: n(m.comments_count), saved: n(I.saved), shares: n(I.shares),
      interactions: n(I.total_interactions), avg_watch_s: typeof I.ig_reels_avg_watch_time === "number" ? I.ig_reels_avg_watch_time / 1000 : null,
      profile_visits: n(I.profile_visits), follows: n(I.follows), updated_at: new Date().toISOString(),
    };
  });
  if (!rows.length) return 0;
  const { error } = await db.from("ig_media").upsert(rows, { onConflict: "ig_media_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

async function collect(a: Acc) {
  const ig = a.ig_user_id, today = spDate(), month = today.slice(0, 7);
  const since = Math.floor(new Date(month + "-01T03:00:00Z").getTime() / 1000);
  const until = Math.floor(Date.now() / 1000);
  const errors: string[] = [];
  const row: Record<string, unknown> = { client_id: a.client_id, date: today };
  const extra: Record<string, unknown> = { source: "meta", updated_at: new Date().toISOString() };

  const prof = await graph(a, `/${ig}`, { fields: "followers_count,follows_count,media_count,username" });
  row.followers = prof.followers_count ?? null;
  row.following = prof.follows_count ?? null;
  row.posts = prof.media_count ?? null;

  // totais do mês até hoje (uma métrica por vez, para uma que falhar não derrubar as outras)
  const tot: Record<string, number> = {};
  for (const m of ["reach", "views", "total_interactions", "accounts_engaged"]) {
    try {
      const r = await graph(a, `/${ig}/insights`, { metric: m, period: "day", metric_type: "total_value", since: String(since), until: String(until) });
      const v = r.data?.[0]?.total_value?.value;
      if (typeof v === "number") tot[m] = v;
    } catch (e) { errors.push(`${m}: ${(e as Error).message}`); }
  }
  if (tot.reach != null) row.reach = tot.reach;
  if (tot.views != null) row.views = tot.views;
  if (tot.total_interactions != null && tot.reach) row.engagement = Math.round((tot.total_interactions / tot.reach) * 1000) / 10;
  if (tot.total_interactions != null) extra.interactions = tot.total_interactions;
  if (tot.accounts_engaged != null) extra.accounts_engaged = tot.accounts_engaged;

  // posts do mês: melhor post e formato que mais rende
  try {
    const list = await graph(a, `/${ig}/media`, { fields: "id,caption,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url", limit: "50" });
    const mine = (list.data ?? []).filter((m: any) => spDate(new Date(m.timestamp)).startsWith(month));
    const byFmt: Record<string, number> = {};
    let best: any = null;
    for (const m of mine) {
      let views = 0;
      try {
        const r = await graph(a, `/${m.id}/insights`, { metric: "views" });
        views = r.data?.[0]?.values?.[0]?.value ?? r.data?.[0]?.total_value?.value ?? 0;
      } catch (_) { /* post sem métrica */ }
      const f = m.media_product_type === "REELS" ? "reels" : m.media_type === "CAROUSEL_ALBUM" ? "carrossel" : m.media_product_type === "STORY" ? "story" : "post";
      byFmt[f] = (byFmt[f] ?? 0) + views;
      if (!best || views > best.views) best = { ig_media_id: m.id, views, permalink: m.permalink, thumb: m.thumbnail_url || m.media_url || null, caption: (m.caption ?? "").slice(0, 140) };
    }
    const sum = Object.values(byFmt).reduce((x, y) => x + y, 0);
    if (sum) extra.formats = Object.fromEntries(Object.entries(byFmt).map(([k, v]) => [k, Math.round((v / sum) * 100)]));
    if (best) {
      const { data: p } = await db.from("posts").select("id").eq("client_id", a.client_id).or(`ig_media_id.eq.${best.ig_media_id},permalink.eq.${best.permalink}`).limit(1).maybeSingle();
      extra.best = { ...best, post_id: p?.id ?? null };
    }
    extra.posts_month = mine.length;
  } catch (e) { errors.push(`posts: ${(e as Error).message}`); }

  // palavras comentadas no mês (automação de direct)
  const { data: kw } = await db.from("dm_log").select("keyword").eq("client_id", a.client_id).gte("created_at", month + "-01");
  if (kw?.length) {
    const c: Record<string, number> = {};
    for (const k of kw) if (k.keyword) c[k.keyword] = (c[k.keyword] ?? 0) + 1;
    extra.keywords = c;
  }

  // números por post (últimos 50)
  try { extra.media_saved = await saveMedia(a, await mediaInsights(a, 50)); }
  catch (e) { errors.push(`media: ${(e as Error).message}`); }

  if (errors.length) extra.errors = errors;
  row.extra = extra;
  const { error } = await db.from("ig_metrics").upsert(row, { onConflict: "client_id,date" });
  if (error) throw new Error(error.message);
  return { client_id: a.client_id, followers: row.followers, reach: row.reach ?? null, views: row.views ?? null, engagement: row.engagement ?? null, errors };
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

  let accs: Acc[] = [];
  if (body.action === "run") {
    const { data: k } = await db.from("dm_config").select("value").eq("key", "cron_key").maybeSingle();
    if (!k?.value || req.headers.get("x-cron-key") !== k.value) return out({ error: "não autorizado" }, 401);
    const { data } = await db.from("dm_accounts").select("client_id,api,ig_user_id,access_token,active").neq("active", false);
    accs = (data ?? []) as Acc[];
  } else if (body.action === "now") {
    if (!(await isTeam(req))) return out({ error: "Acesso restrito" }, 401);
    const { data } = await db.from("dm_accounts").select("client_id,api,ig_user_id,access_token").eq("client_id", body.client_id).maybeSingle();
    if (!data?.access_token) return out({ error: "A conta do Instagram deste cliente não está conectada" }, 400);
    accs = [data as Acc];
  } else if (body.action === "media") {
    // lista os últimos posts/reels com números por post (para análise)
    const { data: k } = await db.from("dm_config").select("value").eq("key", "cron_key").maybeSingle();
    const okCron = !!k?.value && req.headers.get("x-cron-key") === k.value;
    if (!okCron && !(await isTeam(req))) return out({ error: "Acesso restrito" }, 401);
    const { data } = await db.from("dm_accounts").select("client_id,api,ig_user_id,access_token").eq("client_id", body.client_id).maybeSingle();
    if (!data?.access_token) return out({ error: "A conta do Instagram deste cliente não está conectada" }, 400);
    const a = data as Acc;
    const items = await mediaInsights(a, Number(body.limit ?? 25));
    await saveMedia(a, items).catch(() => {});
    return out({ ok: true, items });
  } else return out({ error: "ação desconhecida" }, 400);

  const res = [];
  for (const a of accs) {
    try { res.push(await collect(a)); } catch (e) { res.push({ client_id: a.client_id, error: (e as Error).message }); }
  }
  return out({ ok: true, res });
});
