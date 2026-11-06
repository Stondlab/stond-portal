/* Portal do cliente Stond: login por e-mail (Supabase Auth) ou link antigo com código (?c=) */
const SB='https://mkhewgatxdkjowvhqppb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1raGV3Z2F0eGRram93dmhxcHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTkxNDMsImV4cCI6MjEwOTQ3NTE0M30.0uGUnW5dqt3d3P7Cad0UYtT6k3fp69rxoMLJgMazbsg';
const MEDIA=SB+'/storage/v1/object/public/media/';
const LOGO='assets/logo-branco.png', SIMB='assets/simbolo-branco.png';

/* ---------- utilidades ---------- */
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const WD=['dom','seg','ter','qua','qui','sex','sáb'], WDL=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const TY={reels:'Reels',carrossel:'Carrossel',story:'Stories',post:'Post',foto:'Post'};
const ty=t=>TY[t]||(t?t[0].toUpperCase()+t.slice(1):'Post');
const pd=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y,m-1,d)};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtD=s=>{const d=pd(s);return `${WD[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()].slice(0,3)}`};
const nf=n=>n==null?'—':Number(n).toLocaleString('pt-BR');
const kf=n=>n==null?'—':n>=1000?(n/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':nf(n);
const mediaUrl=u=>!u?'':/^https?:/.test(u)?u:MEDIA+(D&&D.client?D.client.id+'/':'')+u;
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3200)}

/* ---------- tema ---------- */
function applyTheme(){document.documentElement.classList.toggle('light',ls.get('stond-tema')!=='dark')}
applyTheme();
function tt(){const l=document.documentElement.classList.contains('light');
  return `<button class="tt" data-theme-toggle aria-label="${l?'Usar versão escura':'Usar versão clara'}"><span class="${l?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></span><span class="${l?'':'on'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></span></button>`}

/* ---------- Supabase ---------- */
const keepStore={getItem:k=>ls.get('stond-keep')==='0'?ss.get(k):ls.get(k),setItem:(k,v)=>ls.get('stond-keep')==='0'?ss.set(k,v):ls.set(k,v),removeItem:k=>{ls.set(k,null);ss.set(k,null)}};
const sb=window.supabase.createClient(SB,KEY,{auth:{storage:keepStore,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

const q=new URLSearchParams(location.search);
const TOKEN=q.get('c');                       // link antigo, sem login
const CONVITE=q.get('convite');
const PREVIEW=q.get('ver')==='1';             // a Stond vendo como o cliente               // convite para criar conta
if(CONVITE)ls.set('stond-convite',CONVITE);

let NOTA=false, NOTASEL=null, D=null, MODE=null, S='inicio', OPEN=null, slide=0, FILTER='pend', CALM=null, RAF=0, RECOVERY=false;

async function rpc(fn,args){const {data,error}=await sb.rpc(fn,args||{});if(error)throw new Error(error.message);return data}

async function boot(){
  if(TOKEN){MODE='token';try{D=await rpc('portal_get',{p_token:TOKEN})}catch(e){D=null}
    if(!D)return screenMsg('Link inválido','Este link não funciona mais. Peça um novo para a Stond.');return start()}
  const {data:{session}}=await sb.auth.getSession();
  if(location.hash.includes('type=recovery'))RECOVERY=true;
  if(RECOVERY&&session)return login('nova');
  if(!session)return login(CONVITE?'criar':'entrar');
  await loadMe();
}
async function loadMe(){
  MODE='login';
  try{
    D=await rpc('portal_me');
    const conv=ls.get('stond-convite');
    if(!D&&conv){D=await rpc('portal_claim',{p_token:conv});}
    if(D)ls.set('stond-convite',null);
  }catch(e){return screenMsg('Não foi possível entrar',e.message,true)}
  if(!D){try{if(await rpc('team_me')){location.href='https://gestao.stond.com.br/gestao/';return}}catch(_){}}
  if(!D)return screenMsg('Sua conta ainda não está ligada a um cliente','Abra o convite que a Stond mandou para você. Se já abriu, fale com a gente.',true);
  if(CONVITE||location.hash)history.replaceState(null,'',location.pathname);
  start();
}
sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){RECOVERY=true;login('nova')}});

/* ---------- login ---------- */
function screenMsg(t,m,canOut){cancelAnimationFrame(RAF);
  document.getElementById('app').innerHTML=`<div class="login one"><div class="form"><img class="lg" src="${LOGO}" alt="Stond"><h2>${esc(t)}</h2><p class="sub">${esc(m)}</p>${canOut?'<button class="btn" id="sair">Sair</button>':''}</div></div>`;
  const b=$('#sair');if(b)b.onclick=async()=>{await sb.auth.signOut();login('entrar')};}

const ic={
 mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>',
 eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 inicio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
 aprov:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
 cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
 met:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/></svg>',
 ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".8" fill="currentColor"/></svg>',
 arq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7.5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>',
 link:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
};
const fld=(id,label,type,icon,extra='')=>`<div class="fld in"><label for="${id}">${label}</label><div class="gin">${ic[icon]}<input id="${id}" type="${type}" ${extra}>${type==='password'?`<button type="button" class="eye" data-eye="${id}" aria-label="Mostrar senha">${ic.eye}</button>`:''}</div></div>`;

