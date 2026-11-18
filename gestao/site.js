/* Gestão · Site e WhatsApp: visitas e cliques no WhatsApp dos sites dos clientes, com a origem (UTM).
   Tabela site_events (supabase/sql/site_events.sql); o site envia pela função site_track (ver /t.js). */
(function(){
  const g=GROUPS.find(([t])=>t==='Resultados');if(g&&!g[1].some(([k])=>k==='site'))g[1].push(['site','Site e WhatsApp']);
  let EV=null,busy=false,ERR='';
  const PAL={dm:'Direct',bio:'Bio',story:'Stories',stories:'Stories',post:'Post',reels:'Reels',anuncio:'Anúncio',pagina:'Página',status:'Status'};
  const FON={instagram:'Instagram',facebook:'Facebook',whatsapp:'WhatsApp','meta-ads':'Anúncio Meta',site:'Site'};
  function origem(e){
    if(!e.source)return e.ref?'Sem UTM · '+e.ref:'Direto / sem origem';
    const f=FON[e.source]||e.source,m=PAL[e.medium]||e.medium;
    return [f,m,e.campaign?e.campaign.toUpperCase():''].filter(Boolean).join(' · ');
  }
  const pag=p=>{p=String(p||'/').replace(/\/$/,'')||'/';return p==='/'?'Home':p.replace(/^\//,'/')};
  const hora=s=>{const d=new Date(s);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  async function load(){if(busy)return;busy=true;ERR='';
    try{const since=new Date(Date.now()-90*864e5).toISOString();
      const {data,error}=await sb.from('site_events').select('*').gte('at',since).order('at',{ascending:false}).limit(10000);
      if(error)throw new Error(error.message);EV=data||[];
    }catch(x){EV=[];ERR=x.message}busy=false;render()}
  V.site=()=>{
    if(!EV){load();return shell(topb('Site e WhatsApp','Carregando…'))}
    const c=fv('sc',CL()[0]?.id),dias=+fv('sd','30'),lim=Date.now()-dias*864e5;
    const E=EV.filter(e=>e.client_id===c&&new Date(e.at).getTime()>=lim);
    const vis=E.filter(e=>e.kind==='visita'),zap=E.filter(e=>e.kind==='whatsapp');
    const pessoas=new Set(vis.map(e=>e.visitor).filter(Boolean)).size||vis.length;
    const tx=pessoas?Math.round(new Set(zap.map(e=>e.visitor).filter(Boolean)).size/pessoas*100):0;
    const by=(L,f)=>{const m={};L.forEach(e=>{const k=f(e);m[k]=m[k]||{v:new Set(),n:0,z:0};if(e.kind==='visita'){m[k].n++;m[k].v.add(e.visitor||e.id)}else m[k].z++});return Object.entries(m).sort((a,b)=>b[1].v.size-a[1].v.size||b[1].z-a[1].z)};
    const tab=(tit,rows)=>`<div class="dg-c" style="margin-top:16px"><div class="dg-h"><b>${tit}</b></div><div class="dg-t"><table><tr><th></th><th class="n">Pessoas</th><th class="n">Visitas</th><th class="n">WhatsApp</th></tr>${rows.map(([k,r])=>`<tr><td>${esc(k)}</td><td class="n">${r.v.size}</td><td class="n">${r.n}</td><td class="n">${r.z}</td></tr>`).join('')}</table></div></div>`;
    const ult=zap.slice(0,40);
    return shell(topb('Site e WhatsApp','Quem entrou no site, de onde veio e quem clicou para chamar no WhatsApp.')+`
     <div class="filters">${segF('sc',CL().map(k=>[k.id,k.name]))}${segF('sd',[['30','30 dias'],['7','7 dias'],['1','Hoje'],['90','90 dias']])}</div>
     ${ERR?`<div class="empty">Não consegui ler os dados (${esc(ERR)}).</div>`:''}
     <div class="bento" style="margin-top:14px">
      <div class="bx"><span class="lb">Pessoas no site</span><div class="num">${pessoas}</div><span class="ft">${vis.length} visitas a páginas</span></div>
      <div class="bx"><span class="lb">Cliques no WhatsApp</span><div class="num">${zap.length}</div><span class="ft">${tx}% das pessoas clicaram</span></div>
     </div>
     ${E.length?tab('Por origem',by(E,origem))+tab('Por página',by(E,e=>pag(e.page)))+
      `<div class="dg-c" style="margin-top:16px"><div class="dg-h"><b>Últimos cliques no WhatsApp</b><small>Use a hora para achar a conversa no WhatsApp</small></div><div class="dg-t"><table><tr><th>Quando</th><th>Página</th><th>Botão</th><th>Origem</th></tr>${ult.map(e=>`<tr><td>${hora(e.at)}</td><td>${esc(pag(e.page))}</td><td>${esc(e.label||'')}</td><td>${esc(origem(e))}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum clique ainda.</td></tr>'}</table></div></div>`
      :'<div class="empty">Ainda não chegou nenhuma visita deste cliente no período. Os dados aparecem assim que o site estiver enviando para a Stond.</div>'}`);
  };
})();
