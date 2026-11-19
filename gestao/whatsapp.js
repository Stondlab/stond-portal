/* Gestão › Comercial › WhatsApp (EM BREVE)
   Tela de exemplo de como a Helo vai ver e configurar a recepcionista de WhatsApp com IA.
   Nada aqui é salvo nem ligado: dados de exemplo, só para aprovar o desenho. */
(function(){
  const g=GROUPS.find(([t])=>t==='Comercial');
  if(g&&!g[1].some(([k])=>k==='wa'))g[1].push(['wa','WhatsApp']);
  ic.wa=sv('<path d="M4.6 19.4l1-3.6A8 8 0 1 1 8.4 18.6z"/><path d="M9 8.6c.2-.4.5-.4.8-.4l.6 1.4-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 1.4.6c0 .3 0 .6-.4.8-.6.4-1.4.4-2.1.1a7 7 0 0 1-3-3c-.3-.7-.3-1.5.2-2z"/>');

  // exemplo
  const CV=[
    {id:'c1',n:'Mariana C.',o:'Instagram · VISTO',s:'gb',t:'21:09',last:'Quero! E vocês veem passagem com milha também?',msgs:[['in','Oi! Vi o vídeo do visto americano, queria saber como funciona','21:04'],['ia','Oi, Mariana! Aqui é a assistente do Gabriel. É o primeiro visto ou renovação? E é só pra você?','21:04'],['in','Primeiro visto, pra mim e pro meu marido','21:06'],['ia','Perfeito. Vocês já têm ideia de quando querem viajar?','21:06'],['in','Queria ir pra Orlando em julho. E vocês veem passagem com milha também?','21:08'],['ia','Vemos sim! Te mando a apresentação do Gabriel. A partir daqui ele mesmo continua com você.','21:08'],['doc','Apresentação Gabriel Souza Travel.pdf','21:08']],res:[['Serviço','Visto americano (1º), 2 pessoas'],['Destino','Orlando, julho'],['Interesse','Visto + passagem com milhas']]},
    {id:'c2',n:'Rafael M.',o:'Calculadora',s:'ia',t:'20:51',last:'Tenho umas 180 mil na Livelo, vale a pena?',msgs:[['in','Fiz a calculadora no site. Tenho umas 180 mil na Livelo, vale a pena?','20:50'],['ia','Vale muito, Rafael! Antes de te dizer quanto rende: você pensa em viajar pra onde e quando?','20:51']],res:[['Milhas','180 mil Livelo']]},
    {id:'c3',n:'Paula e Léo',o:'Site',s:'wait',t:'ontem',last:'Vou ver com o Léo e te falo',msgs:[['in','Oi, queremos fazer a lua de mel em maio','ontem'],['ia','Que delícia! Já têm destino em mente?','ontem'],['in','Itália ou Grécia','ontem'],['ia','As duas cabem bem em milhas. Querem que o Gabriel monte as duas opções?','ontem'],['in','Vou ver com o Léo e te falo','ontem']],res:[['Destino','Itália ou Grécia, maio'],['Lembrete','sai amanhã às 10h']]},
    {id:'c4',n:'Bruna S.',o:'Indicação',s:'ok',t:'seg',last:'Fechado, pode começar!',msgs:[['in','A Cláudia me indicou, queria a gestão de milhas','seg'],['gb','Oi Bruna! Te mandei a proposta aqui','seg'],['in','Fechado, pode começar!','seg']],res:[['Resultado','Fechou gestão de milhas']]}
  ];
  const ST={ia:['IA atendendo','wa-ia'],gb:['Com o Gabriel','wa-gb'],wait:['Esperando resposta','wa-wait'],ok:['Virou venda','wa-ok']};
  const TABS=[['conv','Conversas'],['rot','Roteiro da IA'],['mat','Materiais'],['lem','Lembretes'],['cus','Custos']];
  let tab='conv',open='c1';const took={};
  const oc=o=>/Instagram/.test(o)?'ig':/Calculadora/.test(o)?'calc':/Site/.test(o)?'site':'ind';

  const conv=()=>{const c=CV.find(x=>x.id===open)||CV[0];const st=took[c.id]?'gb':c.s;
    return `<div class="wa-cv"><div class="wa-list">${CV.map(x=>{const s=took[x.id]?'gb':x.s;return `<button class="wa-li${x.id===c.id?' on':''}" data-wa-open="${x.id}"><span class="wa-av">${esc(x.n[0])}</span><span class="wa-lt"><b>${esc(x.n)}</b><small>${esc(x.last)}</small><span class="wa-tags"><span class="wa-o ${oc(x.o)}">${esc(x.o)}</span><span class="wa-st ${ST[s][1]}">${ST[s][0]}</span></span></span><small class="wa-tm">${esc(x.t)}</small></button>`}).join('')}</div>
    <div class="wa-chat"><header><div><b>${esc(c.n)}</b><small>${esc(c.o)} · <span class="wa-st ${ST[st][1]}">${ST[st][0]}</span></small></div>
      <span style="display:flex;gap:8px;flex-wrap:wrap">${st==='ia'||st==='wait'?`<button class="btn sm red" data-wa-take="${c.id}">Assumir conversa</button>`:st==='gb'?`<button class="btn sm ghost" data-wa-give="${c.id}">Devolver pra IA</button>`:''}<button class="btn sm ghost" data-go="com">Ver no funil</button></span></header>
      <div class="wa-msgs">${c.msgs.map(([k,t,h])=>k==='doc'?`<div class="wa-m out"><span class="wa-who ia">Assistente (IA)</span><span class="wa-doc"><i>PDF</i>${esc(t)}</span><small>${h}</small></div>`:`<div class="wa-m ${k==='in'?'in':'out'}">${k!=='in'?`<span class="wa-who ${k}">${k==='ia'?'Assistente (IA)':'Gabriel'}</span>`:''}${esc(t)}<small>${h}</small></div>`).join('')}</div>
      <div class="wa-res"><span class="lb">O que a IA anotou</span>${c.res.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div></div></div>`};

  const rot=()=>`<div class="wa-g2">
    <div class="bx wa-f"><span class="lb">Primeira mensagem</span><textarea rows="3" data-wa-ex>Oi! Aqui é a assistente do Gabriel. Te ajudo com milhas, passagens e visto. Me conta: o que você está planejando?</textarea>
      <span class="lb">Tom</span><div class="wa-ch"><button class="on" data-wa-ex>Próximo e leve</button><button data-wa-ex>Mais formal</button></div>
      <span class="lb">Horário</span><div class="wa-ch"><button class="on" data-wa-ex>24 horas</button><button data-wa-ex>Só das 8h às 20h</button></div></div>
    <div class="bx wa-f"><span class="lb">Perguntas que ela faz, nessa ordem</span><ol class="wa-q"><li>O que você está planejando? (visto, passagem, gestão de milhas)</li><li>Pra quantas pessoas?</li><li>Pra onde e quando?</li><li>Já tem milhas? Em qual programa, mais ou menos quantas?</li></ol><button class="btn sm ghost" data-wa-ex>+ Pergunta</button></div>
    <div class="bx wa-f"><span class="lb">Passa pro Gabriel quando</span>${['A pessoa pede valor ou proposta','Pede pra falar com uma pessoa','Parece irritada ou confusa','Pergunta algo que não está nos materiais'].map(t=>`<label class="wa-ck"><input type="checkbox" checked data-wa-ex> ${t}</label>`).join('')}
      <small class="mut">Ao passar, ela manda a apresentação, avisa o Gabriel com o resumo e para de responder.</small></div>
    <div class="bx wa-f"><span class="lb">Ela nunca fala sobre</span><div class="wa-ch">${['Preço e desconto','Garantia de aprovação do visto','Dados de cartão','Política e religião'].map(t=>`<span class="wa-no">${t}</span>`).join('')}<button data-wa-ex>+ Assunto</button></div></div></div>`;

  const mat=()=>`<div class="wa-g2">
    <div class="bx wa-f"><span class="lb">Apresentação enviada antes de passar pro Gabriel</span><div class="wa-pdf"><i>PDF</i><div><b>Apresentação Gabriel Souza Travel.pdf</b><small class="mut">8 páginas · falta montar</small></div><button class="btn sm ghost" data-wa-ex>Trocar arquivo</button></div></div>
    <div class="bx wa-f"><span class="lb">Respostas prontas</span>${[['Quanto tempo demora o visto?','Depende da fila do consulado. Hoje a entrevista em SP está saindo em uns 4 meses, por isso vale começar cedo.'],['Vocês emitem com as minhas milhas?','Sim! O Gabriel emite usando as suas milhas, e você só paga a taxa da companhia e o serviço.'],['Como funciona a gestão de milhas?','O Gabriel cuida dos seus pontos o ano todo: onde juntar, quando transferir e quando emitir, pra não perder nada.']].map(([q,a])=>`<details class="wa-faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}<button class="btn sm ghost" data-wa-ex>+ Resposta</button></div></div>`;

  const lem=()=>`<div class="bx wa-f"><span class="lb">Quando a pessoa some</span>${[['2 dias sem responder','Oi! Conseguiu ver as opções que o Gabriel mandou? Se quiser, ele segura a data pra vocês.',true],['5 dias sem responder','Passando só pra saber se ainda faz sentido. Se mudar de ideia, é só chamar aqui.',true],['Depois disso','O cartão vai pra Perdido com o motivo "sumiu".',false]].map(([q,t,pay])=>`<div class="wa-rule"><b>${q}</b><p>${t}</p>${pay?'<span class="wa-cost">~R$ 0,35 cada</span>':'<span class="wa-cost free">sem mensagem</span>'}</div>`).join('')}
    <small class="mut">Lembrete é mensagem que a gente inicia, por isso a Meta cobra. Responder quem chamou é grátis.</small></div>`;

  const cus=()=>`<div class="os-sum wa-sum">${[['38','conversas no mês'],['31','só respostas, grátis'],['14','lembretes enviados'],['R$ 4,90','Meta'],['R$ 3,80','IA']].map(([v,l])=>`<div><b>${v}</b><small>${l}</small></div>`).join('')}</div>
    <div class="bx wa-f" style="margin-top:12px"><span class="lb">Total do mês</span><b class="wa-tot">R$ 8,70</b><small class="mut">Cobrado no cartão do app da Meta (em dólar) e na conta da IA. Sem mensalidade.</small></div>`;

  V.wa=()=>{
    const body={conv,rot,mat,lem,cus}[tab]();
    return shell(topb('WhatsApp <em>com IA</em>','Gabriel Souza · recepcionista do WhatsApp','<span class="wa-soon-tag">Em breve · tela de exemplo</span>')+`
      <div class="wa-tabs">${TABS.map(([k,l])=>`<button class="${k===tab?'on':''}" data-wa-tab="${k}">${l}</button>`).join('')}</div>${body}`)};

  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-wa-tab],[data-wa-open],[data-wa-take],[data-wa-give],button[data-wa-ex]');if(!t||S!=='wa')return;
    if(t.dataset.waTab){tab=t.dataset.waTab;render()}
    else if(t.dataset.waOpen){open=t.dataset.waOpen;render()}
    else if(t.dataset.waTake){took[t.dataset.waTake]=1;render()}
    else if(t.dataset.waGive){delete took[t.dataset.waGive];const c=CV.find(x=>x.id===t.dataset.waGive);if(c&&c.s==='gb')c.s='ia';render()}
    else if(typeof toast==='function')toast('Tela de exemplo: ainda não salva.');
  });
  if(window.D&&document.querySelector('.app')&&S==='wa')render();
})();
