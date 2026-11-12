/* "Sua marca": manual da marca do cliente, visual (mapa, seções) e completo (documento).
   Os dados vêm de agency_docs (collection 'marca', id = cliente), preenchidos na gestão. */
(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const A=v=>Array.isArray(v)?v:[];
  const TABS=[['mapa','Mapa'],['quem','Quem somos'],['fala','Como falamos'],['visual','Como aparecemos'],['cuida','Como cuidamos'],['doc','Documento completo']];
  let T='mapa', fontsLoaded='';

  /* cores da marca do cliente: a primeira é a base; o acento é a que tiver "valor/destaque/acento" no papel */
  function palette(b){
    const C=A(b.colors).filter(c=>/^#?[0-9a-f]{6}$/i.test(String(c.hex||'').trim()));
    const hx=c=>'#'+String(c.hex).trim().replace('#','');
    const base=C[0]?hx(C[0]):'#2b2325';
    const acc=C.find((c,i)=>i>0&&/valor|destaque|acento|economiz/i.test((c.role||'')+' '+(c.name||'')));
    return {base,accent:acc?hx(acc):(C[1]?hx(C[1]):'#c40a1c')};
  }
  function loadFonts(b){
    const fams=[b.font_title,b.font_accent].map(f=>String(f||'').split(/[,·(]/)[0].trim()).filter(f=>f&&!/montserrat/i.test(f));
    const key=fams.join('|');if(!key||key===fontsLoaded)return;fontsLoaded=key;
    const l=document.createElement('link');l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?'+fams.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')+':ital,wght@0,400;0,700;1,400;1,600').join('&')+'&display=swap';
    document.head.appendChild(l);
  }
  const fam=f=>{const n=String(f||'').split(/[,·(]/)[0].trim();return n?`"${n}",`:''};

  const more=(label,text)=>text?`<button class="mk-more" data-mk-more aria-expanded="false">${E(label)} ↓</button><div class="mk-exp" hidden>${para(text)}</div>`:'';
  const para=t=>String(t||'').split(/\n{2,}/).map(p=>`<p>${inline(p)}</p>`).join('');
  const inline=t=>E(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
  const list=a=>A(a).length?`<ul class="mk-ul">${A(a).map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`:'';

  function steps(b){
    const S=A(b.steps);if(!S.length)return '';
    return `<div class="mk-steps">${S.map(s=>`<div class="mk-step ${E(s.state||'')}"><i></i><b>${E(s.name)}</b><small>${E(s.note||'')}</small></div>`).join('')}</div>`;
  }
  function tabs(){return `<div class="mk-tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" data-mk="${k}" aria-selected="${k===T}">${l}</button>`).join('')}</div>`}

  function mapa(b){
    const br=[['quem','Quem somos','Por que a marca existe e para quem',b.map1],['fala','Como falamos','Personalidade e jeito de falar',b.map2],
              ['visual','Como aparecemos','Cores, letras, assinatura e foto',b.map3],['cuida','Como cuidamos','Jornada, regras e números',b.map4]];
    const chips=s=>String(s||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>`<span class="mk-chip">${E(x)}</span>`).join('');
    return `<section class="mk-card mk-mapwrap"><div class="mk-map" id="mkmap"><svg class="mk-lines" id="mklines" aria-hidden="true"></svg>
      <div class="mk-core" id="mkcore"><span class="mk-eb">A ideia central</span><div class="mk-big">${inline(b.phrase||'')}</div>${b.summary?`<p>${inline(b.summary)}</p>`:''}${b.concept_tag?`<span class="mk-tag">${E(b.concept_tag)}</span>`:''}</div>
      ${br.map(([k,h,q,c],i)=>`<button class="mk-br mk-b${i+1}" data-mk="${k}"><h3><i></i>${h}</h3><small>${q}</small><div class="mk-chips">${chips(c)}</div><span class="mk-go">Abrir →</span></button>`).join('')}
    </div><p class="mk-hint">Toque em qualquer parte para abrir.</p></section>`;
  }

  function quem(b){
    return `<div class="mk-grid">
     ${b.purpose?`<div class="mk-card"><span class="mk-lb">Propósito</span><p class="mk-st">${inline(b.purpose)}</p>${more('Ler explicação',b.purpose_why)}</div>`:''}
     ${b.positioning?`<div class="mk-card"><span class="mk-lb">Posicionamento</span><p class="mk-st sm">${inline(b.positioning)}</p>${more('Ler explicação',b.positioning_why)}</div>`:''}
     ${b.belief||b.enemy?`<div class="mk-card">${b.belief?`<span class="mk-lb">No que acreditamos</span><p class="mk-st sm">${inline(b.belief)}</p>`:''}${b.enemy?`<span class="mk-lb" style="margin-top:14px">O que combatemos</span><p class="mk-p">${inline(b.enemy)}</p>`:''}</div>`:''}
     ${A(b.values).length?`<div class="mk-card"><span class="mk-lb">Valores</span><div class="mk-vals">${A(b.values).map((v,i)=>`<div><span>${i+1}</span><p><b>${E(v.name)}</b>${E(v.desc||'')}</p></div>`).join('')}</div></div>`:''}
     ${A(b.personas).length?`<div class="mk-card mk-full"><span class="mk-lb">Para quem falamos${b.personas_note?' · '+E(b.personas_note):''}</span><div class="mk-three">${A(b.personas).map(p=>`<div class="mk-pc"><b>${E(p.name)}</b>${p.quote?`<q>${E(p.quote)}</q>`:''}<p>${inline(p.desc||'')}</p>${p.product?`<span class="mk-prod">${E(p.product)}</span>`:''}</div>`).join('')}</div>${b.out_tribe?`<p class="mk-muted">Fica de fora: ${inline(b.out_tribe)}</p>`:''}</div>`:''}
    </div>`;
  }

  function fala(b){
    const isn=A(b.is_not);
    return `<div class="mk-grid">
     ${b.archetype?`<div class="mk-card"><span class="mk-lb">Personalidade</span><div class="mk-arch"><span>${E(String(b.archetype).trim()[0]||'')}</span><p><b>${inline(b.archetype)}</b>${b.archetype_desc?`<small>${inline(b.archetype_desc)}</small>`:''}</p></div>${b.words3?`<div class="mk-chips" style="margin-top:12px">${String(b.words3).split(/[,;]/).map(w=>w.trim()).filter(Boolean).map(w=>`<span class="mk-chip">${E(w)}</span>`).join('')}</div>`:''}${more('O lado a evitar',b.shadow)}</div>`:''}
     ${isn.length?`<div class="mk-card"><span class="mk-lb">A marca é / não é</span><div class="mk-isnot"><b class="y">É</b><b class="n">Não é</b>${isn.map(r=>`<span>${E(r.a)}</span><span>${E(r.b)}</span>`).join('')}</div></div>`:''}
     ${A(b.tone).length?`<div class="mk-card mk-full"><span class="mk-lb">Tom por situação</span><div class="mk-tw"><table class="mk-tb"><tr><th>Situação</th><th>Assim</th><th>Assim não</th></tr>${A(b.tone).map(t=>`<tr><td><b>${E(t.sit)}</b></td><td>${E(t.yes)}</td><td>${E(t.no)}</td></tr>`).join('')}</table></div></div>`:''}
     ${A(b.use).length||A(b.avoid).length?`<div class="mk-card"><span class="mk-lb">Palavras</span><div class="mk-words"><div><b class="y">Usamos</b><ul>${A(b.use).map(w=>`<li class="y">${E(w)}</li>`).join('')}</ul></div><div><b class="n">Evitamos</b><ul>${A(b.avoid).map(w=>`<li class="n">${E(w)}</li>`).join('')}</ul></div></div>${more('Por que evitamos',b.avoid_why)}</div>`:''}
     ${A(b.messages).length?`<div class="mk-card"><span class="mk-lb">Mensagens-chave</span><ol class="mk-ol">${A(b.messages).map(m=>`<li>${inline(m)}</li>`).join('')}</ol>${b.tagline?`<p class="mk-muted">Tagline: <b>${E(b.tagline)}</b></p>`:''}</div>`:''}
     ${A(b.pillars).length?`<div class="mk-card mk-full"><span class="mk-lb">Pilares de conteúdo</span><div class="mk-pil">${A(b.pillars).map(p=>`<div><b>${E(p.name)}</b><span>${E(p.desc||'')}</span>${p.tag?`<small>${E(p.tag)}</small>`:''}</div>`).join('')}</div></div>`:''}
    </div>`;
  }

  function visual(b){
    const P=palette(b),C=A(b.colors),pr=b.proof||{};
    const tF=fam(b.font_title)+'Montserrat,sans-serif',aF=fam(b.font_accent)+'Georgia,serif';
    const sig=(bg,fg,acc,flag,cls,extra='')=>`<div class="mk-lg ${cls||''}" style="background:${bg};color:${fg}"><span class="mk-flag ${cls==='bad'?'n':'y'}">${E(flag)}</span><div class="mk-wm" style="font-family:${tF}${extra}">${cls==='bad'&&/avi/i.test(flag)?'✈ ':'<i class="mk-dia" style="background:'+acc+'"></i>'}<em style="font-family:${aF};color:${cls==='bad'?'inherit':acc}">${E(b.sig1||'')}</em> ${E(b.sig2||'')}${cls==='bad'?'':`<small style="color:${acc}">${E(b.sig_line||'')}</small>`}</div></div>`;
    return `<div class="mk-grid">
     ${C.length?`<div class="mk-card mk-full"><span class="mk-lb">Cores · toque para copiar o código</span><div class="mk-sw">${C.map(c=>{const h='#'+String(c.hex||'').replace('#','');return `<button data-copy="${E(h.toUpperCase())}" data-copy-msg="Cor ${E(h.toUpperCase())} copiada."><span style="background:${E(h)}"></span><b>${E(c.name)}</b><small>${E(h.toUpperCase())}${c.role?' · '+E(c.role):''}</small></button>`}).join('')}</div>
       ${C.some(c=>c.pct)?`<div class="mk-ratio">${C.filter(c=>c.pct).map(c=>`<i style="flex:${parseFloat(c.pct)||1};background:#${E(String(c.hex).replace('#',''))}" title="${E(c.name)} ${E(c.pct)}"></i>`).join('')}</div><p class="mk-muted">${C.filter(c=>c.pct).map(c=>E(c.name)+' '+E(c.pct)).join(' · ')}</p>`:''}${more('Por que essas cores',b.colors_why)}</div>`:''}
     ${b.font_title?`<div class="mk-card"><span class="mk-lb">Letras</span><div class="mk-type"><div class="d" style="font-family:${tF}">${E(b.type_sample||'')} ${b.type_word?`<em style="font-family:${aF};color:${P.accent}">${E(b.type_word)}</em>`:''}</div><p style="font-family:${tF}">${E(b.type_text||'')}</p><small>${E([b.font_title&&'Títulos: '+b.font_title,b.font_accent&&'Destaque: '+b.font_accent,b.font_body&&'Textos: '+b.font_body].filter(Boolean).join(' · '))}</small></div>${more('Como usar',b.font_note)}</div>`:''}
     ${pr.value?`<div class="mk-card"><span class="mk-lb">${E(b.proof_title||'A prova principal')}</span><div class="mk-rc" style="background:${P.base};font-family:${tF}"><span class="lab" style="background:${P.accent};color:${P.base}">${E(pr.label||'Resultado de cliente')}</span><div class="val" style="color:${P.accent}">${E(pr.value)}</div><div class="t">${E(pr.text||'')}</div>
       ${pr.before||pr.after?`<div class="bp" style="color:${P.base}">${pr.from||pr.to?`<div class="r">${E(pr.from||'')}<i></i>${E(pr.to||'')}</div>`:''}<div class="m"><span>Ia pagar <b>${E(pr.before||'')}</b></span><span>Pagou <b>${E(pr.after||'')}</b></span></div></div>`:''}
       ${b.sig1||b.sig2?`<div class="sig"><i class="mk-dia" style="background:${P.accent}"></i><div><em style="font-family:${aF};color:${P.accent}">${E(b.sig1||'')}</em> ${E(b.sig2||'')}<small>${E(b.sig_line||'')}</small></div></div>`:''}</div>${pr.note?`<p class="mk-muted" style="text-align:center">${E(pr.note)}</p>`:''}</div>`:''}
     ${b.sig1||b.sig2?`<div class="mk-card mk-full"><span class="mk-lb">Assinatura · certo e errado</span><div class="mk-lgs">${sig(P.base,'#fff',P.accent,'Principal')}${sig('#f3f6fc',P.base,P.accent,'No claro')}${sig(P.base,'#fff',P.accent,'Sem avião','bad')}${sig('linear-gradient(135deg,'+P.base+',#3a2a08)',P.accent,P.accent,'Sem degradê ou brilho','bad',';text-shadow:0 0 12px '+P.accent)}</div>${b.logo_note?`<p class="mk-muted">${inline(b.logo_note)}</p>`:''}</div>`:''}
     ${A(b.photo_use).length||A(b.photo_avoid).length?`<div class="mk-card mk-full"><span class="mk-lb">Fotos e vídeos</span><div class="mk-ph"><div class="y"><b>Usar</b>${list(b.photo_use)}</div><div class="n"><b>Evitar</b>${list(b.photo_avoid)}</div></div></div>`:''}
    </div>`;
  }

  function cuida(b){
    return `${A(b.journey).length?`<div class="mk-card" style="margin-bottom:14px"><span class="mk-lb">Jornada do cliente</span><div class="mk-jr">${A(b.journey).map((j,i)=>`<div><span>${i+1}</span><b>${E(j.name)}</b><small>${E(j.desc||'')}</small></div>`).join('')}</div></div>`:''}
     <div class="mk-grid">
      ${A(b.checklist).length?`<div class="mk-card"><span class="mk-lb">Antes de postar</span><ul class="mk-ck">${A(b.checklist).map(x=>`<li>${inline(x)}</li>`).join('')}</ul></div>`:''}
      ${A(b.rules).length?`<div class="mk-card"><span class="mk-lb">Regras do setor</span><ul class="mk-ck">${A(b.rules).map(x=>`<li>${inline(x)}</li>`).join('')}</ul></div>`:''}
      ${A(b.metrics).length?`<div class="mk-card mk-full"><span class="mk-lb">Como vamos medir</span>${A(b.metrics).map(m=>`<div class="mk-mt"><span>${E(m.name)}<small>${E(m.desc||'')}</small></span><b>${E(m.value||'')}</b></div>`).join('')}${b.next_review?`<p class="mk-muted">${E(b.next_review)}</p>`:''}</div>`:''}
     </div>`;
  }

  /* documento: "## título", "### subtítulo", "> por quê" (caixa), parágrafos e **negrito** */
  function doc(b){
    const L=String(b.doc||'').split('\n');const out=[],toc=[];let buf=[];let n=0;
    const flush=()=>{if(buf.length){out.push(`<p>${inline(buf.join('\n'))}</p>`);buf=[]}};
    for(const raw of L){const l=raw.trimEnd();
      if(/^##\s/.test(l)){flush();const id='mkd'+(n++);toc.push([id,l.replace(/^##\s*/,'')]);out.push(`<h2 id="${id}">${inline(l.replace(/^##\s*/,''))}</h2>`)}
      else if(/^###\s/.test(l)){flush();out.push(`<h3>${inline(l.replace(/^###\s*/,''))}</h3>`)}
      else if(/^>\s?/.test(l)){flush();out.push(`<div class="mk-why">${inline(l.replace(/^>\s?/,''))}</div>`)}
      else if(/^[-•]\s/.test(l)){flush();out.push(`<p class="mk-li">${inline(l.replace(/^[-•]\s/,''))}</p>`)}
      else if(!l.trim())flush(); else buf.push(l);}
    flush();
    const acts=[b.pdf_url&&`<a class="btn sm red" href="${E(b.pdf_url)}" target="_blank" rel="noopener">Baixar PDF</a>`,b.guide_url&&`<a class="btn sm ghost" href="${E(b.guide_url)}" target="_blank" rel="noopener">Guia de bolso</a>`].filter(Boolean).join('');
    return `<div class="mk-dh"><div><b>Manual da marca</b><small>${E(b.version||'')}</small></div>${acts?`<div class="mk-acts">${acts}</div>`:''}</div>
     ${b.pending?`<div class="mk-pend"><b>Falta você:</b> ${inline(b.pending)}</div>`:''}
     ${out.length?`<div class="mk-doc">${toc.length>2?`<nav class="mk-card mk-toc" aria-label="Índice">${toc.map(([id,t])=>`<a href="#" data-mk-to="${id}">${E(t)}</a>`).join('')}</nav>`:''}<article class="mk-card mk-paper">${out.join('')}</article></div>`:'<div class="empty">O documento completo aparece aqui quando a Stond publicar.</div>'}`;
  }

  function view(b){
    loadFonts(b);
    if(!TABS.some(([k])=>k===T))T='mapa';
    const body={mapa,quem,fala,visual,cuida,doc}[T](b);
    if(T==='mapa')requestAnimationFrame(()=>requestAnimationFrame(lines));
    return `<div class="top"><div><h2>Sua marca</h2><p>Tudo o que a sua marca é, num lugar só. Comece pelo mapa e abra cada parte para ver os detalhes.</p></div></div>
      ${steps(b)}${tabs()}<div class="mk-body">${body}</div>`;
  }

  function lines(){
    const map=document.getElementById('mkmap'),svg=document.getElementById('mklines'),core=document.getElementById('mkcore');
    if(!map||!svg||!core||getComputedStyle(svg).display==='none')return;
    const m=map.getBoundingClientRect(),c=core.getBoundingClientRect();let d='';
    map.querySelectorAll('.mk-br').forEach(el=>{const r=el.getBoundingClientRect(),left=r.left+r.width/2<c.left+c.width/2;
      const bx=(left?r.right:r.left)-m.left,by=r.top+r.height/2-m.top,sx=(left?c.left:c.right)-m.left,sy=c.top+c.height/2-m.top+(by<c.top+c.height/2-m.top?-20:20),mx=(sx+bx)/2;
      d+=`M${sx},${sy} C${mx},${sy} ${mx},${by} ${bx},${by} `});
    svg.setAttribute('viewBox',`0 0 ${m.width} ${m.height}`);svg.innerHTML=`<path d="${d}"/>`;
  }
  addEventListener('resize',lines);

  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-mk]');
    if(t){T=t.dataset.mk;if(typeof render==='function')render();const m=document.querySelector('.main');if(m)m.scrollTop=0;return}
    const mo=e.target.closest('[data-mk-more]');
    if(mo){const x=mo.nextElementSibling;x.hidden=!x.hidden;mo.setAttribute('aria-expanded',String(!x.hidden));mo.textContent=mo.textContent.replace(x.hidden?'↑':'↓',x.hidden?'↓':'↑');return}
    const to=e.target.closest('[data-mk-to]');
    if(to){e.preventDefault();const h=document.getElementById(to.dataset.mkTo);if(h)h.scrollIntoView({behavior:'smooth',block:'start'})}
  });

  window.StondMarca={view,reset(){T='mapa'}};
})();
