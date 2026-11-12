/* Gestão · Marca dos clientes: editor do manual que aparece em "Sua marca" no portal.
   Guarda em agency_docs (collection 'marca', id = cliente). Só aparece para o cliente com "Mostrar no portal" ligado.
   "Prévia" usa o mesmo desenho do portal (/marca.js), com o que está salvo, mesmo antes de liberar. */
(function(){
  ic.marca=sv('<circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M6.5 7.2l3.4 3M17.5 7.2l-3.4 3M6.5 16.8l3.4-3M17.5 16.8l-3.4-3"/>');
  const g=GROUPS.find(([t])=>t==='Clientes');if(g&&!g[1].some(([k])=>k==='marca'))g[1].splice(1,0,['marca','Marca']);

  /* [chave, rótulo, tipo, dica]  tipos: txt, area, lines (uma por linha), cols:a,b (colunas separadas por |), chk */
  const F=[
   ['Geral',[
    ['shared','Mostrar no portal do cliente','chk'],
    ['phrase','Frase central (meio do mapa)','txt','Ex.: Você só arruma a mala.'],
    ['summary','Resumo em uma frase','area'],
    ['concept_tag','Etiqueta do conceito','txt','Ex.: Assinado por Gabriel'],
    ['steps','Etapas do método','cols:name,note,state','Uma por linha: Nome | situação | done, now ou vazio'],
    ['map1','Mapa · Quem somos','txt','Pontos-chave separados por ;'],
    ['map2','Mapa · Como falamos','txt','Pontos-chave separados por ;'],
    ['map3','Mapa · Como aparecemos','txt','Pontos-chave separados por ;'],
    ['map4','Mapa · Como cuidamos','txt','Pontos-chave separados por ;'],
    ['pending','O que falta o cliente fazer','area','Aparece em destaque no documento completo']]],
   ['Quem somos',[
    ['purpose','Propósito','area'],['purpose_why','Por que esse propósito','area'],
    ['positioning','Posicionamento','area'],['positioning_why','Por que esse posicionamento','area'],
    ['belief','No que acreditamos','area'],['enemy','O que combatemos','area'],
    ['values','Valores','cols:name,desc','Nome | comportamento que prova'],
    ['personas','Personas','cols:name,quote,desc,product','Nome | frase dela | descrição | produto'],
    ['personas_note','Observação das personas','txt','Ex.: hipóteses a confirmar nas conversas'],
    ['out_tribe','Quem fica de fora','area']]],
   ['Como falamos',[
    ['archetype','Personalidade','txt','Ex.: Cuidador, com o lado Sábio'],['archetype_desc','Explicação curta','area'],
    ['shadow','Lado a evitar','area'],['words3','Três palavras','txt','Separadas por vírgula'],
    ['is_not','É / não é','cols:a,b','É | Não é'],
    ['tone','Tom por situação','cols:sit,yes,no','Situação | assim | assim não'],
    ['use','Palavras que usamos','lines'],['avoid','Palavras que evitamos','lines'],['avoid_why','Por que evitamos','area'],
    ['messages','Mensagens-chave','lines'],['tagline','Tagline','txt'],
    ['pillars','Pilares de conteúdo','cols:name,desc,tag','Nome | o que entra | peso e função']]],
   ['Como aparecemos',[
    ['colors','Cores','cols:name,hex,role,pct','Nome | #HEX | papel | %. A 1ª é a base; o acento é a que tiver "valor" ou "destaque" no papel'],
    ['colors_why','Por que essas cores','area'],
    ['font_title','Fonte dos títulos','txt','Nome no Google Fonts'],['font_accent','Fonte de destaque','txt'],['font_body','Fonte dos textos','txt'],
    ['font_note','Como usar as fontes','area'],
    ['type_sample','Exemplo de título','txt'],['type_word','Palavra em destaque no exemplo','txt'],['type_text','Exemplo de texto','txt'],
    ['proof_title','Título da prova','txt','Ex.: O comprovante · formato principal de prova'],
    ['proof','Prova principal','cols:label,value,text,before,after,from,to,note','Uma linha: etiqueta | valor | frase | ia pagar | pagou | de | para | observação'],
    ['sig1','Assinatura · 1ª parte (fonte de destaque)','txt'],['sig2','Assinatura · 2ª parte','txt'],['sig_line','Assinatura · linha de baixo','txt'],
    ['logo_note','Observação do logo','area'],
    ['photo_use','Fotos: usar','lines'],['photo_avoid','Fotos: evitar','lines']]],
   ['Como cuidamos',[
    ['journey','Jornada','cols:name,desc','Etapa | o que a marca entrega'],
    ['checklist','Antes de postar','lines'],['rules','Regras do setor','lines'],
    ['metrics','Como vamos medir','cols:name,desc,value','Indicador | explicação | valor ou frequência'],
    ['next_review','Próxima leitura','txt']]],
   ['Documento completo',[
    ['version','Versão','txt','Ex.: Versão 1 · 12/11/2026 · Elaborado por: Stond Branding & Growth'],
    ['doc','Texto do manual','area','## título · ### subtítulo · > caixa de "por quê" · - item · **negrito**'],
    ['pdf_url','Link do PDF','txt'],['guide_url','Link do guia de bolso','txt']]]
  ];
  const ALL=F.flatMap(([,f])=>f);
  const toText=(v,t)=>{if(t==='chk')return v;if(t==='lines')return (v||[]).join('\n');
    if(t.startsWith('cols:')){const k=t.slice(5).split(',');const rows=Array.isArray(v)?v:(v&&typeof v==='object'?[v]:[]);return rows.map(r=>k.map(x=>r[x]??'').join(' | ').replace(/( \| )+$/,'')).join('\n')}
    return v??''};
  const fromText=(s,t,key)=>{if(t==='lines')return String(s).split('\n').map(x=>x.trim()).filter(Boolean);
    if(t.startsWith('cols:')){const k=t.slice(5).split(',');const rows=String(s).split('\n').map(x=>x.trim()).filter(Boolean).map(l=>{const p=l.split('|').map(x=>x.trim());return Object.fromEntries(k.map((x,i)=>[x,p[i]||'']))});return key==='proof'?(rows[0]||{}):rows}
    return String(s).trim()};

  V.marca=()=>{
    const ids=CL().map(c=>c.id),c=fv('mc',ids[0]),cur=doc1('marca',c),cl=CL().find(x=>x.id===c)||{};
    const fld=([k,l,t,h])=>t==='chk'?`<label class="mk-chk"><input type="checkbox" name="${k}" ${cur[k]?'checked':''}> ${esc(l)}</label>`
      :`<div class="fld ${t==='txt'?'':'full'}"><label for="mk_${k}">${esc(l)}</label>${t==='txt'?`<input id="mk_${k}" name="${k}" value="${esc(toText(cur[k],t))}">`:`<textarea id="mk_${k}" name="${k}" rows="${k==='doc'?18:t==='area'?3:5}">${esc(toText(cur[k],t))}</textarea>`}${h?`<small class="mk-h">${esc(h)}</small>`:''}</div>`;
    const prev=fv('mkp','')==='1'&&window.StondMarca;
    const pb=`<button class="btn sm ghost" data-f="mkp" data-v="${prev?'':'1'}">${prev?'Voltar a editar':'Prévia'}</button>`;
    const ver=cl.access_token&&cur.shared?`<a class="btn sm ghost" href="https://portal.stond.com.br/?c=${esc(cl.access_token)}&ver=1#marca" target="_blank" rel="noopener">Ver como cliente</a>`:'';
    return shell(topb('Marca dos clientes','O manual que o cliente vê em "Sua marca" no portal',pb+ver)+`
     <div class="filters">${segF('mc',CL().map(k=>[k.id,k.name]))}</div>
     ${cur.shared?'<div class="spc ok"><b>Visível no portal</b><span>O cliente já vê esta marca em "Sua marca".</span></div>':'<div class="spc warn"><b>Ainda não aparece para o cliente</b><span>Ligue "Mostrar no portal do cliente" e salve quando estiver pronto.</span></div>'}
     ${prev?`<div class="mk-prev">${cur.updated?StondMarca.view(cur):'<p class="mk-h">Salve a marca para ver a prévia.</p>'}</div>`:`<form class="fm mkf" id="mkf" data-client="${esc(c)}">${F.map(([t,f])=>`<details class="mk-sec" ${t==='Geral'?'open':''}><summary>${esc(t)}</summary><div class="fg">${f.map(fld).join('')}</div></details>`).join('')}
      <div class="fa"><span class="mk-h">${cur.updated?'Salvo em '+new Date(cur.updated).toLocaleString('pt-BR'):''}</span><span style="flex:1"></span><button class="btn sm red" id="mksave">Salvar marca</button></div></form>`}`);
  };

  document.addEventListener('submit',async e=>{
    if(e.target.id!=='mkf')return;e.preventDefault();
    const f=e.target,c=f.dataset.client,b=$('#mksave');b.disabled=true;b.textContent='Salvando…';
    const data={...doc1('marca',c),client:c,updated:new Date().toISOString()};
    for(const [k,,t] of ALL){const el=f.elements[k];if(!el)continue;data[k]=t==='chk'?el.checked:fromText(el.value,t,k)}
    try{await saveDoc('marca',c,data);toast(data.shared?'Salvo e visível no portal':'Salvo');render()}catch(x){toast(x.message);b.disabled=false;b.textContent='Salvar marca'}
  });
})();
