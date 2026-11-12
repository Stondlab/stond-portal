/* Gestão · Links curtos com UTM: portal.stond.com.br/l/<nome> conta o clique e leva ao destino.
   Tabelas short_links e short_clicks (supabase/sql/short_links.sql). O cliente vê em Resultados > Links e cliques. */
(function(){
  ic.lnk='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
  const g=GROUPS.find(([t])=>t==='Clientes');if(g&&!g[1].some(([k])=>k==='lnk')){const i=g[1].findIndex(([k])=>k==='inv');g[1].splice(i+1,0,['lnk','Links curtos'])}
  const GRP=['Bio','Site','Direct','Stories','Anúncios','Outros'].map(x=>[x,x]);
  const F=[['label','Nome do link (ex.: Calculadora no direct)'],['grp','Onde vai ser usado','sel',GRP],['dest','Página de destino (sem UTM)'],
    ['utm_source','Origem (utm_source)'],['utm_medium','Meio (utm_medium)'],['utm_campaign','Campanha (utm_campaign, opcional)'],['slug','Link curto: portal.stond.com.br/l/…'],['active','Ativo','chk']];
  let LK=null,busy=false;
  const short=s=>'portal.stond.com.br/l/'+s;
  const slugify=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
  const split=u=>{try{const x=new URL(u),q=x.searchParams,o={utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||''};['utm_source','utm_medium','utm_campaign'].forEach(k=>q.delete(k));return {dest:x.toString().replace(/\?$/,''),...o}}catch(e){return {dest:u||'',utm_source:'',utm_medium:'',utm_campaign:''}}};
  const join=v=>{const x=new URL(/^https?:\/\//i.test(v.dest)?v.dest:'https://'+v.dest);['utm_source','utm_medium','utm_campaign'].forEach(k=>{if(v[k])x.searchParams.set(k,v[k].trim())});return x.toString()};
  async function load(){if(busy)return;busy=true;
    try{const since=new Date(Date.now()-30*864e5).toISOString();
      const [a,b]=await Promise.all([sb.from('short_links').select('*,short_clicks(count)').order('sort').order('created_at'),sb.from('short_clicks').select('slug').gte('at',since)]);
      if(a.error)throw new Error(a.error.message);
      const m30={};(b.data||[]).forEach(r=>m30[r.slug]=(m30[r.slug]||0)+1);
      LK=a.data.map(l=>({...l,clicks:l.short_clicks?.[0]?.count||0,clicks30:m30[l.slug]||0}));
    }catch(x){LK=[];toast('Links: '+x.message)}busy=false;render()}
  function open(slug){
    const c=fv('lc',CL()[0]?.id),cur=slug?LK.find(l=>l.slug===slug):null;
    const vals=cur?{label:cur.label,grp:cur.grp,slug:cur.slug,active:cur.active,...split(cur.url)}:{grp:'Direct',utm_source:'instagram',utm_medium:'dm',active:true};
    formModal(cur?'Link curto':'Novo link curto',F,vals,async v=>{
      if(!v.label||!v.dest)throw new Error('Preencha o nome e a página de destino.');
      const slug2=slugify(v.slug||(c+'-'+v.label));if(slug2.length<2)throw new Error('Escolha um link curto.');
      let url;try{url=join(v)}catch(e){throw new Error('Página de destino inválida.')}
      const row={slug:slug2,client_id:cur?cur.client_id:c,label:v.label,grp:v.grp||'',url,active:!!v.active};
      const q=cur?sb.from('short_links').update(row).eq('slug',cur.slug):sb.from('short_links').insert({...row,sort:(LK.filter(l=>l.client_id===c).length)});
      const {error}=await q;if(error)throw new Error(/duplicate|unique/i.test(error.message)?'Esse link curto já existe. Escolha outro nome.':error.message);
      LK=null;return 'Salvo: '+short(slug2);
    },cur?async()=>{const {error}=await sb.from('short_links').delete().eq('slug',cur.slug);if(error)throw new Error(error.message);LK=null}:null);
  }
  V.lnk=()=>{
    if(!LK){load();return shell(topb('Links curtos','Carregando…'))}
    const c=fv('lc',CL()[0]?.id),L=LK.filter(l=>l.client_id===c),G=[...new Set(L.map(l=>l.grp||'Outros'))];
    return shell(topb('Links curtos','Cada link conta os cliques e leva ao site com as UTMs. O cliente vê em Resultados.','<button class="btn red" data-lk-new>Novo link</button>')+`
     <div class="filters">${segF('lc',CL().map(k=>[k.id,k.name]))}</div>
     ${L.length?G.map(gr=>`<p class="eyebrow" style="margin-top:18px">${esc(gr)}</p><div class="list">${L.filter(l=>(l.grp||'Outros')===gr).map(l=>`<div class="row"${l.active?'':' style="opacity:.55"'}><span class="ico2">${ic.lnk}</span><div class="t"><b>${esc(l.label)}${l.active?'':' (desativado)'}</b><small>${esc(short(l.slug))} → ${esc(l.url)}</small></div><span class="trio" style="margin:0"><span><b>${l.clicks}</b><small>cliques</small></span><span><b>${l.clicks30}</b><small>30 dias</small></span></span><button class="btn sm ghost" data-copy-lk="https://${esc(short(l.slug))}">Copiar</button><button class="btn sm ghost" data-lk="${esc(l.slug)}">Editar</button></div>`).join('')}</div>`).join('')
       :'<div class="empty">Nenhum link curto para este cliente ainda. Use "Novo link" para criar o da bio, do direct ou dos Stories.</div>'}`);
  };
  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-lk-new]')){open(null);return}
    const r=e.target.closest('[data-lk]');if(r){open(r.dataset.lk);return}
    const cp=e.target.closest('[data-copy-lk]');if(cp){try{await navigator.clipboard.writeText(cp.dataset.copyLk);toast('Link copiado.')}catch(x){toast(cp.dataset.copyLk)}}
  });
})();
