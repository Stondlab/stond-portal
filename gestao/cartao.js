/* Gestão · Cartão aberto no estilo quadro de cartões (Demandas)
   Título editável, etiquetas, datas, descrição, legenda, checklist, anexos, capa, comentários e atividade,
   mover entre colunas, arquivar. Salva sozinho a cada mudança. */
(function(){
  const _openPost=openPost;
  let CID=null,TMR=null;
  const cur=()=>D.posts.find(x=>x.id===CID);
  const who=()=>(ME&&ME.name)||'Stond';
  const LBL=['Urgente','Gravar','Editar','Revisar','Esperando cliente','Tráfego'];
  const LCOL={'Urgente':'#d9363e','Gravar':'#8f0a19','Editar':'#5a7fa8','Revisar':'#e8a11c','Esperando cliente':'#c868b8','Tráfego':'#3f9f6f'};
  const ago=s=>{if(!s)return '';const d=new Date(s);return d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${p}</svg>`;
  const I={card:ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17"/>'),txt:ic('<path d="M4 6h16M4 11h16M4 16h10"/>'),chk:ic('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>'),clip:ic('<path d="M20 12.5 12.6 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/>'),act:ic('<path d="M4 6h16M4 12h16M4 18h16"/>'),tag:ic('<path d="M3.5 12V4.5H11l9.5 9.5-7.5 7.5z"/><circle cx="8" cy="8.5" r="1.3"/>'),clk:ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),img:ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'),mv:ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),arc:ic('<rect x="3.5" y="4" width="17" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>'),cap:ic('<path d="M4 5h16v14H4zM8 9h8M8 13h6"/>')};

  function save(patch,now){
    const p=cur();if(!p)return;Object.assign(p,patch);
    clearTimeout(TMR);const go=async()=>{try{await savePost({...p})}catch(x){toast(x.message)}};
    if(now)go();else TMR=setTimeout(go,500);
  }
  const log=(text)=>{const p=cur();const h=Array.isArray(p.history)?[...p.history]:[];h.push({kind:'acao',text,by:who(),at:new Date().toISOString()});return h};

  function html(){
    const p=cur();if(!p)return '';
    const col=colOf(p),colN=(COLS.find(c=>c[0]===col)||[])[1]||'';
    const media=p.media||[],im=cover(p),cl=Array.isArray(p.checklist)?p.checklist:[],done=cl.filter(x=>x.done).length;
    const labels=Array.isArray(p.labels)?p.labels.filter(x=>typeof x==='string'):[];
    const H=(Array.isArray(p.history)?p.history:[]).filter(x=>x&&x.at);
    const fb=D.feedback.filter(f=>f.post_id===p.id).map(f=>({kind:'cliente',text:f.text||(f.decision==='aprovado'?'Aprovou':f.decision==='reprovado'?'Pediu ajuste':''),by:cli(p.client_id).name,at:f.created_at}));
    const act=[...H,...fb].filter(x=>x.text).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    return `<div class="ovl cdo" data-close><div class="cdk" role="dialog" aria-modal="true" aria-label="Cartão">
      <button class="cdx" type="button" data-x aria-label="Fechar">✕</button>
      ${im?`<div class="cdcov"><img src="${esc(im)}" alt=""></div>`:''}
      <div class="cdh">${I.card}<div style="min-width:0;flex:1"><textarea class="cdt" data-cd="title" rows="1">${esc(p.title||'')}</textarea>
        <small>na coluna <select data-cd-move>${COLS.map(([k,n])=>`<option value="${k}" ${k===col?'selected':''}>${n}</option>`).join('')}</select> · cliente <select data-cd="client_id">${CL().map(c=>`<option value="${esc(c.id)}" ${c.id===p.client_id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></small></div></div>
      <div class="cdb"><div class="cdm">
        <div class="cdrow">
          <div><span class="cdl">Formato</span><div class="cdtags">${[['reels','Reels'],['carrossel','Carrossel'],['post','Post']].map(([k,n])=>`<button type="button" class="kl ${p.type===k?'':'off'}" data-ty="${k}" data-cd-type="${k}">${n}</button>`).join('')}</div></div>
          <div><span class="cdl">Etiquetas</span><div class="cdtags">${labels.map(l=>`<span class="kl" style="background:${LCOL[l]||'#8a5560'}">${esc(l)}<button type="button" data-cd-unlabel="${esc(l)}" aria-label="Tirar">×</button></span>`).join('')}<details class="cdpop"><summary class="kl add">+</summary><div>${LBL.filter(l=>!labels.includes(l)).map(l=>`<button type="button" class="kl" style="background:${LCOL[l]}" data-cd-label="${esc(l)}">${esc(l)}</button>`).join('')}<input placeholder="Nova etiqueta" data-cd-newlabel></div></details></div></div>
        </div>
        <div class="cdrow">
          <div><span class="cdl">Publicação</span><div class="cdd"><input type="date" data-cd="date" value="${esc(p.date||'')}"><input type="time" data-cd="time" value="${esc(p.time||'')}"></div></div>
          <div><span class="cdl">Prazo da produção</span><div class="cdd"><input type="date" data-cd="due" value="${esc(p.due||'')}">${p.due&&p.due<today()&&!isDone(p)?'<span class="kl lt">Atrasada</span>':''}</div></div>
        </div>
        <section><h4>${I.txt}Descrição</h4><textarea data-cd="brief" rows="4" placeholder="Adicione uma descrição mais detalhada…">${esc(p.brief||'')}</textarea></section>
        <section><h4>${I.cap}Legenda</h4><textarea data-cd="caption" rows="4" placeholder="A legenda que vai no post (o cliente vê)">${esc(p.caption||'')}</textarea>
          <div class="cdd" style="margin-top:6px"><span class="cdl" style="margin:0">Palavra da automação</span><input data-cd="keyword" value="${esc(p.keyword||'')}" placeholder="ex.: MILHAS" style="max-width:160px"></div></section>
        <section><h4>${I.chk}Checklist${cl.length?`<span class="cdpc">${Math.round(done/cl.length*100)}%</span>`:''}</h4>
          ${cl.length?`<div class="cdbar"><i style="width:${cl.length?done/cl.length*100:0}%"></i></div>`:''}
          <div class="cdcl">${cl.map((x,i)=>`<label class="${x.done?'ok':''}"><input type="checkbox" data-cd-chk="${i}" ${x.done?'checked':''}><span>${esc(x.text)}</span><button type="button" data-cd-unchk="${i}" aria-label="Tirar">×</button></label>`).join('')}</div>
          <input class="cdadd" data-cd-newchk placeholder="+ Adicionar um item (Enter)"></section>
        <section><h4>${I.clip}Anexos</h4><div class="cdat">${media.map((m,i)=>{const u=mediaUrl(m.url,p.client_id);return `<div class="cda"><a href="${esc(u)}" target="_blank" rel="noopener">${m.kind==='image'?`<img src="${esc(u)}" alt="">`:`<span>${m.kind==='pdf'?'PDF':'Vídeo'}</span>`}</a><div><b>${esc(m.name||(m.kind==='image'?'Imagem':m.kind==='pdf'?'PDF':'Vídeo'))}</b><small>${i===0&&m.kind!=='pdf'?'Capa · ':''}${m.kind!=='pdf'&&i>0?`<button type="button" data-cd-cover="${i}">Usar como capa</button> · `:''}<button type="button" data-cd-unmedia="${i}">Tirar</button></small></div></div>`}).join('')}</div>
          <label class="cdbtn">${I.clip}Adicionar anexo<input type="file" data-cd-file accept="image/*,video/*,application/pdf,.pdf" multiple hidden></label></section>
        <section><h4>${I.act}Comentários e atividade</h4>
          <div class="cdc"><span class="kav" style="background:#8f0a19">${esc(who()[0])}</span><textarea data-cd-comment rows="2" placeholder="Escrever um comentário… (Enter para enviar)"></textarea></div>
          <div class="cdlog">${act.map(a=>`<div class="${a.kind==='comentario'?'cm':''}"><span class="kav" style="background:${a.kind==='cliente'?ccol(p.client_id):'#8f0a19'}">${esc((a.by||'?')[0])}</span><div><b>${esc(a.by||'')}</b> ${a.kind==='comentario'?'':`<span>${esc(a.text)}</span>`}<small>${ago(a.at)}${a.kind==='cliente'?' · no portal':''}</small>${a.kind==='comentario'?`<p>${esc(a.text)}</p>`:''}</div></div>`).join('')||'<small class="cdmut">Nada por aqui ainda.</small>'}</div></section>
      </div>
      <aside class="cds"><span class="cdl">Adicionar ao cartão</span>
        <button type="button" data-cd-focus="[data-cd-newchk]">${I.chk}Checklist</button>
        <button type="button" data-cd-focus="[data-cd=due]">${I.clk}Datas</button>
        <label>${I.clip}Anexo<input type="file" data-cd-file accept="image/*,video/*,application/pdf,.pdf" multiple hidden></label>
        <button type="button" data-cd-focus=".cdpop summary">${I.tag}Etiquetas</button>
        <span class="cdl">Ações</span>
        <button type="button" data-cd-focus="[data-cd-move]">${I.mv}Mover</button>
        <button type="button" data-cd-dup>${I.card}Copiar</button>
        <button type="button" data-cd-archive>${I.arc}Arquivar</button>
        <button type="button" class="dl" data-cd-del>✕ Excluir</button>
        <small class="cdmut">Cliente vê: título, formato, data, legenda e anexos. Descrição, checklist e comentários ficam só aqui.</small>
      </aside></div></div></div>`;
  }

  function openCard(id){CID=id;MODAL={html,card:true};render();setTimeout(()=>{const t=$('.cdt');if(t)fit(t)},0)}
  const fit=t=>{t.style.height='auto';t.style.height=t.scrollHeight+'px'};
  openPost=function(id,col){if(id&&D.posts.some(x=>x.id===id))return openCard(id);return _openPost(id,col)};

  const rr=()=>{if(MODAL&&MODAL.card)render()};
  document.addEventListener('input',e=>{const el=e.target.closest&&e.target.closest('.cdk [data-cd]');if(!el)return;if(el.classList.contains('cdt'))fit(el);if(el.tagName==='TEXTAREA'||el.type==='text'||!el.type)save({[el.dataset.cd]:el.value})});
  document.addEventListener('change',async e=>{
    const t=e.target;if(!(MODAL&&MODAL.card))return;const p=cur();if(!p)return;
    if(t.matches('[data-cd]')){const k=t.dataset.cd;let v=t.value;if((k==='date'||k==='due')&&!v)v=null;save({[k]:v},true);if(k==='client_id'||k==='date'||k==='due')rr();return}
    if(t.matches('[data-cd-move]')){const n=(COLS.find(c=>c[0]===t.value)||[])[1];save({...colStatus(t.value,p),history:log('moveu para '+n)},true);rr();return}
    if(t.matches('[data-cd-chk]')){const cl=[...p.checklist];cl[+t.dataset.cdChk]={...cl[+t.dataset.cdChk],done:t.checked};save({checklist:cl},true);rr();return}
    if(t.matches('[data-cd-file]')){
      const m=[...(p.media||[])];
      for(const f of [...t.files]){if(f.size>50*1048576){toast(f.name+' tem mais de 50 MB.');continue}
        const path=`${p.client_id}/${Date.now()}-${f.name.normalize('NFD').replace(/[^\w.-]+/g,'-')}`;toast('Enviando '+f.name);
        const {error}=await sb.storage.from('media').upload(path,f,{contentType:f.type||undefined,upsert:false});if(error){toast(error.message);continue}
        const kind=f.type.startsWith('video')?'video':(f.type==='application/pdf'||/\.pdf$/i.test(f.name))?'pdf':'image';
        m.push({url:MEDIA+path,kind,name:f.name})}
      save({media:m,history:log('adicionou anexo')},true);rr();return}
  });
  document.addEventListener('keydown',e=>{
    const t=e.target;if(!(MODAL&&MODAL.card))return;const p=cur();if(!p)return;
    if(e.key==='Enter'&&t.matches('.cdt')){e.preventDefault();t.blur();return}
    if(e.key==='Enter'&&t.matches('[data-cd-newchk]')&&t.value.trim()){e.preventDefault();save({checklist:[...(p.checklist||[]),{text:t.value.trim(),done:false}]},true);rr();setTimeout(()=>{const n=$('[data-cd-newchk]');if(n)n.focus()},0);return}
    if(e.key==='Enter'&&t.matches('[data-cd-newlabel]')&&t.value.trim()){e.preventDefault();save({labels:[...(Array.isArray(p.labels)?p.labels:[]),t.value.trim()]},true);rr();return}
    if(e.key==='Enter'&&!e.shiftKey&&t.matches('[data-cd-comment]')&&t.value.trim()){e.preventDefault();const h=Array.isArray(p.history)?[...p.history]:[];h.push({kind:'comentario',text:t.value.trim(),by:who(),at:new Date().toISOString()});save({history:h},true);rr();return}
    if(e.key==='Escape'&&MODAL&&MODAL.card){MODAL=null;render()}
  });
  document.addEventListener('click',async e=>{
    const t=e.target;if(!(MODAL&&MODAL.card))return;const p=cur();if(!p)return;
    const q=s=>t.closest(s);let b;
    if(b=q('[data-cd-type]')){save({type:b.dataset.cdType},true);rr();return}
    if(b=q('[data-cd-label]')){save({labels:[...(Array.isArray(p.labels)?p.labels:[]),b.dataset.cdLabel]},true);rr();return}
    if(b=q('[data-cd-unlabel]')){save({labels:(p.labels||[]).filter(x=>x!==b.dataset.cdUnlabel)},true);rr();return}
    if(b=q('[data-cd-unchk]')){e.preventDefault();const cl=[...p.checklist];cl.splice(+b.dataset.cdUnchk,1);save({checklist:cl},true);rr();return}
    if(b=q('[data-cd-unmedia]')){const m=[...p.media];m.splice(+b.dataset.cdUnmedia,1);save({media:m},true);rr();return}
    if(b=q('[data-cd-cover]')){const m=[...p.media];const [x]=m.splice(+b.dataset.cdCover,1);m.unshift(x);save({media:m,history:log('trocou a capa')},true);rr();return}
    if(b=q('[data-cd-focus]')){const el=$(b.dataset.cdFocus);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});if(el.tagName==='SUMMARY')el.click();else el.focus()}return}
    if(q('[data-cd-archive]')){if(!confirm('Arquivar este cartão? Ele sai do quadro, do calendário e do portal do cliente.'))return;await savePost({...p,stage:'arquivado',status:'rascunho',history:log('arquivou')});MODAL=null;toast('Cartão arquivado');render();return}
    if(q('[data-cd-dup]')){const n={...p,id:`${p.client_id}-${Date.now().toString(36)}`,title:(p.title||'')+' (cópia)',status:'rascunho',stage:'ideia',publish_status:null,ig_media_id:null,ig_container:null,permalink:null,publish_error:null,publish_at:null,decided_at:null,history:[],created_at:undefined};delete n.created_at;try{await savePost(n);toast('Cópia criada em Ideias');openCard(n.id)}catch(x){toast(x.message)}return}
    if(q('[data-cd-del]')){if(!confirm('Excluir de vez este cartão? Não dá para desfazer.'))return;const {error}=await sb.from('posts').delete().eq('id',p.id);if(error)return toast(error.message);D.posts=D.posts.filter(x=>x.id!==p.id);MODAL=null;toast('Excluído');render();return}
  });
})();
