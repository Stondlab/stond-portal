/* Gestão · Stond OS · casca igual ao mockup
   - Menu de 6 itens (Hoje, Comercial, Clientes, Produção, Resultados, Stond) + lista de clientes
   - Abas embaixo do título com as telas de cada espaço
   - Hoje: linha do dia, Precisa de você, Metas do mês, Amanhã e faixa de dinheiro no pé */
(function(){
  ic.hoje=sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>');
  ic.sp_com=sv('<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>');
  ic.sp_cli=sv('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>');
  ic.sp_prod=sv('<rect x="4" y="4.5" width="4.5" height="15" rx="1"/><rect x="10.5" y="4.5" width="4.5" height="9" rx="1"/><rect x="17" y="4.5" width="3" height="12" rx="1"/>');
  ic.sp_res=sv('<path d="m4 16 5-5 4 4 7-7"/><path d="M15 8h5v5"/>');
  ic.sp_st=sv('<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>');
  const SP=[['','Hoje','hoje'],['Comercial','Comercial','sp_com'],['Clientes','Clientes','sp_cli'],['Produção','Produção','sp_prod'],['Resultados','Resultados','sp_res'],['Stond','Stond','sp_st']];
  const grpOf=k=>{if(k==='pasta')return 'Clientes';for(const [g,it] of GROUPS)if(it.some(([kk])=>kk===k))return g;return ''};
  const items=g=>((GROUPS.find(([t])=>t===g)||[])[1]||[]).filter(([k])=>V[k]);
  const last=g=>{const v=ls.get('sg-last-'+g);return v&&V[v]&&items(g).some(([k])=>k===v)?v:(items(g)[0]||[])[0]};

  shell=function(inner){
    const cur=grpOf(S);if(cur&&S!=='pasta')ls.set('sg-last-'+cur,S);
    const tabs=[['inicio','Hoje'],['agenda','Posts'],['aprov','Aprovar'],['pub','Agendados'],['fin','Financeiro']];
    const b=k=>{const n=badge(k);return n?`<span class="bdg">${n}</span>`:''};
    const nav=SP.map(([g,l,i])=>{const go_=g?last(g):'inicio',n=g?items(g).reduce((a,[k])=>a+badge(k),0):window.osNeed?osNeed().length:0;
      return `<button data-go="${go_}" ${cur===g&&(g||S==='inicio')?'aria-current="page"':''}>${ic[i]}<span>${l}</span>${n?`<span class="bdg">${n}</span>`:''}</button>`}).join('');
    const cls=CL().filter(c=>(c.status||'ativo')!=='inativo').map(c=>{const ph=cphoto(c.id);return `<button data-pasta="${esc(c.id)}" ${S==='pasta'&&FILT.pc===c.id?'aria-current="page"':''}>${ph?`<img class="mono" src="${esc(ph)}" alt="">`:`<i class="mono" style="background:${esc(c.color||'#8a5560')}">${esc((c.name||'?')[0])}</i>`}<span>${esc(c.name)}</span></button>`}).join('');
    return `<div class="app os"><aside class="side os-side"><div class="os-brand"><i class="os-s" aria-hidden="true"></i><span>Stond</span></div>
      <button class="srch" data-busca>${sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')}<span>Buscar</span><kbd>Ctrl K</kbd></button>
      <nav class="nav os-nav">${nav}</nav>
      <p class="os-lb">Clientes</p><nav class="nav os-nav os-cls">${cls}</nav>
      <div class="os-me"><span class="av">${esc((ME.name||'?')[0])}</span><div><b>${esc(ME.name)}</b><small>${esc(ME.role==='dona'?'Stond · dona':'Stond · equipe')}</small></div></div>
      <div class="os-ft">${tt()}<button class="out os-out" data-out>Sair</button></div></aside>
     <main class="main"><div class="mhead"><span class="os-brand"><i class="os-s"></i><span>Stond</span></span><span style="display:flex;gap:10px;align-items:center"><button class="srch m" data-busca aria-label="Buscar">${sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')}</button>${tt()}<button class="out" data-out style="padding:0">Sair</button></span></div>${inner}</main>
     <nav class="tabbar">${tabs.map(([k,l])=>`<button data-go="${k}" ${k===S?'aria-current="page"':''}>${ic[k]}${l}${b(k)}</button>`).join('')}</nav></div>${MODAL?MODAL.html():''}`;
  };

  /* abas do espaço, logo abaixo do título */
  const _render=render;
  render=function(){
    _render();
    const g=grpOf(S),m=document.querySelector('.main');if(!g||!m||S==='pasta')return;
    const top=m.querySelector(':scope > .top');if(!top||m.querySelector('.sub'))return;
    const it=items(g);if(it.length<2)return;
    const d=document.createElement('div');d.className='sub';
    d.innerHTML=it.map(([k,l])=>`<button data-go="${k}" class="${k===S?'on':''}">${esc(l)}</button>`).join('');
    top.after(d);
  };

  /* ---------- Hoje ---------- */
  const H0=8,H1=22;
  const hr=t=>{const [h,m]=String(t||'').split(':').map(Number);return isNaN(h)?null:h+(m||0)/60};
  V.inicio=()=>{
    const now=new Date(),T=today(),TM=iso(new Date(now.getTime()+864e5)),N=window.osNeed?osNeed():[];
    const pT=posts().filter(p=>p.date===T&&p.type!=='story'),eT=docs('events').filter(e=>e.date===T);
    const gone=pT.filter(p=>isDone(p)||(p.time&&hr(p.time)<=now.getHours()+now.getMinutes()/60&&p.status==='aprovado')).length,left=pT.length-gone;
    const head=gone?`${gone} ${gone===1?'post foi':'posts foram'} ao ar`:left?`${left} ${left===1?'post vai':'posts vão'} ao ar`:'nada vai ao ar';
    const greet=now.getHours()<12?'Bom dia':now.getHours()<18?'Boa tarde':'Boa noite';
    const L=[...pT.filter(p=>p.time).map(p=>({h:hr(p.time),t:`${p.time} · ${p.title}`,c:p.client_id,a:`data-edit-post="${esc(p.id)}"`})),...eT.filter(e=>e.start).map(e=>({h:hr(e.start),t:`${e.start} · ${e.title}`,c:e.client,a:`data-edit-doc="events:${esc(e.id)}"`}))].filter(x=>x.h!=null).sort((a,b)=>a.h-b.h);
    const X=h=>Math.max(0,Math.min(100,(h-H0)/(H1-H0)*100)),nowH=now.getHours()+now.getMinutes()/60;
    const ncl=new Set(L.map(x=>x.c)).size;
    const line=`<div class="bx os-line"><div class="os-lh"><span class="lb">Linha do dia</span><small>${ncl} ${ncl===1?'cliente':'clientes'} · ${pT.length} ${pT.length===1?'publicação':'publicações'}${eT.length?` · ${eT.length} ${eT.length===1?'compromisso':'compromissos'}`:''}</small></div>
      <div class="os-ax">${[8,10,12,14,16,18,20,22].map(h=>`<span style="left:${X(h)}%"><i></i>${String(h).padStart(2,'0')}h</span>`).join('')}
       ${L.map((x,i)=>`<button class="os-pt${X(x.h)>62?' rt':''}" ${x.a} style="${X(x.h)>62?`right:${100-X(x.h)}%`:`left:${X(x.h)}%`};--lv:${i%2}"><i style="background:${esc(ccol(x.c))}"></i><b>${esc(x.t)}</b></button>`).join('')}
       ${nowH>=H0&&nowH<=H1?`<span class="os-now" style="left:${X(nowH)}%"><small>agora</small></span>`:''}</div>
      ${L.length?'':'<p class="wait">Nenhum post ou compromisso com horário hoje.</p>'}</div>`;
    const need=`<div class="bx os-nd"><div class="os-lh"><span class="lb" style="color:var(--redtxt)">Precisa de você</span><b class="os-nn">${N.length||''}</b></div>${N.length?N.slice(0,7).map(x=>`<div class="os-ni"><span class="${x.k==='r'?'kl-r':x.k==='w'?'kl-w':'kl-n'}">${esc(x.s)}</span><div><b>${esc(x.t)}</b></div><button class="btn sm ${x.k==='r'?'':'ghost'}" ${x.a}>${esc(x.b)}</button></div>`).join(''):'<p class="wait">Nada esperando você. Bom momento para adiantar a próxima semana.</p>'}${N.length>7?`<small class="mut">E mais ${N.length-7}.</small>`:''}</div>`;
    const mk=month(),A=active();
    const metas=`<div class="bx os-mt"><span class="lb">Metas do mês</span>${A.map(c=>{const R=doc1('resultados',c.id+'_'+mk),g=num(R.meta_vendas),M=D.metrics.filter(x=>x.client_id===c.id),Lm=M.slice(-1)[0],F=M.filter(x=>x.date<mk+'-01').slice(-1)[0]||M[0],dl=Lm&&F&&Lm!==F?Lm.followers-F.followers:null;
       return `<button class="os-mi" data-pasta="${esc(c.id)}"><small>${esc(c.name.split(' ')[0])} · ${g?'vendas':'seguidores'}</small>${g?`<b>${nf(num(R.vendas))} <small>de ${nf(g)}</small></b><div class="prog"><b style="width:${Math.min(100,num(R.vendas)/g*100)}%"></b></div>`:`<b>${Lm?nf(Lm.followers):'—'}${dl!=null?` <small class="${dl<0?'kx-w':'rs-up'}">${dl>=0?'+':''}${nf(dl)} no mês</small>`:''}</b>`}</button>`}).join('')}</div>`;
    const tm=posts().filter(p=>p.date===TM&&p.type!=='story').sort((a,b)=>String(a.time).localeCompare(String(b.time)));
    const st=p=>isDone(p)?['No ar','kl-o']:p.status==='aprovado'?['Aprovado','kl-o']:p.status==='pendente'?['Com o cliente','kl-w']:p.status==='reprovado'?['Ajuste','kl-r']:['Em produção','kl-n'];
    const amanha=`<div class="bx os-am"><span class="lb">Amanhã</span>${tm.length?tm.map(p=>{const [s,k]=st(p);return `<button class="os-ai" data-edit-post="${esc(p.id)}"><span class="kl" data-ty="${esc(p.type||'post')}">${ty(p.type)}</span><b>${esc(p.title)}</b><small>${esc(cli(p.client_id).name.split(' ')[0])} · ${esc(p.time||'')} · <i class="${k}">${s}</i></small></button>`}).join(''):'<p class="wait">Nada programado para amanhã.</p>'}</div>`;
    const ms=settings('metas'),Dp=finOf('pj').filter(f=>f.type==='despesa'&&String(f.date).startsWith(mk)).reduce((s,f)=>s+num(f.amount),0),ld=docs('leads').filter(l=>!['fechado','perdido'].includes(l.stage||'novo'));
    const strip=`<div class="os-strip"><span>Receita recorrente <b>${brl(mrr())}</b>${num(ms.mrr)?` de ${brl(ms.mrr)}`:''}</span><span>Capacidade <b>${A.length} de ${num(ms.capacidade)||5}</b> clientes</span><span>Despesas do mês <b>${brl(Dp)}</b></span><span>Leads abertos <b>${ld.length}</b>${ld.length?` · ${brl(ld.reduce((s,l)=>s+num(l.value),0))}/mês`:''}</span><button class="lnk" data-go="gest">Saúde da Stond ›</button></div>`;
    return shell(`<div class="top"><div><p class="eyebrow">${WDL[now.getDay()]}, ${now.getDate()} de ${MES[now.getMonth()]}</p><h2>${greet}, ${esc(ME.name.split(' ')[0])}. ${head[0].toUpperCase()+head.slice(1)} <em>hoje</em></h2></div><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-new="leads">Novo lead</button><button class="btn red" data-new="post">Nova demanda</button></span></div>`+spaceBanner()+line+`<div class="os-3">${need}${metas}${amanha}</div>`+strip);
  };
})();
(function(){
  COLS.forEach(c=>{if(c[0]==='aprovacao')c[1]='Com o cliente'});
  const _dem=V.dem;V.dem=()=>_dem().replace('<h2>Demandas</h2>','<h2>O que está <em>andando</em></h2>');
  /* pasta: abas do cliente no lugar dos botões de cliente (o cliente se escolhe no menu) */
  const _p=V.pasta;
  V.pasta=()=>{const A=CL(),c=FILT.pc&&A.find(x=>x.id===FILT.pc)?FILT.pc:A[0]?.id;if(c)FILT.pc=c;
    const T=[['','Visão geral'],['marca','Marca'],['plano','Plano do mês'],['proj','Projeto'],['msg','Conversa'],['dem','Posts'],['met','Resultados'],['auto','Automações']];
    return _p().replace(/<div class="filters"><div class="seg">[\s\S]*?<\/div><\/div>/,`<div class="sub">${T.map(([k,l])=>k?`<button data-gav="${k}" data-gc="${esc(c)}">${l}</button>`:`<button class="on">${l}</button>`).join('')}</div>`)};
})();
