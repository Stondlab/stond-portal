/* Gestão · Resultados (Stond OS)
   - Métricas: filtro de cliente e período, comparação com o período anterior,
     funil Atenção > Interesse > Contato > Resultado, posts que trouxeram contato,
     baixar PDF (impressão) e planilha (CSV). O diagnóstico antigo continua embaixo.
   - Raio-x do Reels: cada Reels do período com gancho, meio e CTA e a leitura do que mudar.
   - Anúncios: funil do anúncio (CPM, CTR, CPC, custo por conversa e por cliente, retorno)
     e qual criativo vence.
   Dados: ig_media e ig_metrics (Meta, todo dia), dm_log (palavras), agency_docs:
   'resultados' (cliente_AAAA-MM: agendamentos, vendas, valor, metas), 'reelhook'
   (id do Reels: % que passou dos 3 s, lançado à mão), 'invest' e 'criativos'. */
(function(){
  ic.reels=sv('<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M4 8h16M9 3.5 11 8M14 3.5 16 8"/><path d="M10.5 11.5v5l4-2.5z"/>');
  if(!GROUPS.some(g=>g[1].some(([k])=>k==='reels'))){const g=GROUPS.find(([t])=>t==='Resultados');if(g){const i=g[1].findIndex(([k])=>k==='met');g[1].splice(i+1,0,['reels','Raio-x do Reels'])}}
  const g=GROUPS.find(([t])=>t==='Resultados');if(g){const it=g[1].find(([k])=>k==='inv');if(it)it[1]='Anúncios'}

  const DAY=864e5;
  const PER=[['30','30 dias'],['7','7 dias'],['90','90 dias'],['m0','Este mês'],['m1','Mês passado']];
  function range(p){
    const now=new Date();let a,b;
    if(p==='m0'){a=new Date(now.getFullYear(),now.getMonth(),1);b=new Date(now.getFullYear(),now.getMonth()+1,1)}
    else if(p==='m1'){a=new Date(now.getFullYear(),now.getMonth()-1,1);b=new Date(now.getFullYear(),now.getMonth(),1)}
    else{b=new Date(now.getTime()+DAY);b.setHours(0,0,0,0);a=new Date(b.getTime()-(+p)*DAY)}
    const len=b-a;return {a,b,pa:new Date(a-len),pb:a,label:(PER.find(x=>x[0]===p)||PER[0])[1]};
  }
  const inR=(t,a,b)=>{const d=new Date(t);return d>=a&&d<b};
  const sumF=(L,k)=>L.reduce((t,m)=>t+(+m[k]||0),0);
  const media=c=>(D.media||[]).filter(m=>m.client_id===c);
  const dms=c=>(D.dmlog||[]).filter(x=>x.client_id===c);
  const sent=x=>['sent','link_enviado','enviado'].includes(String(x.status||''));
  const ret=m=>m.duration_s&&m.avg_watch_s!=null?m.avg_watch_s/m.duration_s:null;
  const pcx=(x,d=0)=>x==null||!isFinite(x)?'—':(x*100).toLocaleString('pt-BR',{maximumFractionDigits:d})+'%';
  const n1=x=>x==null||!isFinite(x)?'—':Number(x).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const delta=(a,b)=>{if(!b||a==null)return '';const d=(a-b)/b;if(!isFinite(d)||Math.abs(d)<.005)return '<small class="rs-eq">igual</small>';return `<small class="${d>0?'rs-up':'rs-dn'}">${d>0?'+':''}${pcx(d)}</small>`};
  const mkey=d=>iso(d).slice(0,7);
  const resDoc=(c,mk)=>doc1('resultados',c+'_'+mk);
  const capT=m=>esc(String(m.caption||'Sem legenda').split('\n')[0].slice(0,70));

  function stats(c,a,b){
    const M=media(c).filter(m=>inR(m.ts,a,b)),R=M.filter(m=>m.format==='reels'),L=dms(c).filter(x=>inR(x.created_at,a,b));
    const mt=D.metrics.filter(x=>x.client_id===c),f0=mt.filter(x=>pd(x.date)<a).slice(-1)[0]||mt.find(x=>pd(x.date)>=a),f1=mt.filter(x=>pd(x.date)<b).slice(-1)[0];
    const months=[...new Set([mkey(a),mkey(new Date(b-1))])],RD=months.map(k=>resDoc(c,k));
    return {M,R,L,posts:M.length,reach:sumF(M,'reach'),views:sumF(M,'views'),saved:sumF(M,'saved'),shares:sumF(M,'shares'),visits:sumF(M,'profile_visits'),follows:sumF(M,'follows'),
      ret:med(R.map(ret)),words:L.length,links:L.filter(sent).length,net:f0&&f1?f1.followers-f0.followers:null,
      agend:RD.reduce((t,r)=>t+(+r.agend||0),0),vendas:RD.reduce((t,r)=>t+(+r.vendas||0),0),valor:RD.reduce((t,r)=>t+(+r.valor||0),0)};
  }
  const filterBar=(key,extra='')=>`<div class="rs-filt">${segF('mc',CL().map(k=>[k.id,k.name]))}${segF('rp',PER)}<span class="rs-sp"></span>${extra}</div>`;
  const mrow=(l,v,p)=>`<div class="rs-m"><span>${l}</span><b>${v}</b>${p??''}</div>`;

  /* ---------- Métricas ---------- */
  V.met=()=>{
    const c=fv('mc',CL()[0]?.id),p=fv('rp','30'),r=range(p),S=stats(c,r.a,r.b),P=stats(c,r.pa,r.pb);
    const mk=mkey(new Date()),RD=resDoc(c,mk),meta=+RD.meta_vendas||0;
    const lastMet=D.metrics.filter(x=>x.client_id===c).slice(-1)[0];
    const top=S.M.map(m=>({m,w:dms(c).filter(x=>x.media_id===m.ig_media_id&&inR(x.created_at,r.a,r.b)).length})).map(o=>({...o,score:o.w*3+(+o.m.follows||0)*2+(+o.m.profile_visits||0)*.2})).filter(o=>o.score>0).sort((x,y)=>y.score-x.score).slice(0,4);
    return shell(topb(`Do alcance à <em>venda</em>`,`${esc(cli(c).name)} · ${r.label} · comparado com o período anterior${lastMet?` · Meta atualizado em ${fmtD(lastMet.date)}`:''}`,
      `<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-ig-connect>Reconectar Instagram</button><button class="btn" data-sync-met>Atualizar agora</button><button class="btn red" data-res-lanc>Lançar vendas</button></span>`)+
     filterBar('met',`<button class="btn sm" data-res-pdf>Baixar PDF</button><button class="btn sm" data-res-csv>Baixar planilha</button>`)+`
     <div class="rs-meta"><div><span class="lb">Vendas no mês</span><b>${nf(+RD.vendas||0)}${meta?`<small>de ${meta}</small>`:'<small>sem meta</small>'}</b>${meta?`<div class="prog"><b style="width:${Math.min(100,(+RD.vendas||0)/meta*100)}%"></b></div>`:''}</div>
      <div><span class="lb">Conversas pelo Instagram</span><b>${nf(S.words)}${delta(S.words,P.words)}</b></div>
      <div><span class="lb">Seguidores líquidos</span><b>${S.net==null?'—':(S.net>0?'+':'')+nf(S.net)}</b><small class="mut">${S.follows?nf(S.follows)+' vieram pelos posts':''}</small></div>
      <div><span class="lb">Alcance</span><b>${nf(S.reach)}${delta(S.reach,P.reach)}</b></div></div>
     <div class="rs-fun">
      <div class="rs-st"><h5>1 · Atenção</h5>${mrow('Alcance dos posts',nf(S.reach),delta(S.reach,P.reach))}${mrow('Visualizações',nf(S.views),delta(S.views,P.views))}${mrow('Posts no período',nf(S.posts))}<span class="q">Chegou em gente nova?</span></div>
      <div class="rs-st"><h5>2 · Interesse</h5>${mrow('Salvamentos',nf(S.saved),delta(S.saved,P.saved))}${mrow('Compartilhamentos',nf(S.shares),delta(S.shares,P.shares))}${mrow('Visitas ao perfil',nf(S.visits),delta(S.visits,P.visits))}${mrow('Retenção média dos Reels',pcx(S.ret))}<span class="q">Valeu guardar ou mandar para alguém?</span></div>
      <div class="rs-st hot"><h5>3 · Contato</h5>${mrow('Comentaram a palavra',nf(S.words),delta(S.words,P.words))}${mrow('Links enviados no direct',nf(S.links))}${mrow('Seguiram pelos posts',nf(S.follows),delta(S.follows,P.follows))}<span class="q">Alguém levantou a mão?</span></div>
      <div class="rs-st"><h5>4 · Resultado</h5>${mrow('Agendamentos',nf(S.agend))}${mrow('Vendas',nf(S.vendas))}${mrow('Valor vendido',S.valor?brl(S.valor):'—')}${mrow('Conversa → venda',S.words?pcx(S.vendas/S.words):'—')}<span class="q">Lançado por você em "Lançar vendas".</span></div>
     </div>
     <div class="rs-2"><div class="bx"><span class="lb">Posts que trouxeram contato</span>${top.length?top.map(({m,w})=>`<a class="rs-post" href="${esc(m.permalink||'#')}" target="_blank" rel="noopener"><span>${capT(m)}</span><small>${m.format==='reels'?'Reels':'Feed'} · ${fmtD(m.ts.slice(0,10))} · ${w} palavra${w===1?'':'s'} · ${nf(m.follows||0)} seguidores · ${nf(m.profile_visits||0)} visitas</small></a>`).join(''):'<small class="mut">Nenhum post do período gerou palavra, seguidor ou visita ainda.</small>'}</div>
      <div class="bx"><span class="lb">Qual formato rende mais</span>${(()=>{const R=S.M.filter(m=>m.format==='reels'),F=S.M.filter(m=>m.format!=='reels'),a=mi(R.map(m=>m.reach)),b=mi(F.map(m=>m.reach)),mx=Math.max(a||0,b||0,1);
        return `<div class="bars"><div><span>Reels</span><i><b style="width:${(a||0)/mx*100}%"></b></i><span>${nf(a)}</span></div><div><span>Carrossel e foto</span><i><b style="width:${(b||0)/mx*100}%"></b></i><span>${nf(b)}</span></div></div><small class="mut">Alcance mediano por post no período. Engajamento sai da conta até ser revisado.</small>`})()}</div></div>
     ${diag(c)}`);
  };

  /* ---------- Raio-x do Reels ---------- */
  function read(m,c){
    const w=+m.avg_watch_s||0,d=+m.duration_s||0,rt=ret(m),h=doc1('reelhook',m.ig_media_id).hold3,hold=h===''||h==null?null:+h/100;
    const words=dms(c).filter(x=>x.media_id===m.ig_media_id).length,act=words+(+m.follows||0);
    const gancho=hold!=null?(hold>=.6?'ok':hold>=.45?'mid':'bad'):(w&&w<3?'bad':w<5?'mid':'ok');
    const meio=rt==null?'mid':rt>=.4?'ok':rt>=.25?'mid':'bad';
    const fim=act>=3?'ok':act>=1?'mid':'bad';
    let dg,tone;
    if(gancho==='bad'){dg='Gancho fraco';tone='r'}else if(meio==='bad'){dg='Meio cansa';tone='w'}else if(fim==='bad'){dg='CTA fraco';tone='w'}else{dg='Bom inteiro';tone='o'}
    const tips=[];
    if(gancho==='bad')tips.push(['Troque a abertura','Mostre o resultado ou o número no primeiro segundo, com texto grande na tela.','r']);
    else if(gancho==='ok')tips.push(['O gancho funcionou','Repita o mesmo tipo de abertura nos próximos.','o']);
    if(meio==='bad')tips.push(['Corte o meio','As pessoas saem antes da metade. Encurte ou divida em partes.','w']);
    else if(meio==='ok')tips.push(['Segurou até o fim','O ritmo do vídeo está bom.','o']);
    if(fim==='bad')tips.push(['O pedido final não converteu','Peça uma palavra simples para comentar, em uma frase, e diga o que a pessoa recebe.','w']);
    else tips.push(['O CTA trouxe gente',`${words} comentaram a palavra · ${nf(m.follows||0)} seguiram · ${nf(m.profile_visits||0)} visitaram o perfil`,'o']);
    return {w,d,rt,hold,words,gancho,meio,fim,dg,tone,tips};
  }
  V.reels=()=>{
    const c=fv('mc',CL()[0]?.id),p=fv('rp','30'),r=range(p);
    const R=media(c).filter(m=>m.format==='reels'&&inR(m.ts,r.a,r.b)).sort((a,b)=>String(b.ts).localeCompare(String(a.ts)));
    const sel=R.find(m=>m.ig_media_id===FILT.rx)||R[0];
    const zc={ok:'ok',mid:'',bad:'bad'};
    let det='';
    if(sel){const x=read(sel,c),W=600,pos=s=>x.d?Math.min(W,s/x.d*W):0;
      det=`<div class="rs-2 rs-rx"><div class="bx"><div class="rs-rh">${sel.thumb?`<img src="${esc(sel.thumb)}" alt="">`:'<span class="noimg"></span>'}<div><b>${capT(sel)}</b><small>${fmtD(sel.ts.slice(0,10))} · ${n1(x.d)} s · ${nf(sel.views)} views · ${nf(sel.shares)} compart. · ${nf(sel.saved)} salvos</small></div><a class="btn sm" href="${esc(sel.permalink||'#')}" target="_blank" rel="noopener">Abrir no Instagram</a></div>
        <svg class="rs-bar" viewBox="0 0 ${W} 46" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="14" width="${W}" height="16" rx="8" fill="var(--bg-3)"/><rect x="0" y="14" width="${pos(x.w).toFixed(0)}" height="16" rx="8" fill="var(--red)"/><line x1="${pos(3).toFixed(0)}" x2="${pos(3).toFixed(0)}" y1="6" y2="38" stroke="var(--ink)" stroke-dasharray="3 3"/></svg>
        <div class="rs-bl"><small>0 s</small><small>3 s · gancho</small><small>média assistida ${n1(x.w)} s</small><small>${n1(x.d)} s</small></div>
        <div class="rs-z"><div class="${zc[x.gancho]}"><span class="mut">Gancho · ${x.hold!=null?'passaram dos 3 s':'tempo médio assistido'}</span><b>${x.hold!=null?pcx(x.hold):n1(x.w)+' s'}</b><button class="lnkb" data-hook="${esc(sel.ig_media_id)}">${x.hold!=null?'Corrigir':'Lançar'} o % que passou dos 3 s</button></div>
          <div class="${zc[x.meio]}"><span class="mut">Meio · quanto do vídeo viram</span><b>${pcx(x.rt)}</b><small>${n1(x.w)} s de ${n1(x.d)} s</small></div>
          <div class="${zc[x.fim]}"><span class="mut">CTA · quem agiu no fim</span><b>${nf(x.words)} <small>palavras</small></b><small>${nf(sel.follows||0)} seguiram · ${nf(sel.profile_visits||0)} visitas</small></div></div></div>
        <div class="bx rs-hot"><span class="lb">Leitura pronta · <span class="kl-${x.tone}">${x.dg}</span></span>${x.tips.map(([a,b,t])=>`<div class="rs-tip"><b>${a}</b><small>${b}</small></div>`).join('')}<button class="btn sm" data-new="post">Virar tarefa no quadro</button></div></div>`}
    return shell(topb(`Onde o vídeo <em>perde</em> gente`,`${esc(cli(c).name)} · Reels de ${r.label.toLowerCase()} · clique em um para ver o detalhe`)+filterBar('reels')+
      (R.length?det+`<div class="list rs-tab"><div class="rs-tr rs-th"><span>Reels</span><span>Views</span><span>Assistido</span><span>Retenção</span><span>Compart.</span><span>Palavras</span><span>Diagnóstico</span></div>${R.map(m=>{const x=read(m,c);return `<button class="rs-tr${m===sel?' on':''}" data-rx="${esc(m.ig_media_id)}"><span>${capT(m)}<small>${fmtD(m.ts.slice(0,10))}</small></span><span>${nf(m.views)}</span><span>${n1(x.w)} s</span><span>${pcx(x.rt)}</span><span>${nf(m.shares)}</span><span>${nf(x.words)}</span><span><i class="kl-${x.tone}">${x.dg}</i></span></button>`}).join('')}</div>
      <p class="note2">Como ler: gancho fraco = saem nos primeiros segundos, troque a abertura. Meio cansa = passam do gancho mas saem antes da metade, corte o vídeo. CTA fraco = assistem e ninguém comenta ou segue, mude o pedido. O % que passou dos 3 s só aparece no app do Instagram; lance à mão para ficar mais preciso.</p>`
      :empty('Nenhum Reels neste período. Escolha um período maior ou clique em Atualizar agora em Métricas.')));
  };

  /* ---------- Anúncios ---------- */
  const IF=[['client','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['month','Mês','month'],['spent','Valor gasto','num'],['impressions','Impressões','num'],['reach','Alcance','num'],['clicks','Cliques','num'],['conversations','Conversas iniciadas','num'],['qualified','Conversas qualificadas','num'],['sales','Vendas','num'],['revenue','Valor das vendas','num'],['note','Comentário da Stond (o cliente vê)','area']];
  const CF=[['client','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['month','Mês','month'],['name','Criativo (nome do anúncio)'],['spent','Gasto','num'],['impressions','Impressões','num'],['clicks','Cliques','num'],['conversations','Conversas','num'],['sales','Vendas','num']];
  const mesN=m=>{const [y,mm]=String(m||'').split('-');return mm?MES[+mm-1][0].toUpperCase()+MES[+mm-1].slice(1)+' '+y:String(m||'')};
  const dv=(a,b)=>+b?(+a||0)/(+b):null;
  function openInv(id,col){
    const F=col==='criativos'?CF:IF;
    const cur=id?{...docs(col).find(d=>d.id===id)}:{client:fv('ic',CL()[0]?.id),month:new Date().toISOString().slice(0,7)};
    formModal(col==='criativos'?(id?'Criativo':'Novo criativo'):(id?'Anúncios do mês':'Lançar mês de anúncios'),F,cur,async v=>{
      if(!v.client||!/^\d{4}-\d{2}$/.test(v.month||''))throw new Error('Escolha o cliente e o mês.');
      const nid=col==='criativos'?(id||v.client+'_'+v.month+'_'+Math.random().toString(36).slice(2,6)):v.client+'_'+v.month;
      if(id&&id!==nid)await delDoc(col,id);
      await saveDoc(col,nid,{...v,updated:new Date().toISOString()});
    },id?async()=>delDoc(col,id):null);
  }
  V.inv=()=>{
    const c=fv('ic',CL()[0]?.id),L=docs('invest').filter(d=>d.client===c).sort((a,b)=>String(b.month).localeCompare(String(a.month)));
    const mk=fv('im',L[0]?.month||new Date().toISOString().slice(0,7)),R=L.find(x=>x.month===mk)||{},C=docs('criativos').filter(d=>d.client===c&&d.month===mk);
    const cpm=dv(R.spent,R.impressions)!=null?dv(R.spent,R.impressions)*1000:null,freq=dv(R.impressions,R.reach),ctr=dv(R.clicks,R.impressions),cpc=dv(R.spent,R.clicks),cpv=dv(R.spent,R.conversations),cac=dv(R.spent,R.sales),roas=dv(R.revenue,R.spent);
    const best=C.length?C.map(x=>({...x,cc:dv(x.spent,x.conversations)})).sort((a,b)=>(a.cc??1e9)-(b.cc??1e9)):[];
    const dec=(x,i)=>x.cc==null?['Sem conversa','r']:i===0&&best.length>1?['Pôr mais verba','o']:i===best.length-1&&best.length>2?['Desligar','r']:['Manter',''];
    const money=v=>v==null?'—':brl(v);
    return shell(topb(`Quanto foi investido e o que <em>voltou</em>`,`${esc(cli(c).name)} · o cliente vê o resumo no portal, em Resultados`,'<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-cri-new>Novo criativo</button><button class="btn red" data-inv-new2>Lançar mês</button></span>')+`
     <div class="rs-filt">${segF('ic',CL().map(k=>[k.id,k.name]))}${L.length?segF('im',L.slice(0,6).map(x=>[x.month,mesN(x.month)])):''}</div>
     ${R.month?`<div class="rs-meta"><div><span class="lb">Investido</span><b>${money(+R.spent||0)}</b></div><div><span class="lb">Custo por conversa</span><b>${money(cpv)}</b><small class="mut">${nf(R.conversations)} conversas</small></div><div><span class="lb">Custo por cliente</span><b>${money(cac)}</b><small class="mut">${nf(R.sales)} vendas</small></div><div><span class="lb">Retorno</span><b class="${roas>=1?'rs-up':''}">${roas==null?'—':n1(roas)+'×'}</b><small class="mut">${R.revenue?brl(R.revenue)+' em vendas':'lance o valor das vendas'}</small></div></div>
     <div class="rs-fun">
      <div class="rs-st"><h5>1 · Custo</h5>${mrow('Alcance',nf(R.reach))}${mrow('CPM (mil pessoas)',money(cpm))}${mrow('Frequência',n1(freq))}<span class="q">${freq>3?'Acima de 3: o público cansou do criativo.':'Até 3 está saudável.'}</span></div>
      <div class="rs-st"><h5>2 · Clique</h5>${mrow('CTR',pcx(ctr,1))}${mrow('CPC',money(cpc))}<span class="q">${ctr!=null&&ctr<.01?'CTR abaixo de 1%: criativo ou texto não chama.':'Quanto % de quem viu clicou.'}</span></div>
      <div class="rs-st hot"><h5>3 · Conversa</h5>${mrow('Conversas',nf(R.conversations))}${mrow('Qualificadas',nf(R.qualified))}${mrow('Custo por conversa',money(cpv))}<span class="q">Muita conversa e pouca qualificada = público errado.</span></div>
      <div class="rs-st"><h5>4 · Venda</h5>${mrow('Vendas',nf(R.sales))}${mrow('Conversa → venda',pcx(dv(R.sales,R.conversations)))}${mrow('Custo por cliente',money(cac))}<span class="q">Quanto custou cada cliente novo.</span></div>
     </div>
     <div class="bx"><span class="lb">Qual criativo vence · ${esc(mesN(mk))}</span>${best.length?`<div class="rs-tab"><div class="rs-tr rs-cr rs-th"><span>Criativo</span><span>Gasto</span><span>CTR</span><span>Conversas</span><span>Custo/conversa</span><span>Vendas</span><span>Decisão</span></div>${best.map((x,i)=>{const [d,t]=dec(x,i);return `<button class="rs-tr rs-cr" data-cri="${esc(x.id)}"><span>${esc(x.name||'Sem nome')}</span><span>${money(+x.spent||0)}</span><span>${pcx(dv(x.clicks,x.impressions),1)}</span><span>${nf(x.conversations)}</span><span>${money(x.cc)}</span><span>${nf(x.sales)}</span><span><i class="kl-${t||'n'}">${d}</i></span></button>`}).join('')}</div>`:'<small class="mut">Lance cada anúncio do mês em "Novo criativo" para ver qual traz conversa mais barata.</small>'}</div>
     ${R.note?`<p class="callout2">${esc(R.note)}</p>`:''}
     <p class="note2"><button class="lnkb" data-inv-edit="${esc(R.id)}">Editar os números de ${esc(mesN(mk))}</button> · Puxar sozinho do Gerenciador de Anúncios fica para depois (precisa de permissão extra do Meta).</p>`
     :'<div class="empty">Nenhum mês lançado para este cliente. Use "Lançar mês" com o que aparece no Gerenciador de Anúncios.</div>'}`);
  };

  /* ---------- exportar ---------- */
  function csv(){
    const c=fv('mc',CL()[0]?.id),r=range(fv('rp','30'));
    const rows=[['data','formato','legenda','alcance','views','salvos','compartilhamentos','visitas ao perfil','seguidores','duracao_s','assistido_s','palavras','link']];
    media(c).filter(m=>inR(m.ts,r.a,r.b)).forEach(m=>rows.push([m.ts.slice(0,10),m.format,String(m.caption||'').split('\n')[0],m.reach,m.views,m.saved,m.shares,m.profile_visits,m.follows,m.duration_s,m.avg_watch_s,dms(c).filter(x=>x.media_id===m.ig_media_id).length,m.permalink]));
    const s='﻿'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));a.download=`resultados-${c}-${today()}.csv`;a.click();
  }
  function lanc(){
    const c=fv('mc',CL()[0]?.id),mk=mkey(new Date()),id=c+'_'+mk;
    formModal(`Vendas de ${mesN(mk)} · ${cli(c).name}`,[['agend','Agendamentos ou reuniões','num'],['vendas','Vendas','num'],['valor','Valor vendido','num'],['meta_vendas','Meta de vendas do mês','num']],doc1('resultados',id),async v=>{await saveDoc('resultados',id,{...doc1('resultados',id),...v,client:c,month:mk})});
  }
  function hook(id){
    formModal('% que passou dos 3 segundos',[['hold3','% (veja no app do Instagram > Insights do Reels > Retenção)','num']],doc1('reelhook',id),async v=>{await saveDoc('reelhook',id,{...v})});
  }
  document.addEventListener('click',e=>{
    const t=e.target;
    const rx=t.closest('[data-rx]');if(rx){FILT.rx=rx.dataset.rx;render();const m=$('.main');if(m)m.scrollTo({top:0,behavior:'smooth'});return}
    if(t.closest('[data-res-pdf]')){window.print();return}
    if(t.closest('[data-res-csv]')){csv();return}
    if(t.closest('[data-res-lanc]')){lanc();return}
    const h=t.closest('[data-hook]');if(h){hook(h.dataset.hook);return}
    if(t.closest('[data-inv-new2]')){openInv(null,'invest');return}
    const ie=t.closest('[data-inv-edit]');if(ie){openInv(ie.dataset.invEdit,'invest');return}
    if(t.closest('[data-cri-new]')){openInv(null,'criativos');return}
    const cr=t.closest('[data-cri]');if(cr){openInv(cr.dataset.cri,'criativos');return}
  },true);
})();