function login(kind){
  cancelAnimationFrame(RAF);
  const keep=ls.get('stond-keep')!=='0';
  const F={
   entrar:{h:'Bem-vindo de volta',p:'Entre na área do cliente para ver e aprovar seus conteúdos.',body:fld('em','E-mail','email','mail','autocomplete="email" required')+fld('pw','Senha','password','lock','autocomplete="current-password" required')+
     `<div class="lrow in"><label for="kc"><input id="kc" type="checkbox" ${keep?'checked':''}>Manter conectado</label><button class="lnk" type="button" data-to="esqueci">Esqueci a senha</button></div>`,btn:'Entrar',
     foot:`<p class="first in">Primeiro acesso? <button type="button" data-to="criar">Criar minha senha</button></p>`},
   criar:{h:'Criar seu acesso',p:'Use o e-mail em que você quer receber os avisos da Stond.',body:fld('nm','Seu nome','text','user','autocomplete="name" required')+fld('em','E-mail','email','mail','autocomplete="email" required')+fld('pw','Crie uma senha','password','lock','autocomplete="new-password" minlength="8" required')+
     `<p class="sub in" style="margin:0;font-size:12.5px">${ls.get('stond-convite')?'Seu convite já está aqui. Depois de criar a senha, você entra direto no seu painel.':'Para criar o acesso, abra o link de convite que a Stond mandou para você.'}</p>`,btn:'Criar acesso',
     foot:`<p class="first in">Já tem senha? <button type="button" data-to="entrar">Entrar</button></p>`},
   esqueci:{h:'Esqueceu a senha?',p:'Mandamos um link para o seu e-mail para você criar uma nova.',body:fld('em','E-mail','email','mail','autocomplete="email" required'),btn:'Enviar link',
     foot:`<p class="first in"><button type="button" data-to="entrar">Voltar para entrar</button></p>`},
   nova:{h:'Nova senha',p:'Escolha a nova senha da sua conta.',body:fld('pw','Nova senha','password','lock','autocomplete="new-password" minlength="8" required'),btn:'Salvar e entrar',foot:''}
  }[kind];
  document.getElementById('app').innerHTML=`<div class="login">
   <form class="form" id="lf" novalidate>
    <a class="lgl in" href="https://stond.com.br" aria-label="Ir para o site da Stond"><img class="lg" src="${LOGO}" alt="Stond"></a>
    <h2 class="in">${F.h}</h2><p class="sub in">${F.p}</p>
    ${F.body}
    <p class="err" id="lerr" role="alert" hidden></p>
    <button class="btn red full in" type="submit" id="lbtn">${F.btn}</button>
    ${kind==='entrar'||kind==='criar'?`<div class="or in">ou</div><button class="btn goog full in" type="button" data-google><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>Continuar com Google</button>`:''}
    ${F.foot}
   </form>
   <div class="stage"><canvas id="ldots" aria-hidden="true"></canvas><span class="tag">Da decisão ao crescimento</span>
    <div class="gl a" style="animation-delay:2.6s"><span class="ck">✓</span><div><b>Aprove seus posts</b><small>Veja a arte e a legenda antes de publicar</small></div></div>
    <div class="gl b" style="animation-delay:2.8s"><div><b>Seu calendário</b><small>Tudo o que vai ao ar no mês</small></div></div>
    <div class="gl c" style="animation-delay:3s"><div><b>Suas métricas</b><small>Como o seu perfil está crescendo</small></div></div>
    <p class="big">Toda marca <em>tem um DNA</em></p></div></div>`;
  document.querySelectorAll('.in').forEach((e,i)=>e.style.animationDelay=(i*.06)+'s');
  dots();
  const f=$('#lf'),err=$('#lerr'),btn=$('#lbtn');
  f.addEventListener('click',async e=>{if(e.target.closest('[data-google]')){err.hidden=true;const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)fail(/not enabled|provider/i.test(error.message)?'O acesso com Google ainda não está ligado. Use e-mail e senha.':error.message);return}const t=e.target.closest('[data-to]');if(t)login(t.dataset.to);const y=e.target.closest('[data-eye]');if(y){const i=document.getElementById(y.dataset.eye);i.type=i.type==='password'?'text':'password'}});
  const fail=m=>{err.textContent=m;err.hidden=false;btn.disabled=false;btn.textContent=F.btn};
  f.onsubmit=async e=>{e.preventDefault();err.hidden=true;
    const em=$('#em')?.value.trim(),pw=$('#pw')?.value,nm=$('#nm')?.value.trim();
    if($('#em')&&!/^\S+@\S+\.\S+$/.test(em))return fail('Confira o e-mail.');
    if($('#pw')&&(pw||'').length<(kind==='entrar'?1:8))return fail(kind==='entrar'?'Digite a senha.':'A senha precisa ter pelo menos 8 caracteres.');
    if(kind==='criar'&&!nm)return fail('Escreva seu nome.');
    btn.disabled=true;btn.textContent='Aguarde…';
    try{
      if(kind==='entrar'){ls.set('stond-keep',$('#kc').checked?'1':'0');
        const {error}=await sb.auth.signInWithPassword({email:em,password:pw});
        if(error)return fail(/invalid/i.test(error.message)?'E-mail ou senha incorretos.':/confirm/i.test(error.message)?'Confirme seu e-mail pelo link que enviamos antes de entrar.':error.message);
        return loadMe();}
      if(kind==='criar'){
        const {data,error}=await sb.auth.signUp({email:em,password:pw,options:{data:{name:nm},emailRedirectTo:location.origin+location.pathname}});
        if(error)return fail(/registered/i.test(error.message)?'Este e-mail já tem acesso. Use Entrar.':error.message);
        if(data.session)return loadMe();
        return screenMsg('Confirme seu e-mail',`Enviamos um link para ${em}. Abra o e-mail e toque no link para entrar no seu painel.`);}
      if(kind==='esqueci'){
        const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});
        if(error)return fail(error.message);
        return screenMsg('Link enviado',`Se ${em} tiver acesso, você vai receber um e-mail para criar a nova senha.`);}
      if(kind==='nova'){
        const {error}=await sb.auth.updateUser({password:pw});if(error)return fail(error.message);
        RECOVERY=false;history.replaceState(null,'',location.pathname);return loadMe();}
    }catch(x){fail('Sem conexão. Tente de novo.')}
  };
}

