-- Stond OS (18/11/2026): o portal passa a receber o relatório enviado, os pedidos da Stond e a meta do mês.
-- Só acrescenta 3 chaves ao final do portal_data; o resto é igual ao que está no ar.
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
      from public.posts p where p.client_id = c.id and coalesce(p.stage,'') <> 'arquivado'), '[]'::jsonb),
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
      from public.short_links s where s.client_id = c.id and s.active), '[]'::jsonb),
    'site', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', e.kind, 'at', e.at, 'page', e.page, 'source', e.source, 'medium', e.medium,
        'campaign', e.campaign, 'ref', e.ref, 'label', e.label, 'v', md5(e.visitor)) order by e.at desc)
      from (select * from public.site_events s2 where s2.client_id = c.id and s2.at > now() - interval '90 days'
            order by s2.at desc limit 3000) e), '[]'::jsonb),
    -- novos: relatório enviado (sem notas internas), pedidos da Stond e a meta do mês
    'reports', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'leitura', d.data->>'leitura', 'destaque', d.data->>'destaque',
        'proximo', d.data->>'proximo', 'sentAt', d.data->>'sentAt') order by d.id desc)
      from public.agency_docs d where d.collection = 'reports' and d.client_id = c.id
        and coalesce((d.data->>'sent')::boolean, false)), '[]'::jsonb),
    'pedidos', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.data->>'title', 'due', d.data->>'due',
        'note', d.data->>'note', 'done', coalesce((d.data->>'done')::boolean, false)) order by d.data->>'due')
      from public.agency_docs d where d.collection = 'pedidos' and d.client_id = c.id), '[]'::jsonb),
    'resultados', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'vendas', d.data->>'vendas', 'meta_vendas', d.data->>'meta_vendas'))
      from public.agency_docs d where d.collection = 'resultados' and (d.client_id = c.id or d.id like c.id || '\_%')), '[]'::jsonb)
  ) from public.clients c where c.id = p_client
$function$;
