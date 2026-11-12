-- Links curtos com UTM (portal.stond.com.br/l/<slug>) e registro de cliques.
-- A equipe cria/edita na gestão; o visitante passa por /l/<slug>, que chama link_go (conta o clique e devolve o destino).
create table if not exists public.short_links(
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  client_id text not null references public.clients(id) on delete cascade,
  label text not null default '',
  grp text not null default '',
  url text not null check (url ~* '^https?://'),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.short_clicks(
  id bigserial primary key,
  slug text not null references public.short_links(slug) on delete cascade on update cascade,
  at timestamptz not null default now()
);
create index if not exists short_clicks_slug_at on public.short_clicks(slug, at);
create index if not exists short_links_client on public.short_links(client_id);
alter table public.short_links enable row level security;
alter table public.short_clicks enable row level security;
drop policy if exists "equipe tudo" on public.short_links;
create policy "equipe tudo" on public.short_links for all to authenticated using (is_team()) with check (is_team());
drop policy if exists "equipe tudo" on public.short_clicks;
create policy "equipe tudo" on public.short_clicks for all to authenticated using (is_team()) with check (is_team());

create or replace function public.link_go(p_slug text) returns text
language plpgsql security definer set search_path to 'public' as $$
declare u text; s text := lower(trim(coalesce(p_slug, '')));
begin
  select url into u from public.short_links where slug = s and active;
  if u is null then return null; end if;
  insert into public.short_clicks(slug) values (s);
  return u;
end $$;
revoke all on function public.link_go(text) from public;
grant execute on function public.link_go(text) to anon, authenticated;

-- portal_data passa a devolver 'shortlinks' (links ativos do cliente com cliques no total e nos últimos 30 dias)
CREATE OR REPLACE FUNCTION public.portal_data(p_client text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'client', jsonb_build_object('id', c.id, 'name', c.name, 'handle', c.handle, 'color', c.color),
    'posts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'type', p.type, 'date', p.date, 'time', p.time, 'title', p.title,
        'caption', p.caption, 'brief', p.brief, 'labels', p.labels, 'status', p.status,
        'media', p.media, 'decided_at', p.decided_at) order by p.date, p.time)
      from public.posts p where p.client_id = c.id), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object(
        'post_id', f.post_id, 'kind', f.kind, 'text', f.text, 'author', f.author, 'at', f.created_at) order by f.created_at)
      from public.post_feedback f where f.client_id = c.id), '[]'::jsonb),
    'profile', (select g.data from public.ig_profiles g where g.client_id = c.id),
    'links', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'kind', l.kind, 'title', l.title, 'url', l.url, 'note', l.note) order by l.sort, l.id)
      from public.client_links l where l.client_id = c.id), '[]'::jsonb),
    'metrics', coalesce((select jsonb_agg(to_jsonb(m) - 'client_id' order by m.date)
      from public.ig_metrics m where m.client_id = c.id), '[]'::jsonb),
    'uploads', coalesce((select jsonb_agg(jsonb_build_object('path', o.name, 'size', o.metadata->>'size', 'at', o.created_at) order by o.created_at desc)
      from storage.objects o where o.bucket_id = 'client-files' and (storage.foldername(o.name))[1] = c.id), '[]'::jsonb),
    'brand', (select d.data - 'shared' - 'updated' from public.agency_docs d
      where d.collection = 'marca' and d.id = c.id
        and coalesce((d.data->>'shared')::boolean, false) limit 1),
    'automations', coalesce((select jsonb_agg(jsonb_build_object(
        'keyword', k.keyword, 'title', split_part(coalesce(k.link_title, ''), E'\n', 1), 'since', k.created_at,
        'asked', (select count(*) from public.dm_log l where l.client_id = c.id and l.keyword = k.keyword),
        'sent', (select count(*) from public.dm_log l where l.client_id = c.id and l.keyword = k.keyword and l.status in ('sent', 'link_enviado')),
        'asked30', (select count(*) from public.dm_log l where l.client_id = c.id and l.keyword = k.keyword and l.created_at > now() - interval '30 days')
      ) order by k.created_at)
      from public.dm_keywords k where k.client_id = c.id and coalesce(k.active, true)), '[]'::jsonb),
    'invest', coalesce((select jsonb_agg(d.data - 'client' order by d.id desc)
      from public.agency_docs d where d.collection = 'invest' and d.client_id = c.id), '[]'::jsonb),
    'shortlinks', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', s.slug, 'label', s.label, 'grp', s.grp, 'url', s.url,
        'clicks', (select count(*) from public.short_clicks k where k.slug = s.slug),
        'clicks30', (select count(*) from public.short_clicks k where k.slug = s.slug and k.at > now() - interval '30 days')
      ) order by s.sort, s.created_at)
      from public.short_links s where s.client_id = c.id and s.active), '[]'::jsonb)
  ) from public.clients c where c.id = p_client
$function$;
