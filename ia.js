/* IA da Stond: chat flutuante usado na gestão e no portal do cliente */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function md(t){
    const lines=esc(t).split('\n');let html='',list=false;
    for(const l of lines){
      const b=l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if(b){if(!list){html+='<ul>';list=true}html+='<li>'+b[1]+'</li>';continue}
      if(list){html+='</ul>';list=false}
      if(/^#{1,4}\s/.test(l)){html+='<p><b>'+l.replace(/^#+\s/,'')+'</b></p>';continue}
      html+=l.trim()?'<p>'+l+'</p>':'';
    }
    if(list)html+='</ul>';
    return html.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  }
  const SPARK='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';

  window.StondIA={mount(o){
    if(document.querySelector('.ia-panel'))return;
    const K='stond-ia-'+o.mode;
    let H=[];try{H=JSON.parse(sessionStorage.getItem(K)||'[]')}catch(_){}
    const save=()=>{try{sessionStorage.setItem(K,JSON.stringify(H.slice(-30)))}catch(_){}};
    const fab=document.createElement('button');fab.className='ia-fab';fab.type='button';fab.setAttribute('aria-label','Abrir a IA');fab.innerHTML=SPARK+'<span>IA</span>';
    const pn=document.createElement('section');pn.className='ia-panel';pn.hidden=true;pn.setAttribute('aria-label','IA da Stond');
    pn.innerHTML=`<header><div><b>${esc(o.title||'IA da Stond')}</b><small>${esc(o.sub||'')}</small></div><span><button type="button" class="ia-new" title="Nova conversa">Limpar</button><button type="button" class="ia-x" aria-label="Fechar">×</button></span></header>
      <div class="ia-log" aria-live="polite"></div>
      <form class="ia-f"><textarea rows="1" placeholder="Pergunte o que quiser" aria-label="Sua pergunta"></textarea><button class="ia-send" aria-label="Enviar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>`;
    document.body.append(pn);if(o.fab!==false)document.body.append(fab);
    let nd=null;
    if(o.nudge){nd=document.createElement('button');nd.type='button';nd.className='ia-nudge';nd.textContent=o.nudge.text;document.body.append(nd);
      nd.onclick=()=>{open(true);ask(o.nudge.ask||o.nudge.text)}}
    const log=pn.querySelector('.ia-log'),ta=pn.querySelector('textarea'),f=pn.querySelector('form');
    let busy=false;
    function draw(){
      if(!H.length){log.innerHTML=`<div class="ia-hi"><p>${esc(o.hello||'Oi! Como posso ajudar?')}</p>${(o.hints||[]).map(h=>`<button type="button" class="ia-hint">${esc(h)}</button>`).join('')}</div>`;return}
      log.innerHTML=H.map(m=>m.role==='user'?`<div class="ia-m me">${esc(m.content)}</div>`:`<div class="ia-m ai${m.err?' err':''}">${md(m.content)}${m.err?'':`<button type="button" class="ia-copy">Copiar</button>`}</div>`).join('')+(busy?'<div class="ia-m ai ia-wait"><i></i><i></i><i></i></div>':'');
      log.scrollTop=log.scrollHeight;
    }
    async function ask(q){
      q=q.trim();if(!q||busy)return;
      H.push({role:'user',content:q});busy=true;ta.value='';fit();draw();
      try{
        if(o.local){await new Promise(r=>setTimeout(r,350));H.push({role:'assistant',content:o.local(q)});busy=false;save();draw();return}
        const {data,error}=await o.sb.functions.invoke('ia',{body:{mode:o.mode,messages:H.filter(m=>!m.err).map(({role,content})=>({role,content}))}});
        let msg=data&&data.text;
        if(!msg){let e=data&&data.error;if(!e&&error){try{e=(await error.context.json()).error}catch(_){e=null}}throw new Error(e||'A IA não respondeu agora. Tente de novo.')}
        H.push({role:'assistant',content:msg});
      }catch(e){H.push({role:'assistant',content:e.message,err:true})}
      busy=false;save();draw();
    }
    function fit(){ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,140)+'px'}
    const open=v=>{pn.hidden=!v;fab.hidden=v;if(nd)nd.hidden=v;if(v){draw();setTimeout(()=>ta.focus(),30)}};
    fab.onclick=()=>open(true);
    document.addEventListener('click',e=>{if(e.target.closest('[data-ia-open]'))open(true)});
    pn.querySelector('.ia-x').onclick=()=>open(false);
    pn.querySelector('.ia-new').onclick=()=>{if(busy)return;H=[];save();draw()};
    f.onsubmit=e=>{e.preventDefault();ask(ta.value)};
    ta.oninput=fit;
    ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(ta.value)}};
    log.onclick=e=>{
      const h=e.target.closest('.ia-hint');if(h)return ask(h.textContent);
      const c=e.target.closest('.ia-copy');if(c){const t=c.parentElement.cloneNode(true);t.querySelector('.ia-copy').remove();navigator.clipboard?.writeText(t.innerText.trim());c.textContent='Copiado';setTimeout(()=>c.textContent='Copiar',1500)}
    };
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pn.hidden)open(false)});
  }};
})();
