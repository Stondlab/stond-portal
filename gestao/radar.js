/* Gestão · Radar do nicho: estudo de concorrentes, referências e assuntos do momento,
   ligado ao que já deu certo no próprio perfil do cliente, e tudo vira pauta.
   - Deu certo aqui: posts do cliente comparados com a própria mediana do formato (ig_media),
     com palavras do direct (dm_log) e o "por que funcionou" anotado pela Stond.
   - Nicho: perfis acompanhados (concorrentes e referências) e posts fora da curva deles.
   - Assuntos do momento: tendências, datas e conversas da audiência, com "vale até" e a ponte para o cliente.
   - Fórmulas: os moldes que se repetem nos acertos (do cliente e do nicho).
   agency_docs 'radar' (id aleatório; 'acerto_<ig_media_id>' para os acertos):
     kind perfil  {client, handle, role:concorrente|referencia, followers, median, note}
     kind post    {client, handle, link, format, views, median, hook, emotion, why, formula, date}
     kind assunto {client, text, type:tendencia|data|conversa, source, until, bridge, heat}
     kind acerto  {client, mediaId, why, formula}
   "Virar pauta" grava em agency_docs 'pautas' (o Acervo do Planejamento) com a etiqueta #radar. */
(function(){
  ic.radar=sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 18 6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>');
  if(!GROUPS.some(g=>g[1].some(([k])=>k==='radar'))){const g=GROUPS.find(([t])=>t==='Clientes');if(g){const i=g[1].findIndex(([k])=>k==='plano');g[1].splice(i>=0?i+1:1,0,['radar','Radar do nicho'])}}

  const DAY=864e5;
  const cid=()=>fv('rc',CL()[0]?.id);
  const R=k=>docs('radar').filter(d=>d.client===cid()&&(!k||d.kind===k));
  const med=a=>{const s=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y);if(!s.length)return null;const h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2};
  const xf=(v,m)=>m?v/m:null;
  const xs=x=>x==null?'—':x.toLocaleString('pt-BR',{maximumFractionDigits:1})+'x';
  const tier=x=>x==null?'':x>=3?'fora':x>=1.5?'acima':x<.7?'abaixo':'';
  const TIER={fora:['Fora da curva','var(--red)'],acima:['Acima da mediana','var(--ok)'],abaixo:['Abaixo','var(--muted)']};
  const FMTN={reels:'Reels',carrossel:'Carrossel',foto:'Post'},FMTP={reels:'Reels',carrossel:'carrosséis',foto:'posts'};
  const capT=m=>String(m.caption||'Sem legenda').split('\n')[0].slice(0,90);
  const ago=t=>Math.max(0,Math.round((Date.now()-new Date(t))/DAY));
  const plN=(n,a,b)=>`${n} ${n===1?a:b}`;

  /* posts do cliente: cada um contra a mediana do mesmo formato no período */
  function mine(c,days){
    const a=Date.now()-days*DAY;
    const M0=(D.media||[]).filter(m=>m.client_id===c&&new Date(m.ts)>=a);
    const mr={};M0.forEach(m=>(mr[m.format]=mr[m.format]||[]).push(+m.reach||0));for(const f in mr)mr[f]=med(mr[f]);
    const M=M0.filter(m=>m.reach==null||+m.reach>=.15*(mr[m.format]||0)); /* tira versões de teste e duplicadas */
    const dm=(D.dmlog||[]).filter(x=>x.client_id===c);
    const by={};M.forEach(m=>(by[m.format]=by[m.format]||[]).push(m));
    const base={};for(const f in by)base[f]={views:med(by[f].map(m=>+m.views)),likes:med(by[f].map(m=>+m.likes)),shares:med(by[f].map(m=>+m.shares)),n:by[f].length};
    return M.map(m=>{const b=base[m.format]||{};const words=dm.filter(x=>x.media_id===m.ig_media_id).length;
      return {m,b,xv:xf(+m.views,b.views),xl:xf(+m.likes,b.likes),xsh:b.shares?xf(+m.shares,b.shares):null,words,fresh:ago(m.ts)<=3}})
      .sort((p,q)=>(q.xv||0)-(p.xv||0));
  }

  const ideaBtn=(src,txt)=>`<button class="btn sm red" data-rd-idea="${esc(src)}" data-txt="${esc(txt)}">Virar pauta</button>`;

  function vAqui(){
    const c=cid(),days=+fv('rd','30'),L=mine(c,days),top=L.filter(x=>tier(x.xv)==='fora'||tier(x.xv)==='acima');
    if(!L.length)return empty('Sem posts medidos neste período. As métricas vêm do Instagram todo dia; escolha um período maior.');
    const ac=id=>doc1('radar','acerto_'+id);
    const card=x=>{const m=x.m,a=ac(m.ig_media_id),t=tier(x.xv);
      return `<article class="rd-hit">
        <div class="rd-th">${m.thumb?`<img src="${esc(m.thumb)}" alt="" loading="lazy" onerror="this.remove()">`:''}<span class="pill" data-ty="${esc(m.format)}">${FMTN[m.format]||'Post'}</span></div>
        <div class="rd-bd">
          <div class="rd-tg">${t?`<span class="chip" style="color:${TIER[t][1]};border-color:${TIER[t][1]}">${TIER[t][0]}</span>`:''}${x.fresh?`<span class="chip pend">${plN(ago(m.ts),'dia','dias')} no ar · ainda subindo</span>`:''}<small>${fmtD(String(m.ts).slice(0,10))}</small></div>
          <b>${esc(capT(m))}</b>
          <div class="rd-nums"><span><b>${nf(m.views)}</b><small>views · ${xs(x.xv)} a mediana</small></span><span><b>${nf(m.likes)}</b><small>curtidas · ${xs(x.xl)}</small></span><span><b>${nf(m.shares)}</b><small>compart. · ${xs(x.xsh)}</small></span><span><b>${nf(x.words)}</b><small>palavras no direct</small></span></div>
          <small class="rd-base">Mediana dos ${x.b.n} ${FMTP[m.format]||'posts'} dos últimos ${days} dias: ${nf(Math.round(x.b.views))} views</small>
          ${a.why?`<div class="rd-why"><span class="lb">Por que funcionou</span><p>${esc(a.why)}</p>${a.formula?`<p class="rd-f"><span>Fórmula</span>${esc(a.formula)}</p>`:''}</div>`:`<p class="rd-none">Ainda sem leitura. Anote o porquê: é isso que vira a próxima ideia.</p>`}
          <div class="rd-ac"><button class="btn sm ghost" data-rd-why="${esc(m.ig_media_id)}">${a.why?'Editar leitura':'Anotar por que funcionou'}</button>${a.formula?ideaBtn('acerto_'+m.ig_media_id,a.formula):''}<a class="btn sm ghost" href="${esc(m.permalink||'#')}" target="_blank" rel="noopener">Abrir</a></div>
        </div></article>`};
    const rest=L.filter(x=>!top.includes(x));
    return `<p class="pa-help">Cada post comparado com a mediana do próprio formato no período, não com outros perfis. Acima de 1,5x merece leitura; 3x ou mais é fora da curva. Versões de teste e duplicadas (alcance muito abaixo do normal) ficam de fora.</p>
      <div class="filters">${segF('rd',[['30','30 dias'],['60','60 dias'],['90','90 dias']])}</div>
      ${top.length?`<div class="rd-hits">${top.map(card).join('')}</div>`:empty('Nada acima da mediana neste período.')}
      ${rest.length?`<details class="rd-more"><summary>Os outros ${rest.length} posts do período</summary><div class="al">${rest.map(x=>`<div><span class="pill" data-ty="${esc(x.m.format)}">${FMTN[x.m.format]||'Post'}</span><small>${esc(capT(x.m))}</small><b>${nf(x.m.views)}</b><span class="chip">${xs(x.xv)}</span></div>`).join('')}</div></details>`:''}`;
  }

  function vNicho(){
    const P=R('perfil'),S=R('post').sort((a,b)=>(b.views/(b.median||b.views))-(a.views/(a.median||a.views)));
    const role=fv('rr','all');
    const PS=P.filter(p=>role==='all'||p.role===role);
    return `<p class="pa-help">Quem acompanhamos e o que passou da mediana deles. Compare cada perfil com ele mesmo. Estudamos a estrutura, nunca copiamos as palavras, e o concorrente nunca é citado no conteúdo do cliente.</p>
      <div class="filters">${segF('rr',[['all','Todos · '+P.length],['concorrente','Concorrentes'],['referencia','Referências']])}<button class="btn sm ghost" data-rd-new="perfil">+ Perfil</button><button class="btn sm red" data-rd-new="post">+ Post estudado</button></div>
      ${PS.length?`<div class="rd-pf">${PS.map(p=>{const n=S.filter(s=>s.handle===p.handle).length;return `<button class="rd-pc" data-rd-ed="${esc(p.id)}"><span class="mono">${esc((p.handle||'?').replace('@','')[0].toUpperCase())}</span><div><b>${esc(p.handle)}</b><small>${p.role==='concorrente'?'Concorrente':'Referência'} · ${nf(p.followers)} seguidores · mediana ${nf(p.median)} views</small>${p.note?`<em>${esc(p.note)}</em>`:''}</div><span class="chip">${plN(n,'post','posts')}</span></button>`}).join('')}</div>`:empty('Nenhum perfil ainda. Comece por 2 concorrentes diretos e 2 referências de formato.')}
      <h3 class="rd-h">Posts fora da curva no nicho</h3>
      ${S.length?`<div class="rd-st">${S.map(s=>{const x=xf(s.views,s.median),t=tier(x);return `<article class="rd-sp">
        <header><b>${esc(s.handle)}</b><span class="pill" data-ty="${esc(s.format)}">${FMTN[s.format]||'Post'}</span>${t?`<span class="chip" style="color:${TIER[t][1]};border-color:${TIER[t][1]}">${xs(x)} a mediana</span>`:''}<small>${nf(s.views)} views</small></header>
        ${s.hook?`<p class="rd-hk">“${esc(s.hook)}”</p>`:''}
        <dl>${s.emotion?`<div><dt>O que desperta</dt><dd>${esc(s.emotion)}</dd></div>`:''}${s.why?`<div><dt>Por que funcionou</dt><dd>${esc(s.why)}</dd></div>`:''}${s.formula?`<div><dt>Molde</dt><dd>${esc(s.formula)}</dd></div>`:''}</dl>
        <div class="rd-ac">${s.formula?ideaBtn(s.id,s.formula):''}<button class="btn sm ghost" data-rd-ed="${esc(s.id)}">Editar</button>${s.link?`<a class="btn sm ghost" href="${esc(s.link)}" target="_blank" rel="noopener">Abrir</a>`:''}</div></article>`}).join('')}</div>`:empty('Nenhum post estudado ainda.')}`;
  }

  const AT=[['tendencia','Tendência'],['data','Data e evento'],['conversa','Conversa da audiência']];
  function vAssuntos(){
    const T=today(),A=R('assunto'),f=fv('ra','vale');
    const L=A.filter(a=>f==='all'||(f==='vale'?!a.until||a.until>=T:a.until&&a.until<T)).sort((a,b)=>(+b.heat||0)-(+a.heat||0)||String(a.until||'9').localeCompare(String(b.until||'9')));
    return `<p class="pa-help">O que o público está vendo e falando agora. Cada assunto só vale com a ponte para o cliente: sem ponte, não entra. O "vale até" avisa quando a janela fecha.</p>
      <div class="filters">${segF('ra',[['vale','Valendo agora'],['passou','Passou'],['all','Tudo']])}<button class="btn sm red" data-rd-new="assunto">+ Assunto</button></div>
      ${L.length?`<div class="rd-as">${L.map(a=>{const left=a.until?Math.round((pd(a.until)-pd(T))/DAY):null;return `<article class="rd-a">
        <header><span class="chip">${(AT.find(x=>x[0]===a.type)||AT[0])[1]}</span>${a.heat?`<span class="rd-heat" aria-label="Força ${a.heat} de 3">${'●'.repeat(+a.heat)}${'○'.repeat(3-+a.heat)}</span>`:''}${left!=null?`<small class="${left<=3&&left>=0?'rd-soon':''}">${left<0?'janela fechou':left===0?'vale até hoje':'vale mais '+plN(left,'dia','dias')}</small>`:''}</header>
        <b>${esc(a.text)}</b>${a.source?`<small>${esc(a.source)}</small>`:''}
        ${a.bridge?`<p class="rd-f"><span>Ponte para ${esc(cli(cid()).name.split(' ')[0])}</span>${esc(a.bridge)}</p>`:'<p class="rd-none">Falta a ponte com o cliente.</p>'}
        <div class="rd-ac">${a.bridge?ideaBtn(a.id,a.bridge):''}<button class="btn sm ghost" data-rd-ed="${esc(a.id)}">Editar</button></div></article>`}).join('')}</div>`:empty('Nenhum assunto neste filtro.')}`;
  }

  function vFormulas(){
    const c=cid(),F=[...docs('radar').filter(d=>d.client===c&&d.kind==='acerto'&&d.formula).map(d=>({f:d.formula,src:'Deu certo aqui',id:d.id,mid:d.mediaId})),
      ...R('post').filter(s=>s.formula).map(s=>({f:s.formula,src:s.handle,id:s.id}))];
    return `<p class="pa-help">Os moldes que se repetem nos acertos. Uma fórmula do próprio cliente vale mais que uma do nicho: já foi testada com o público dele.</p>
      ${F.length?`<div class="al rd-fl">${F.map(x=>{const m=x.mid&&(D.media||[]).find(z=>z.ig_media_id===x.mid);return `<div><span class="chip ${x.src==='Deu certo aqui'?'ok':''}">${esc(x.src)}</span><small><b>${esc(x.f)}</b>${m?`<br>de: ${esc(capT(m))}`:''}</small>${ideaBtn(x.id,x.f)}</div>`}).join('')}</div>`:empty('As fórmulas aparecem aqui quando você anota a leitura de um acerto ou de um post estudado.')}`;
  }

  V.radar=()=>{
    const c=cid(),tab=fv('rt','aqui'),days=+fv('rd','30');
    const hits=mine(c,days).filter(x=>tier(x.xv)).filter(x=>tier(x.xv)!=='abaixo').length,T=today();
    const nA=R('assunto').filter(a=>!a.until||a.until>=T).length,nS=R('post').length,nI=docs('pautas').filter(p=>p.client===c&&(p.tags||[]).includes('radar')).length;
    const TB=[['aqui','Deu certo aqui',hits],['nicho','Nicho',nS],['assuntos','Assuntos do momento',nA],['formulas','Fórmulas','']];
    const body={aqui:vAqui,nicho:vNicho,assuntos:vAssuntos,formulas:vFormulas}[tab]||vAqui;
    return shell(topb('Radar do <em>nicho</em>',`${esc(cli(c).name)} · o que está dando certo, o que estão conversando e como trazer para o cliente`,`<button class="btn sm ghost" data-rd-plano>Acervo de pautas${nI?` · ${nI} do radar`:''}</button>`)+`
      <div class="filters">${segF('rc',CL().map(k=>[k.id,k.name]))}</div>
      <div class="pl-tabs">${TB.map(([k,l,n])=>`<button data-f="rt" data-v="${k}" aria-pressed="${tab===k}">${l}${n!==''&&n!=null?` <small>${n}</small>`:''}</button>`).join('')}</div>
      <div class="pl-body">${body()}</div>`);
  };

  /* ---------- formulários ---------- */
  const FF={
    perfil:[['handle','@ do perfil'],['role','Tipo','sel',[['concorrente','Concorrente'],['referencia','Referência de formato']]],['followers','Seguidores','num'],['median','Mediana de views dos últimos posts','num'],['note','O que observar nele','area']],
    post:[['handle','@ do perfil'],['link','Link do post'],['format','Formato','sel',[['reels','Reels'],['carrossel','Carrossel'],['foto','Post']]],['views','Views','num'],['median','Mediana do perfil','num'],['date','Data do post','date'],['hook','Gancho (abertura, como está)'],['emotion','O que desperta (alívio, status, medo de ficar de fora, prova, humor)'],['why','Por que funcionou','area'],['formula','Molde reutilizável, sem as palavras do criador','area']],
    assunto:[['text','Assunto'],['type','Tipo','sel',AT],['source','De onde veio (link, perfil, comentários)'],['until','Vale até','date'],['heat','Força (1 a 3)','sel',[['1','1 · fraco'],['2','2 · médio'],['3','3 · forte']]],['bridge','Ponte para o cliente (a ideia)','area']],
    acerto:[['why','Por que funcionou','area'],['formula','Fórmula (o molde para repetir)','area']]
  };
  const TIT={perfil:'Perfil acompanhado',post:'Post estudado',assunto:'Assunto do momento',acerto:'Por que funcionou'};
  function openR(kind,id,preset={}){
    const cur=id?doc1('radar',id):{...preset};
    const k=cur.kind||kind;
    formModal(TIT[k]+(id?'':' · '+cli(cid()).name),FF[k],cur,async v=>{
      if(k==='perfil'&&!v.handle)throw new Error('Escreva o @.');
      if(k==='assunto'&&!v.text)throw new Error('Escreva o assunto.');
      if(k==='perfil'||k==='post')v.handle=v.handle?'@'+String(v.handle).replace(/^@/,'').trim():'';
      await saveDoc('radar',id||(k==='acerto'?'acerto_'+preset.mediaId:null),{...cur,...v,kind:k,client:cur.client||cid(),by:cur.by||ME.name,updated:new Date().toISOString()});
    },id&&k!=='acerto'?async()=>delDoc('radar',id):null);
  }
  async function toPauta(src,txt){
    const d=doc1('radar',src),fmt=d.format||(d.mediaId&&((D.media||[]).find(m=>m.ig_media_id===d.mediaId)||{}).format)||'';
    const from=d.kind==='acerto'?'Repetir um acerto do próprio perfil':d.kind==='post'?'Molde de '+d.handle:d.kind==='assunto'?'Assunto do momento: '+d.text+(d.until?' (vale até '+fmtD(d.until)+')':''):'';
    await saveDoc('pautas',null,{client:cid(),text:txt.slice(0,140),format:fmt==='foto'?'post':fmt,funnel:'',status:'nova',votes:[],voters:[],tags:['radar'],note:[from,d.why].filter(Boolean).join('\n'),radar:src,by:ME.name,createdAt:new Date().toISOString()});
    toast('Guardada no Acervo de pautas');
  }

  document.addEventListener('click',async e=>{
    if(S!=='radar'||MODAL)return;const t=e.target;
    const w=t.closest('[data-rd-why]');if(w){const id=w.dataset.rdWhy;const ex=doc1('radar','acerto_'+id);openR('acerto',ex.kind?'acerto_'+id:null,{mediaId:id,kind:'acerto'});return}
    const n=t.closest('[data-rd-new]');if(n){openR(n.dataset.rdNew,null,{kind:n.dataset.rdNew});return}
    const ed=t.closest('[data-rd-ed]');if(ed){openR(null,ed.dataset.rdEd);return}
    const i=t.closest('[data-rd-idea]');if(i){i.disabled=true;try{await toPauta(i.dataset.rdIdea,i.dataset.txt);render()}catch(x){toast(x.message);i.disabled=false}return}
    if(t.closest('[data-rd-plano]')){FILT.pc=cid();FILT.pt='pautas';FILT.ps='nova';go('plano');return}
  });
})();