/* S de pontos que se forma sozinho */
function dots(){
  cancelAnimationFrame(RAF);const c=document.getElementById('ldots');if(!c)return;
  const x=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),red=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let P=[];const t0=performance.now();const img=new Image();img.src=SIMB;
  function build(){const H=160,W=Math.round(H*468/607),o=document.createElement('canvas');o.width=W;o.height=H;const ox=o.getContext('2d');ox.drawImage(img,0,0,W,H);
    const d=ox.getImageData(0,0,W,H).data,pts=[];for(let y=0;y<H;y+=3)for(let i=0;i<W;i+=3)if(d[(y*W+i)*4+3]>128)pts.push([i/W-.5,(y/H-.5)*H/W]);
    P=pts.map(p=>{const a=Math.random()*6.283,r=.6+Math.random()*.9;return{tx:p[0],ty:p[1],sx:Math.cos(a)*r*1.6,sy:Math.sin(a)*r,z:Math.random(),ph:Math.random()*6.3}});}
  const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
  function draw(t){if(!document.body.contains(c))return;const w=c.clientWidth,h=c.clientHeight;
    if(c.width!==Math.round(w*dpr)){c.width=w*dpr;c.height=h*dpr}x.setTransform(dpr,0,0,dpr,0,0);
    const k=red?1:ease(Math.min(1,Math.max(0,(t-t0-250)/2600))),S=Math.min(w*.62,h*.6)*468/607;
    x.clearRect(0,0,w,h);
    for(const q of P){const wob=(1-k)*.02+.004,sc=1+(1-k)*.4;
      const px=w/2+((q.sx+(q.tx-q.sx)*k)+Math.sin(t/900+q.ph)*wob)*S*sc,py=h/2-h*.03+((q.sy+(q.ty-q.sy)*k)+Math.cos(t/1100+q.ph)*wob)*S*sc;
      const a=.35+.65*k*(.6+.4*q.z),rr=Math.max(.8,(1.1+q.z*1.4)*(S/420));
      x.fillStyle=`rgba(${230+25*q.z|0},${20+40*q.z*k|0},${40+20*q.z|0},${a.toFixed(2)})`;x.beginPath();x.arc(px,py,rr,0,6.283);x.fill();}
    if(!red)RAF=requestAnimationFrame(draw);}
  const st=()=>{build();draw(performance.now())};img.complete&&img.naturalWidth?st():img.onload=st;
}

/* ---------- app ---------- */
const posts=()=>D.posts||[];
const pend=()=>posts().filter(p=>p.status==='pendente');
const okP=()=>posts().filter(p=>p.status==='aprovado');
const adj=()=>posts().filter(p=>p.status==='reprovado');
const cover=p=>{const m=(p.media||[])[0];if(!m)return '';return m.kind==='video'?(m.poster?mediaUrl(m.poster):''):mediaUrl(m.url)};
const thumb=(p,cls='')=>{const m=(p.media||[])[0];if(!m)return `<span class="noimg ${cls}">${ty(p.type)}</span>`;
  return m.kind==='video'&&!m.poster?`<video class="${cls}" src="${mediaUrl(m.url)}#t=1.5" muted playsinline preload="metadata"></video>`:`<img class="${cls}" src="${cover(p)}" alt="" loading="lazy">`};
const chip=p=>p.status==='pendente'?'<span class="chip pend">Aprovar</span>':p.status==='aprovado'?'<span class="chip ok">Aprovado</span>':p.status==='reprovado'?'<span class="chip">Ajuste pedido</span>':'';
const first=()=>((D.client&&D.client.name)||'').split(' ')[0];
const photo=()=>D.profile&&D.profile.photo?mediaUrl(D.profile.photo):'';

