/* Gestão · Planejamento do mês: os 10 passos do mês de cada cliente, em ordem.
   O que já existe (Marca, Agenda, Demandas, Aprovação, Publicação, Métricas) vira atalho com o resumo do mês.
   O que é novo mora aqui: Acervo de pautas, Funil do mês, Key visual e Mapa do mês.
   agency_docs: 'plano' (id = cliente_AAAA-MM: done, funnel, kv, map) e 'pautas' (id aleatório). */
(function(){
  ic.plano=sv('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M8 14.2l1.8 1.8 3.6-3.8"/>');
  if(!GROUPS.some(g=>g[1].some(([k])=>k==='plano')))GROUPS[0][1].splice(1,0,['plano','Planejamento']);

  const FMT=[['reels','Reels'],['carrossel','Carrossel'],['story','Stories'],['post','Post']];
  const FUN=[['topo','Topo','Atrair','Gente nova conhecendo a marca: alcance, conteúdo que se compartilha.','#3f8fd8',40],
             ['meio','Meio','Relacionar','Quem já segue passa a confiar: autoridade, bastidores, prova.','#e0a33b',35],
             ['fundo','Fundo','Converter','Quem confia age: oferta, depoimento, chamada para o direct.','#c8102e',25]];
  const SIT=[['nova','Nova'],['pauta','Na pauta'],['usada','Usada']];
  const STEPS=[
    ['marca','Central estratégica','Persona, posicionamento, tom de voz e concorrentes na Marca do cliente.'],
    ['kv','Key visual do mês','Paleta, clima e referências que guiam as artes do mês.'],
    ['mapa','Mapa do mês','Objetivo, produtos, canais, verba e datas do mês.'],
    ['funil','Funil do mês','O objetivo de topo, meio e fundo e quanto de cada um.'],
    ['pautas','Acervo de pautas','Ideias votadas que entram na pauta do mês.'],
    ['agenda','Calendário','Datas de posts, gravações e entregas.'],
    ['dem','Demandas','Produção de cada peça no quadro.'],
    ['aprov','Aprovação','O cliente aprova ou pede ajuste no portal.'],
    ['pub','Agendamento','Aprovado entra na fila e publica sozinho.'],
    ['met','Métricas','Fechar o mês com os números e o que aprender.']];

  const cid=()=>fv('pc',CL()[0]?.id);
  const mk=()=>fv('pm',month());
  const pid=()=>cid()+'_'+mk();
  const plan=()=>({done:{},funnel:{},kv:{},map:{},...doc1('plano',pid())});
  async function savePlan(patch){const p={...plan(),...patch,client:cid(),month:mk(),updated:new Date().toISOString()};await saveDoc('plano',pid(),p)}
  const pautas=()=>docs('pautas').filter(p=>p.client===cid());
  const votes=p=>(p.votes||[]).length;
  const mesN=m=>{const [y,mm]=m.split('-').map(Number);return Mes(mm-1)+' '+y};
  const shift=(m,n)=>{const [y,mm]=m.split('-').map(Number);return iso(new Date(y,mm-1+n,1)).slice(0,7)};
  const funOf=k=>FUN.find(f=>f[0]===k);
  const pl_=(n,a,b)=>n+' '+(n===1?a:b);

  /* resumo de cada passo a partir do que já existe no app */
  function hint(k){
    const c=cid(),m=mk(),P=posts().filter(p=>p.client_id===c&&String(p.date||'').startsWith(m)),pl=plan();
    if(k==='marca'){const b=doc1('marca',c);return b.phrase?(b.shared?'Marca pronta e visível ao cliente':'Marca preenchida, ainda oculta ao cliente'):'Marca ainda não preenchida'}
    if(k==='kv'){const n=(pl.kv.colors||'').split(/[\s,]+/).filter(x=>/^#?[0-9a-f]{3,6}$/i.test(x)).length;return pl.kv.mood?`${n} cores · ${esc(pl.kv.mood.slice(0,60))}`:'Ainda não definido'}
    if(k==='mapa'){const r=(pl.map.branches||'').split('\n').filter(x=>x.trim()).length;return pl.map.center||pl.map.goal?`${esc(pl.map.center||pl.map.goal)} · ${r} assuntos`:'Ainda não definido'}
    if(k==='funil'){const n=FUN.filter(([f])=>(pl.funnel[f]||{}).goal).length;return n?`${n} de 3 etapas com objetivo`:'Ainda não definido'}
    if(k==='pautas'){const A=pautas(),na=A.filter(p=>p.status==='pauta'&&p.month===m).length;return `${pl_(A.filter(p=>(p.status||'nova')==='nova').length,'ideia nova','ideias novas')} · ${na} na pauta do mês`}
    if(k==='agenda')return `${P.filter(p=>p.type!=='story').length} posts e ${P.filter(p=>p.type==='story').length} stories com data no mês`;
    if(k==='dem'){const pr=P.filter(p=>colOf(p)==='producao').length,id=P.filter(p=>colOf(p)==='ideia').length;return `${pl_(id,'ideia','ideias')} · ${pr} em produção`}
    if(k==='aprov'){const pe=P.filter(p=>p.status==='pendente').length,aj=P.filter(p=>p.status==='reprovado').length;return `${pe} esperando o cliente${aj?` · ${aj} com ajuste`:''}`}
    if(k==='pub'){const ag=P.filter(p=>p.publish_status==='agendado').length,pu=P.filter(isDone).length;return `${ag} agendados · ${pu} publicados`}
    if(k==='met'){const M=D.metrics.filter(x=>x.client_id===c),L=M.slice(-1)[0];return L?`Última medição ${fmtD(L.date)} · ${nf(L.followers)} seguidores`:'Sem medição ainda'}
    return '';
  }
  const INPAGE={kv:'kv',mapa:'mapa',funil:'funil',pautas:'pautas'};

  /* ---------- abas ---------- */
  function vPassos(){
    const pl=plan(),n=STEPS.filter(([k])=>pl.done[k]).length;
    return `<div class="pl-prog"><div><b>${n} de 10</b><span>passos feitos em ${esc(mesN(mk()))}</span></div>${bar(n*10,'var(--red)')}</div>
    <div class="pl-steps">${STEPS.map(([k,t,d],i)=>{const on=!!pl.done[k];return `<div class="pl-st${on?' on':''}">
      <button class="pl-ck" data-pl-done="${k}" aria-pressed="${on}" aria-label="Marcar ${esc(t)} como feito">${on?'✓':i+1}</button>
      <div class="pl-tx"><b>${t}</b><small>${d}</small><em>${hint(k)}</em></div>
      <button class="btn sm ghost" data-pl-open="${k}">${INPAGE[k]?'Abrir':'Ir para '+t.split(' ')[0].toLowerCase()}</button></div>`}).join('')}</div>`;
  }

  function card(p){
    const mine=(p.votes||[]).includes(ME.email),f=funOf(p.funnel),st=p.status||'nova',post=p.postId&&posts().find(x=>x.id===p.postId);
    return `<article class="pa-cd${st==='usada'?' used':''}">
      <button class="pa-vt${mine?' on':''}" data-pa-vote="${esc(p.id)}" aria-pressed="${mine}" aria-label="Votar"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 14 6-6 6 6"/></svg><b>${votes(p)}</b></button>
      <div class="pa-bd"><b>${esc(p.text)}</b>
        <div class="kt">${p.format?`<span class="pill" data-ty="${esc(p.format)}">${ty(p.format)}</span>`:''}${f?`<span class="chip" style="color:${f[4]};border-color:${f[4]}">${f[1]}</span>`:''}${(p.tags||[]).map(t=>`<span class="pa-tg">#${esc(t)}</span>`).join('')}
        ${st==='pauta'?`<span class="chip pend">Na pauta · ${esc(mesN(p.month||mk()))}</span>`:st==='usada'?'<span class="chip ok">Usada</span>':''}</div>
        ${p.note?`<small>${esc(p.note)}</small>`:''}
        <small class="pa-by">${esc(p.by||'')}${p.createdAt?' · '+fmtD(p.createdAt):''}${(p.votes||[]).length?' · votos: '+(p.voters||[]).map(esc).join(', '):''}</small></div>
      <div class="pa-ac">${st==='nova'?`<button class="btn sm ghost" data-pa-st="${esc(p.id)}|pauta">Pôr na pauta</button>`:''}
        ${st!=='usada'?`<button class="btn sm red" data-pa-dem="${esc(p.id)}">Virar demanda</button>`:post?`<button class="btn sm ghost" data-edit-post="${esc(post.id)}">Ver demanda</button>`:''}
        ${st==='pauta'?`<button class="btn sm ghost" data-pa-st="${esc(p.id)}|nova">Tirar da pauta</button>`:''}
        <button class="btn sm ghost" data-pa-ed="${esc(p.id)}">Editar</button></div></article>`;
  }
  function vPautas(){
    const s=fv('ps','aberto'),f=fv('pf2','all'),A=pautas();
    const L=A.filter(p=>s==='aberto'?(p.status||'nova')!=='usada':s==='mes'?p.status==='pauta'&&p.month===mk():(p.status||'nova')===s)
      .filter(p=>f==='all'||p.format===f||p.funnel===f).sort((a,b)=>votes(b)-votes(a)||String(b.createdAt).localeCompare(String(a.createdAt)));
    return `<form class="pa-qk" id="paq"><input name="t" id="pat" placeholder="Anote uma ideia e dê Enter" autocomplete="off" aria-label="Nova ideia">
      <select name="f" aria-label="Etapa do funil"><option value="">Etapa do funil</option>${FUN.map(([k,n,v])=>`<option value="${k}">${n} · ${v}</option>`).join('')}</select><button class="btn sm red">Guardar</button></form>
    <p class="pa-help"><b>#reels</b> escolhe o formato · <b>#etiqueta</b> organiza · o voto mais alto sobe para o topo</p>
    <div class="filters">${segF('ps',[['aberto','Em aberto · '+A.filter(p=>(p.status||'nova')!=='usada').length],['nova','Novas'],['mes','Na pauta de '+Mes(+mk().slice(5)-1).toLowerCase()],['usada','Usadas']])}
      ${segF('pf2',[['all','Tudo'],...FMT,...FUN.map(([k,n])=>[k,n])])}</div>
    ${L.length?`<div class="pa-ls">${L.map(card).join('')}</div>`:empty(A.length?'Nenhuma ideia neste filtro.':'O acervo está vazio. Anote a primeira ideia acima: ela fica guardada para este e os próximos meses.')}`;
  }

  function vFunil(){
    const pl=plan(),m=mk(),P=pautas().filter(p=>p.month===m&&(p.status==='pauta'||p.status==='usada')),tot=P.length;
    return `<p class="pa-help">Diga o que cada etapa precisa fazer neste mês e quanto do conteúdo vai para ela. As pautas do mês entram na coluna da etapa delas.</p>
    <div class="fu-bar">${FUN.map(([k,n,,,c,d])=>{const w=num((pl.funnel[k]||{}).pct)||d;return `<span style="flex:${w};background:${c}">${n} ${w}%</span>`}).join('')}</div>
    <div class="fu">${FUN.map(([k,n,v,d,c,def])=>{const F=pl.funnel[k]||{},it=P.filter(p=>p.funnel===k),w=num(F.pct)||def,real=tot?Math.round(it.length/tot*100):0,off=tot&&Math.abs(real-w)>=15;
      return `<section class="fu-c" style="--cc:${c}"><header><b>${n} · ${v}</b><span>${pl_(it.length,'pauta','pautas')}</span></header>
       <small>${d}</small>
       <label>Objetivo do mês<textarea data-pl-f="funnel.${k}.goal" rows="2" placeholder="Ex.: chegar em 2 mil seguidores novos">${esc(F.goal||'')}</textarea></label>
       <label>Quanto do conteúdo (%)<input data-pl-f="funnel.${k}.pct" inputmode="numeric" value="${esc(F.pct??def)}"></label>
       <div class="fu-real${off?' off':''}">${tot?`Na pauta agora: ${real}%${off?(real>w?' (acima)':' (abaixo)'):''}`:'Nenhuma pauta do mês ainda'}</div>
       ${it.map(p=>`<div class="fu-it">${p.format?`<span class="pill" data-ty="${esc(p.format)}">${ty(p.format)}</span>`:''}<span>${esc(p.text)}</span></div>`).join('')}
       <button class="kadd" data-pl-tab="pautas">+ Pauta para o ${n.toLowerCase()}</button></section>`}).join('')}</div>
    ${P.filter(p=>!p.funnel).length?`<p class="pa-help" style="margin-top:12px">${P.filter(p=>!p.funnel).length} pautas do mês ainda sem etapa do funil. Abra o acervo e escolha a etapa de cada uma.</p>`:''}`;
  }

  function vKv(){
    const k=plan().kv,cols=String(k.colors||'').split(/[\s,]+/).map(x=>x.trim()).filter(x=>/^#?[0-9a-f]{3,6}$/i.test(x)).map(x=>x[0]==='#'?x:'#'+x);
    const refs=String(k.refs||'').split('\n').map(x=>x.trim()).filter(Boolean);
    return `<p class="pa-help">O visual que liga as artes do mês. A identidade fixa fica na Marca; aqui é o clima deste mês.</p>
    <div class="kv">${cols.length?`<div class="kv-pal">${cols.map(c=>`<span style="background:${esc(c)}"><i>${esc(c)}</i></span>`).join('')}</div>`:''}
     <label>Clima do mês<textarea data-pl-f="kv.mood" rows="2" placeholder="Ex.: verão, luz natural, tons quentes, leve">${esc(k.mood||'')}</textarea></label>
     <label>Cores do mês (códigos separados por vírgula)<input data-pl-f="kv.colors" placeholder="#0b1f3a, #e0a33b, #f4efe6" value="${esc(k.colors||'')}"></label>
     <label>Fotos e elementos (o que usar)<textarea data-pl-f="kv.use" rows="2">${esc(k.use||'')}</textarea></label>
     <label>Referências (um link por linha: Pinterest, posts, artes)<textarea data-pl-f="kv.refs" rows="3">${esc(k.refs||'')}</textarea></label>
     ${refs.length?`<div class="kv-refs">${refs.map(r=>/^https?:\/\//.test(r)?`<a href="${esc(r)}" target="_blank" rel="noopener">${esc(r.replace(/^https?:\/\/(www\.)?/,'').slice(0,48))}</a>`:`<span>${esc(r)}</span>`).join('')}</div>`:''}</div>`;
  }

  const MAPF=[['goal','Objetivo do mês','Ex.: vender 3 pacotes de fim de ano'],['products','Produtos e ofertas','Ex.: consultoria de milhas, pacote réveillon'],['channels','Canais','Ex.: Reels, stories, direct, anúncio no Facebook'],['budget','Verba','Ex.: R$ 300 em anúncios'],['dates','Datas do mês','Ex.: 20/11 Black Friday, 25/12 Natal']];
  function vMapa(){
    const m=plan().map,R=String(m.branches||'').split('\n').map(x=>x.trim()).filter(Boolean),filled=MAPF.filter(([k])=>String(m[k]||'').trim());
    return `<p class="pa-help">O mês inteiro numa tela: tema, objetivo, o que vender, onde, com quanto e em que datas. Cada assunto pode virar pauta.</p>
    <div class="mm"><div class="mm-c">${esc(m.center||'Tema do mês')}</div>
     ${filled.length||R.length?`<div class="mm-r">${filled.map(([k,l])=>`<div><b>${l}</b><small>${esc(m[k])}</small></div>`).join('')}${R.map(r=>{const [h,...x]=r.split(':');return `<div class="mm-s"><b>${esc(h)}</b>${x.length?`<small>${esc(x.join(':'))}</small>`:''}<button class="pa-mini" data-mm-pauta="${esc(h.trim())}">+ pauta</button></div>`}).join('')}</div>`:''}</div>
    <div class="kv"><label>Tema central do mês<input data-pl-f="map.center" placeholder="Ex.: Viajar mais gastando menos" value="${esc(m.center||'')}"></label>
     ${MAPF.map(([k,l,ph])=>`<label>${l}<input data-pl-f="map.${k}" placeholder="${esc(ph)}" value="${esc(m[k]||'')}"></label>`).join('')}
     <label>Assuntos do mês (um por linha; use "assunto: detalhe")<textarea data-pl-f="map.branches" rows="5" placeholder="Milhas: como juntar sem cartão caro&#10;Bastidores: viagem de dezembro">${esc(m.branches||'')}</textarea></label></div>`;
  }

  V.plano=()=>{
    const c=cid(),m=mk(),tab=fv('pt','passos');
    const T=[['passos','Os 10 passos'],['pautas','Acervo de pautas'],['funil','Funil do mês'],['kv','Key visual'],['mapa','Mapa do mês']];
    const body={passos:vPassos,pautas:vPautas,funil:vFunil,kv:vKv,mapa:vMapa}[tab]||vPassos;
    return shell(topb('Planejamento do mês',`${esc(cli(c).name)} · ${esc(mesN(m))}`,`<div class="seg"><button data-f="pm" data-v="${shift(m,-1)}">‹ ${Mes(+shift(m,-1).slice(5)-1)}</button><button data-f="pm" data-v="${shift(m,1)}">${Mes(+shift(m,1).slice(5)-1)} ›</button></div>`)+`
     <div class="filters">${segF('pc',CL().map(k=>[k.id,k.name]))}</div>
     <div class="pl-tabs">${T.map(([k,l])=>`<button data-f="pt" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
     <div class="pl-body">${body()}</div>`);
  };

  /* ---------- ações ---------- */
  function parse(t){const tags=[],o={format:''};const text=t.replace(/#([\wÀ-ú-]+)/g,(_,w)=>{const l=w.toLowerCase(),f=FMT.find(([k,n])=>k===l||n.toLowerCase()===l||(l==='stories'&&k==='story'));if(f&&!o.format)o.format=f[0];else tags.push(l);return ''}).replace(/\s+/g,' ').trim();return {...o,text,tags}}
  function openPauta(id,preset={}){
    const p=id?docs('pautas').find(x=>x.id===id):{status:'nova',...preset};
    const F=[['text','Ideia'],['format','Formato','sel',[['',''],...FMT]],['funnel','Etapa do funil','sel',[['',''],...FUN.map(([k,n,v])=>[k,n+' · '+v])]],['status','Situação','sel',SIT],['month','Mês da pauta','month'],['tags','Etiquetas (separe por vírgula)'],['note','Detalhes, gancho, referência','area']];
    formModal(id?'Pauta':'Nova pauta',F,{...p,tags:(p.tags||[]).join(', ')},async v=>{
      if(!v.text)throw new Error('Escreva a ideia.');
      const tags=String(v.tags||'').split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean);
      if(v.status==='pauta'&&!v.month)v.month=mk();
      await saveDoc('pautas',id,{...(id?doc1('pautas',id):{client:cid(),by:ME.name,createdAt:new Date().toISOString(),votes:[],voters:[]}),...v,tags,client:id?p.client:cid()});
    },id?async()=>delDoc('pautas',id):null);
  }
  async function toDemand(id){
    const p=doc1('pautas',id);
    const brief=[p.note,p.funnel?'Funil: '+funOf(p.funnel)[1]+' · '+funOf(p.funnel)[2]:'',(p.tags||[]).length?'Etiquetas: '+p.tags.map(t=>'#'+t).join(' '):''].filter(Boolean).join('\n');
    const row={id:`${p.client}-${Date.now().toString(36)}`,client_id:p.client,title:p.text,type:p.format||'carrossel',status:'rascunho',stage:'ideia',media:[],brief:brief||null,date:null,due:null};
    const d=await savePost(row);
    await saveDoc('pautas',id,{...p,status:'usada',month:p.month||mk(),postId:d.id,usedAt:new Date().toISOString()});
    toast('Virou demanda em Ideias');
  }
  const set=(o,path,v)=>{const ks=path.split('.');let x=o;ks.slice(0,-1).forEach(k=>{x[k]={...(x[k]||{})};x=x[k]});x[ks.at(-1)]=v;return o};
  let tm=null;
  document.addEventListener('input',e=>{const el=e.target.closest('[data-pl-f]');if(!el||S!=='plano')return;
    const path=el.dataset.plF,v=el.value;clearTimeout(tm);tm=setTimeout(async()=>{const p=plan();set(p,path,v);
      try{await savePlan(p);if(/kv\.colors|kv\.refs|map\./.test(path)||path.endsWith('.pct')){const a=document.activeElement,id=a&&a.dataset.plF,pos=a&&a.selectionStart;render();const n=id&&document.querySelector(`[data-pl-f="${id}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}}catch(x){toast(x.message)}},700)});

  document.addEventListener('submit',async e=>{if(e.target.id!=='paq')return;e.preventDefault();
    const f=e.target,raw=f.elements.t.value.trim();if(!raw)return;const p=parse(raw);if(!p.text)return toast('Escreva a ideia.');
    const b=f.querySelector('button');b.disabled=true;
    try{await saveDoc('pautas',null,{...p,client:cid(),funnel:f.elements.f.value,status:'nova',votes:[],voters:[],by:ME.name,createdAt:new Date().toISOString()});render();const i=$('#pat');if(i)i.focus()}catch(x){toast(x.message);b.disabled=false}});

  document.addEventListener('click',async e=>{
    if(S!=='plano'||MODAL)return;const t=e.target;
    const dn=t.closest('[data-pl-done]');if(dn){const p=plan(),k=dn.dataset.plDone;p.done={...p.done,[k]:!p.done[k]};try{await savePlan(p);render()}catch(x){toast(x.message)}return}
    const op=t.closest('[data-pl-open]');if(op){const k=op.dataset.plOpen,c=cid(),m=mk();
      if(INPAGE[k]){FILT.pt=INPAGE[k];render();return}
      if(k==='marca')FILT.mc=c;if(k==='met')FILT.mc=c;if(k==='dem'){FILT.dc=c;FILT.dm=m}if(k==='agenda')CALM=pd(m+'-01');
      go(k);return}
    const tb=t.closest('[data-pl-tab]');if(tb){FILT.pt=tb.dataset.plTab;render();const i=$('#pat');if(i)i.focus();return}
    const vt=t.closest('[data-pa-vote]');if(vt){const id=vt.dataset.paVote,p=doc1('pautas',id),V_=new Set(p.votes||[]),N=new Set(p.voters||[]);
      if(V_.has(ME.email)){V_.delete(ME.email);N.delete(ME.name)}else{V_.add(ME.email);N.add(ME.name)}
      try{await saveDoc('pautas',id,{...p,votes:[...V_],voters:[...N]});render()}catch(x){toast(x.message)}return}
    const st=t.closest('[data-pa-st]');if(st){const [id,s]=st.dataset.paSt.split('|'),p=doc1('pautas',id);
      try{await saveDoc('pautas',id,{...p,status:s,month:s==='pauta'?mk():p.month});toast(s==='pauta'?'Entrou na pauta de '+mesN(mk()):'Voltou para o acervo');render()}catch(x){toast(x.message)}return}
    const dm=t.closest('[data-pa-dem]');if(dm){dm.disabled=true;try{await toDemand(dm.dataset.paDem);render()}catch(x){toast(x.message);dm.disabled=false}return}
    const ed=t.closest('[data-pa-ed]');if(ed){openPauta(ed.dataset.paEd);return}
    const mp=t.closest('[data-mm-pauta]');if(mp){openPauta(null,{text:mp.dataset.mmPauta+': ',status:'nova'});return}
  });
})();
