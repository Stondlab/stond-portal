/* Gestão · Stond OS · Comercial
   - Funil: quanto tempo cada lead está parado na etapa, última conversa, próximo passo,
     meta de clientes novos no mês e botão "Virar cliente" quando fecha.
   - Vitrine de soluções: o que a Stond vende, com problema que resolve, preço, prazo,
     em quais clientes já roda e atalho para montar a proposta. */
(function(){
  ic.sol=sv('<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="m4 8.5 8 4.5 8-4.5M12 13v7"/>');
  const gCom=GROUPS.find(([t])=>t==='Comercial');
  if(gCom&&!gCom[1].some(([k])=>k==='sol'))gCom[1].splice(1,0,['sol','Vitrine de soluções']);

  // campos novos do lead e da meta
  const fl=FORMS.leads.f,iNote=fl.findIndex(([k])=>k==='note');
  if(!fl.some(([k])=>k==='lastTalk'))fl.splice(iNote,0,['lastTalk','Última conversa','date'],['lostWhy','Se perdeu, por quê']);
  const fm=FORMS['settings:metas'].f;
  if(!fm.some(([k])=>k==='novos'))fm.splice(3,0,['novos','Meta de clientes novos por mês','num']);

  // grava a data em que o lead entrou na etapa (arrastando ou editando)
  const _save=saveDoc;
  saveDoc=async function(col,id,data){
    if(col==='leads'){const old=id&&docs('leads').find(x=>x.id===id);if(!old||(old.stage||'novo')!==(data.stage||'novo'))data={...data,stageAt:today()}}
    return _save(col,id,data);
  };

  const row=id=>D.docs.find(x=>x.collection==='leads'&&x.id===id)||{};
  const days=s=>s?Math.max(0,Math.round((pd(today())-pd(s))/864e5)):null;
  const since=l=>l.stageAt||String(row(l.id).updated_at||l.createdAt||'').slice(0,10)||null;
  const dtxt=n=>n==null?'':n===0?'hoje':n===1?'há 1 dia':`há ${n} dias`;
  const LIM={novo:2,contato:5,proposta:4,negociacao:7};
  const open=L=>L.filter(l=>!['fechado','perdido'].includes(l.stage||'novo'));

  V.com=()=>{
    const L=docs('leads'),T=today(),mk=T.slice(0,7);
    const won=L.filter(l=>l.stage==='fechado'),lost=L.filter(l=>l.stage==='perdido');
    const wonM=won.filter(l=>String(since(l)||'').startsWith(mk)).length;
    const goal=num(settings('metas').novos)||0,O=open(L);
    const rate=won.length+lost.length?Math.round(won.length/(won.length+lost.length)*100):null;
    const cyc=won.map(l=>l.createdAt&&since(l)?days(String(l.createdAt).slice(0,10))-days(since(l)):null).filter(x=>x!=null);
    const avg=cyc.length?Math.round(cyc.reduce((a,b)=>a+b,0)/cyc.length):null;
    const stuck=O.filter(l=>days(since(l))>(LIM[l.stage||'novo']||5)).length;
    const card=l=>{
      const st=l.stage||'novo',d=days(since(l)),late=st!=='fechado'&&d>(LIM[st]||5),lt=days(l.lastTalk);
      const nx=l.nextDate?`<small class="cm-nx${l.nextDate<T?' lt':''}">${esc(l.nextStep||'Próximo passo')} · ${fmtD(l.nextDate)}</small>`:(st!=='fechado'?'<small class="cm-nx no">Sem próximo passo</small>':'');
      return `<article class="kd" draggable="true" data-drag-lead="${esc(l.id)}" data-edit-doc="leads:${esc(l.id)}"><div class="klb">${l.source?`<span class="kl">${esc(l.source)}</span>`:''}${st!=='fechado'&&d!=null?`<span class="kl${late?' lt':''}">${d===0?'Entrou hoje':(late?'Parado ':'')+dtxt(d)}</span>`:''}</div><b>${esc(l.name)}</b>${l.company?`<small>${esc(l.company)}</small>`:''}${nx}<div class="km"><small class="kdt" style="margin:0">${l.value?brl(l.value)+'/mês':''}</small>${lt!=null?`<small style="margin-left:auto">Falou ${dtxt(lt)}</small>`:''}</div>${st==='fechado'?(l.clientId?`<span class="cm-ok">Já é cliente</span>`:`<button class="btn sm red" data-lead-cli="${esc(l.id)}">Virar cliente</button>`):''}</article>`};
    return shell(topb('Funil <em>comercial</em>',`${O.length} ${O.length===1?'lead aberto':'leads abertos'}${stuck?`, ${stuck} parado${stuck>1?'s':''}`:''}`,'<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-go="sol">Vitrine</button><button class="btn red" data-new="leads">Novo lead</button></span>')+`
    <div class="rs-meta">
      <div><span class="lb">Clientes novos no mês</span><b>${wonM}${goal?`<small>de ${goal}</small>`:''}</b>${goal?`<div class="prog"><b style="width:${Math.min(100,wonM/goal*100)}%"></b></div>`:'<button class="btn sm ghost" style="align-self:flex-start" data-cm-meta>Definir meta</button>'}</div>
      <div><span class="lb">Em negociação</span><b>${brl(sum(O.map(l=>({amount:l.value}))))}<small>/mês</small></b><small class="mut">${O.length} ${O.length===1?'lead':'leads'}</small></div>
      <div><span class="lb">Taxa de fechamento</span><b>${rate==null?'—':rate+'%'}</b><small class="mut">${won.length} fechados, ${lost.length} perdidos</small></div>
      <div><span class="lb">Tempo até fechar</span><b>${avg==null?'—':avg+'<small>dias</small>'}</b><small class="mut">média dos fechados</small></div>
    </div>
    ${L.length?'':`<div class="cm-tip"><b>Funil vazio.</b> Cadastre quem pediu orçamento, quem veio por indicação ou quem você quer abordar. Cada cartão mostra há quantos dias está parado e cobra o próximo passo em Hoje.</div>`}
    <div class="kb">${STG.map(([k,n,c])=>{const it=L.filter(l=>(l.stage||'novo')===k).sort((a,b)=>String(since(a)).localeCompare(String(since(b))));return `<section class="kc" data-drop-lead="${k}" style="--cc:${c}"><header><b>${n}</b><span>${it.length}${it.length&&sum(it.map(l=>({amount:l.value})))?' · '+brl(sum(it.map(l=>({amount:l.value})))):''}</span></header>${it.map(card).join('')}${k==='novo'?'<button class="kadd" data-new="leads">+ Novo lead</button>':''}</section>`}).join('')}</div>
    ${lost.length?`<details class="cm-lost"><summary>Perdidos (${lost.length})</summary><div class="list">${lost.map(l=>`<button class="row" data-edit-doc="leads:${esc(l.id)}"><div class="t"><b>${esc(l.name)}</b><small>${esc(l.lostWhy||'Motivo não anotado')}</small></div><small>${fmtD(since(l))}</small></button>`).join('')}</div></details>`:''}`);
  };

  /* ---------- Vitrine de soluções ---------- */
  const TAG=[['automacao','Automação de direct'],['portal','Portal do cliente'],['site','Site'],['trafego','Tráfego pago'],['social','Social media'],['branding','Marca'],['video','Vídeo'],['sistemas','Sistema sob medida'],['outro','Outro']];
  FORMS.solucoes={t:'Solução',f:[['name','Nome'],['tag','Tipo','sel',TAG],['problem','Problema que resolve','area'],['includes','O que entra','area'],['price','Preço','num'],['priceKind','Cobrança','sel',[['mensal','Por mês'],['unico','Valor único'],['setup','Implantação + mensal']]],['monthly','Se implantação, mensal depois','num'],['deadline','Prazo de entrega'],['active','Mostrar na vitrine','chk']]};
  const SVC={site:'Site',trafego:'Tráfego pago',social:'Social media',branding:'Branding',video:'Vídeo',sistemas:'Sistemas'};
  const runs=s=>{
    const has=c=>((c.data||{}).services||[]);
    if(s.tag==='automacao')return active().filter(c=>(D.kwRows||[]).some(k=>k.client_id===c.id));
    if(s.tag==='portal')return active().filter(c=>c.access_token||D.posts.some(p=>p.client_id===c.id&&D.feedback.some(f=>f.post_id===p.id)));
    if(s.tag==='trafego')return active().filter(c=>has(c).includes('Tráfego pago')||docs('invest').some(i=>i.client===c.id));
    if(SVC[s.tag])return active().filter(c=>has(c).includes(SVC[s.tag]));
    return [];
  };
  const PRE=[
    {tag:'automacao',name:'Automação de direct',problem:'Quem comenta a palavra no post recebe o link ou a resposta no direct na hora, sem ninguém responder à mão.',includes:'Palavras-chave, mensagens, ligação com o Instagram pela API oficial da Meta, relatório de quem pediu.'},
    {tag:'portal',name:'Portal do cliente',problem:'Cliente aprova posts, vê métricas e arquivos num lugar só, sem perder mensagem no WhatsApp.',includes:'Aprovação do calendário, métricas do mês, marca, arquivos e relatórios.'},
    {tag:'social',name:'Social media mensal',problem:'Perfil parado ou sem estratégia, conteúdo que não vira contato.',includes:'Calendário do mês, carrosséis, roteiros de Reels, legendas, publicação e relatório.'},
    {tag:'trafego',name:'Gestão de tráfego',problem:'Anúncio que gasta e não traz conversa nem venda.',includes:'Campanhas no Meta, criativos, acompanhamento de custo por conversa e por cliente.'},
    {tag:'site',name:'Site que vende',problem:'Sem lugar próprio para mostrar o trabalho e captar pedidos de orçamento.',includes:'Página, textos, WhatsApp, rastreio de visitas e cliques.'},
    {tag:'branding',name:'Marca do zero',problem:'Marca sem identidade ou que não passa o valor do serviço.',includes:'Diagnóstico, plataforma de marca, briefing de logo, manual.'},
    {tag:'sistemas',name:'Sistema sob medida',problem:'Processo do cliente feito em planilha, papel ou WhatsApp.',includes:'Levantamento, protótipo, sistema no ar, ajustes no primeiro mês.'}
  ];
  const priceTxt=s=>!num(s.price)?'Preço a definir':s.priceKind==='unico'?brl(s.price):s.priceKind==='setup'?`${brl(s.price)} + ${brl(s.monthly)}/mês`:`${brl(s.price)}/mês`;
  V.sol=()=>{
    const S=docs('solucoes'),on=S.filter(s=>s.active!==false),off=S.filter(s=>s.active===false);
    const used=new Set(S.map(s=>s.tag));
    const sug=PRE.filter(p=>!used.has(p.tag));
    const cardS=s=>{const R=runs(s);return `<article class="cm-sol${s.active===false?' off':''}"><header><span class="kl">${esc((TAG.find(t=>t[0]===s.tag)||['','Outro'])[1])}</span>${s.deadline?`<small>${esc(s.deadline)}</small>`:''}</header><b>${esc(s.name)}</b><p>${esc(s.problem||'')}</p>${s.includes?`<small class="mut">${esc(s.includes)}</small>`:''}<div class="cm-pr">${priceTxt(s)}</div><div class="cm-run">${R.length?`<small>Já roda em</small>${R.map(c=>`<span class="kav" style="background:${esc(c.color||'#8f0a19')}" title="${esc(c.name)}">${esc((c.name||'?')[0])}</span>`).join('')}<small>${R.map(c=>esc(c.name)).join(', ')}</small>`:'<small>Ainda não roda em nenhum cliente</small>'}</div><footer><button class="btn sm ghost" data-edit-doc="solucoes:${esc(s.id)}">Editar</button><button class="btn sm red" data-sol-prop="${esc(s.id)}">Pôr na proposta</button></footer></article>`};
    return shell(topb('Vitrine de <em>soluções</em>','O que a Stond vende, por quanto e onde já funciona','<button class="btn red" data-new="solucoes">Nova solução</button>')+`
    ${on.length?`<div class="cm-grid">${on.map(cardS).join('')}</div>`:`<div class="cm-tip"><b>Vitrine vazia.</b> Comece pelas sugestões abaixo: cada uma abre já preenchida, é só colocar preço e prazo.</div>`}
    ${sug.length?`<p class="eyebrow" style="margin:22px 0 10px">Sugestões a partir do que a Stond já faz</p><div class="cm-grid">${sug.map(p=>{const R=runs(p);return `<article class="cm-sol sug"><header><span class="kl">${esc((TAG.find(t=>t[0]===p.tag)||[])[1])}</span></header><b>${esc(p.name)}</b><p>${esc(p.problem)}</p><div class="cm-run">${R.length?`<small>Já roda em ${R.map(c=>esc(c.name)).join(', ')}</small>`:'<small>Nenhum cliente ainda</small>'}</div><footer><button class="btn sm" data-sol-pre="${esc(p.tag)}">Adicionar à vitrine</button></footer></article>`}).join('')}</div>`:''}
    ${off.length?`<details class="cm-lost"><summary>Fora da vitrine (${off.length})</summary><div class="cm-grid">${off.map(cardS).join('')}</div></details>`:''}`);
  };

  document.addEventListener('click',e=>{
    const t=e.target;
    const lc=t.closest('[data-lead-cli]');
    if(lc){e.stopPropagation();e.preventDefault();const id=lc.dataset.leadCli,l=docs('leads').find(x=>x.id===id);if(!l)return;
      openClient();const o=MODAL.onSave;
      MODAL.onSave=async v=>{await o(v);const c=D.clients.find(x=>x.name===v.name);await saveDoc('leads',id,{...l,clientId:c?c.id:v.name})};
      requestAnimationFrame(()=>{const f=$('#fm');if(!f)return;const set=(k,x)=>{if(f.elements[k]&&x!=null&&x!=='')f.elements[k].value=x};
        set('name',l.name);set('fee',l.value);set('since',today());
        const src=['Indicação','Instagram','Site'].includes(l.source)?l.source:'Outro';set('origem',src)});
      return}
    const sp=t.closest('[data-sol-prop]');
    if(sp){e.stopPropagation();const s=docs('solucoes').find(x=>x.id===sp.dataset.solProp);if(!s)return;
      openDoc('contracts',null,{kind:'proposta',status:'rascunho',title:s.name,value:s.priceKind==='setup'?num(s.monthly):s.priceKind==='unico'?'':num(s.price),obs:[s.problem,s.includes&&'Inclui: '+s.includes,s.deadline&&'Prazo: '+s.deadline,s.priceKind==='unico'&&num(s.price)?'Valor único: '+brl(s.price):'',s.priceKind==='setup'&&num(s.price)?'Implantação: '+brl(s.price):''].filter(Boolean).join('\n')});return}
    const pr=t.closest('[data-sol-pre]');
    if(pr){e.stopPropagation();const p=PRE.find(x=>x.tag===pr.dataset.solPre);if(p)openDoc('solucoes',null,{...p,priceKind:'mensal',active:true});return}
    const ns=t.closest('[data-new="solucoes"]');
    if(ns){e.stopPropagation();openDoc('solucoes',null,{priceKind:'mensal',active:true});return}
    const cm=t.closest('[data-cm-meta]');
    if(cm){e.stopPropagation();openDoc('settings','metas');return}
  },true);
})();
