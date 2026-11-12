/* Gestão · Investimento em anúncios: a Helo lança o valor gasto no mês por cliente.
   Guarda em agency_docs (collection 'invest', id = cliente_AAAA-MM). O portal mostra em Resultados > Investimento. */
(function(){
  ic.inv='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M14.6 9.2c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.7.8 2.7 2.1-1.2 2.1-2.7 2.1c-1.2 0-2.2-.5-2.7-1.4M12 6.5v1.4M12 16.1v1.4"/></svg>';
  const g=GROUPS.find(([t])=>t==='Clientes');if(g&&!g[1].some(([k])=>k==='inv')){const i=g[1].findIndex(([k])=>k==='met');g[1].splice(i+1,0,['inv','Investimento'])}
  const F=[['client','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['month','Mês','month'],['spent','Valor gasto em anúncios','num'],['reach','Alcance','num'],['clicks','Cliques','num'],['conversations','Conversas no direct ou WhatsApp','num'],['note','Comentário para o cliente (opcional)','area']];
  const mesN=m=>{const [y,mm]=String(m||'').split('-');return mm?MES[+mm-1][0].toUpperCase()+MES[+mm-1].slice(1)+' '+y:String(m||'')};
  const nn=v=>v===''||v==null?'—':Number(v).toLocaleString('pt-BR');
  function open(id){
    const cur=id?{...docs('invest').find(d=>d.id===id)}:{client:fv('ic',CL()[0]?.id),month:new Date().toISOString().slice(0,7)};
    formModal(id?'Investimento do mês':'Lançar investimento',F,cur,async v=>{
      if(!v.client||!/^\d{4}-\d{2}$/.test(v.month||''))throw new Error('Escolha o cliente e o mês.');
      const nid=v.client+'_'+v.month;
      if(id&&id!==nid)await delDoc('invest',id);
      await saveDoc('invest',nid,{...v,updated:new Date().toISOString()});
    },id?async()=>delDoc('invest',id):null);
  }
  V.inv=()=>{
    const c=fv('ic',CL()[0]?.id),L=docs('invest').filter(d=>d.client===c).sort((a,b)=>String(b.month).localeCompare(String(a.month)));
    const tot=L.reduce((t,r)=>t+(+r.spent||0),0),conv=L.reduce((t,r)=>t+(+r.conversations||0),0);
    return shell(topb('Investimento em anúncios','O cliente vê isto no portal, em Resultados.','<button class="btn red" data-inv-new>Lançar mês</button>')+`
     <div class="filters">${segF('ic',CL().map(k=>[k.id,k.name]))}</div>
     ${L.length?`<div class="sum"><div><b>${brl(tot)}</b><span>Investido no total</span></div><div><b>${conv?nn(conv):'—'}</b><span>Conversas</span></div><div><b>${conv?brl(tot/conv):'—'}</b><span>Custo por conversa</span></div></div>
     <div class="list">${L.map(r=>`<button class="row" data-inv="${esc(r.id)}"><span class="ico2">${ic.inv}</span><div class="t"><b>${esc(mesN(r.month))} · ${brl(r.spent)}</b><small>Alcance ${nn(r.reach)} · Cliques ${nn(r.clicks)} · Conversas ${nn(r.conversations)}</small></div></button>`).join('')}</div>`
     :'<div class="empty">Nenhum mês lançado para este cliente. Use "Lançar mês" para registrar quanto foi gasto em anúncios.</div>'}`);
  };
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-inv-new]')){open(null);return}
    const r=e.target.closest('[data-inv]');if(r)open(r.dataset.inv);
  });
})();
