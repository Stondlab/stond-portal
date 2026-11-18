-- Visitas e cliques no WhatsApp dos sites dos clientes, com a origem (UTM).
-- O site carrega portal.stond.com.br/t.js, que chama site_track (anon). A equipe vê em Gestão > Site.
create table if not exists public.site_events(
  id bigserial primary key,
  client_id text not null references public.clients(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('visita','whatsapp')),
  page text not null default '',
  source text not null default '',
  medium text not null default '',
  campaign text not null default '',
  content text not null default '',
  ref text not null default '',
  label text not null default '',
  visitor text not null default ''
);
create index if not exists site_events_client_at on public.site_events(client_id, at desc);
create index if not exists site_events_visitor_at on public.site_events(visitor, at);
alter table public.site_events enable row level security;
drop policy if exists "equipe le" on public.site_events;
create policy "equipe le" on public.site_events for select to authenticated using (is_team());
drop policy if exists "equipe apaga" on public.site_events;
create policy "equipe apaga" on public.site_events for delete to authenticated using (is_team());

create or replace function public.site_track(p_client text, p_kind text, p_page text default '', p_source text default '',
  p_medium text default '', p_campaign text default '', p_content text default '', p_ref text default '',
  p_label text default '', p_visitor text default '') returns boolean
language plpgsql security definer set search_path to 'public' as $$
declare v text := left(coalesce(p_visitor,''), 40);
begin
  if p_kind not in ('visita','whatsapp') then return false; end if;
  if not exists (select 1 from public.clients where id = p_client) then return false; end if;
  -- trava simples contra abuso: no máximo 60 eventos por visitante por hora
  if v <> '' and (select count(*) from public.site_events where visitor = v and at > now() - interval '1 hour') >= 60 then return false; end if;
  insert into public.site_events(client_id, kind, page, source, medium, campaign, content, ref, label, visitor)
  values (p_client, p_kind, left(coalesce(p_page,''),120), lower(left(coalesce(p_source,''),60)), lower(left(coalesce(p_medium,''),60)),
    lower(left(coalesce(p_campaign,''),80)), lower(left(coalesce(p_content,''),80)), left(coalesce(p_ref,''),120), left(coalesce(p_label,''),80), v);
  return true;
end $$;
revoke all on function public.site_track(text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.site_track(text,text,text,text,text,text,text,text,text,text) to anon, authenticated;
