/* Portal do cliente · casca Stond OS (carrega por último)
   - Menu com 5 espaços: Início, Calendário, Marca, Resultados, Arquivos. Cada espaço tem abas embaixo do título.
   - Início: o post que espera aprovação em destaque, com Aprovar e Pedir ajuste; ao lado, os próximos dias.
   - Próximos dias em ordem de data. */
(function(){
  const reps=()=>(D&&D.reports)||[];
  const SP=()=>[
    ['inicio','Início',[['inicio','Início'],['aprov','Aprovações']]],
    ['cal','Calendário',[['cal','Calendário'],['ig','Prévia do feed']]],
    ...(hasMarca()?[['marca','Marca',[['marca','A marca'],['proj','Projeto']]]]:[]),
    ['met','Resultados',[['met','Mês'],...(reps().length?[['rel','Relatório']]:[]),['inv','Anúncios'],['lnk','Site e WhatsApp'],['auto','Automações']]],
    ['arq','Arquivos',[['arq','Arquivos e links']]],
    ...(hasWa()?[['wa','WhatsApp',[['wa','WhatsApp']]]]:[])];
  const spOf=s=>SP().find(([,,T])=>T.some(([k])=>k===s))||SP()[0];

  ic.wa='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4.6 19.4l1-3.6A8 8 0 1 1 8.4 18.6z"/><path d="M9 8.6c.2-.4.5-.4.8-.4l.6 1.4-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 1.4.6c0 .3 0 .6-.4.8-.6.4-1.4.4-2.1.1a7 7 0 0 1-3-3c-.3-.7-.3-1.5.2-2z"/></svg>';
  // WhatsApp com IA: por enquanto só a demonstração, e só para quem vai ter (Gabriel)
  V.wa=function(){
    return `<div class="top"><div><p class="eyebrow">Em breve</p><h2>Atendimento no <em>WhatsApp</em></h2><p>Quem chamar no seu WhatsApp é atendido na hora pela assistente, recebe sua apresentação e chega pra você já qualificado. Cada conversa vira um cartão que anda sozinho até a venda. Aperte "Próximo passo" pra ver.</p></div></div>
    <iframe class="wa-demo" src="/demo/whatsapp?embed=1" title="Demonstração do atendimento no WhatsApp" loading="lazy"></iframe>`;
  };
  shell=function(inner){
    const L=SP(),cur=spOf(S),ph=photo(),P=pend().length;
    const b=k=>k==='inicio'&&P?`<span class="bdg">${P}</span>`:'';
    // as pílulas antigas saem: as abas do espaço ficam embaixo do título
    inner=inner.replace(/<div class="pills">[\s\S]*?<\/div>/,'');
    const tabs=cur[2].length>1?`<div class="sub po-sub">${cur[2].map(([k,l])=>`<button data-go="${k}" class="${k===S?'on':''}">${l}${k==='aprov'&&P?` <span class="bdg">${P}</span>`:''}</button>`).join('')}</div>`:'';
    inner=/<div class="top[^"]*">[\s\S]*?<\/div>\s*<\/div>/.test(inner)&&tabs?inner.replace(/(<div class="top[^"]*">[\s\S]*?<\/div>\s*<\/div>)/,'$1'+tabs):tabs+inner;
    return `<div class="app po"><aside class="side os-side"><img class="po-logo" src="assets/logo-branco.png" alt="Stond">
     <div class="who po-who">${ph?`<img src="${ph}" alt="">`:`<span>${esc(first()[0]||'?')}</span>`}<div><b>${esc(D.client.name)}</b><small>${D.client.handle?'@'+esc(D.client.handle):''}</small></div></div>
     <nav class="nav os-nav">${L.map(([k,l])=>`<button data-go="${k}" ${k===cur[0]?'aria-current="page"':''}>${ic[k]||''}${l}${b(k)}</button>`).join('')}</nav>
     <div class="os-ft">${tt()}${MODE==='login'?'<button class="out" data-out>Sair</button>':''}</div></aside>
     <main class="main"><div class="mhead"><img class="po-logo m" src="assets/logo-branco.png" alt="Stond"><span style="display:flex;gap:10px;align-items:center">${tt()}${ph?`<img class="a" src="${ph}" alt="">`:''}${MODE==='login'?'<button class="out" data-out style="padding:0">Sair</button>':''}</span></div>${edBar()}${inner}</main>
     <nav class="tabbar po-tab">${L.map(([k,l])=>`<button data-go="${k}" ${k===cur[0]?'aria-current="page"':''}>${ic[k]||''}${l}${b(k)}</button>`).join('')}</nav></div>${OPEN?modal():''}`;
  };

  /* Início */
  const _ini=V.inicio;
  V.inicio=function(){
    const raw=_ini.call(V),tp=document.createElement('template');tp.innerHTML=raw;
    const part=s=>{const e=tp.content.querySelector(s);return e?e.outerHTML:''};
    const now=new Date(),t0=iso(now),t7=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+6));
    const P=pend().slice().sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))),p=P[0];
    const nx=posts().filter(x=>x.date>=t0&&x.date<=t7).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))),days=[...new Set(nx.map(x=>x.date))];
    const head=P.length?`${esc(first())}, ${P.length} ${P.length>1?'posts esperam':'post espera'} <em>você</em>`:`${esc(first())}, tudo em dia por <em>aqui</em>`;
    const n=(p&&(p.media||[]).filter(m=>m.kind!=='pdf').length)||0,im=p?cover(p):'';
    const cap=p?String(p.caption||'').replace(/\s+/g,' ').trim():'';
    const hero=p?`<article class="po-hero"><button class="po-art" data-open="${esc(p.id)}" aria-label="Abrir ${esc(p.title)}">${im?`<img src="${esc(im)}" alt="">`:`<span class="noimg">${ty(p.type)}</span>`}
        ${n>1?`<span class="po-dots">${Array.from({length:Math.min(n,8)},(_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</span>`:''}
        <span class="po-cap"><b>${esc(p.title)}</b><small>${ty(p.type)} · ${fmtD(p.date)}${p.time?' · '+esc(p.time):''}${n>1?` · ${n} imagens`:''}</small></span></button>
       ${cap?`<p class="po-leg">“${esc(cap.slice(0,140))}${cap.length>140?'…':''}” <button class="lnkb" data-open="${esc(p.id)}">ver tudo</button></p>`:''}
       <div class="po-act"><button class="btn ghost" data-open="${esc(p.id)}">Pedir ajuste</button><button class="btn red" data-qok="${esc(p.id)}">Aprovar</button></div></article>`:'';
    const prox=`<div class="bx po-nx"><span class="lb">Próximos dias</span>${days.length?days.map(d=>{const dd=pd(d);return `<div class="po-d"><b>${dd.getDate()}<small>${WD[dd.getDay()]}</small></b><ul>${nx.filter(x=>x.date===d).map(x=>`<li${(x.media||[]).length?` data-open="${esc(x.id)}"`:''}><span>${esc(x.time||'')}</span>${esc(x.title)}${x.status==='pendente'?' <i class="chip pend">aprovar</i>':''}</li>`).join('')}</ul></div>`}).join(''):'<p class="wait">Nada marcado para os próximos 7 dias.</p>'}</div>`;
    const more=P.length>1?`<button class="po-more" data-go="aprov">Mais ${P.length-1} para aprovar ›</button>`:`<button class="po-more" data-go="aprov">Ver todas as aprovações ›</button>`;
    const top=`<div class="top"><div><p class="eyebrow">${WDL[now.getDay()]}, ${now.getDate()} de ${MES[now.getMonth()]}</p><h2>${head}</h2></div><div class="tact">${part('[data-ia-open]')}</div></div>`;
    // prévia do feed (como o perfil vai ficar) e automações do direct
    const vis=posts().filter(x=>x.type!=='story'&&(x.media||[]).length&&['pendente','aprovado','publicado'].includes(x.status));
    const fim=vis.map(x=>x.date).filter(Boolean).sort().slice(-1)[0]||t0;
    const slots=posts().filter(x=>/reel|video/i.test(x.type||'')&&!(x.media||[]).length&&x.status!=='reprovado'&&(x.date||'')>=t0&&(x.date||'')<=fim);
    const feed=vis.concat(slots).sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||''))).slice(0,9);
    const fd=feed.length?`<div class="bx po-feed"><div class="po-h"><span class="lb">Como vai ficar seu feed</span><button class="po-more" data-go="ig">Ver o perfil ›</button></div><div class="po-fg">${feed.map(x=>{const c=cover(x),fut=x.date>t0&&x.status!=='publicado';return `<button ${(x.media||[]).length?`data-open="${esc(x.id)}"`:'data-go="ig"'} class="${fut?'fut':''}" title="${esc(fmtD(x.date)+' · '+x.title)}">${c?`<img src="${esc(c)}" alt="" loading="lazy">`:`<span>Reels<small>${esc(fmtD(x.date))}</small></span>`}${fut?`<i>${esc(fmtD(x.date).split(', ').pop())}</i>`:''}${/reel/i.test(x.type||'')?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>':''}</button>`}).join('')}</div></div>`:'';
    const A=(D.automations||[]).slice().sort((a,b)=>(+b.asked30||0)-(+a.asked30||0)),tot=A.reduce((n,a)=>n+(+a.asked30||0),0);
    const au=A.length?`<div class="bx po-auto"><div class="po-h"><span class="lb">Automações do direct</span><button class="po-more" data-go="auto">Ver tudo ›</button></div><div class="po-big"><b>${nf(tot)}</b><span>${tot===1?'pessoa pediu':'pessoas pediram'} o link pelo direct nos últimos 30 dias</span></div>${A.slice(0,5).map(a=>`<div class="po-kw"><span>Comentou <b>${esc(String(a.keyword||'').toUpperCase())}</b></span><small>${nf(+a.asked30||0)} em 30 dias · ${nf(+a.sent||0)} ${(+a.sent||0)===1?'link entregue':'links entregues'}</small></div>`).join('')}</div>`:'';
    // três colunas: com post para aprovar, ele abre a primeira; sem, o "Seu mês" fica em cima
    const sis=part('.pm-sis'),rel=part('.pm-rel');
    const body=P.length
      ?`<div class="po-g3"><div class="po-c">${hero}</div><div class="po-c">${more}${part('.pm-meta')}${part('.pm-ped')}${prox}${au}</div><div class="po-c">${fd}${rel}${sis}</div></div>`
      :`${part('.pm-meta')}${part('.pm-ped')}${part('.pm-mes')}<div class="po-g3"><div class="po-c">${prox}${rel}</div><div class="po-c">${fd}</div><div class="po-c">${au}${sis}</div></div>`;
    return top+body+part('.nota,.nps');
  };
  if(D&&document.querySelector(".app"))render();
})();
