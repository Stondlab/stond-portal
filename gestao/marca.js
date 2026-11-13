/* Gestão · Marca dos clientes: o mesmo "Sua marca" do portal, editável direto na tela.
   Clicar num texto edita ali mesmo; "+" adiciona, "×" remove; salva sozinho.
   Guarda em agency_docs (collection 'marca', id = cliente). O cliente só vê com "Visível para o cliente" ligado. */
(function(){
  ic.marca=sv('<circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M6.5 7.2l3.4 3M17.5 7.2l-3.4 3M6.5 16.8l3.4-3M17.5 16.8l-3.4-3"/>');
  const g=GROUPS.find(([t])=>t==='Clientes');if(g&&!g[1].some(([k])=>k==='marca'))g[1].splice(1,0,['marca','Marca']);

  /* esqueleto de uma marca nova: mostra todas as partes para preencher */
  const blank=()=>({shared:false,phrase:'',summary:'',concept_tag:'',
    steps:['Diagnóstico','Construção','Ativação','Otimização','Escala'].map(n=>({name:n,note:'',state:''})),
    map1:'',map2:'',map3:'',map4:'',pending:'',purpose:'',purpose_why:'',positioning:'',positioning_why:'',belief:'',enemy:'',
    values:[],personas:[],personas_note:'',out_tribe:'',archetype:'',archetype_desc:'',shadow:'',words3:'',is_not:[],tone:[],
    use:[],avoid:[],avoid_why:'',messages:[],tagline:'',pillars:[],colors:[],colors_why:'',font_title:'',font_accent:'',font_body:'',font_note:'',
    type_sample:'',type_word:'',type_text:'',proof_title:'',proof:{},sig1:'',sig2:'',sig_line:'',logo_note:'',photo_use:[],photo_avoid:[],
    journey:[],checklist:[],rules:[],metrics:[],tasks:[],compare:[],next_review:'',version:'',doc:'',pdf_url:'',guide_url:''});

  /* a marca do cliente como objeto vivo (as edições mudam este objeto e ele é salvo) */
  function brandOf(c){
    let row=D.docs.find(x=>x.collection==='marca'&&x.id===c);
    if(!row){row={collection:'marca',id:c,client_id:c,data:{...blank(),client:c},_new:true};D.docs.push(row)}
    return row;
  }

  let timer=null,saving=null;
  const st=t=>{const el=$('#mkst');if(el)el.textContent=t};
  function queue(c,data){
    st('Salvando…');clearTimeout(timer);
    timer=setTimeout(async()=>{
      data.client=c;data.updated=new Date().toISOString();
      try{saving=saveDoc('marca',c,data);await saving;st('Salvo')}catch(x){st('Não salvou');toast(x.message)}
    },600);
  }

  V.marca=()=>{
    const ids=CL().map(k=>k.id),c=fv('mc',ids[0]),row=brandOf(c),b=row.data,cl=CL().find(x=>x.id===c)||{};
    const on=!!b.shared;
    const ver=cl.access_token&&on?`<a class="btn sm ghost" href="https://portal.stond.com.br/?c=${esc(cl.access_token)}&ver=1#marca" target="_blank" rel="noopener">Ver no portal</a>`:'';
    const sw=`<button class="mk-sw-tg${on?' on':''}" data-mk-share aria-pressed="${on}"><i></i>${on?'Visível para o cliente':'Oculta para o cliente'}</button>`;
    return shell(topb('Marca dos clientes','Clique em qualquer texto para editar. Salva sozinho.',`<span class="mk-st-txt" id="mkst">${b.updated?'Salvo':''}</span>${sw}${ver}`)+`
     <div class="filters">${segF('mc',CL().map(k=>[k.id,k.name]))}</div>
     ${StondMarca.view(b,{edit:true,head:false,onChange:d=>queue(c,d)})}`);
  };

  /* Projetos e Antes e depois: as mesmas partes da marca, cada uma com página própria no menu */
  ic.proj=sv('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9.5h17M8 13.5h5M8 16h8"/>');
  ic.antes=sv('<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/><path d="M6 15l2-3 2 3M16 14.5l1.5-2 2.5 3"/>');
  const page=(sec,title,sub)=>()=>{
    const ids=CL().map(k=>k.id),c=fv('mc',ids[0]),b=brandOf(c).data;
    return shell(topb(title,sub,`<span class="mk-st-txt" id="mkst">${b.updated?'Salvo':''}</span>`)+`
     <div class="filters">${segF('mc',CL().map(k=>[k.id,k.name]))}</div>
     ${StondMarca.view(b,{edit:true,head:false,section:sec,onChange:d=>queue(c,d)})}`);
  };
  V.proj=page('projeto','Projetos','O que vamos fazer, o que está em andamento e o que já foi entregue, por cliente');
  V.antes=page('antes','Antes e depois','Como cada cliente era e como ficou');

  document.addEventListener('click',async e=>{
    const t=e.target.closest('[data-mk-share]');if(!t)return;
    const c=fv('mc',CL()[0]?.id),row=brandOf(c),b=row.data;
    if(!b.shared&&!String(b.phrase||'').trim()){toast('Preencha pelo menos a frase central antes de liberar.');return}
    b.shared=!b.shared;clearTimeout(timer);
    b.client=c;b.updated=new Date().toISOString();
    try{await saveDoc('marca',c,b);toast(b.shared?'Agora o cliente vê "Sua marca" no portal.':'Marca oculta para o cliente.');render()}
    catch(x){b.shared=!b.shared;toast(x.message)}
  });
})();
