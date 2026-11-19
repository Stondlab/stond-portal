/* Portal do cliente · Stond OS
   - Engajamento conferido: pessoas que interagiram ÷ pessoas alcançadas (antes era interações ÷ alcance)
   - Início: meta do mês, pedidos da Stond, "Seu mês" quando não há nada para aprovar, sistemas ligados
   - Ajuste: o cliente escolhe a parte (arte, texto da arte, legenda, outro)
   - Calendário em lista por dia no celular
   - Relatório do mês com a Leitura da Stond e a nota
   - Métricas mostram de quando é o número */
(function(){
  const PARTS=['Arte','Texto da arte','Legenda','Outro'];let PART=null,EXTRA=null,LOADING=false;
  const hm=s=>new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const when=s=>{const d=new Date(s),t=iso(new Date());return (iso(d)===t?'hoje':fmtD(iso(d)))+', '+hm(s)};
  const pl=(n,a,b)=>n===1?a:b;

  /* dados: engajamento conferido e extras (relatório, pedidos, meta) */
  function fix(){
    (D.metrics||[]).forEach(m=>{const x=m.extra||{};if(!m._eng&&x.accounts_engaged!=null&&m.reach){m.engagement=Math.round(x.accounts_engaged/m.reach*1000)/10;m._eng=1}});
    if(D.reports===undefined&&EXTRA)Object.assign(D,EXTRA);
  }
  async function extras(){
    if(LOADING||!D||!D.client||D.reports!==undefined)return;LOADING=true;
    try{const {data,error}=await sb.from('agency_docs').select('collection,id,data').eq('client_id',D.client.id).in('collection',['reports','pedidos','resultados']);
      if(error||!data)return;
      EXTRA={reports:data.filter(r=>r.collection==='reports'&&r.data.sent).map(r=>({id:r.id,...r.data})),pedidos:data.filter(r=>r.collection==='pedidos').map(r=>({id:r.id,...r.data})),resultados:data.filter(r=>r.collection==='resultados').map(r=>({id:r.id,...r.data}))};
      fix();_render();
    }catch(_){}finally{LOADING=false}
  }
  const _render=render;
  render=function(){if(D){fix();if(D.reports===undefined&&!EXTRA)extras()}_render()};

  const reports=()=>(D.reports||[]).slice().sort((a,b)=>String(b.id).localeCompare(String(a.id)));
  const pedidos=()=>(D.pedidos||[]).filter(p=>!p.done).sort((a,b)=>String(a.due||'9').localeCompare(String(b.due||'9')));
  const metaMes=()=>{const mk=iso(new Date()).slice(0,7);return (D.resultados||[]).find(r=>String(r.id).endsWith('_'+mk))||null};

  function sistemas(){
    const L=[],A=D.automations||[],M=D.metrics||[],last=M[M.length-1],mk=iso(new Date()).slice(0,7);
    if(A.length){const n=A.reduce((s,a)=>s+(+a.asked30||0),0);L.push(['Automação de direct',`${A.length} ${pl(A.length,'palavra','palavras')} · ${n} ${pl(n,'pessoa pediu','pessoas pediram')} o link em 30 dias`])}
    const ap=(D.feedback||[]).filter(f=>f.kind==='aprovado'&&String(f.at).startsWith(mk)).length;
    L.push(['Portal de aprovação',`${ap} ${pl(ap,'aprovação','aprovações')} em ${MES[new Date().getMonth()]}`]);
    if(last){const u=(last.extra||{}).updated_at;L.push(['Métricas do Instagram',u?`Atualizadas ${when(u)}`:`Última medição ${fmtD(last.date)}`])}
    const sl=D.shortlinks||[];if(sl.length){const c=sl.reduce((s,x)=>s+(+x.clicks30||0),0);L.push(['Links curtos',`${sl.length} ${pl(sl.length,'link','links')} · ${c} cliques em 30 dias`])}
    if((D.site||[]).length)L.push(['Site e WhatsApp',`${(D.site||[]).length} acessos e cliques em 90 dias`]);
    return L;
  }
  function seuMes(){
    const now=new Date(),mk=iso(now).slice(0,7),mp=posts().filter(p=>String(p.date).startsWith(mk));
    const ar=mp.filter(p=>p.status==='publicado'||(p.status==='aprovado'&&p.date<=iso(now))).length,nx=mp.filter(p=>p.date>iso(now)&&p.status==='aprovado').length;
    const M=D.metrics||[],L=M[M.length-1],F=M.filter(m=>m.date<mk+'-01').slice(-1)[0]||M[0],gan=L&&F&&L.followers!=null&&F.followers!=null?L.followers-F.followers:null;
    const kw=(D.automations||[]).reduce((s,a)=>s+(+a.asked30||0),0);
    return `<div class="pm-mes"><p class="eyebrow">Seu mês</p><div class="sum"><div><b>${ar}</b><span>${pl(ar,'post no ar','posts no ar')}</span></div><div><b>${nx}</b><span>${pl(nx,'aprovado para sair','aprovados para sair')}</span></div><div><b>${gan==null?'—':(gan>=0?'+':'')+nf(gan)}</b><span>seguidores no mês</span></div>${kw?`<div><b>${nf(kw)}</b><span>pediram o link no direct</span></div>`:''}</div></div>`;
  }

  /* Início */
  const _ini=V.inicio;
  V.inicio=function(){
    let h=_ini.call(V);
    const mm=metaMes(),P=pedidos(),S=sistemas(),R=reports()[0];
    const top=`${mm&&+mm.meta_vendas?`<div class="pm-meta"><span class="lb">Meta de ${MES[new Date().getMonth()]}</span><b>${nf(+mm.vendas||0)} <small>de ${nf(+mm.meta_vendas)} vendas</small></b><div class="prog"><b style="width:${Math.min(100,(+mm.vendas||0)/(+mm.meta_vendas)*100)}%"></b></div></div>`:''}
      ${P.length?`<div class="pm-ped"><p class="eyebrow">A Stond precisa de você</p>${P.map(p=>`<div><b>${esc(p.title)}</b>${p.note?`<small>${esc(p.note)}</small>`:''}<span class="chip ${p.due&&p.due<iso(new Date())?'':'pend'}">${p.due?'até '+fmtD(p.due):'sem prazo'}</span></div>`).join('')}<button class="lnkb" data-go="arq">Mandar arquivos</button></div>`:''}`;
    h=h.replace('<div class="sum">',top+'<div class="sum">');
    if(!pend().length)h=h.replace(/<div class="empty">Tudo aprovado por aqui\.[^<]*<\/div>/,seuMes());
    const bot=`<div class="pm-two">${R?`<button class="pm-rel" data-go="rel"><p class="eyebrow">Relatório de ${esc(mesN(String(R.id).split('_')[1]))}</p><b>${esc(String(R.leitura||R.destaque||'Veja como foi o mês').slice(0,170))}</b><span>Ler o relatório</span></button>`:''}
      ${S.length?`<div class="pm-sis"><p class="eyebrow">O que a Stond montou para você</p>${S.map(([n,d])=>`<div><i>Ligado</i><b>${esc(n)}</b><small>${esc(d)}</small></div>`).join('')}</div>`:''}</div>`;
    return h+bot;
  };

  /* Aprovações: Seu mês no lugar da caixa vazia */
  const _ap=V.aprov;
  V.aprov=function(){let h=_ap.call(V);if(FILTER==='pend'&&!pend().length)h=h.replace(/<div class="empty">[\s\S]*?<\/div>\s*$/,seuMes());return h};

  /* Calendário: lista por dia no celular */
  const _cal=V.cal;
  V.cal=function(){
    const h=_cal.call(V),y=CALM.getFullYear(),m=CALM.getMonth(),mk=`${y}-${String(m+1).padStart(2,'0')}`;
    const mp=posts().filter(p=>String(p.date).startsWith(mk)).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))),days=[...new Set(mp.map(p=>p.date))];
    return h+`<div class="pm-cl">${days.length?days.map(d=>`<div class="pm-cd"><p class="eyebrow">${fmtD(d)}</p><div class="list">${mp.filter(p=>p.date===d).map(p=>`<${(p.media||[]).length?`button data-open="${esc(p.id)}"`:'div'} class="row">${thumb(p)}<div class="t"><b>${esc(p.title)}</b><small>${ty(p.type)}${p.time?' · '+esc(p.time):''}</small></div>${chip(p)}</${(p.media||[]).length?'button':'div'}>`).join('')}</div></div>`).join(''):'<div class="empty">Nada planejado neste mês ainda.</div>'}</div>`;
  };

  /* Métricas: de quando é o número + engajamento explicado */
  const _met=V.met;
  V.met=function(){
    const M=D.metrics||[],L=M[M.length-1]||{},u=(L.extra||{}).updated_at;
    return _met.call(V).replace('<h2>Métricas</h2><p>',`<h2>Métricas</h2><p>${u?`Atualizado ${when(u)}. `:''}`)
      .replace(/(<span class="lb">Engajamento<\/span>[\s\S]*?)(<\/div><\/div>\s*<div class="bx w2 w2m"><span class="lb">Palavras)/,'$1<span class="ft">Das pessoas alcançadas, quantas curtiram, comentaram, salvaram ou compartilharam</span>$2');
  };

  /* Relatório */
  V.rel=function(){
    const L=reports();if(!L.length)return `${resPills()}<div class="top"><div><h2>Relatório</h2><p>O relatório do mês aparece aqui quando a Stond enviar.</p></div></div><div class="empty">Ainda não tem relatório.</div>`;
    const sel=L.find(r=>r.id===RSEL)||L[0],mk=String(sel.id).split('_')[1]||'';
    const M=D.metrics||[],[y,m]=mk.split('-').map(Number),end=M.filter(x=>x.date<=iso(new Date(y,m,0))).slice(-1)[0],ini=M.filter(x=>x.date<mk+'-01').slice(-1)[0]||M[0];
    const ps=posts().filter(p=>String(p.date).startsWith(mk)),fb=(D.feedback||[]).filter(f=>f.kind==='aprovado'&&String(f.at).startsWith(mk)).length;
    const k=[['Seguidores',end?nf(end.followers):'—',end&&ini&&end!==ini?((end.followers-ini.followers>=0?'+':'')+nf(end.followers-ini.followers)+' no mês'):''],['Alcance',end&&end.reach!=null?kf(end.reach):'—','contas alcançadas'],['Posts',String(ps.length),'no mês'],['Aprovações',String(fb),'pelo portal']];
    return `${resPills()}<div class="top"><div><p class="eyebrow">Relatório do mês</p><h2>${esc(mesN(mk))}</h2><p>O que a Stond entregou, o que funcionou e o que muda.</p></div>${L.length>1?`<div class="seg">${L.slice(0,4).map(r=>`<button data-rsel="${esc(r.id)}" aria-pressed="${r.id===sel.id}">${esc(mesN(String(r.id).split('_')[1]).split(' ')[0])}</button>`).join('')}</div>`:''}</div>
    <article class="pm-rep">${sel.leitura?`<div class="pm-lt"><p class="eyebrow">Leitura da Stond</p><p>${esc(sel.leitura)}</p></div>`:''}
     <div class="sum">${k.map(([a,b,c])=>`<div><b>${b}</b><span>${a}${c?' · '+c:''}</span></div>`).join('')}</div>
     ${sel.destaque?`<div><p class="eyebrow">Destaque</p><p>${esc(sel.destaque)}</p></div>`:''}${sel.proximo?`<div><p class="eyebrow">Próximo mês</p><p>${esc(sel.proximo)}</p></div>`:''}
     <button class="btn ghost" data-print>Baixar PDF</button></article>${notaCard()}`;
  };
  let RSEL=null;
  const _sh=shell;
  shell=function(inner){
    let h=_sh(inner);
    if(reports().length){h=h.replace(/(<button data-go="auto"[^>]*>[\s\S]*?<\/button>)/,`$1<button data-go="rel" ${S==='rel'?'aria-current="page"':''}>${ic.met||''}Relatório</button>`)}
    if(reports().length)h=h.replace(/(<div class="pills">[\s\S]*?<button data-go="auto"[^>]*>[^<]*<\/button>)/,`$1<button data-go="rel" ${S==='rel'?'aria-current="page"':''}>Relatório</button>`);
    return h;
  };
  RES.push('rel');

  /* Pedido de ajuste: escolher a parte */
  const _modal=modal;
  modal=function(){
    const h=_modal();if(!h)return h;const p=posts().find(x=>x.id===OPEN);
    if(!p||!['pendente','aprovado','reprovado'].includes(p.status))return h;
    return h.replace('<div class="fld"><label for="cm">',`<div class="pm-pt"><span>O que precisa mudar?</span>${PARTS.map(x=>`<button type="button" data-part="${x}" aria-pressed="${PART===x}">${x}</button>`).join('')}</div><div class="fld"><label for="cm">`);
  };
  document.addEventListener('click',e=>{
    const t=e.target;
    const pt=t.closest('[data-part]');if(pt){e.stopPropagation();PART=PART===pt.dataset.part?null:pt.dataset.part;document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.part===PART));const c=$('#cm');if(c)c.focus();return}
    const fb=t.closest('[data-fb]');if(fb&&fb.dataset.fb==='ajuste'&&PART){const c=$('#cm');if(c&&c.value.trim()&&!/^\[/.test(c.value))c.value=`[${PART}] `+c.value.trim();PART=null}
    if(t.closest('[data-x]')||t.matches('[data-close]'))PART=null;
    if(t.closest('[data-print]')){window.print();return}
    const rs=t.closest('[data-rsel]');if(rs){e.stopPropagation();RSEL=rs.dataset.rsel;render();return}
  },true);
})();
