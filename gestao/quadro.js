/* Gestão · Quadro no jeito Trello / Asana
   - Quadro: colunas de largura fixa com rolagem para o lado, cartões compactos (capa, etiquetas coloridas,
     título, selos de data, anexos, checklist, comentários e cliente), "+ Adicionar um cartão"
   - Lista: tabela agrupada por etapa (como no Asana), clique abre o cartão
   - Filtros numa linha só: Quadro|Lista, cliente, mostrar, mês */
(function(){
  const LCOL={'Urgente':'#d9363e','Gravar':'#8f0a19','Editar':'#5a7fa8','Revisar':'#e8a11c','Esperando cliente':'#c868b8','Tráfego':'#3f9f6f'};
  const I={
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12.5 12.6 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/></svg>',
    chk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    msg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5h14v10H9l-4 4z"/></svg>'};
  const dd=s=>s?Math.max(0,Math.round((Date.now()-new Date(s))/864e5)):null;
  const adjTxt=id=>{const f=D.feedback.filter(x=>x.post_id===id&&x.kind!=='aprovado'&&x.text).slice(-1)[0];return f&&f.text};

  function list(){
    const c=fv('dc','all'),show=fv('dq','all'),mk=fv('dm',month());
    let L=posts().filter(p=>c==='all'||p.client_id===c).filter(p=>p.type!=='story'||fv('ds','0')==='1');
    L=L.filter(p=>!p.date||String(p.date).startsWith(mk)||colOf(p)!=='publicado');
    L=L.filter(p=>colOf(p)!=='publicado'||String(p.date).startsWith(mk));
    if(show==='adj')L=L.filter(p=>p.status==='reprovado');
    if(show==='stuck')L=L.filter(p=>['producao','aprovacao'].includes(colOf(p))&&dd(p.updated_at)>=3);
    if(show==='late')L=L.filter(p=>p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado');
    if(show==='reels')L=L.filter(p=>/reel/i.test(p.type||''));
    if(show==='carrossel')L=L.filter(p=>/carros/i.test(p.type||''));
    return L.sort((a,b)=>((a.date||'9')+(a.time||'')).localeCompare((b.date||'9')+(b.time||'')));
  }
  function card(p){
    const im=cover(p),late=p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado',col=colOf(p),n=dd(p.updated_at);
    const labels=(Array.isArray(p.labels)?p.labels:[]).filter(x=>typeof x==='string');
    const cl=Array.isArray(p.checklist)?p.checklist:[],cd=cl.filter(x=>x.done).length,fb=D.feedback.filter(f=>f.post_id===p.id&&f.text).length;
    const adj=p.status==='reprovado'&&adjTxt(p.id),stuck=['producao','aprovacao'].includes(col)&&n>=3;
    return `<article class="qc" draggable="true" data-drag="${esc(p.id)}" data-edit-post="${esc(p.id)}">${im?`<div class="qc-cv"><img src="${esc(im)}" alt="" loading="lazy"></div>`:''}
      <div class="qc-in">${labels.length||p.status==='reprovado'||late?`<div class="qc-lb">${labels.map(l=>`<i style="background:${LCOL[l]||'#8a5560'}" title="${esc(l)}">${esc(l)}</i>`).join('')}${p.status==='reprovado'?'<i style="background:#d9363e">Ajuste</i>':''}${late?'<i style="background:#e8a11c">Atrasada</i>':''}</div>`:''}
       <b>${esc(p.title||'Sem título')}</b>
       ${adj?`<small class="qc-aj">“${esc(String(adj).slice(0,110))}”</small>`:''}
       <div class="qc-ft"><span class="qc-ty" data-ty="${esc(p.type||'post')}">${ty(p.type)}</span>
        ${p.date?`<span class="qc-b${late?' lt':''}">${I.clock}${fmtD(p.date).replace(/^\w+, /,'')}${p.time?' '+esc(p.time):''}</span>`:''}
        ${(p.media||[]).length?`<span class="qc-b">${I.clip}${(p.media||[]).length}</span>`:''}
        ${cl.length?`<span class="qc-b${cd===cl.length?' ok':''}">${I.chk}${cd}/${cl.length}</span>`:''}
        ${fb?`<span class="qc-b">${I.msg}${fb}</span>`:''}
        ${stuck?`<span class="qc-b wn" title="Sem mexer há ${n} dias">${n}d</span>`:''}
        <span class="kav" style="background:${esc(ccol(p.client_id))}" title="${esc(cli(p.client_id).name)}">${esc((cli(p.client_id).name||'?')[0])}</span></div></div></article>`;
  }
  function bar(m,y){
    const mk=fv('dm',month()),[yy,mm]=mk.split('-').map(Number),prev=iso(new Date(yy,mm-2,1)).slice(0,7),next=iso(new Date(yy,mm,1)).slice(0,7),vw=fv('dv','board');
    const sel=(k,opts,v)=>`<select class="qb-sel" data-fsel="${k}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?'selected':''}>${esc(b)}</option>`).join('')}</select>`;
    return `<div class="qb">
      <div class="qb-vw"><button data-f="dv" data-v="board" aria-pressed="${vw==='board'}">Quadro</button><button data-f="dv" data-v="list" aria-pressed="${vw==='list'}">Lista</button></div>
      ${sel('dc',[['all','Todos os clientes'],...CL().map(k=>[k.id,k.name])],fv('dc','all'))}
      ${sel('dq',[['all','Todos os cartões'],['adj','Só com ajuste'],['stuck','Parados há 3+ dias'],['late','Atrasados'],['reels','Só Reels'],['carrossel','Só carrossel']],fv('dq','all'))}
      <div class="qb-mo"><button data-f="dm" data-v="${prev}" aria-label="Mês anterior">‹</button><b>${Mes(mm-1)} ${yy}</b><button data-f="dm" data-v="${next}" aria-label="Próximo mês">›</button></div>
    </div>`;
  }
  V.dem=()=>{
    const L=list(),vw=fv('dv','board'),mk=fv('dm',month()),[y,m]=mk.split('-').map(Number),c=fv('dc','all');
    const head=topb('O que está <em>andando</em>',`${L.filter(p=>!isDone(p)).length} cartões em andamento · ${c==='all'?'todos os clientes':esc(cli(c).name)}`,'<button class="btn red" data-new="post">Nova demanda</button>');
    if(vw==='list'){
      const st=p=>isDone(p)?['No ar','kl-o']:p.status==='aprovado'?['Aprovado','kl-o']:p.status==='pendente'?['Com o cliente','kl-w']:p.status==='reprovado'?['Ajuste','kl-r']:colOf(p)==='producao'?['Em produção','kl-n']:['Ideia',''];
      return shell(head+bar()+`<div class="qk-w">${COLS.map(([k,n,col])=>{const it=L.filter(p=>colOf(p)===k);if(!it.length)return '';
        return `<section class="qk-g"><header style="--cc:${col}"><b>${esc(n)}</b><span>${it.length}</span></header><div class="qk-h"><span>Cartão</span><span>Cliente</span><span>Formato</span><span>Vai ao ar</span><span>Prazo</span><span>Situação</span></div>
        ${it.map(p=>{const [s,kc]=st(p),late=p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado';return `<button class="qk-r" data-edit-post="${esc(p.id)}"><span class="qk-t">${cover(p)?`<img src="${esc(cover(p))}" alt="" loading="lazy">`:'<i></i>'}<b>${esc(p.title||'Sem título')}</b></span><span>${cdot(p.client_id)}${esc(cli(p.client_id).name)}</span><span>${ty(p.type)}</span><span>${p.date?fmtD(p.date)+(p.time?' · '+esc(p.time):''):'—'}</span><span class="${late?'qk-lt':''}">${p.due?fmtD(p.due):'—'}</span><span><i class="${kc}">${s}</i></span></button>`}).join('')}
        ${k==='ideia'||k==='producao'?`<button class="qk-add" data-newcol="${k}">+ Adicionar cartão</button>`:''}</section>`}).join('')||'<div class="empty">Nenhum cartão com esse filtro.</div>'}</div>`);
    }
    return shell(head+bar()+`<div class="qb-board">${COLS.map(([k,n,col])=>{const it=L.filter(p=>colOf(p)===k);
      return `<section class="qk" data-drop="${k}" style="--cc:${col}"><header><b>${esc(n)}</b><span>${it.length}</span></header><div class="qk-c">${it.map(card).join('')}
        ${!it.length&&k==='aprovacao'?'<p class="qk-e">Nada com o cliente. Arraste para cá os cartões prontos para aprovar.</p>':''}</div>
        ${k==='ideia'||k==='producao'?`<button class="qk-add" data-newcol="${k}">+ Adicionar um cartão</button>`:''}</section>`}).join('')}</div>`);
  };
  document.addEventListener('change',e=>{const s=e.target.closest('[data-fsel]');if(s){FILT[s.dataset.fsel]=s.value;render()}});
})();
