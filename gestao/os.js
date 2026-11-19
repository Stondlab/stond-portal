/* Gestão · Stond OS
   - Hoje como lista do dia: o que precisa de você, a agenda de hoje e a semana.
   - Pasta do cliente: tudo de um cliente num lugar só, com atalhos para cada tela
     já filtrada nele.
   Só lê os dados que o app já carrega. */
(function(){
  ic.pasta=sv('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>');
  // Marca, Projetos e Antes e depois ficam dentro da pasta do cliente (decisão de 13/11: edição pela visão do cliente)
  const gC=GROUPS.find(([t])=>t==='Clientes');
  if(gC)gC[1]=gC[1].filter(([k])=>!['marca','proj','antes'].includes(k));

  const t0=()=>today();
  const addD=(n)=>iso(new Date(Date.now()+n*864e5));

  /* ---------- Hoje ---------- */
  function need(){
    const L=[],now=new Date(),T=t0();
    posts().filter(p=>p.status==='reprovado').forEach(p=>L.push({c:p.client_id,t:`${cli(p.client_id).name} pediu ajuste em "${p.title}"`,s:'Ajuste pedido',k:'r',a:`data-edit-post="${esc(p.id)}"`,b:'Abrir'}));
    posts().filter(p=>p.publish_status==='erro').forEach(p=>L.push({c:p.client_id,t:`"${p.title}" não foi publicado`,s:'Falha ao publicar',k:'r',a:'data-go="pub"',b:'Ver'}));
    pend().filter(p=>p.date&&p.date<=addD(2)).forEach(p=>L.push({c:p.client_id,t:`"${p.title}" vai ao ar ${fmtD(p.date)} e ainda não foi aprovado`,s:'Cobrar aprovação',k:'w',a:'data-go="aprov"',b:'Ver'}));
    late().forEach(p=>L.push({c:p.client_id,t:`"${p.title}" passou do prazo (${fmtD(p.due)})`,s:'Atrasada',k:'w',a:`data-edit-post="${esc(p.id)}"`,b:'Abrir'}));
    const msgs=docs('messages').filter(m=>m.who==='Cliente'&&!m.readStond);
    [...new Set(msgs.map(m=>m.client))].forEach(c=>{const n=msgs.filter(m=>m.client===c).length;L.push({c,t:`${cli(c).name} mandou ${n} mensage${n===1?'m':'ns'}`,s:'Mensagem',k:'b',a:'data-go="msg"',b:'Responder'})});
    finOf('pj').filter(f=>!f.paid&&f.date&&f.date<=T).forEach(f=>L.push({c:f.client,t:`${f.type==='receita'?'Receber':'Pagar'} ${f.desc||''} · ${brl(f.amount)}${f.date<T?' (venceu '+fmtD(f.date)+')':''}`,s:f.type==='receita'?'A receber':'A pagar',k:f.date<T?'r':'w',a:'data-go="fin"',b:'Ver'}));
    docs('leads').filter(l=>!['fechado','perdido'].includes(l.stage)&&l.nextDate&&l.nextDate<=T).forEach(l=>L.push({c:null,t:`${l.name}: ${l.nextStep||'próximo passo'}`,s:'Comercial',k:'b',a:'data-go="com"',b:'Abrir'}));
    docs('contracts').filter(k=>k.status==='assinado'&&k.renewAt&&k.renewAt>=T&&(pd(k.renewAt)-now)/864e5<=30).forEach(k=>L.push({c:k.client,t:`Contrato de ${cli(k.client).name} vence ${fmtD(k.renewAt)}`,s:'Renovar',k:'w',a:'data-go="prop"',b:'Ver'}));
    active().filter(c=>health(c)<55).forEach(c=>L.push({c:c.id,t:`${c.name} está com saúde ${health(c)}`,s:'Risco de cancelar',k:'r',a:`data-pasta="${esc(c.id)}"`,b:'Abrir pasta'}));
    const ord={r:0,w:1,b:2};return L.sort((a,b)=>ord[a.k]-ord[b.k]);
  }
  V.inicio=()=>{
    const now=new Date(),T=t0(),N=need();
    const ev=docs('events').filter(e=>e.date===T).map(e=>[e.start||'',e.client,e.title,'']);
    const pt=posts().filter(p=>p.date===T).map(p=>[p.time||'',p.client_id,`${ty(p.type)} "${p.title}" vai ao ar`,p.status==='aprovado'||isDone(p)?'<i class="kl-o">Pronto</i>':p.status==='pendente'?'<i class="kl-w">Sem aprovação</i>':'<i class="kl-r">Não está pronto</i>']);
    const items=[...ev,...pt].sort((a,b)=>a[0].localeCompare(b[0]));
    const week=[...Array(7)].map((_,i)=>{const d=new Date(now.getTime()+i*864e5),k=iso(d),P=posts().filter(p=>p.date===k);return {d,k,P,E:docs('events').filter(e=>e.date===k)}});
    const M=mrr(),goal=num(settings('metas').mrr)||0;
    return shell(topb(`${now.getHours()<12?'Bom dia':now.getHours()<18?'Boa tarde':'Boa noite'}, <em>${esc(ME.name.split(' ')[0])}</em>`,
      N.length?`${N.length} ${N.length===1?'coisa precisa':'coisas precisam'} de você e ${items.length} ${items.length===1?'compromisso':'compromissos'} hoje`:`Nada esperando você. ${items.length} ${items.length===1?'compromisso':'compromissos'} hoje`,
      '<button class="btn red" data-new="post">Nova demanda</button>').replace('<h2>',`<p class="eyebrow">${WDL[now.getDay()]}, ${now.getDate()} de ${MES[now.getMonth()]}</p><h2>`)+spaceBanner()+`
    <div class="os-g">
     <div class="bx os-need"><span class="lb">Precisa de você${N.length?` · ${N.length}`:''}</span>${N.length?N.slice(0,9).map(x=>`<div class="os-it">${x.c?cdot(x.c):'<i class="cd" style="background:var(--faint)"></i>'}<div><b>${esc(x.t)}</b><small><i class="kl-${x.k==='b'?'n':x.k}">${x.s}</i></small></div><button class="btn sm" ${x.a}>${x.b}</button></div>`).join('')+(N.length>9?`<small class="mut">E mais ${N.length-9}.</small>`:''):'<p class="wait">Tudo em dia. Bom momento para planejar a semana.</p>'}</div>
     <div class="os-col">
      <div class="bx"><span class="lb">Hoje</span>${items.length?`<div class="tl">${items.map(([h,c,t,x])=>`<div><b>${esc(h)}</b><span>${cdot(c)}${esc(t)}</span>${x}</div>`).join('')}</div>`:'<p class="wait">Nada marcado para hoje.</p>'}</div>
      <div class="bx"><span class="lb">Números da Stond</span><div class="os-k"><div><small>Receita recorrente</small><b>${brl(M)}</b>${goal?`<div class="prog"><b style="width:${Math.min(100,M/goal*100)}%"></b></div>`:''}</div><div><small>Clientes ativos</small><b>${active().length}<em> de ${num(settings('metas').capacidade)||5}</em></b></div><div><small>Com os clientes</small><b>${pend().length}<em> para aprovar</em></b></div></div></div>
     </div>
    </div>
    <div class="bx"><span class="lb">Próximos 7 dias</span><div class="os-wk">${week.map(w=>`<div class="${w.k===T?'on':''}"><small>${WDL[w.d.getDay()].slice(0,3)} ${w.d.getDate()}</small>${w.P.map(p=>`<button data-edit-post="${esc(p.id)}" class="os-p">${cdot(p.client_id)}<span>${p.time?esc(p.time)+' · ':''}${esc(p.title)}</span></button>`).join('')}${w.E.map(e=>`<span class="os-p ev">${esc(e.start||'')} ${esc(e.title)}</span>`).join('')}${!w.P.length&&!w.E.length?'<span class="os-p none">—</span>':''}</div>`).join('')}</div></div>`);
  };

  /* ---------- Pasta do cliente ---------- */
  const SET={dem:['dc'],agenda:['pcl'],met:['mc'],reels:['mc'],marca:['mc'],antes:['mc'],msg:['gc'],inv:['ic'],lnk:['lc'],site:['sc'],auto:['ac'],rel:['rc'],plano:['pc'],proj:['mc']};
  V.pasta=()=>{
    const A=CL(),c=FILT.pc&&A.find(x=>x.id===FILT.pc)?FILT.pc:A[0]?.id;if(!c)return shell(topb('Pasta do cliente','')+empty('Nenhum cliente.'));
    const C=cli(c),d=C.data||{},ps=posts().filter(p=>p.client_id===c),mo=month();
    const inM=ps.filter(p=>String(p.date||'').startsWith(mo)),m=D.metrics.filter(x=>x.client_id===c).slice(-1)[0];
    const msgs=docs('messages').filter(x=>x.client===c).sort((a,b)=>String(b.at).localeCompare(String(a.at))),unread=msgs.filter(x=>x.who==='Cliente'&&!x.readStond).length;
    const inv=docs('invest').filter(x=>x.client===c).sort((a,b)=>String(b.month).localeCompare(String(a.month)))[0];
    const plan=docs('pautas').filter(x=>(x.client||x.client_id)===c);
    const kw=(D.kwRows||[]).filter(x=>x.client_id===c),dmN=(D.dmlog||[]).filter(x=>x.client_id===c&&String(x.created_at).startsWith(mo)).length;
    const gav=(v,t,l,body)=>`<button class="os-gv" data-gav="${v}" data-gc="${esc(c)}"><span class="ico2">${ic[v]||ic.pasta}</span><div><b>${t}</b><small>${l}</small>${body||''}</div></button>`;
    return shell(`<div class="top"><div><p class="eyebrow">Pasta do cliente</p><h2>${esc(C.name)}</h2><p>${C.handle?'@'+esc(C.handle)+' · ':''}${fee(C)?brl(fee(C))+'/mês · ':''}saúde ${health(C)}${d.nota?' · nota '+esc(d.nota):''}</p></div><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-edit-client="${esc(c)}">Editar cliente</button><a class="btn red" href="https://portal.stond.com.br/?c=${esc(C.access_token)}&ver=1" target="_blank" rel="noopener">Ver e editar como cliente</a></span></div>
     <div class="filters"><div class="seg">${A.map(x=>`<button data-pasta="${esc(x.id)}" aria-pressed="${x.id===c}">${esc(x.name)}</button>`).join('')}</div></div>
     <div class="os-sum"><div><b>${inM.length}</b><small>posts no mês</small></div><div><b>${ps.filter(p=>p.status==='pendente').length}</b><small>esperando aprovação</small></div><div><b>${ps.filter(p=>p.status==='reprovado').length}</b><small>ajustes pedidos</small></div><div><b>${m?nf(m.followers):'—'}</b><small>seguidores</small></div><div><b>${nf(dmN)}</b><small>palavras no mês</small></div></div>
     <p class="eyebrow" style="margin-top:18px">Produção</p>
     <div class="os-gvs">${gav('dem','Quadro',`${ps.filter(p=>!isDone(p)&&p.stage!=='arquivado').length} em andamento`)}${gav('agenda','Calendário',`${inM.length} posts em ${MES[new Date().getMonth()]}`)}${gav('aprov','Aprovações',`${ps.filter(p=>p.status==='pendente').length} com o cliente`)}${gav('plano','Plano do mês',plan.length?`${plan.length} pautas`:'Pautas, funil e mapa')}</div>
     <p class="eyebrow" style="margin-top:18px">Marca e relação</p>
     <div class="os-gvs">${gav('marca','Marca','Manual, cores, voz e metas da marca')}${gav('proj','Projeto','Etapas do método e entregas')}${gav('antes','Antes e depois','Perfil antes e hoje')}${gav('msg','Conversa',unread?`${unread} nova${unread===1?'':'s'} do cliente`:msgs[0]?'Última: '+esc(String(msgs[0].text||'').slice(0,40)):'Sem mensagens')}</div>
     <p class="eyebrow" style="margin-top:18px">Resultados</p>
     <div class="os-gvs">${gav('met','Métricas',m?`${nf(m.followers)} seguidores · alcance ${nf(m.reach)}`:'Sem medição')}${gav('reels','Raio-x do Reels','Gancho, meio e CTA de cada vídeo')}${gav('inv','Anúncios',inv?`${esc(inv.month)} · ${brl(inv.spent)}`:'Nenhum mês lançado')}${gav('auto','Automações',`${kw.length} palavra${kw.length===1?'':'s'} · ${dmN} no mês`)}${gav('site','Site e WhatsApp','Quem chamou e de onde veio')}${gav('lnk','Links curtos','Cliques por link')}${gav('rel','Relatório do mês','Montar e mandar para o portal')}</div>`);
  };
  // atalhos: nome do cliente na lista abre a pasta
  const _cli=V.cli;
  V.cli=()=>_cli().replace(/<button class="lk" data-edit-client="([^"]+)">Editar<\/button>/g,'<button class="lk" data-pasta="$1"><b>Abrir pasta</b></button><button class="lk" data-edit-client="$1">Editar</button>');

  document.addEventListener('click',e=>{
    const p=e.target.closest('[data-pasta]');if(p){e.preventDefault();e.stopPropagation();FILT.pc=p.dataset.pasta;go('pasta');return}
    const g=e.target.closest('[data-gav]');if(g){e.preventDefault();e.stopPropagation();const v=g.dataset.gav,c=g.dataset.gc;(SET[v]||[]).forEach(k=>FILT[k]=c);go(v);return}
  },true);
})();
