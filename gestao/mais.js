/* Gestão · Stond OS · o resto do mockup
   - Busca Ctrl+K com ações rápidas
   - Quadro: cliente, ajuste e dias parado no cartão, filtros prontos
   - Calendário: miniatura, borda pelo estado, arrastar muda a data
   - Aprovações: lembrete pelo WhatsApp, tela vazia sugere o próximo lote
   - Pasta: capa, meta do mês, saúde explicada, sistemas ligados, pedidos, linha do tempo
   - Mensagens: abrir no WhatsApp e virar demanda
   - Relatório: Leitura da Stond
   - Saúde da Stond: reserva do mês, lucro por cliente, meta de soluções */
(function(){
  const dd=s=>s?Math.max(0,Math.round((Date.now()-new Date(s))/864e5)):null;
  const hm=s=>new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const dm=s=>new Date(s).toLocaleDateString('pt-BR',{day:'numeric',month:'short'}).replace('.','');
  const lastAdj=id=>D.feedback.filter(f=>f.post_id===id&&f.kind!=='aprovado'&&f.text).slice(-1)[0];
  const wa=t=>'https://wa.me/?text='+encodeURIComponent(t);
  const first=c=>String(cli(c).name||'').split(' ')[0];

  /* ---------- campos novos ---------- */
  FORMS.reports.f.unshift(['leitura','Leitura da Stond (2 ou 3 frases: o que funcionou e o que muda)','area']);
  FORMS.pedidos={t:'Pedido para o cliente',f:[['client','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['title','O que a Stond precisa (ex.: 5 fotos do consultório)'],['due','Até quando','date'],['note','Detalhe','area'],['done','Já recebido','chk']]};
  const fm=FORMS['settings:metas'].f;
  if(!fm.some(([k])=>k==='solucoes'))fm.splice(4,0,['solucoes','Meta de soluções vendidas no ano (sistemas, sites, automações)','num'],['reservaMes','Quanto guardar por mês','num']);

  /* ---------- Busca Ctrl+K ---------- */
  const _shell=shell;
  shell=function(inner){
    return _shell(inner)
      .replace('<nav class="nav">','<button class="srch" data-busca>'+sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')+'<span>Buscar</span><kbd>Ctrl K</kbd></button><nav class="nav">')
      .replace(/(<div class="mhead"><img[^>]*>)/,'$1<button class="srch m" data-busca aria-label="Buscar">'+sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')+'</button>');
  };
  let BI=[],BS=0;
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  function bItems(q){
    const Q=norm(q.trim()),L=[];
    const add=(g,t,s,fn)=>L.push({g,t,s,fn});
    const acts=[['Nova demanda',()=>openPost()],['Novo lead',()=>openDoc('leads',null,{stage:'novo'})],['Lançar métrica',()=>{go('met');setTimeout(()=>openMetric(),0)}],['Novo evento',()=>openDoc('events',null,{date:today(),kind:'reuniao'})],['Lançar despesa',()=>openDoc('fin',null,{type:'despesa',owner:'pj',date:today()})],['Nova proposta',()=>openDoc('contracts',null,{kind:'proposta',status:'rascunho'})],['Pedido para cliente',()=>openDoc('pedidos',null,{})]];
    acts.forEach(([t,fn])=>add('Ações',t,'',fn));
    CL().forEach(c=>add('Ações','Nova demanda para '+c.name,'',()=>{FILT.dc=c.id;openPost()}));
    for(const [g,it] of GROUPS)for(const [k,l] of it)if(V[k])add('Telas',l,g||'',()=>go(k));
    CL().forEach(c=>add('Clientes',c.name,(c.handle?'@'+c.handle+' · ':'')+'abrir pasta',()=>{FILT.pc=c.id;go('pasta')}));
    posts().slice().reverse().forEach(p=>add('Posts',p.title||'Sem título',`${cli(p.client_id).name} · ${ty(p.type)}${p.date?' · '+fmtD(p.date):''}`,()=>openPost(p.id)));
    docs('leads').forEach(l=>add('Leads',l.name,(l.company||'')+' · '+(l.stage||'novo'),()=>openDoc('leads',l.id)));
    docs('pautas').forEach(p=>add('Pautas',p.title||p.name||'Pauta',cli(p.client||p.client_id).name,()=>{FILT.pc=p.client||p.client_id;go('plano')}));
    docs('solucoes').forEach(s=>add('Soluções',s.name,'Vitrine',()=>go('sol')));
    if(!Q)return L.filter(x=>x.g==='Ações').slice(0,7).concat(L.filter(x=>x.g==='Telas').slice(0,6));
    return L.filter(x=>norm(x.t+' '+x.s).includes(Q)).slice(0,24);
  }
  function bDraw(){
    const box=document.getElementById('bk');if(!box)return;const q=box.querySelector('input').value;BI=bItems(q);BS=Math.min(BS,Math.max(0,BI.length-1));
    let g='',h='';BI.forEach((x,i)=>{if(x.g!==g){g=x.g;h+=`<p class="bk-g">${esc(g)}</p>`}h+=`<button class="bk-i${i===BS?' on':''}" data-bk="${i}"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:''}</button>`});
    box.querySelector('.bk-l').innerHTML=h||'<p class="bk-n">Nada encontrado.</p>';
    const on=box.querySelector('.bk-i.on');if(on)on.scrollIntoView({block:'nearest'});
  }
  function bOpen(){
    if(document.getElementById('bk')||!ME)return;BS=0;
    const d=document.createElement('div');d.id='bk';d.className='bk';
    d.innerHTML=`<div class="bk-b" role="dialog" aria-label="Buscar"><div class="bk-h">${sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')}<input placeholder="Busque post, cliente, lead, tela ou ação" autocomplete="off"><kbd>Esc</kbd></div><div class="bk-l"></div></div>`;
    document.body.appendChild(d);const i=d.querySelector('input');i.focus();bDraw();
    i.addEventListener('input',()=>{BS=0;bDraw()});
    i.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){BS=Math.min(BI.length-1,BS+1);bDraw();e.preventDefault()}else if(e.key==='ArrowUp'){BS=Math.max(0,BS-1);bDraw();e.preventDefault()}else if(e.key==='Enter'){bRun(BS);e.preventDefault()}});
    d.addEventListener('click',e=>{const b=e.target.closest('[data-bk]');if(b){bRun(+b.dataset.bk);return}if(e.target===d)bClose()});
  }
  const bClose=()=>{const d=document.getElementById('bk');if(d)d.remove()};
  function bRun(i){const x=BI[i];bClose();if(x)x.fn()}
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('bk')?bClose():bOpen()}
    else if(e.key==='Escape'&&document.getElementById('bk'))bClose();
  });

  /* ---------- Quadro ---------- */
  const _dem=V.dem;
  V.dem=()=>{
    const f=fv('dq','all');let h=_dem();
    h=h.replace('<div class="filters">','<div class="filters">'+segF('dq',[['all','Todos os cartões'],['adj','Só com ajuste'],['stuck','Parados há 3+ dias (produção e cliente)'],['late','Atrasados']]));
    h=h.replace(/<article class="kd tr"[^>]*data-edit-post="([^"]+)">([\s\S]*?)<\/article>/g,(all,id,body)=>{
      const p=D.posts.find(x=>x.id===id);if(!p)return all;
      const n=dd(p.updated_at),adj=p.status==='reprovado'&&lastAdj(id),late=p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado';
      const col=colOf(p),stuck=n>=3&&['producao','aprovacao'].includes(col);
      if(f==='adj'&&p.status!=='reprovado')return '';if(f==='stuck'&&!stuck)return '';if(f==='late'&&!late)return '';
      const extra=`<small class="kx">${cdot(p.client_id)}${esc(cli(p.client_id).name)}${['producao','aprovacao'].includes(col)&&n!=null?` · <span class="${stuck?'kx-w':''}">${n===0?'mexido hoje':n===1?'sem mexer há 1 dia':`sem mexer há ${n} dias`}</span>`:''}</small>${adj?`<small class="kx-a">“${esc(String(adj.text).slice(0,140))}”</small>`:''}`;
      return all.replace('<div class="kft">',extra+'<div class="kft">');
    });
    h=h.replace(/(<section class="kc" data-drop="aprovacao"[^>]*><header>[\s\S]*?<\/header>)(<\/section>|<button)/,(a,hd,end)=>hd+'<p class="kx-e">Nada com o cliente. Mande o próximo lote: arraste os cartões prontos para cá.</p>'+end);
    return h;
  };

  /* ---------- Calendário ---------- */
  const stCls=p=>p.status==='reprovado'?'st-r':isDone(p)?'st-o':p.status==='pendente'?'st-w':p.status==='aprovado'?'st-b':'';
  const _ag=V.agenda;
  V.agenda=()=>_ag().replace(/<button class="ev" data-edit-post="([^"]+)" style="([^"]*)">/g,(a,id,st)=>{
    const p=D.posts.find(x=>x.id===id);if(!p)return a;const im=cover(p);
    return `<button class="ev ev-p ${stCls(p)}" draggable="true" data-cdrag="${esc(id)}" data-edit-post="${esc(id)}" style="${st}">${im?`<img class="ev-t" src="${esc(im)}" alt="" loading="lazy">`:''}`;
  }).replace('<div class="leg">','<div class="leg"><span><i class="lgb st-r"></i>Ajuste</span><span><i class="lgb st-w"></i>Com o cliente</span><span><i class="lgb st-b"></i>Aprovado</span><span><i class="lgb st-o"></i>No ar</span><span class="mut">Arraste um post para outro dia para mudar a data.</span>');
  let CD=null;
  document.addEventListener('dragstart',e=>{const k=e.target.closest&&e.target.closest('[data-cdrag]');if(k){CD=k.dataset.cdrag;e.dataTransfer.effectAllowed='move'}});
  document.addEventListener('dragover',e=>{if(CD&&e.target.closest('[data-newday]'))e.preventDefault()});
  document.addEventListener('drop',async e=>{if(!CD)return;const z=e.target.closest('[data-newday]');const id=CD;CD=null;if(!z)return;e.preventDefault();
    const p=D.posts.find(x=>x.id===id),day=z.dataset.newday;if(!p||p.date===day)return;
    if(isDone(p)||['agendado','publicando'].includes(p.publish_status)){toast('Esse post já está agendado no Instagram. Abra o cartão para mudar o horário.');return}
    try{await savePost({...p,date:day});toast('Data mudada para '+fmtD(day));render()}catch(x){toast(x.message)}});
  document.addEventListener('dragend',()=>{CD=null});

  /* ---------- Aprovações ---------- */
  const _ap=V.aprov;
  V.aprov=()=>{
    const f=fv('af','pend');let h=_ap();
    if(f==='pend'){
      const old=pend().filter(p=>dd(p.updated_at)>=2),by={};old.forEach(p=>{(by[p.client_id]=by[p.client_id]||[]).push(p)});
      const rem=Object.entries(by).map(([c,L])=>`<a class="btn sm" href="${esc(wa(`Oi, ${first(c)}! Tem ${L.length} ${L.length>1?'posts esperando':'post esperando'} sua aprovação no portal da Stond: https://portal.stond.com.br\n\n${L.map(p=>'• '+p.title+(p.date?' ('+fmtD(p.date)+')':'')).join('\n')}`))}" target="_blank" rel="noopener">Lembrar ${esc(first(c))} no WhatsApp · ${L.length}</a>`).join('');
      if(rem)h=h.replace(/(<div class="filters">[\s\S]*?<\/div><\/div>)/,`$1<div class="ap-rem"><span>Esperando há 2 dias ou mais. Mande um lembrete com um toque:</span>${rem}</div>`);
      h=h.replace('<div class="empty">Nada por aqui.</div>','<div class="empty">Nada esperando o cliente agora.<br><button class="btn sm red" data-go="dem" style="margin-top:10px">Montar o próximo lote no Quadro</button></div>');
    }
    if(f==='adj')h=h.replace(/(<small style="color:var\(--ink\)">“[\s\S]*?”<\/small>)<\/div><\/button>/g,'$1<span class="btn sm red ap-fix">Abrir para corrigir</span></div></button>');
    return h;
  };

  /* ---------- Sistemas ligados (pasta e alertas em Hoje) ---------- */
  function sistemas(c){
    const C=cli(c),out=[],now=Date.now();
    const kw=(D.kwRows||[]).filter(k=>k.client_id===c),act=kw.filter(k=>k.active!==false),L=(D.dmlog||[]).filter(x=>x.client_id===c);
    const last=L.map(x=>x.created_at).sort().slice(-1)[0],err=L.filter(x=>/err/.test(x.status||'')&&(now-new Date(x.created_at))/864e5<7).length;
    const acc=D.accounts.find(a=>a.client_id===c);
    if(kw.length)out.push({k:'auto',n:'Automação de direct',st:!acc?'parado':err?'erro':act.length?'ok':'parado',d:`${act.length} palavra${act.length===1?'':'s'} ligada${act.length===1?'':'s'}${last?' · último disparo '+dm(last)+' '+hm(last):''}${err?` · ${err} erro${err>1?'s':''} na semana`:''}`});
    const pub=posts().filter(p=>p.client_id===c&&p.publish_status),perr=pub.filter(p=>p.publish_status==='erro').length,lp=pub.filter(isDone).map(p=>p.published_at||p.updated_at).sort().slice(-1)[0];
    if(acc||pub.length)out.push({k:'pub',n:'Publicação automática',st:!acc?'parado':perr?'erro':'ok',d:`${acc?'@'+esc(acc.username||''):'Conta não conectada'}${lp?' · último post '+dm(lp):''}${perr?` · ${perr} com erro`:''}`});
    const m=D.metrics.filter(x=>x.client_id===c).slice(-1)[0],mu=m&&m.extra&&m.extra.updated_at;
    if(m){const meta=(m.extra||{}).source==='meta';out.push({k:'met',n:'Métricas do Instagram',st:meta&&dd(mu||m.date)>2?'parado':'ok',d:meta?(mu?`Lê o Meta 1 vez por dia · atualizado ${dm(mu)} às ${hm(mu)}`:`Última leitura ${fmtD(m.date)}`):`Lançadas à mão · última ${fmtD(m.date)}`})}
    if(C.access_token){const fb=D.feedback.filter(f=>f.client_id===c).slice(-1)[0];out.push({k:'portal',n:'Portal do cliente',st:'ok',d:fb?`Última resposta do cliente ${dm(fb.created_at)}`:'Ligado, cliente ainda não respondeu'})}
    if((D.links||[]).some(l=>l.client_id===c))out.push({k:'lnk',n:'Links curtos',st:'ok',d:`${(D.links||[]).filter(l=>l.client_id===c).length} links`});
    return out;
  }
  window.sysAlerts=()=>{const L=[];active().forEach(c=>sistemas(c.id).filter(s=>s.st!=='ok').forEach(s=>L.push({c:c.id,t:`${s.n} de ${c.name} ${s.st==='erro'?'deu erro':'parou'}: ${s.d.replace(/<[^>]+>/g,'')}`,s:'Sistema',k:s.st==='erro'?'r':'w',a:`data-pasta="${esc(c.id)}"`,b:'Ver'})));return L};
  window.sistemasDe=sistemas;
  const STL={ok:['Ligado','kl-o'],parado:['Parado','kl-w'],erro:['Com erro','kl-r']};

  /* ---------- Pasta ---------- */
  function healthWhy(C){
    const ps=posts().filter(p=>p.client_id===C.id),pn=ps.filter(p=>p.status==='pendente'),L=[['Base','80','']];
    const oldest=pn.map(p=>p.updated_at).sort()[0];
    if(oldest){const d=(Date.now()-new Date(oldest))/864e5;if(d>3)L.push(['Aprovação parada há '+Math.round(d)+' dias','−'+Math.round(Math.min(30,d*3)),'r'])}
    const ov=finOf('pj').filter(f=>f.client===C.id&&f.type==='receita'&&!f.paid&&f.date&&f.date<today()).length;if(ov)L.push([ov+' mensalidade'+(ov>1?'s':'')+' atrasada'+(ov>1?'s':''),'−'+ov*15,'r']);
    const nota=num((C.data||{}).nota);if(nota)L.push(['Nota do cliente '+nota,(nota>=7?'+':'−')+Math.abs((nota-7)*4),nota>=7?'o':'r']);
    if(ps.some(p=>String(p.date).startsWith(month())))L.push(['Tem post no mês','+8','o']);else L.push(['Nenhum post no mês','0','w']);
    return L;
  }
  function timeline(c){
    const E=[];
    D.feedback.filter(f=>f.client_id===c).forEach(f=>{const p=D.posts.find(x=>x.id===f.post_id);E.push([f.created_at,f.kind==='aprovado'?'Aprovou':f.kind==='ajuste'||f.kind==='reprovado'?'Pediu ajuste':'Comentou',`${p?'"'+p.title+'"':''}${f.text?' · '+f.text:''}`,f.kind==='aprovado'?'o':'w'])});
    posts().filter(p=>p.client_id===c&&isDone(p)&&p.date).forEach(p=>E.push([p.published_at||p.date+'T12:00:00','Foi ao ar',`"${p.title}"`,'b']));
    docs('messages').filter(m=>m.client===c).forEach(m=>E.push([m.at,m.who==='Cliente'?'Mensagem do cliente':'Mensagem da Stond',m.text,'n']));
    docs('reports').filter(r=>r.client===c&&r.sent).forEach(r=>E.push([r.sentAt,'Relatório enviado',r.id.split('_')[1]||'','b']));
    docs('pedidos').filter(r=>r.client===c).forEach(r=>E.push([r.createdAt,r.done?'Pedido recebido':'Pedido ao cliente',r.title,r.done?'o':'w']));
    return E.filter(x=>x[0]).sort((a,b)=>String(b[0]).localeCompare(String(a[0]))).slice(0,14);
  }
  const _pasta=V.pasta;
  V.pasta=()=>{
    let h=_pasta();const A=CL(),c=FILT.pc&&A.find(x=>x.id===FILT.pc)?FILT.pc:A[0]?.id;if(!c)return h;
    const C=cli(c),d=C.data||{},ph=cphoto(c),mo=month(),R=doc1('resultados',c+'_'+mo),meta=num(R.meta_vendas);
    const ren=d.renewAt||(docs('contracts').filter(k=>k.client===c&&k.status==='assinado'&&k.renewAt).map(k=>k.renewAt).sort().slice(-1)[0]);
    h=h.replace('<div class="top"><div><p class="eyebrow">Pasta do cliente</p>',`<div class="top os-cap"><div class="os-cap-i">${ph?`<img src="${esc(ph)}" alt="">`:`<span style="background:${esc(C.color||'#8a5560')}">${esc((C.name||'?')[0])}</span>`}</div><div><p class="eyebrow">Pasta do cliente</p>`);
    h=h.replace(/saúde (\d+)/,`saúde $1${ren?' · renova '+fmtD(ren):''}`);
    const S=sistemas(c),P=docs('pedidos').filter(p=>p.client===c).sort((a,b)=>(a.done-b.done)||String(a.due||'9').localeCompare(String(b.due||'9'))),T=timeline(c),W=healthWhy(C);
    const add=`<div class="os-p3">
      <div class="bx"><span class="lb">Meta do mês</span>${meta?`<div class="num">${nf(num(R.vendas))}<small>de ${nf(meta)} vendas</small></div><div class="prog"><b style="width:${Math.min(100,num(R.vendas)/meta*100)}%"></b></div>`:'<p class="wait">Sem meta lançada para este mês.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-gav="met" data-gc="${esc(c)}">${meta?'Atualizar vendas':'Definir meta'}</button></div>
      <div class="bx"><span class="lb">Saúde ${health(C)} de 100, por quê</span><div class="os-why">${W.map(([t,v,k])=>`<div><small>${esc(t)}</small><b class="${k==='r'?'rs-dn':k==='o'?'rs-up':''}">${v}</b></div>`).join('')}</div></div>
      <div class="bx"><span class="lb">Sistemas ligados</span>${S.length?`<div class="os-sys">${S.map(s=>`<div><i class="${STL[s.st][1]}">${STL[s.st][0]}</i><b>${esc(s.n)}</b><small>${s.d}</small></div>`).join('')}</div><span class="ft">O cliente vê essa lista no portal</span>`:'<p class="wait">Nenhum sistema ligado ainda.</p>'}</div>
     </div>
     <div class="os-p2">
      <div class="bx"><span class="lb">Pedidos para o cliente</span>${P.length?`<div class="al">${P.map(p=>`<div data-edit-doc="pedidos:${esc(p.id)}" style="cursor:pointer"><b style="width:62px;flex:none">${p.due?fmtD(p.due).replace(/^\w+, /,''):''}</b><small>${esc(p.title)}</small><span class="chip ${p.done?'ok':p.due&&p.due<today()?'':'pend'}">${p.done?'Recebido':p.due&&p.due<today()?'Atrasado':'Esperando'}</span></div>`).join('')}</div>`:'<p class="wait">Fotos, vídeos ou informações que a Stond precisa. Aparece no portal com o prazo.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-pedido="${esc(c)}">Novo pedido</button></div>
      <div class="bx"><span class="lb">Linha do tempo</span>${T.length?`<div class="os-tl">${T.map(([at,t,s,k])=>`<div><small>${esc(dm(at))}</small><i class="${k==='o'?'tl-o':k==='w'?'tl-w':k==='b'?'tl-b':''}"></i><div><b>${esc(t)}</b><small>${esc(String(s||'').slice(0,110))}</small></div></div>`).join('')}</div>`:'<p class="wait">Aprovações, ajustes, entregas e conversas aparecem aqui.</p>'}</div>
     </div>`;
    return h.replace('<p class="eyebrow" style="margin-top:18px">Produção</p>',add+'<p class="eyebrow" style="margin-top:18px">Produção</p>');
  };

  /* ---------- Mensagens ---------- */
  V.msg=()=>{
    const c=fv('gc',CL()[0]?.id),L=docs('messages').filter(m=>m.client===c).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
    return shell(topb('Mensagens','Conversa com cada cliente',`<a class="btn" href="${esc(wa(`Oi, ${first(c)}! `))}" target="_blank" rel="noopener">Abrir no WhatsApp</a>`)+`<div class="filters">${segF('gc',CL().map(k=>[k.id,k.name]))}</div>
    <div class="list" style="padding:12px;gap:8px">${L.length?L.map(m=>`<div class="row" style="border:0;${m.who==='Cliente'?'':'justify-content:flex-end;text-align:right'}"><div class="t"><b style="font-weight:500">${esc(m.text)}</b><small>${esc(m.who==='Cliente'?cli(c).name:(m.by||'Stond'))} · ${m.at?new Date(m.at).toLocaleString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</small></div>${m.who==='Cliente'?`<div class="ra"><button class="btn sm ghost" data-msg-dem="${esc(m.id)}">Virar demanda</button><a class="btn sm ghost" href="${esc(wa(`Oi, ${first(c)}! Sobre a sua mensagem "${String(m.text).slice(0,120)}": `))}" target="_blank" rel="noopener">Responder no WhatsApp</a></div>`:''}</div>`).join(''):'<p class="wait" style="padding:10px">Nenhuma mensagem com este cliente.</p>'}
    <form id="mf" style="display:flex;gap:8px;margin-top:6px"><input id="mt" placeholder="Escreva uma mensagem" style="flex:1" autocomplete="off"><button class="btn sm red">Enviar</button></form></div>`);
  };

  /* ---------- Relatório ---------- */
  const _rel=V.rel;
  V.rel=()=>{
    const c=fv('rc',CL()[0]?.id),mk=fv('rm',iso(new Date(new Date().getFullYear(),new Date().getMonth()-1,1)).slice(0,7)),rep=doc1('reports',c+'_'+mk);
    return _rel().replace('<p class="rt"><b>Destaque</b>',`<p class="rt rt-l"><b>Leitura da Stond</b>${esc(rep.leitura||'Escreva 2 ou 3 frases: o que funcionou, o que não funcionou e o que muda no próximo mês. É a primeira coisa que o cliente lê.')}</p><p class="rt"><b>Destaque</b>`)
      .replace('O relatório do mês. Você revisa, escreve o destaque e envia para o portal do cliente','Você escreve a Leitura da Stond e envia. O cliente lê no portal e dá a nota do mês');
  };

  /* ---------- Saúde da Stond ---------- */
  const _gest=V.gest;
  V.gest=()=>{
    const ms=settings('metas'),mk=month(),y=String(new Date().getFullYear());
    const resM=num(ms.reservaMes)||500,res=finOf('all').filter(f=>/reserva/i.test(f.category||f.desc||'')&&String(f.date).startsWith(mk)).reduce((s,f)=>s+num(f.amount),0);
    const desp=c=>finOf('pj').filter(f=>f.type==='despesa'&&f.client===c&&String(f.date).startsWith(mk)).reduce((s,f)=>s+num(f.amount),0);
    const LC=active().map(c=>({c,f:fee(c),d:desp(c.id)})).map(x=>({...x,l:x.f-x.d})).sort((a,b)=>b.l-a.l);
    const SOL=docs('solucoes').filter(s=>s.tag!=='social').map(s=>norm(s.name));
    const sold=docs('contracts').filter(k=>k.status==='assinado'&&String(k.start||k.createdAt||'').startsWith(y)&&(SOL.some(n=>norm(k.title).includes(n))||/sistema|site|automa|portal/i.test(k.title||''))).length,gS=num(ms.solucoes);
    const add=`<div class="bx w2 w2m"><span class="lb">Lucro por cliente · ${MES[new Date().getMonth()]}</span>${LC.length?`<div class="al">${LC.map(x=>`<div>${cdot(x.c.id)}<b>${esc(x.c.name)}</b><small>${brl(x.f)} − ${brl(x.d)} de custos</small><b style="font-weight:500;color:${x.l>=0?'var(--ok)':'var(--red)'}">${brl(x.l)}</b></div>`).join('')}</div><span class="ft">Mensalidade menos as despesas lançadas com o cliente no Financeiro</span>`:'<p class="wait">Nenhum cliente ativo.</p>'}</div>
     <div class="bx"><span class="lb">Reserva do mês</span><div class="num">${brl(res)}<small>de ${brl(resM)}</small></div><div class="prog"><b style="width:${Math.min(100,res/resM*100)}%"></b></div><span class="ft">Lance no Financeiro com a categoria "Reserva"</span></div>
     <div class="bx"><span class="lb">Soluções vendidas em ${y}</span><div class="num">${sold}${gS?`<small>de ${gS}</small>`:''}</div>${gS?`<div class="prog"><b style="width:${Math.min(100,sold/gS*100)}%"></b></div>`:''}<span class="ft">Sistemas, sites e automações, separado de social media</span></div>`;
    return _gest().replace(/(<div class="bx w4 w2m"><span class="lb">Metas de )/,add+'$1');
  };

  /* ---------- cliques ---------- */
  document.addEventListener('click',e=>{
    const t=e.target;
    if(t.closest('[data-busca]')){e.stopPropagation();bOpen();return}
    const pe=t.closest('[data-pedido]');if(pe){e.stopPropagation();openDoc('pedidos',null,{client:pe.dataset.pedido,due:iso(new Date(Date.now()+5*864e5))});return}
    const md=t.closest('[data-msg-dem]');if(md){e.stopPropagation();const m=docs('messages').find(x=>x.id===md.dataset.msgDem);if(!m)return;FILT.dc=m.client;openPost(null,'ideia');
      setTimeout(()=>{const f=$('#fm');if(!f)return;if(f.elements.title)f.elements.title.value=String(m.text).slice(0,70);if(f.elements.brief)f.elements.brief.value='Pedido do cliente em '+(m.at?dm(m.at):'')+': '+m.text},0);
      saveDoc('messages',m.id,{...doc1('messages',m.id),readStond:true}).catch(()=>{});return}
  },true);
})();