/* ---------- assistente do portal (roda só no app, nada sai daqui) ---------- */
function iaLocal(q){
  const t=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const has=(...w)=>w.some(x=>t.includes(x));
  const line=p=>`- ${fmtD(p.date)}: ${ty(p.type)}${p.title?' "'+p.title+'"':''}`;
  const today=iso(new Date());
  if(has('contrato','pagamento','pagar','valor','boleto','nota fiscal','preco','escopo','cancel'))
    return 'Esse assunto é direto com a Stond. Escreva para contato@stond.com.br que a gente responde rapidinho.';
  if(has('ajuste','alterar','mudar','corrigir','trocar','editar')){
    const a=adj();
    return 'Para pedir um ajuste, abra o post em **Aprovações** e toque em **Pedir ajuste**. Diga o que mudar e onde, por exemplo: "Na 2ª imagem, troque o título por ..."'+(a.length?`\n\nVocê já pediu ajuste em ${a.length} ${a.length>1?'posts':'post'}:\n`+a.map(line).join('\n'):'');
  }
  if(has('aprov','pendente','falta','revisar','olhar')){
    const p=pend().slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(!p.length)return `Está tudo em dia! Nada esperando a sua aprovação. Você já aprovou ${okP().length} ${okP().length===1?'post':'posts'}.`;
    return `${p.length>1?"Faltam":"Falta"} **${p.length}** ${p.length>1?'posts':'post'} para você aprovar:\n`+p.slice(0,12).map(line).join('\n')+(p.length>12?`\n- e mais ${p.length-12}`:'')+'\n\nÉ só abrir **Aprovações** e tocar em cada um.';
  }
  if(has('semana','hoje','amanha','ar ','calendario','agenda','proxim','quando','publica')){
    const end=new Date();end.setDate(end.getDate()+7);
    const p=posts().filter(x=>x.date&&x.date.slice(0,10)>=today&&x.date.slice(0,10)<=iso(end)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(!p.length)return 'Não tem nada marcado para os próximos 7 dias. O mês completo está em **Calendário**.';
    return `Nos próximos 7 dias ${p.length>1?'vão':'vai'} ao ar:\n`+p.map(x=>line(x)+(x.status==='pendente'?' (ainda falta aprovar)':'')).join('\n');
  }
  if(has('metric','seguidor','alcance','visualiza','instagram','numero','cresc','resultado','mes','engaj')){
    const M=D.metrics||[],L=M[M.length-1],F=M[0];
    if(!L)return 'Os números do seu Instagram ainda não foram lançados. Assim que a Stond fechar o mês, eles aparecem em **Métricas**.';
    const out=[];
    if(L.followers!=null)out.push(`Você tem **${nf(L.followers)} seguidores**`+(F&&F!==L&&F.followers!=null?`, ${L.followers-F.followers>=0?'+':''}${nf(L.followers-F.followers)} desde ${fmtD(F.date)}.`:'.'));
    if(L.reach!=null)out.push(`No mês, ${kf(L.reach)} contas viram o seu conteúdo (alcance).`);
    if(L.views!=null)out.push(`Foram ${kf(L.views)} visualizações.`);
    out.push('Alcance é quantas pessoas diferentes viram. Visualizações contam todas as vezes, inclusive repetidas. O detalhe completo está em **Métricas**.');
    return out.join('\n\n');
  }
  if(has('arquivo','link','enviar','mandar foto','upload','drive'))
    return 'Em **Arquivos e links** você encontra os links da Stond e pode enviar fotos, vídeos e documentos para a gente. É só arrastar ou tocar em enviar.';
  if(/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(t))
    return `Oi, ${first()||'tudo bem'}! Me pergunte o que falta aprovar, o que vai ao ar esta semana ou como está o seu Instagram.`;
  return 'Ainda não sei responder isso. Eu ajudo com:\n- o que falta aprovar\n- o que vai ao ar esta semana\n- como está o seu Instagram\n- como pedir um ajuste\n\nPara outras dúvidas, fale com a Stond em contato@stond.com.br.';
}
function notaCard(){
  if(!NOTA||PREVIEW)return '';
  if(NOTA==='ok')return `<div class="nota"><b>Obrigado pela nota!</b><span>Ela ajuda a Stond a melhorar todo mês.</span></div>`;
  return `<div class="nota"><b>De 0 a 10, quanto você indicaria a Stond para um amigo?</b><span>Uma pergunta por mês, leva 5 segundos.</span>
   <div class="nsc">${Array.from({length:11},(_,i)=>`<button data-nota="${i}" class="${NOTASEL===i?'on':''}">${i}</button>`).join('')}</div>
   ${NOTASEL!=null?`<textarea id="notat" rows="2" placeholder="Quer contar o porquê? (opcional)"></textarea><button class="btn red" data-nota-ok>Enviar nota</button>`:''}</div>`;
}
function start(){CALM=null;if(!PREVIEW)rpc('portal_nota_feita',{p_token:TOKEN||null}).then(v=>{if(v===false){NOTA=true;if(S==='inicio')render()}}).catch(()=>{});const h=location.hash.slice(1);S=['inicio','aprov','cal','met','ig','arq'].includes(h)?h:'inicio';render();
  if(window.StondIA)StondIA.mount({sb,mode:'cliente',local:iaLocal,fab:false,title:'Assistente Stond',sub:'Responde com os dados do seu portal',hello:'Oi, '+(first()||'tudo bem')+'! Posso dizer o que falta aprovar, o que vai ao ar e como está o seu Instagram.',hints:['O que falta eu aprovar?','O que vai ao ar esta semana?','Como está meu Instagram?','Como peço um ajuste?']})}
function go(s){S=s;OPEN=null;if(location.hash.slice(1)!==s)history.replaceState(null,'','#'+s);render();const m=$('.main');if(m)m.scrollTop=0}

function shell(inner){
  const items=[['inicio','Início'],['aprov','Aprovações',pend().length],['cal','Calendário'],['met','Métricas'],['ig','Meu Instagram'],['arq','Arquivos e links']];
  const tabs=[['inicio','Início'],['aprov','Aprovar',pend().length],['cal','Calendário'],['met','Métricas'],['arq','Arquivos']];
  const ph=photo();
  return `<div class="app"><aside class="side"><img class="logo" src="${LOGO}" alt="Stond">
   <div class="who">${ph?`<img src="${ph}" alt="">`:''}<div><b>${esc(D.client.name)}</b><small>${esc(D.client.handle||'')}</small></div></div>
   <nav class="nav">${items.map(([k,l,b])=>`<button data-go="${k}" ${k===S?'aria-current="page"':''}>${ic[k]}${l}${b?`<span class="bdg">${b}</span>`:''}</button>`).join('')}</nav>
   ${tt()}${MODE==='login'?'<button class="out" style="margin-top:0;padding-left:4px" data-out>Sair</button>':''}</aside>
   <main class="main"><div class="mhead"><img class="l" src="${LOGO}" alt="Stond"><span style="display:flex;gap:10px;align-items:center">${tt()}${ph?`<img class="a" src="${ph}" alt="">`:''}${MODE==='login'?'<button class="out" data-out style="padding:0">Sair</button>':''}</span></div>${inner}</main>
   <nav class="tabbar">${tabs.map(([k,l,b])=>`<button data-go="${k}" ${k===S||(k==='met'&&S==='ig')?'aria-current="page"':''}>${ic[k]}${l}${b?`<span class="bdg">${b}</span>`:''}</button>`).join('')}</nav></div>${OPEN?modal():''}`;
}
const row=p=>`<button class="row" data-open="${esc(p.id)}">${thumb(p)}<div class="t"><b>${esc(p.title)}</b><small>${ty(p.type)} · ${fmtD(p.date)}${p.time?' · '+esc(p.time):''}</small></div>${chip(p)}</button>`;

const V={
 inicio(){
  const today=new Date(),t0=iso(today),t7=iso(new Date(today.getFullYear(),today.getMonth(),today.getDate()+6));
  const nx=posts().filter(p=>p.date>=t0&&p.date<=t7),days=[...new Set(nx.map(p=>p.date))];
  const mk=iso(today).slice(0,7),mp=posts().filter(p=>String(p.date).startsWith(mk));
  const P=pend();
  return `<div class="top"><div><p class="eyebrow">${WDL[today.getDay()]}, ${today.getDate()} de ${MES[today.getMonth()]}</p><h2>Olá, ${esc(first())}</h2><p>${P.length?`${P.length} ${P.length>1?'conteúdos esperam':'conteúdo espera'} sua aprovação.`:'Nada esperando você agora.'}</p></div><div class="tact"><button class="btn iab" data-ia-open><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>IA</button>${P.length?'<button class="btn red" data-go="aprov">Ver o que aprovar</button>':''}</div></div>${notaCard()}
  <div class="sum"><div><b>${P.length}</b><span>Para aprovar</span></div><div><b>${okP().length}</b><span>Aprovados</span></div><div><b>${mp.length}</b><span>Posts em ${MES[today.getMonth()]}</span></div></div>
  <div class="two"><section><p class="eyebrow">Precisa da sua atenção</p>${P.length?`<div class="list">${P.map(row).join('')}</div>`:'<div class="empty">Tudo aprovado por aqui. Quando a Stond mandar algo novo, aparece neste lugar.</div>'}</section>
  <section><p class="eyebrow">Próximos 7 dias</p>${days.length?`<div class="week">${days.map(d=>{const dd=pd(d);return `<div class="day"><div class="d">${dd.getDate()}<small>${WD[dd.getDay()]}</small></div><ul>${nx.filter(p=>p.date===d).map(p=>`<li><i class="dot t-${esc(p.type)}"></i><span>${esc(p.time||'')} · ${esc(p.title)}</span></li>`).join('')}</ul></div>`}).join('')}</div>`:'<div class="empty">Nada programado para esta semana.</div>'}</section></div>`;
 },
 aprov(){
  const L={pend:pend(),ok:okP(),adj:adj(),all:posts().filter(p=>(p.media||[]).length)}[FILTER];
  return `<div class="top"><div><h2>Aprovações</h2><p>Abra cada post, veja a arte e a legenda, e aprove ou peça ajuste.</p></div></div>
  <div class="filters"><div class="seg">${[['pend','Para aprovar',pend().length],['ok','Aprovados',okP().length],['adj','Ajustes pedidos',adj().length],['all','Todos']].map(([k,l,n])=>`<button data-filter="${k}" aria-pressed="${FILTER===k}">${l}${n!=null?' · '+n:''}</button>`).join('')}</div></div>
  ${L.length?`<div class="grid">${L.map(p=>`<button class="card" data-open="${esc(p.id)}"><div class="ph">${thumb(p)}<span class="k">${ty(p.type)}</span></div><div class="bd"><small>${fmtD(p.date)}${p.time?' · '+esc(p.time):''}</small><b>${esc(p.title)}</b>${p.status==='pendente'?'<span class="chip pend" style="align-self:flex-start">Esperando você</span>':chip(p).replace('class="chip','style="align-self:flex-start" class="chip')}</div></button>`).join('')}</div>`:'<div class="empty">Nada por aqui.</div>'}`;
 },
 cal(){
  const now=new Date();if(!CALM)CALM=new Date(now.getFullYear(),now.getMonth(),1);
  const y=CALM.getFullYear(),m=CALM.getMonth(),startW=new Date(y,m,1).getDay(),nd=new Date(y,m+1,0).getDate(),cells=Math.ceil((startW+nd)/7)*7;
  const mk=`${y}-${String(m+1).padStart(2,'0')}`,mp=posts().filter(p=>String(p.date).startsWith(mk)),t0=iso(now);
  let c='';for(let i=0;i<cells;i++){const d=i-startW+1;if(d<1||d>nd){c+='<div class="cell off"></div>';continue}
    const ds=`${mk}-${String(d).padStart(2,'0')}`,ev=mp.filter(p=>p.date===ds);
    c+=`<div class="cell ${ds===t0?'today':''}" data-day="${ds}"><span class="n">${d}</span>${ev.map(p=>`<button class="ev ${p.status==='pendente'?'pend':''}" ${(p.media||[]).length?`data-open="${esc(p.id)}"`:`data-day="${ds}"`} title="${esc((p.time||'')+' · '+p.title)}"><i class="dot t-${esc(p.type)}"></i><span>${esc(p.title)}</span></button>`).join('')}</div>`}
  const sel=ss.get('stond-day')&&ss.get('stond-day').startsWith(mk)?ss.get('stond-day'):(t0.startsWith(mk)?t0:(mp[0]&&mp[0].date));
  const sp=mp.filter(p=>p.date===sel);
  const prev=new Date(y,m-1,1),next=new Date(y,m+1,1);
  return `<div class="top"><div><h2>${MES[m][0].toUpperCase()+MES[m].slice(1)} ${y}</h2><p>${mp.length} publicações planejadas.</p></div><div class="seg"><button data-cal="-1">‹ ${MES[prev.getMonth()][0].toUpperCase()+MES[prev.getMonth()].slice(1)}</button><button data-cal="1">${MES[next.getMonth()][0].toUpperCase()+MES[next.getMonth()].slice(1)} ›</button></div></div>
  <div class="cal"><div class="wd">${WD.map(w=>`<div>${w}</div>`).join('')}</div><div class="cells">${c}</div></div>
  <div class="leg"><span><i class="dot t-reels"></i>Reels</span><span><i class="dot t-carrossel"></i>Carrossel</span><span><i class="dot t-story"></i>Stories</span><span><i class="dot" style="background:var(--warn)"></i>Esperando sua aprovação</span></div>
  ${sel?`<div class="calday"><p class="eyebrow" style="margin-top:6px">${fmtD(sel)}</p>${sp.length?`<div class="list">${sp.map(p=>`<${(p.media||[]).length?`button data-open="${esc(p.id)}"`:'div'} class="row"><i class="dot t-${esc(p.type)}"></i><div class="t"><b>${esc(p.title)}</b><small>${ty(p.type)}${p.time?' · '+esc(p.time):''}</small></div>${chip(p)}</${(p.media||[]).length?'button':'div'}>`).join('')}</div>`:'<div class="empty">Nada neste dia.</div>'}</div>`:''}`;
 },
 met(){
  const M=D.metrics||[],L=M[M.length-1]||{},F=M[0]||{},X=L.extra||{};
  const series=M.filter(r=>r.followers!=null);
  let chart='';
  if(series.length>1){const pts=series.map(r=>r.followers),mx=Math.max(...pts),mn=Math.min(...pts),W=300,H=90,Xf=i=>i*W/(pts.length-1),Yf=v=>mx===mn?H/2:H-(v-mn)/(mx-mn)*(H-8)-4;
    const line=pts.map((v,i)=>`${i?'L':'M'}${Xf(i).toFixed(1)},${Yf(v).toFixed(1)}`).join(' ');
    chart=`<svg class="ch" viewBox="0 0 300 100" preserveAspectRatio="none" aria-label="Seguidores de ${nf(pts[0])} para ${nf(pts[pts.length-1])}"><defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f80b1d" stop-opacity=".35"/><stop offset="1" stop-color="#f80b1d" stop-opacity="0"/></linearGradient></defs>${[25,50,75].map(y=>`<line x1="0" x2="300" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity=".08"/>`).join('')}<path d="${line} L300,100 L0,100Z" fill="url(#ga)"/><path d="${line}" fill="none" stroke="#f80b1d" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${Xf(pts.length-1)}" cy="${Yf(pts[pts.length-1])}" r="4" fill="#f80b1d"/></svg>`}
  else chart='<p class="wait">A curva aparece a partir da próxima medição.</p>';
  const dl=(L.followers!=null&&F.followers!=null&&series.length>1)?L.followers-F.followers:null;
  const fd=F.date?fmtD(F.date).replace(/^\w+, /,''):'';
  const wait='<p class="wait">Entra no fechamento do mês.</p>';
  const kw=X.keywords?Object.entries(X.keywords).sort((a,b)=>b[1]-a[1]):[],kmax=kw.length?kw[0][1]:1;
  const best=X.best?(posts().find(p=>p.id===X.best.post_id)||(X.best.permalink?{title:X.best.caption||'Post do mês',type:'post',media:X.best.thumb?[{url:X.best.thumb,kind:'image'}]:[]}:null)):null;
  const fm=X.formats?Object.entries(X.formats):[],fmc={reels:'var(--red)',carrossel:'var(--carr)',story:'#8a5560'};
  const now=new Date(),mk=iso(now).slice(0,7),mp=posts().filter(p=>String(p.date).startsWith(mk)),pub=mp.filter(p=>p.status==='publicado'||p.status==='aprovado').length;
  return `<div class="top"><div><h2>Métricas</h2><p>Como o seu Instagram está evoluindo${fd?' desde '+fd:''}.</p></div></div>
  <div class="bento">
   <div class="bx hero w2 h2 w2m"><span class="lb">Seguidores</span><div class="num">${nf(L.followers)}${dl!=null?`<small style="${dl<0?'color:var(--red)':''}">${dl>=0?'+':''}${nf(dl)} desde ${fd}</small>`:''}</div>${chart}
    ${F.followers!=null?`<span class="ft">Ponto de partida: ${nf(F.followers)} seguidores, ${nf(F.posts)} posts, ${nf(F.following)} seguindo</span>`:''}</div>
   <div class="bx"><span class="lb">Alcance do mês</span>${L.reach!=null?`<div class="num">${kf(L.reach)}</div><span class="ft">Contas alcançadas</span>`:wait}</div>
   <div class="bx"><span class="lb">Engajamento</span>${L.engagement!=null?`<div class="ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-opacity=".1" stroke-width="3.4"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="#f80b1d" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="${(Math.min(10,L.engagement)/10*97.4).toFixed(1)} 97.4" transform="rotate(-90 18 18)"/></svg><div><div class="num" style="font-size:30px">${Number(L.engagement).toLocaleString('pt-BR')}%</div><span class="ft">curtidas, comentários e salvos por alcance</span></div></div>`:wait}</div>
   <div class="bx w2 w2m"><span class="lb">Palavras comentadas</span>${kw.length?`<div class="bars">${kw.map(([k,v])=>`<div><span>${esc(k)}</span><i><b style="width:${v/kmax*100}%"></b></i><span>${nf(v)}</span></div>`).join('')}</div><span class="ft">Cada comentário vira uma conversa no direct</span>`:'<p class="wait">Aqui aparecem as palavras que as pessoas comentam para receber o link no direct.</p>'}</div>
   <div class="bx w2m"><span class="lb">Melhor post</span>${best?`<div class="best">${thumb(best)}<div><b style="font-weight:500">${esc(best.title)}</b><div class="num" style="font-size:26px;margin-top:4px">${kf(X.best.views)}</div><span class="ft">visualizações</span></div></div>`:wait}</div>
   <div class="bx"><span class="lb">Visualizações</span>${L.views!=null?`<div class="num">${kf(L.views)}</div><span class="ft">No mês</span>`:wait}</div>
   <div class="bx"><span class="lb">Formato que mais rende</span>${fm.length?`<div class="num" style="font-size:28px">${ty(fm.sort((a,b)=>b[1]-a[1])[0][0])}</div><div class="stack">${fm.map(([k,v])=>`<i style="width:${v}%;background:${fmc[k]||'var(--muted)'}"></i>`).join('')}</div><span class="ft">${fm.map(([k,v])=>`${v}% ${ty(k).toLowerCase()}`).join(' · ')}</span>`:wait}</div>
   <div class="bx"><span class="lb">${MES[now.getMonth()][0].toUpperCase()+MES[now.getMonth()].slice(1)} aprovado</span><div class="num">${pub}<small style="color:var(--muted)">de ${mp.length}</small></div><div class="prog"><b style="width:${mp.length?pub/mp.length*100:0}%"></b></div><button class="lnkb" data-go="ig">Ver prévia do feed</button></div>
  </div>`;
 },
 ig(){
  const pr=D.profile||{},M=D.metrics||[],L=M[M.length-1]||{};
  const feed=posts().filter(p=>p.type!=='story'&&(p.media||[]).length&&['pendente','aprovado','publicado'].includes(p.status)).sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||'')));
  return `<div class="ig"><div class="top"><div><h2>Meu Instagram</h2><p>Como o seu perfil fica com os próximos posts.</p></div></div>
  <div class="igh">${photo()?`<img src="${photo()}" alt="">`:''}<div><div class="nm">${esc(pr.handle||D.client.handle||'')}</div><div class="stats"><span><b>${nf(L.posts??pr.posts)}</b> posts</span><span><b>${nf(L.followers??pr.followers)}</b> seguidores</span><span><b>${nf(L.following??pr.following)}</b> seguindo</span></div></div></div>
  <p class="bio"><b>${esc(pr.name||D.client.name)}</b>
${esc(pr.bioNow||pr.bio||'')}</p>
  <div class="feed">${feed.map(p=>`<button data-open="${esc(p.id)}">${thumb(p)}<span class="tag">${p.status==='aprovado'?'Aprovado':p.status==='publicado'?'No ar':'Prévia'}</span></button>`).join('')}</div></div>`;
 },
 arq(){
  const L=(D.links||[]).filter(l=>l.kind==='link'),F=(D.links||[]).filter(l=>l.kind==='arquivo'),U=D.uploads||[];
  const ext=u=>{const m=String(u).split('?')[0].match(/\.([a-z0-9]{2,4})$/i);return m?m[1].toUpperCase():'LINK'};
  const host=u=>String(u).replace(/^https?:\/\//,'').replace(/\/$/,'');
  return `<div class="top"><div><h2>Arquivos e links</h2><p>Tudo do seu projeto num lugar só.</p></div></div>
  <p class="eyebrow">Links</p>${L.length?`<div class="files">${L.map(l=>`<div class="fl"><span class="ico">${ic.link}</span><div class="t"><b>${esc(l.title)}</b><small>${esc(host(l.url))}</small>${l.note?`<small>${esc(l.note)}</small>`:''}</div><a class="btn sm ghost" href="${esc(l.url)}" target="_blank" rel="noopener">Abrir</a><button class="btn sm ghost" data-copy="${esc(l.url)}">Copiar</button></div>`).join('')}</div>`:'<div class="empty">Nenhum link ainda.</div>'}
  <p class="eyebrow" style="margin-top:22px">Arquivos da Stond</p>${F.length?`<div class="files">${F.map(l=>`<div class="fl"><span class="ico">${ext(l.url)}</span><div class="t"><b>${esc(l.title)}</b>${l.note?`<small>${esc(l.note)}</small>`:''}</div><a class="btn sm ghost" href="${esc(l.url)}" target="_blank" rel="noopener">Abrir</a></div>`).join('')}</div>`:'<div class="empty">Quando a Stond compartilhar um arquivo com você, ele aparece aqui.</div>'}
  ${MODE==='login'?`<p class="eyebrow" style="margin-top:22px">Enviados por você</p>${U.length?`<div class="files">${U.map(u=>{const n=u.path.split('/').pop().replace(/^\d+-/,'');return `<div class="fl"><span class="ico">${ext(n)}</span><div class="t"><b>${esc(n)}</b><small>${new Date(u.at).toLocaleDateString('pt-BR')}${u.size?' · '+(u.size/1048576).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB':''}</small></div><button class="btn sm ghost" data-get="${esc(u.path)}">Abrir</button></div>`}).join('')}</div>`:''}
  <label class="drop" id="drop" for="up"><b style="color:var(--ink);font-weight:500">Mandar um arquivo para a Stond</b><span>Arraste aqui ou escolha no seu computador. Fotos, vídeos e documentos até 50 MB.</span><span class="btn sm">Escolher arquivo</span><input id="up" type="file" multiple hidden></label>`:''}`;
 }
};

/* ---------- post aberto ---------- */
function modal(){
  const p=posts().find(x=>x.id===OPEN);if(!p)return '';
  const md=p.media||[];if(slide>=md.length)slide=0;const m=md[slide];
  const brief=(p.brief||'').split('\n').filter(l=>!/^Tipo:/i.test(l.trim())).join('\n').trim();
  const fb=(D.feedback||[]).filter(f=>f.post_id===p.id);
  const canDecide=['pendente','aprovado','reprovado'].includes(p.status);
  return `<div class="ovl" data-close><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(p.title)}">
   <div class="media">${m?(m.kind==='video'?`<video src="${mediaUrl(m.url)}" controls playsinline preload="metadata"></video>`:`<img src="${mediaUrl(m.url)}" alt="Slide ${slide+1} de ${md.length}">`):''}
    ${md.length>1?`<span class="cnt">${slide+1} de ${md.length}</span><button class="nv l" data-sl="-1" aria-label="Anterior">‹</button><button class="nv r" data-sl="1" aria-label="Próximo">›</button><div class="pg">${md.map((_,i)=>`<i class="${i===slide?'on':''}"></i>`).join('')}</div>`:''}</div>
   <div class="info"><div class="hd"><div><b>${esc(p.title)}</b><small>${ty(p.type)} · ${fmtD(p.date)}${p.time?' · '+esc(p.time):''} ${chip(p)}</small></div><button class="x" data-x aria-label="Fechar">✕</button></div>
    <div class="sc">${p.caption?`<div><p class="eyebrow">Legenda</p><div class="cap">${esc(p.caption)}</div></div>`:''}
     ${brief?`<div><p class="eyebrow">Detalhes</p><div class="det">${esc(brief)}</div></div>`:''}
     ${fb.length?`<div><p class="eyebrow">Conversa</p><div class="hist">${fb.map(f=>`<div><b>${esc(f.author||'Você')}</b> <small>${f.kind==='aprovado'?'aprovou':f.kind==='ajuste'?'pediu ajuste':'comentou'} · ${new Date(f.at).toLocaleDateString('pt-BR')}</small>${f.text?`<p>${esc(f.text)}</p>`:''}</div>`).join('')}</div></div>`:''}</div>
    ${PREVIEW?`<div class="act"><p class="sub" style="margin:0">Você está vendo como o cliente. Aprovar e pedir ajuste ficam desligados aqui.</p></div>`:`<div class="act">
     <div class="fld"><label for="cm">Comentário ${canDecide?'(opcional para aprovar)':''}</label><textarea id="cm" placeholder="Escreva aqui se quiser mudar algo"></textarea></div>
     <p class="err" id="perr" role="alert" hidden></p>
     <div class="bt">${canDecide?'<button class="btn red" data-fb="aprovado">Aprovar</button><button class="btn" data-fb="ajuste">Pedir ajuste</button>':''}<button class="btn ghost" data-fb="comentario">Só comentar</button></div></div>`}</div></div></div>`;
}
async function sendFb(kind){
  const txt=$('#cm').value.trim(),err=$('#perr');err.hidden=true;
  if(kind!=='aprovado'&&!txt){err.textContent=kind==='ajuste'?'Conte o que precisa mudar.':'Escreva o comentário.';err.hidden=false;return}
  document.querySelectorAll('[data-fb]').forEach(b=>b.disabled=true);
  try{
    if(MODE==='token'){const au=(D.client&&D.client.name)||'Cliente';D=await rpc('portal_feedback',{p_token:TOKEN,p_post:OPEN,p_kind:kind,p_text:txt,p_author:au});}
    else D=await rpc('portal_feedback_me',{p_post:OPEN,p_kind:kind,p_text:txt});
    toast(kind==='aprovado'?'Aprovado. Obrigado!':kind==='ajuste'?'Pedido de ajuste enviado para a Stond.':'Comentário enviado.');
    if(kind==='comentario')render();else{OPEN=null;render()}
  }catch(e){err.textContent=e.message;err.hidden=false;document.querySelectorAll('[data-fb]').forEach(b=>b.disabled=false)}
}

/* ---------- envio de arquivos ---------- */
async function upload(files){
  for(const f of files){
    if(f.size>50*1048576){toast(`${f.name} passa de 50 MB.`);continue}
    const safe=f.name.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w.\-]+/g,'-');
    toast(`Enviando ${f.name}…`);
    const {error}=await sb.storage.from('client-files').upload(`${D.client.id}/${Date.now()}-${safe}`,f,{contentType:f.type||undefined});
    if(error){toast('Não foi possível enviar: '+error.message);return}
  }
  D=await rpc('portal_me');toast('Arquivo enviado para a Stond.');render();
}

function render(){
  if(!D)return;
  document.getElementById('app').innerHTML=shell(V[S]());
  document.title=({inicio:'Início',aprov:'Aprovações',cal:'Calendário',met:'Métricas',ig:'Meu Instagram',arq:'Arquivos e links'}[S])+' · Stond';
  const up=$('#up');if(up){up.onchange=()=>upload([...up.files]);const dz=$('#drop');
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('on')});dz.addEventListener('dragleave',()=>dz.classList.remove('on'));
    dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('on');upload([...e.dataTransfer.files])});}
}

document.addEventListener('click',async e=>{
  const t=e.target;
  if(t.closest('[data-theme-toggle]')){ls.set('stond-tema',document.documentElement.classList.contains('light')?'dark':'light');applyTheme();if(D&&$('.app'))render();return}
  if(!$('.app'))return;
  const g=t.closest('[data-go]');if(g){go(g.dataset.go);return}
  const o=t.closest('[data-open]');if(o){OPEN=o.dataset.open;slide=0;render();return}
  if(t.closest('[data-x]')||t.matches('[data-close]')){OPEN=null;render();return}
  const sl=t.closest('[data-sl]');if(sl){const n=(posts().find(x=>x.id===OPEN).media||[]).length;slide=(slide+ +sl.dataset.sl+n)%n;render();return}
  const fb=t.closest('[data-fb]');if(fb){sendFb(fb.dataset.fb);return}
  const nb=t.closest('[data-nota]');if(nb){NOTASEL=+nb.dataset.nota;render();const x=$('#notat');if(x)x.focus();return}
  if(t.closest('[data-nota-ok]')){const tx=($('#notat')||{}).value||'';try{await rpc('portal_nota',{p_score:NOTASEL,p_text:tx,p_token:TOKEN||null});NOTA='ok';render();setTimeout(()=>{NOTA=false;if(S==='inicio')render()},4000)}catch(e){toast(e.message)}return}
  const fl=t.closest('[data-filter]');if(fl){FILTER=fl.dataset.filter;render();return}
  const cl=t.closest('[data-cal]');if(cl){CALM=new Date(CALM.getFullYear(),CALM.getMonth()+ +cl.dataset.cal,1);ss.set('stond-day',null);render();return}
  const dy=t.closest('[data-day]');if(dy){ss.set('stond-day',dy.dataset.day);render();return}
  const cp=t.closest('[data-copy]');if(cp){try{await navigator.clipboard.writeText(cp.dataset.copy);toast('Link copiado.')}catch(x){toast(cp.dataset.copy)}return}
  const gt=t.closest('[data-get]');if(gt){const {data,error}=await sb.storage.from('client-files').createSignedUrl(gt.dataset.get,300);if(error)return toast(error.message);window.open(data.signedUrl,'_blank','noopener');return}
  if(t.closest('[data-out]')){await sb.auth.signOut();D=null;login('entrar');return}
});
document.addEventListener('keydown',e=>{if(!OPEN)return;if(e.key==='Escape'){OPEN=null;render()}
  const n=(posts().find(x=>x.id===OPEN)?.media||[]).length;if(n>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')&&!/TEXTAREA|INPUT/.test(document.activeElement.tagName)){slide=(slide+(e.key==='ArrowRight'?1:-1)+n)%n;render()}});
let tx0=null;document.addEventListener('touchstart',e=>{if(e.target.closest('.media'))tx0=e.touches[0].clientX},{passive:true});
document.addEventListener('touchend',e=>{if(tx0==null||!OPEN)return;const dx=e.changedTouches[0].clientX-tx0;tx0=null;const n=(posts().find(x=>x.id===OPEN)?.media||[]).length;if(n>1&&Math.abs(dx)>40){slide=(slide+(dx<0?1:-1)+n)%n;render()}},{passive:true});
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(D&&h&&h!==S&&V[h]){S=h;OPEN=null;render()}});

boot();
