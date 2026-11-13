/* "Sua marca": manual da marca do cliente, visual (visão geral + seções) e completo (documento).
   Os dados vêm de agency_docs (collection 'marca', id = cliente).
   view(b) mostra para o cliente; view(b,{edit:true,onChange}) é o mesmo desenho editável (usado na gestão):
   clicar num texto edita ali mesmo, "+" adiciona item, "×" remove. */
(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const A=v=>Array.isArray(v)?v:[];
  /* abas de cima: a marca + o projeto. A marca tem sub-abas (visão geral e as 4 partes + manual) */
  const TABS=[['mapa','A marca'],['plano','O que vamos fazer'],['fazendo','Em andamento'],['entregue','Entregue'],['metricas','Métricas'],['antes','Antes e depois']];
  const SUB=[['mapa','Visão geral'],['quem','Quem somos'],['fala','Como falamos'],['visual','Como aparecemos'],['cuida','Como cuidamos'],['doc','Manual completo']];
  const ST={plano:'O que vamos fazer',fazendo:'Em andamento',entregue:'Entregue'};
  let TAB='mapa', fontsLoaded='', ED=null, B=null, FOCUS=null, SEC='';

  /* ---------- dados: caminhos "chave", "chave.i", "chave.i.campo", "chave;i" (pontos separados por ;) ---------- */
  function getP(o,p){if(p.includes(';')){const [k,i]=p.split(';');return chipsOf(o[k])[+i]??''}return p.split('.').reduce((x,k)=>x==null?x:x[k],o)}
  function setP(o,p,v){
    if(p.includes(';')){const [k,i]=p.split(';');const a=chipsOf(o[k]);a[+i]=v;o[k]=a.map(x=>x.trim()).filter(Boolean).join('; ');return}
    const ks=p.split('.');let x=o;for(let j=0;j<ks.length-1;j++){const k=ks[j];if(x[k]==null||typeof x[k]!=='object')x[k]=/^\d+$/.test(ks[j+1])?[]:{};x=x[k]}x[ks[ks.length-1]]=v;
  }
  const chipsOf=s=>String(s||'').split(';').map(x=>x.trim()).filter(Boolean);

  /* cores e letras da marca do cliente */
  function palette(b){
    const C=A(b.colors).filter(c=>/^#?[0-9a-f]{6}$/i.test(String(c.hex||'').trim()));
    const hx=c=>'#'+String(c.hex).trim().replace('#','');
    const base=C[0]?hx(C[0]):'#2b2325';
    const acc=C.find((c,i)=>i>0&&/valor|destaque|acento|economiz/i.test((c.role||'')+' '+(c.name||'')));
    return {base,accent:acc?hx(acc):(C[1]&&!/^#?f{6}$/i.test(C[1].hex)?hx(C[1]):'#c9a35e')};
  }
  const famName=f=>String(f||'').split(/[,·(]/)[0].trim();
  function loadFonts(b){
    const fams=[b.font_title,b.font_accent,b.font_body].map(famName).filter(Boolean);
    const key=[...new Set(fams)].join('|');if(!key||key===fontsLoaded)return;fontsLoaded=key;
    const l=document.createElement('link');l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?'+[...new Set(fams)].map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')+':ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700').join('&')+'&display=swap';
    document.head.appendChild(l);
  }
  const fam=(f,fb)=>{const n=famName(f);return (n?`"${n}",`:'')+fb};

  /* ---------- texto: em leitura vira HTML, em edição vira campo editável ---------- */
  const inline=t=>E(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
  const para=t=>String(t||'').split(/\n{2,}/).map(p=>`<p>${inline(p)}</p>`).join('');
  function T(p,ph,o={}){const v=getP(B,p);
    if(!ED)return o.raw?E(v):inline(v);
    return `<span class="mk-ed${o.ml?' ml':''}" data-e="${p}" contenteditable="plaintext-only" spellcheck="true" data-ph="${E(ph||'Escreva aqui')}"${/\*\*/.test(v||'')?` data-raw="${E(v)}"`:''}>${o.raw?E(v??''):inline(v??'')}</span>`}
  const has=v=>Array.isArray(v)?v.length>0:!!String(v??'').trim();
  const S=(...v)=>ED||v.some(has);
  const X=p=>ED?`<button class="mk-x" data-del="${p}" title="Remover" aria-label="Remover">×</button>`:'';
  const ADD=(p,tpl,label)=>ED?`<button class="mk-add" data-add="${p}" data-tpl='${E(JSON.stringify(tpl))}'>+ ${E(label||'Adicionar')}</button>`:'';
  const LIST=(k,fn,tpl,label)=>A(B[k]).map((x,i)=>fn(x,i,`${k}.${i}`)).join('')+ADD(k,tpl,label);
  const more=(label,k)=>ED?`<div class="mk-exp ed"><span class="mk-exl">${E(label)}</span>${T(k,'Explicação (aparece em "'+label+'")',{ml:1})}</div>`
    :has(B[k])?`<button class="mk-more" data-mk-more aria-expanded="false">${E(label)} ↓</button><div class="mk-exp" hidden>${para(B[k])}</div>`:'';
  const lb=t=>`<span class="mk-lb">${t}</span>`;

  /* ---------- partes ---------- */
  function steps(){
    const s=A(B.steps);if(!s.length&&!ED)return '';
    return `<div class="mk-steps">${s.map((x,i)=>`<div class="mk-step mk-it ${E(x.state||'')}">${X('steps.'+i)}<i class="mk-bar"${ED?` data-cyc="steps.${i}" title="Clique para mudar: feito, agora, depois"`:''}></i><b>${T(`steps.${i}.name`,'Etapa',{raw:1})}</b><small>${T(`steps.${i}.note`,'Situação',{raw:1})}</small></div>`).join('')}${ADD('steps',{name:'',note:'',state:''},'Etapa')}</div>`;
  }
  function tabs(list,cur,sub){
    const cnt=k=>A(B.tasks).filter(t=>(t.status||'plano')===k).length;
    const inB=SUB.some(([k])=>k===cur);
    return `<div class="mk-tabs" role="tablist">${list.map(([k,l])=>{const n=ST[k]?cnt(k):0;return `<button role="tab" data-mk="${k}" aria-selected="${sub&&k==='mapa'?inB:k===cur}">${l}${n?`<span class="mk-cnt">${n}</span>`:''}</button>`}).join('')}</div>
     ${sub&&inB?`<div class="mk-sub">${SUB.map(([k,l])=>`<button data-mk="${k}" aria-pressed="${k===cur}">${l}</button>`).join('')}</div>`:''}`}

  function phraseHTML(){
    if(ED)return T('phrase','Frase central da marca');
    const w=String(B.phrase||'').trim().split(/\s+/);if(w.length<2)return inline(B.phrase||'');
    const last=w.pop();return `${E(w.join(' '))} <em>${E(last)}</em>`;
  }
  function sigHTML(){return `<div class="mk-sig"><i class="mk-dia"></i><div><span class="mk-sg"><em>${T('sig1','Nome',{raw:1})}</em> ${T('sig2','Sobrenome',{raw:1})}</span><small>${T('sig_line','Linha da assinatura',{raw:1})}</small></div></div>`}

  function mapa(){
    const P=[['quem','01','Quem somos','Por que a marca existe e para quem','map1'],['fala','02','Como falamos','Personalidade e jeito de falar','map2'],
             ['visual','03','Como aparecemos','Cores, letras, assinatura e fotos','map3'],['cuida','04','Como cuidamos','Jornada, regras e números','map4']];
    return `<section class="mk-hero">
      <div class="mk-hl"><span class="mk-eb">A ideia central</span><h3 class="mk-phrase">${phraseHTML()}</h3>
        ${S(B.summary)?`<p class="mk-sum">${T('summary','Resumo em uma frase',{ml:1})}</p>`:''}
        ${S(B.concept_tag)?`<span class="mk-tag">${T('concept_tag','Etiqueta do conceito',{raw:1})}</span>`:''}</div>
      <div class="mk-hr">${S(B.sig1,B.sig2)?sigHTML():''}
        ${A(B.colors).length?`<div class="mk-dots">${A(B.colors).slice(0,6).map(c=>`<i style="background:#${E(String(c.hex||'').replace('#',''))}" title="${E(c.name)}"></i>`).join('')}</div>`:''}</div>
     </section>
     ${S(B.pending)?`<div class="mk-pend"><b>Falta você</b><span>${T('pending','O que falta o cliente fazer',{ml:1})}</span></div>`:''}
     ${projStrip()}
     <div class="mk-parts">${P.map(([k,n,h,q,m])=>{const ch=chipsOf(B[m]);
       return `<div class="mk-part"><span class="mk-n">${n}</span><h4>${h}</h4><small>${q}</small>
        <ul>${ch.map((c,i)=>`<li class="mk-it">${X(m+';'+i)}${T(m+';'+i,'Ponto-chave',{raw:1})}</li>`).join('')}</ul>
        ${ED?`<button class="mk-add" data-chip="${m}">+ Ponto-chave</button>`:''}
        <button class="mk-go" data-mk="${k}">Ver tudo →</button></div>`}).join('')}</div>`;
  }

  function quem(){
    return `<div class="mk-grid">
     ${S(B.purpose)?`<div class="mk-card">${lb('Propósito')}<p class="mk-st">${T('purpose','Propósito',{ml:1})}</p>${more('Ler explicação','purpose_why')}</div>`:''}
     ${S(B.positioning)?`<div class="mk-card">${lb('Posicionamento')}<p class="mk-st sm">${T('positioning','Posicionamento',{ml:1})}</p>${more('Ler explicação','positioning_why')}</div>`:''}
     ${S(B.belief)?`<div class="mk-card">${lb('No que acreditamos')}<p class="mk-st sm">${T('belief','Crença da marca',{ml:1})}</p></div>`:''}
     ${S(B.enemy)?`<div class="mk-card">${lb('O que combatemos')}<p class="mk-p">${T('enemy','O que a marca combate',{ml:1})}</p></div>`:''}
     ${S(B.values)?`<div class="mk-card mk-full">${lb('Valores')}<div class="mk-vals">${LIST('values',(v,i,p)=>`<div class="mk-it">${X(p)}<span class="mk-num">${i+1}</span><p><b>${T(p+'.name','Valor',{raw:1})}</b><span>${T(p+'.desc','Comportamento que prova',{raw:1})}</span></p></div>`,{name:'',desc:''},'Valor')}</div></div>`:''}
     ${S(B.personas)?`<div class="mk-card mk-full">${lb('Para quem falamos')}${S(B.personas_note)?`<p class="mk-note">${T('personas_note','Observação',{raw:1})}</p>`:''}
       <div class="mk-pers">${LIST('personas',(x,i,p)=>`<div class="mk-pc mk-it">${X(p)}<span class="mk-av">${E(String(x.name||'?').trim()[0]||'?')}</span><b>${T(p+'.name','Nome da persona',{raw:1})}</b>${S(x.quote)?`<q>${T(p+'.quote','Frase dela',{raw:1})}</q>`:''}<p>${T(p+'.desc','Quem é',{ml:1})}</p>${S(x.product)?`<span class="mk-prod">${T(p+'.product','Produto ou porta de entrada',{raw:1})}</span>`:''}</div>`,{name:'',quote:'',desc:'',product:''},'Persona')}</div>
       ${S(B.out_tribe)?`<p class="mk-muted"><b>Fica de fora:</b> ${T('out_tribe','Quem fica de fora',{ml:1})}</p>`:''}</div>`:''}
    </div>`;
  }

  function fala(){
    return `<div class="mk-grid">
     ${S(B.archetype)?`<div class="mk-card">${lb('Personalidade')}<div class="mk-arch"><span class="mk-badge">${E(String(B.archetype||'?').trim()[0]||'?')}</span><div><b class="mk-st sm">${T('archetype','Arquétipo',{raw:1})}</b><p>${T('archetype_desc','Explicação curta',{ml:1})}</p></div></div>
       ${S(B.words3)?`<div class="mk-chips">${ED?T('words3','Três palavras, separadas por vírgula',{raw:1}):String(B.words3).split(/[,;]/).map(w=>w.trim()).filter(Boolean).map(w=>`<span class="mk-chip">${E(w)}</span>`).join('')}</div>`:''}${more('O lado a evitar','shadow')}</div>`:''}
     ${S(B.is_not)?`<div class="mk-card">${lb('A marca é / não é')}<div class="mk-isnot"><b class="y">É</b><b class="n">Não é</b>${A(B.is_not).map((r,i)=>`<span class="mk-it">${X('is_not.'+i)}${T(`is_not.${i}.a`,'É',{raw:1})}</span><span>${T(`is_not.${i}.b`,'Não é',{raw:1})}</span>`).join('')}</div>${ADD('is_not',{a:'',b:''},'Linha')}</div>`:''}
     ${S(B.tone)?`<div class="mk-card mk-full">${lb('Tom por situação')}<div class="mk-tone">${LIST('tone',(t,i,p)=>`<div class="mk-tr mk-it">${X(p)}<b>${T(p+'.sit','Situação',{raw:1})}</b><div class="y"><small>Assim</small>${T(p+'.yes','Exemplo certo',{ml:1})}</div><div class="n"><small>Assim não</small>${T(p+'.no','Exemplo errado',{ml:1})}</div></div>`,{sit:'',yes:'',no:''},'Situação')}</div></div>`:''}
     ${S(B.use,B.avoid)?`<div class="mk-card">${lb('Palavras')}<div class="mk-words"><div><b class="y">Usamos</b><ul>${A(B.use).map((w,i)=>`<li class="y mk-it">${X('use.'+i)}${T('use.'+i,'Palavra',{raw:1})}</li>`).join('')}</ul>${ADD('use','','Palavra')}</div><div><b class="n">Evitamos</b><ul>${A(B.avoid).map((w,i)=>`<li class="n mk-it">${X('avoid.'+i)}${T('avoid.'+i,'Palavra',{raw:1})}</li>`).join('')}</ul>${ADD('avoid','','Palavra')}</div></div>${more('Por que evitamos','avoid_why')}</div>`:''}
     ${S(B.messages)?`<div class="mk-card">${lb('Mensagens-chave')}<ol class="mk-ol">${A(B.messages).map((m,i)=>`<li class="mk-it">${X('messages.'+i)}${T('messages.'+i,'Mensagem',{ml:1})}</li>`).join('')}</ol>${ADD('messages','','Mensagem')}${S(B.tagline)?`<p class="mk-muted">Tagline: <b>${T('tagline','Tagline',{raw:1})}</b></p>`:''}</div>`:''}
     ${S(B.pillars)?`<div class="mk-card mk-full">${lb('Pilares de conteúdo')}<div class="mk-pil">${LIST('pillars',(x,i,p)=>`<div class="mk-it">${X(p)}<b>${T(p+'.name','Pilar',{raw:1})}</b><span>${T(p+'.desc','O que entra',{ml:1})}</span><small>${T(p+'.tag','Peso e função',{raw:1})}</small></div>`,{name:'',desc:'',tag:''},'Pilar')}</div></div>`:''}
    </div>`;
  }

  function visual(){
    const C=A(B.colors),pr=B.proof||{};
    const lg=(bg,fg,flag,bad,extra='')=>`<div class="mk-lg${bad?' bad':''}" style="background:${bg};color:${fg}${extra}"><span class="mk-flag ${bad?'n':'y'}">${E(flag)}</span><div class="mk-wm">${bad&&/avi/i.test(flag)?'✈ ':'<i class="mk-dia"></i>'}<em>${E(B.sig1||'')}</em> ${E(B.sig2||'')}${bad?'':`<small>${E(B.sig_line||'')}</small>`}</div></div>`;
    return `<div class="mk-grid">
     ${S(C)?`<div class="mk-card mk-full">${lb(ED?'Cores · edite nome, código e papel':'Cores · toque para copiar o código')}<div class="mk-sw">${C.map((c,i)=>{const h='#'+String(c.hex||'').replace('#','').toUpperCase(),p='colors.'+i;
        return ED?`<div class="mk-swc mk-it">${X(p)}<span class="mk-swx" style="background:${E(h)}"></span><b>${T(p+'.name','Nome',{raw:1})}</b><small>${T(p+'.hex','#000000',{raw:1})} · ${T(p+'.role','Papel',{raw:1})} · ${T(p+'.pct','%',{raw:1})}</small></div>`
        :`<button class="mk-swc" data-copy="${E(h)}" data-copy-msg="Cor ${E(h)} copiada."><span class="mk-swx" style="background:${E(h)}"></span><b>${E(c.name)}</b><small>${E(h)}${c.role?' · '+E(c.role):''}</small></button>`}).join('')}${ADD('colors',{name:'',hex:'#',role:'',pct:''},'Cor')}</div>
       ${C.some(c=>c.pct)?`<div class="mk-ratio">${C.filter(c=>c.pct).map(c=>`<i style="flex:${parseFloat(c.pct)||1};background:#${E(String(c.hex).replace('#',''))}" title="${E(c.name)} ${E(c.pct)}"></i>`).join('')}</div><p class="mk-muted">${C.filter(c=>c.pct).map(c=>E(c.name)+' '+E(c.pct)).join(' · ')}</p>`:''}${more('Por que essas cores','colors_why')}</div>`:''}
     ${S(B.font_title)?`<div class="mk-card">${lb('Letras')}<div class="mk-type"><div class="d">${T('type_sample','Exemplo de título',{raw:1})} <em>${T('type_word','destaque',{raw:1})}</em></div><p>${T('type_text','Exemplo de texto',{ml:1})}</p>
       <small>Títulos: ${T('font_title','Fonte',{raw:1})} · Destaque: ${T('font_accent','Fonte',{raw:1})} · Textos: ${T('font_body','Fonte',{raw:1})}</small></div>${more('Como usar','font_note')}</div>`:''}
     ${S(pr.value)?`<div class="mk-card">${lb(T('proof_title','Título da prova',{raw:1})||'A prova principal')}<div class="mk-rc"><span class="lab">${T('proof.label','Etiqueta',{raw:1})}</span><div class="val">${T('proof.value','R$ 0',{raw:1})}</div><div class="t">${T('proof.text','Frase',{raw:1})}</div>
       <div class="bp"><div class="r">${T('proof.from','DE',{raw:1})}<i></i>${T('proof.to','PARA',{raw:1})}</div><div class="m"><span>Ia pagar <b>${T('proof.before','R$',{raw:1})}</b></span><span>Pagou <b>${T('proof.after','R$',{raw:1})}</b></span></div></div>
       ${sigHTML()}</div>${S(pr.note)?`<p class="mk-muted c">${T('proof.note','Observação',{raw:1})}</p>`:''}</div>`:''}
     ${S(B.sig1,B.sig2)?`<div class="mk-card mk-full">${lb('Assinatura · certo e errado')}<div class="mk-lgs">${lg('var(--mb)','#fff','Principal')}${lg('#f3f6fc','var(--mb)','No claro')}${lg('var(--mb)','#fff','Sem avião',1)}${lg('linear-gradient(135deg,var(--mb),#3a2a08)','var(--ma)','Sem degradê ou brilho',1,';text-shadow:0 0 12px var(--ma)')}</div>${S(B.logo_note)?`<p class="mk-muted">${T('logo_note','Observação do logo',{ml:1})}</p>`:''}</div>`:''}
     ${S(B.photo_use,B.photo_avoid)?`<div class="mk-card mk-full">${lb('Fotos e vídeos')}<div class="mk-ph"><div class="y"><b>Usar</b><ul>${A(B.photo_use).map((x,i)=>`<li class="mk-it">${X('photo_use.'+i)}${T('photo_use.'+i,'Item',{raw:1})}</li>`).join('')}</ul>${ADD('photo_use','','Item')}</div><div class="n"><b>Evitar</b><ul>${A(B.photo_avoid).map((x,i)=>`<li class="mk-it">${X('photo_avoid.'+i)}${T('photo_avoid.'+i,'Item',{raw:1})}</li>`).join('')}</ul>${ADD('photo_avoid','','Item')}</div></div></div>`:''}
    </div>`;
  }

  function cuida(){
    return `${S(B.journey)?`<div class="mk-card mk-mb">${lb('Jornada do cliente')}<div class="mk-jr">${LIST('journey',(j,i,p)=>`<div class="mk-it">${X(p)}<span>${i+1}</span><b>${T(p+'.name','Etapa',{raw:1})}</b><small>${T(p+'.desc','O que a marca entrega',{ml:1})}</small></div>`,{name:'',desc:''},'Etapa')}</div></div>`:''}
     <div class="mk-grid">
      ${S(B.checklist)?`<div class="mk-card">${lb('Antes de postar')}<ul class="mk-ck">${A(B.checklist).map((x,i)=>`<li class="mk-it">${X('checklist.'+i)}${T('checklist.'+i,'Pergunta',{ml:1})}</li>`).join('')}</ul>${ADD('checklist','','Pergunta')}</div>`:''}
      ${S(B.rules)?`<div class="mk-card">${lb('Regras do setor')}<ul class="mk-ck">${A(B.rules).map((x,i)=>`<li class="mk-it">${X('rules.'+i)}${T('rules.'+i,'Regra',{ml:1})}</li>`).join('')}</ul>${ADD('rules','','Regra')}</div>`:''}
      <div class="mk-card mk-full mk-link"><span>Os números de como a marca está indo ficam na aba <b>Métricas</b>.</span><button class="mk-go" data-mk="metricas"${SEC?' data-go="met"':''}>Ver métricas →</button></div>
     </div>`;
  }

  /* documento: "## título", "### subtítulo", "> por quê" (caixa), "- item", **negrito** */
  function doc(){
    const L=String(B.doc||'').split('\n');const out=[],toc=[];let buf=[];let n=0;
    const flush=()=>{if(buf.length){out.push(`<p>${inline(buf.join('\n'))}</p>`);buf=[]}};
    for(const raw of L){const l=raw.trimEnd();
      if(/^##\s/.test(l)){flush();const id='mkd'+(n++);toc.push([id,l.replace(/^##\s*/,'')]);out.push(`<h2 id="${id}">${inline(l.replace(/^##\s*/,''))}</h2>`)}
      else if(/^###\s/.test(l)){flush();out.push(`<h3>${inline(l.replace(/^###\s*/,''))}</h3>`)}
      else if(/^>\s?/.test(l)){flush();out.push(`<div class="mk-why">${inline(l.replace(/^>\s?/,''))}</div>`)}
      else if(/^[-•]\s/.test(l)){flush();out.push(`<p class="mk-li">${inline(l.replace(/^[-•]\s/,''))}</p>`)}
      else if(!l.trim())flush(); else buf.push(l);}
    flush();
    if(ED)return `<div class="mk-card mk-mb">${lb('Manual completo')}
      <div class="mk-dfl"><label>Versão</label>${T('version','Ex.: Versão 1 · 12/11/2026',{raw:1})}<label>Link do PDF</label>${T('pdf_url','https://…',{raw:1})}<label>Link do guia de bolso</label>${T('guide_url','https://…',{raw:1})}</div>
      <p class="mk-muted">Como escrever: <b>##</b> título · <b>###</b> subtítulo · <b>&gt;</b> caixa de "por quê" · <b>-</b> item · <b>**negrito**</b></p>
      <textarea class="mk-docta" data-e="doc" rows="28" spellcheck="true">${E(B.doc||'')}</textarea></div>`;
    const acts=[B.pdf_url&&`<a class="btn sm red" href="${E(B.pdf_url)}" target="_blank" rel="noopener">Baixar PDF</a>`,B.guide_url&&`<a class="btn sm ghost" href="${E(B.guide_url)}" target="_blank" rel="noopener">Guia de bolso</a>`].filter(Boolean).join('');
    return `<div class="mk-dh"><div><b>Manual da marca</b><small>${E(B.version||'')}</small></div>${acts?`<div class="mk-acts">${acts}</div>`:''}</div>
     ${out.length?`<div class="mk-doc">${toc.length>2?`<nav class="mk-card mk-toc" aria-label="Índice">${toc.map(([id,t])=>`<a href="#" data-mk-to="${id}">${E(t)}</a>`).join('')}</nav>`:''}<article class="mk-card mk-paper">${out.join('')}</article></div>`:'<div class="empty">O manual completo aparece aqui quando a Stond publicar.</div>'}`;
  }

  /* ---------- projeto: o que vamos fazer, em andamento, entregue ---------- */
  const STAGES=['Diagnóstico','Construção','Ativação','Otimização','Escala'];
  function projStrip(){
    const t=A(B.tasks);if(!t.length)return '';const c=k=>t.filter(x=>(x.status||'plano')===k).length;
    return `<div class="mk-proj">${[['entregue','Entregue'],['fazendo','Em andamento'],['plano','O que vamos fazer']].map(([k,l])=>`<button data-mk="${k}"${SEC?' data-go="proj"':''} class="mk-pj ${k}"><b>${c(k)}</b><span>${l}</span></button>`).join('')}</div>`;
  }
  function tasks(st){
    const all=A(B.tasks),rows=all.map((t,i)=>[t,i]).filter(([t])=>(t.status||'plano')===st);
    const dl={plano:'Previsto para',fazendo:'Previsto para',entregue:'Entregue em'}[st];
    const intro={plano:'O que ainda vamos fazer na sua marca, na ordem do método.',fazendo:'O que a Stond está fazendo agora.',entregue:'Tudo o que já foi entregue, com o link para abrir.'}[st];
    const card=([t,i],grouped)=>{const p='tasks.'+i;return `<div class="mk-task mk-it ${st}">${X(p)}
      <div class="mk-tk-h">${S(t.stage)&&(!grouped||ED)?`<span class="mk-stage">${T(p+'.stage','Etapa do método',{raw:1})}</span>`:''}${st==='entregue'?'<span class="mk-ok">✓ Entregue</span>':st==='fazendo'?'<span class="mk-doing">Em andamento</span>':''}</div>
      <b>${T(p+'.name','Nome da entrega',{raw:1})}</b>${S(t.desc)?`<p>${T(p+'.desc','O que é e para que serve',{ml:1})}</p>`:''}
      <div class="mk-tk-f">${S(t.date)?`<small>${dl} ${T(p+'.date','dd/mm',{raw:1})}</small>`:'<small></small>'}
        ${ED?`<small class="mk-lk">Link: ${T(p+'.link','https://…',{raw:1})}</small>`:t.link?`<a class="mk-open" href="${E(t.link)}" target="_blank" rel="noopener">Abrir →</a>`:''}</div>
      ${A(t.files).length||(ED&&ED.onUpload)?`<div class="mk-files">${A(t.files).map((f,j)=>`<span class="mk-file"><a href="${E(f.url)}" target="_blank" rel="noopener" download>${/\.pdf($|\?)/i.test(f.url)?'PDF':'Arquivo'} · ${E(f.name||'baixar')}</a>${ED?`<button class="mk-x" data-del="${p}.files.${j}" aria-label="Tirar arquivo">×</button>`:''}</span>`).join('')}${ED&&ED.onUpload?`<label class="mk-up">+ Arquivo para o cliente baixar<input type="file" data-mk-file="${p}" multiple hidden></label>`:''}</div>`:''}
      ${ED?`<div class="mk-mv">${Object.entries({plano:'A fazer',fazendo:'Fazendo',entregue:'Entregue'}).map(([k,l])=>`<button data-st="${p}" data-v="${k}" aria-pressed="${k===st}">${l}</button>`).join('')}</div>`:''}</div>`};
    const groups=STAGES.map(g=>[g,rows.filter(([t])=>t.stage===g)]).filter(([,r])=>r.length);
    const other=rows.filter(([t])=>!STAGES.includes(t.stage));
    const body=rows.length?(st==='entregue'?`<div class="mk-tasks">${rows.map(x=>card(x)).join('')}</div>`
      :[...groups,...(other.length?[['Outras',other]]:[])].map(([g,r])=>`<div class="mk-tg"><span class="mk-lb">${E(g)}</span><div class="mk-tasks">${r.map(x=>card(x,1)).join('')}</div></div>`).join(''))
      :`<div class="mk-card mk-empty">${{plano:'Nada planejado por enquanto.',fazendo:'Nada em andamento agora.',entregue:'As entregas aparecem aqui assim que ficarem prontas.'}[st]}</div>`;
    return `<p class="mk-intro">${intro}</p>${body}${ED?`<button class="mk-add" data-add="tasks" data-tpl='${E(JSON.stringify({name:'',desc:'',stage:'',status:st,date:'',link:''}))}'>+ Entrega</button>`:''}`;
  }

  /* ---------- projeto no Método Stond: etapas, este mês, até 3 meses, projeção (Escala), já entregue ---------- */
  const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const ymOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const addM=(ym,n)=>{const [y,m]=ym.split('-').map(Number);return ymOf(new Date(y,m-1+n,1))};
  const mName=ym=>{const m=+String(ym).split('-')[1];return m?MESES[m-1][0].toUpperCase()+MESES[m-1].slice(1):''};
  const PHC={'Diagnóstico':'#8a7e81','Construção':'#5a7fa8','Ativação':'#8f0a19','Otimização':'#d08a1c','Escala':'#3f9f6f'};
  const METDESC={'Diagnóstico':'Entender onde a marca está hoje.','Construção':'Posicionamento, identidade e manual da marca.','Ativação':'Colocar a marca no ar e rodar o conteúdo.','Otimização':'Ler os números e ajustar o que não funciona.','Escala':'Crescer o que deu certo.'};
  let POSTS=[];
  function autoProg(t){
    if(t.auto!=='posts'||!t.month)return null;
    const L=POSTS.filter(p=>String(p.date||'').slice(0,7)===t.month&&p.stage!=='arquivado'&&p.type!=='story');if(!L.length)return null;
    const ok=L.filter(p=>p.status==='aprovado'||p.status==='publicado'||p.publish_status==='publicado').length;
    return {ok,n:L.length};
  }
  const stLb={entregue:['k','Pronto'],fazendo:['f','Fazendo'],plano:['v','Vem aí']};
  function edFields(t,i){const p='tasks.'+i;if(!ED)return '';
    return `<div class="pj-ed"><small>Mês ${T(p+'.month','AAAA-MM',{raw:1})}</small><small>Etapa ${T(p+'.stage','Ativação',{raw:1})}</small><small>Link ${T(p+'.link','https://…',{raw:1})}</small>
      <button class="pj-tg" data-tg="${p}.you" aria-pressed="${!!t.you}">Precisa do cliente</button><button class="pj-tg" data-tg="${p}.auto" data-v="posts" aria-pressed="${t.auto==='posts'}">Progresso pelos posts</button>
      <div class="mk-mv">${Object.entries({plano:'Vem aí',fazendo:'Fazendo',entregue:'Pronto'}).map(([k,l])=>`<button data-st="${p}" data-v="${k}" aria-pressed="${k===(t.status||'plano')}">${l}</button>`).join('')}</div>
      ${ED.onUpload?`<div class="mk-files">${A(t.files).map((f,j)=>`<span class="mk-file"><a href="${E(f.url)}" target="_blank" rel="noopener">${E(f.name||'arquivo')}</a><button class="mk-x" data-del="${p}.files.${j}" aria-label="Tirar arquivo">×</button></span>`).join('')}<label class="mk-up">+ Arquivo<input type="file" data-mk-file="${p}" multiple hidden></label></div>`:''}</div>`}
  function item(t,i){const p='tasks.'+i,[c,l]=stLb[t.status||'plano'],pr=autoProg(t);
    const desc=pr?`${pr.ok} de ${pr.n} posts aprovados.`:'';
    return `<div class="pj-it mk-it${t.you?' you':''}">${X(p)}<span class="pj-st ${c}">${t.you&&t.status!=='entregue'?'Precisa de você':l}</span><b>${T(p+'.name','Nome da entrega',{raw:1})}</b>
      ${S(t.desc)||desc?`<p>${desc&&!ED?E(desc)+(t.desc?' ':''):''}${S(t.desc)?T(p+'.desc','Uma frase sobre a entrega',{ml:1}):''}</p>`:''}
      ${pr?`<div class="pj-mini"><i style="width:${Math.round(pr.ok/pr.n*100)}%"></i></div>`:''}
      ${!ED&&t.link?`<a class="mk-open" href="${E(t.link)}" target="_blank" rel="noopener">Abrir →</a>`:''}${edFields(t,i)}</div>`}
  function rc(t,i){const p='tasks.'+i,c=PHC[t.stage]||'#8a7e81';
    return `<div class="pj-rc mk-it${t.you&&t.status!=='entregue'?' you':''}${t.status==='entregue'?' ok':''}" style="--pc:${c}">${X(p)}<span class="pp">${E(t.stage||'')}</span><b>${T(p+'.name','Nome da entrega',{raw:1})}</b>
      ${t.you&&t.status!=='entregue'?`<small>Precisa de você${t.desc?': '+E(t.desc):''}</small>`:S(t.desc)?`<small>${T(p+'.desc','Detalhe',{raw:1})}</small>`:''}${t.status==='entregue'?'<small class="okk">✓ Pronto</small>':''}${edFields(t,i)}</div>`}
  function projeto(){
    const cur=ymOf(new Date()),all=A(B.tasks).map((t,i)=>[t,i]);
    const mOf=t=>t.month||(t.status==='entregue'?'':cur);
    const st=A(B.steps);
    const met=`<span class="mk-lb">Método Stond</span><div class="pj-met">${st.map((x,i)=>`<div class="pj-ph mk-it ${E(x.state||'')}">${X('steps.'+i)}<span class="dot"${ED?` data-cyc="steps.${i}" title="Clique para mudar: feito, agora, depois"`:''}>${x.state==='done'?'✓':i+1}</span>
      <b>${T(`steps.${i}.name`,'Etapa',{raw:1})}</b><p>${ED?T(`steps.${i}.desc`,METDESC[x.name]||'O que é esta etapa',{raw:1}):E(x.desc||METDESC[x.name]||'')}</p><em>${T(`steps.${i}.note`,'Situação',{raw:1})}</em></div>`).join('')}${ADD('steps',{name:'',desc:'',note:'',state:''},'Etapa')}</div>`;
    const now=all.filter(([t])=>mOf(t)===cur),nowSt=(st.find(x=>x.state==='now')||{}).name;
    const done=now.filter(([t])=>t.status==='entregue').length;
    const mes=`<div class="pj-mes"><div class="pj-mh"><div><span class="mk-lb">Este mês</span><h3>${mName(cur)}${nowSt?` <span class="pj-tag" style="--pc:${PHC[nowSt]||'#8f0a19'}">${E(nowSt)}</span>`:''}</h3></div>
      ${now.length?`<div class="pj-big"><span class="n">${done}<small> de ${now.length} prontos</small></span><span class="pj-bar"><i style="width:${Math.round(done/now.length*100)}%"></i></span></div>`:''}</div>
      <div class="pj-its">${now.sort((a,b)=>({entregue:0,fazendo:1,plano:2}[a[0].status||'plano'])-({entregue:0,fazendo:1,plano:2}[b[0].status||'plano'])).map(([t,i])=>item(t,i)).join('')||'<p class="mk-muted">Nada marcado para este mês.</p>'}</div>
      ${ED?`<button class="mk-add" data-add="tasks" data-tpl='${E(JSON.stringify({name:'',desc:'',stage:nowSt||'',status:'fazendo',month:cur,link:''}))}'>+ Entrega neste mês</button>`:''}</div>`;
    const ms=[1,2].map(n=>addM(cur,n));
    const road=`<span class="mk-lb">Próximos meses</span><div class="pj-road">${ms.map(m=>{const L=all.filter(([t])=>mOf(t)===m);
      return `<div class="pj-col"><header><b>${mName(m)}</b><small>${m.slice(0,4)}</small></header>${L.map(([t,i])=>rc(t,i)).join('')||'<p class="mk-muted">A definir.</p>'}
      ${ED?`<button class="mk-add" data-add="tasks" data-tpl='${E(JSON.stringify({name:'',desc:'',stage:'',status:'plano',month:m,link:''}))}'>+ Entrega</button>`:''}</div>`}).join('')}</div>`;
    const later=all.filter(([t])=>{const m=mOf(t);return m&&m>ms[1]});
    const esc=A(B.escala),fut=esc.length||later.length||ED?`<div class="pj-esc"><div class="pj-eh"><span class="pj-tag" style="--pc:${PHC['Escala']}">Escala</span><h3>Para onde a marca vai</h3><p>Projeção: o que vem depois que a base estiver rodando.</p></div>
      <div class="pj-ecs">${LIST('escala',(x,i,p)=>`<div class="pj-ec mk-it">${X(p)}<small>${T(p+'.when','Quando',{raw:1})}</small><b>${T(p+'.name','Ideia',{raw:1})}${!ED&&S(x.tag)?` <span class="pj-etag">${E(x.tag)}</span>`:''}</b>${S(x.desc)||ED?`<p>${T(p+'.desc','O que é',{ml:1})}</p>`:''}${ED?`<small class="pj-eed">Selo ${T(p+'.tag','ex.: Protótipo',{raw:1})} · Link ${T(p+'.link','https://...',{raw:1})}</small>`:S(x.link)?`<a class="pj-eb" href="${E(x.link)}" target="_blank" rel="noopener">${/prot/i.test(x.tag||'')?'Ver o protótipo':'Abrir'} ↗</a>`:''}</div>`,{name:'',desc:'',when:'',tag:'',link:''},'Projeção')}
      ${later.map(([t,i])=>`<div class="pj-ec"><small>${mName(t.month)} ${t.month.slice(0,4)}</small><b>${E(t.name)}</b>${t.desc?`<p>${E(t.desc)}</p>`:''}${edFields(t,i)}</div>`).join('')}</div></div>`:'';
    const ent=all.filter(([t])=>t.status==='entregue');
    const ok=ent.length?`<span class="mk-lb">Já entregue</span><div class="pj-ent">${ent.map(([t,i])=>{const u=t.link||(A(t.files)[0]||{}).url;return u&&!ED?`<a href="${E(u)}" target="_blank" rel="noopener">${E(t.name)}</a>`:`<span>${E(t.name)}${ED&&!t.month?' <small>(sem mês)</small>':''}</span>`}).join('')}</div>`:'';
    const loose=ED?all.filter(([t])=>t.status==='entregue'&&!t.month):[];
    return `<div class="pj">${met}${mes}${road}${fut}${ok}${loose.length?`<details class="pj-loose"><summary>Editar entregas antigas (sem mês)</summary><div class="pj-its">${loose.map(([t,i])=>item(t,i)).join('')}</div></details>`:''}</div>`;
  }

  /* ---------- métricas: antes, agora e meta ---------- */
  const sz=v=>String(v||'').length>7?' class="tx"':'';
  function metricas(){
    return `${SEC==='metas'?'<span class="mk-lb">Metas da marca · antes, agora e meta</span>':'<p class="mk-intro">Como vamos saber se a marca está funcionando. "Antes" é o ponto de partida, "agora" é a última leitura.</p>'}
     <div class="mk-mets">${LIST('metrics',(m,i,p)=>`<div class="mk-met mk-it">${X(p)}<b>${T(p+'.name','Indicador',{raw:1})}</b><small>${T(p+'.desc','O que mostra',{raw:1})}</small>
       <div class="mk-mv3"><div><span>Antes</span><em${sz(m.before)}>${T(p+'.before','—',{raw:1})||'—'}</em></div><i>→</i><div class="now"><span>Agora</span><em${sz(m.value)}>${T(p+'.value','—',{raw:1})||'—'}</em></div><div class="goal"><span>Meta</span><em${sz(m.goal)}>${T(p+'.goal','—',{raw:1})||'—'}</em></div></div></div>`,{name:'',desc:'',before:'',value:'',goal:''},'Indicador')}</div>
     ${S(B.next_review)?`<p class="mk-muted">${T('next_review','Próxima leitura',{raw:1})}</p>`:''}`;
  }

  /* ---------- antes e depois ---------- */
  function antes(){
    const img=(p,u,ph)=>ED?`<small class="mk-lk">Imagem: ${T(p,ph,{raw:1})}</small>`:u?`<img src="${E(u)}" alt="" loading="lazy">`:'';
    return `${SEC==='antes'?'':'<p class="mk-intro">Como a marca era e como ficou.</p>'}
     <div class="mk-bas">${LIST('compare',(c,i,p)=>`<div class="mk-ba mk-it">${X(p)}<span class="mk-lb">${T(p+'.topic','Tema',{raw:1})}</span>
       <div class="mk-ba2"><div class="b"><small>Antes</small>${img(p+'.img_before',c.img_before,'link da imagem (opcional)')}<p>${T(p+'.before','Como era',{ml:1})}</p></div>
       <div class="a"><small>Depois</small>${img(p+'.img_after',c.img_after,'link da imagem (opcional)')}<p>${T(p+'.after','Como ficou',{ml:1})}</p></div></div></div>`,{topic:'',before:'',after:'',img_before:'',img_after:''},'Comparação')}</div>`;
  }

  /* section: sem nada = tudo junto (gestão); 'marca' | 'projeto' | 'antes' | 'metas' = uma página do menu do portal */
  const PROJ=[['plano','O que vamos fazer'],['fazendo','Em andamento'],['entregue','Entregue']];
  const HEAD={marca:['Sua marca','O que a sua marca é e o porquê de cada escolha.'],projeto:['Projeto','Onde estamos no Método Stond, o que estamos fazendo e o que vem a seguir.'],antes:['Antes e depois','Como a sua marca era e como ficou.']};
  function view(b,opt={}){
    B=b||{};ED=opt.edit?opt:null;SEC=opt.section||'';POSTS=A(opt.posts);loadFonts(B);
    const P=palette(B);
    const vars=`--mb:${P.base};--ma:${P.accent};--mf:${fam(B.font_title,'Montserrat,sans-serif')};--ms:${fam(B.font_accent,'Georgia,serif')}`;
    const fn={projeto,mapa,quem,fala,visual,cuida,doc,metricas,antes,plano:()=>tasks('plano'),fazendo:()=>tasks('fazendo'),entregue:()=>tasks('entregue')};
    let cur=TAB,top='',body;
    if(SEC==='marca'){cur=SUB.some(([k])=>k===TAB)?TAB:'mapa';top=tabs(SUB,cur)}
    else if(SEC==='projeto'){cur='projeto'}
    else if(SEC==='antes'||SEC==='metas'){cur=SEC==='antes'?'antes':'metricas'}
    else{cur=TABS.some(([k])=>k===TAB)||SUB.some(([k])=>k===TAB)?TAB:'mapa';top=steps()+tabs(TABS,cur,1)}
    body=fn[cur]();
    if(FOCUS)requestAnimationFrame(()=>{const el=document.querySelector(`[data-e^="${FOCUS}"]`);FOCUS=null;if(el)el.focus()});
    const h=HEAD[SEC]||(SEC?null:['Sua marca','O que a sua marca é, o que estamos fazendo nela e os resultados, num lugar só.']);
    return `<div class="mk${ED?' mk-editing':''}${SEC?' mk-s-'+SEC:''}" style='${vars}'>
      ${opt.head===false||!h?'':`<div class="top"><div><h2>${h[0]}</h2><p>${h[1]}</p></div></div>`}
      ${top}<div class="mk-body">${body}</div></div>`;
  }

  /* ---------- eventos ---------- */
  const rerender=()=>{if(typeof render==='function')render()};
  const changed=()=>{if(ED&&ED.onChange)ED.onChange(B)};
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-mk]');
    if(t){TAB=t.dataset.mk;rerender();const m=document.querySelector('.main');if(m)m.scrollTop=0;return}
    const mo=e.target.closest('[data-mk-more]');
    if(mo){const x=mo.nextElementSibling;x.hidden=!x.hidden;mo.setAttribute('aria-expanded',String(!x.hidden));mo.textContent=mo.textContent.replace(x.hidden?'↑':'↓',x.hidden?'↓':'↑');return}
    const to=e.target.closest('[data-mk-to]');
    if(to){e.preventDefault();const h=document.getElementById(to.dataset.mkTo);if(h)h.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(!ED)return;
    const del=e.target.closest('[data-del]');
    if(del){const p=del.dataset.del;
      if(p.includes(';')){const [k,i]=p.split(';');const a=chipsOf(B[k]);a.splice(+i,1);B[k]=a.join('; ')}
      else{const ks=p.split('.');const i=+ks.pop();const arr=getP(B,ks.join('.'));if(Array.isArray(arr))arr.splice(i,1)}
      changed();rerender();return}
    const add=e.target.closest('[data-add]');
    if(add){const k=add.dataset.add;if(!Array.isArray(B[k]))B[k]=[];B[k].push(JSON.parse(add.dataset.tpl));FOCUS=`${k}.${B[k].length-1}`;changed();rerender();return}
    const ch=e.target.closest('[data-chip]');
    if(ch){const k=ch.dataset.chip;const a=chipsOf(B[k]);a.push('Novo ponto');B[k]=a.join('; ');FOCUS=`${k};${a.length-1}`;changed();rerender();return}
    const sm=e.target.closest('[data-st]');
    if(sm){const t=getP(B,sm.dataset.st);if(t){t.status=sm.dataset.v;changed();rerender()}return}
    const tg=e.target.closest('[data-tg]');
    if(tg){const ks=tg.dataset.tg.split('.');const k=ks.pop();const o=getP(B,ks.join('.'));if(o){o[k]=tg.dataset.v?(o[k]===tg.dataset.v?'':tg.dataset.v):!o[k];changed();rerender()}return}
    const cy=e.target.closest('[data-cyc]');
    if(cy){const s=getP(B,cy.dataset.cyc);if(s){s.state=s.state==='done'?'now':s.state==='now'?'':'done';changed();rerender()}return}
  });
  /* negrito (**assim**) aparece formatado; ao clicar mostra o texto cru para editar */
  document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('.mk-ed[data-raw]');if(el){el.innerText=el.dataset.raw;el.removeAttribute('data-raw')}});
  document.addEventListener('focusout',e=>{
    const el=e.target.closest&&e.target.closest('[data-e]');if(!el||!ED)return;
    const v=el.tagName==='TEXTAREA'?el.value:(el.classList.contains('ml')?el.innerText:el.textContent).replace(/ /g,' ').replace(/\n+$/,'');
    const p=el.dataset.e,old=getP(B,p);if((old??'')===v)return;
    setP(B,p,el.tagName==='TEXTAREA'?v:v.trim());changed();
    if(/hex$|^font_|^colors|^sig/.test(p))rerender();
  });
  document.addEventListener('keydown',e=>{
    const el=e.target.closest&&e.target.closest('.mk-ed');if(!el)return;
    if(e.key==='Enter'&&!el.classList.contains('ml')){e.preventDefault();el.blur()}
    if(e.key==='Escape'){el.blur()}
  });
  /* anexar arquivo numa entrega (a gestão sobe o arquivo e devolve o link) */
  document.addEventListener('change',async e=>{
    const inp=e.target.closest&&e.target.closest('[data-mk-file]');if(!inp||!ED||!ED.onUpload)return;
    const t=getP(B,inp.dataset.mkFile);if(!t)return;
    for(const f of [...inp.files]){try{const url=await ED.onUpload(f);if(url){if(!Array.isArray(t.files))t.files=[];t.files.push({url,name:f.name})}}catch(x){console.error(x)}}
    changed();rerender();
  });
  addEventListener('resize',()=>{});

  window.StondMarca={view,reset(){TAB='mapa'}};
})();
