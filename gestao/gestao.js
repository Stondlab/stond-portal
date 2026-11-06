/* Gestão Stond (painel interno da agência) */
const SB='https://mkhewgatxdkjowvhqppb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1raGV3Z2F0eGRram93dmhxcHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTkxNDMsImV4cCI6MjEwOTQ3NTE0M30.0uGUnW5dqt3d3P7Cad0UYtT6k3fp69rxoMLJgMazbsg';
const MEDIA=SB+'/storage/v1/object/public/media/';
const LOGO='/assets/logo-branco.png';
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const WD=['dom','seg','ter','qua','qui','sex','sáb'],WDL=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const Mes=m=>MES[m][0].toUpperCase()+MES[m].slice(1);
const TY={reels:'Reels',carrossel:'Carrossel',story:'Stories',post:'Post',foto:'Post'};
const ty=t=>TY[t]||(t?t[0].toUpperCase()+t.slice(1):'Post');
const pd=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y,m-1,d)};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtD=s=>{if(!s)return '';const d=pd(s);return `${WD[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()].slice(0,3)}`};
const nf=n=>n==null||n===''?'—':Number(n).toLocaleString('pt-BR');
const brl=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const num=v=>Number(String(v??'').replace(/\./g,'').replace(',','.'))||0;
const today=()=>iso(new Date());
const mediaUrl=(u,c)=>!u?'':/^https?:/.test(u)?u:MEDIA+(c?c+'/':'')+u;
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3200)}

/* tema */
function applyTheme(){document.documentElement.classList.toggle('light',ls.get('stond-tema')==='light')}
applyTheme();
function tt(){const l=document.documentElement.classList.contains('light');
  return `<button class="tt" data-theme-toggle aria-label="${l?'Usar versão escura':'Usar versão clara'}"><span class="${l?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></span><span class="${l?'':'on'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></span></button>`}

const sb=window.supabase.createClient(SB,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'sg-auth'}});

/* ---------- ícones ---------- */
const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${p}</svg>`;
const ic={
 inicio:sv('<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
 dem:sv('<rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="15.5" y="4" width="5" height="7" rx="1.5"/>'),
 aprov:sv('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>'),
 agenda:sv('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
 pub:sv('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r=".8" fill="currentColor"/>'),
 cli:sv('<circle cx="9" cy="9" r="3.4"/><path d="M3 19c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6"/><circle cx="17" cy="8" r="2.6"/><path d="M16.5 13.2c2.2.2 3.8 1.6 4.5 3.8"/>'),
 met:sv('<path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/>'),
 rel:sv('<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 16v-3M12 16V9M16 16v-5"/>'),
 msg:sv('<path d="M4 5.5h16v11H9l-5 4z"/>'),
 gest:sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
 cres:sv('<path d="M3.5 17.5l6-6 4 4 7-7.5"/><path d="M15 8h5.5v5.5"/>'),
 com:sv('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>'),
 prop:sv('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h6M9.5 15.5h6"/>'),
 fin:sv('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
 adm:sv('<path d="M4 20V8l8-4.5L20 8v12"/><path d="M9 20v-6h6v6M3 20h18"/>'),
};

/* ---------- dados ---------- */
let ME=null,D={clients:[],posts:[],feedback:[],metrics:[],docs:[],accounts:[],links:[],kw:new Set()},S='inicio',FILT={},MODAL=null,CALM=null;
const CL=()=>D.clients;
const cli=id=>D.clients.find(c=>c.id===id)||{id,name:id||'Stond',color:'#8a5560'};
const ccol=id=>cli(id).color||'#8a5560';
const cdot=id=>`<i class="cd" style="background:${esc(ccol(id))}"></i>`;
const docs=col=>D.docs.filter(d=>d.collection===col).map(d=>({...d.data,id:d.id,client:d.client_id??d.data.client}));
const doc1=(col,id)=>{const d=D.docs.find(x=>x.collection===col&&x.id===id);return d?{...d.data}:{}};
const posts=()=>D.posts;
const pend=()=>posts().filter(p=>p.status==='pendente');
const isDone=p=>p.publish_status==='publicado'||p.status==='publicado';

async function load(){
  const q=(t,s='*')=>sb.from(t).select(s);
  const [c,p,f,m,d,a,l,k]=await Promise.all([q('clients','id,name,handle,color,status,data,access_token').order('created_at'),q('posts').order('date'),q('post_feedback').order('created_at'),q('ig_metrics').order('date'),q('agency_docs'),q('ig_accounts'),q('client_links'),q('dm_keywords','keyword,aliases,client_id')]);
  for(const r of [c,p,f,m,d])if(r.error)throw new Error(r.error.message);
  D={clients:c.data,posts:p.data,feedback:f.data,metrics:m.data,docs:d.data,accounts:a.data||[],links:l.data||[]};
  try{const {data:u}=await sb.rpc('storage_usage');D.usage=u||null}catch(_){D.usage=null}
  D.kw=new Set((k.data||[]).flatMap(x=>[x.keyword,...(x.aliases||[])]).map(w=>String(w).toLowerCase()));
}
async function saveDoc(col,id,data){
  id=id||Math.random().toString(36).slice(2,10);
  const row={collection:col,id,client_id:data.client||null,data,updated_at:new Date().toISOString(),updated_by:ME.email};
  const {error}=await sb.from('agency_docs').upsert(row);if(error)throw new Error(error.message);
  const i=D.docs.findIndex(x=>x.collection===col&&x.id===id);i>=0?D.docs[i]=row:D.docs.push(row);return id;
}
async function delDoc(col,id){const {error}=await sb.from('agency_docs').delete().eq('collection',col).eq('id',id);if(error)throw new Error(error.message);D.docs=D.docs.filter(x=>!(x.collection===col&&x.id===id))}
async function savePost(p){
  const row={...p,updated_at:new Date().toISOString()};
  const {data,error}=await sb.from('posts').upsert(row).select().single();if(error)throw new Error(error.message);
  const i=D.posts.findIndex(x=>x.id===data.id);i>=0?D.posts[i]=data:D.posts.push(data);return data;
}

/* ---------- entrar ---------- */
async function boot(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return login();
  const {data,error}=await sb.rpc('team_me');
  if(error||!data)return denied(session.user.email);
  ME=data;
  try{await load()}catch(e){return msgScreen('Não foi possível carregar',e.message)}
  if(location.hash.length>1)S=location.hash.slice(1).split('?')[0];
  if(!V[S])S='inicio';
  render();
  if(window.StondIA)sb.functions.invoke('ia',{body:{action:'ping'}}).then(({data})=>{if(data&&data.on)StondIA.mount({sb,mode:'gestao',title:'IA da Stond',sub:'Enxerga clientes, posts, métricas e finanças',hello:'Oi, '+((ME.name||'').split(' ')[0]||'Helo')+'! Pergunte sobre a agência, um cliente ou peça um texto.',hints:['O que está atrasado ou parado esta semana?','Como está o Gabriel este mês?','Sugira 5 pautas para a Crys em dezembro','Como está o caixa da Stond?']})}).catch(()=>{});
}
function msgScreen(t,m,out=true){document.getElementById('app').innerHTML=`<div class="login one"><div class="form"><h2>${esc(t)}</h2><p class="sub">${esc(m)}</p>${out?'<button class="btn" id="sair">Sair</button>':''}</div></div>`;const b=$('#sair');if(b)b.onclick=async()=>{await sb.auth.signOut();login()}}
function denied(em){msgScreen('Acesso restrito',`A conta ${em} não tem acesso.`)}
function login(){
  document.getElementById('app').innerHTML=`<div class="login one"><form class="form" id="lf" novalidate>
   <h2>Entrar</h2><p class="sub">Acesso restrito.</p>
   <button class="btn goog full" type="button" data-google><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>Continuar com Google</button>
   <div class="or">ou</div>
   <div class="fld"><label for="em">E-mail</label><div class="gin"><input id="em" type="email" autocomplete="email" required></div></div>
   <div class="fld"><label for="pw">Senha</label><div class="gin"><input id="pw" type="password" autocomplete="current-password" required></div></div>
   <p class="err" id="lerr" role="alert" hidden></p>
   <button class="btn full" type="submit" id="lbtn">Entrar</button></form></div>`;
  const err=$('#lerr'),fail=m=>{err.textContent=m;err.hidden=false;$('#lbtn').disabled=false};
  $('[data-google]').onclick=async()=>{const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/gestao/'}});if(error)fail(error.message)};
  $('#lf').onsubmit=async e=>{e.preventDefault();err.hidden=true;$('#lbtn').disabled=true;
    const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
    if(error)return fail(/invalid/i.test(error.message)?'E-mail ou senha incorretos.':error.message);boot()};
}

/* ---------- casca ---------- */
const GROUPS=[['',[['inicio','Início'],['dem','Demandas'],['aprov','Aprovação'],['agenda','Agenda'],['pub','Publicação']]],
 ['Clientes',[['cli','Clientes'],['met','Métricas'],['rel','Relatórios'],['msg','Mensagens']]],
 ['Negócio',[['gest','Gestão da Stond'],['cres','Crescimento'],['com','Comercial'],['prop','Propostas e contratos'],['fin','Financeiro'],['adm','Administrativo']]]];
function badge(k){if(k==='aprov')return pend().length;if(k==='dem')return late().length;if(k==='pub')return queue().filter(p=>p.publish_status==='agendado').length;if(k==='msg')return docs('messages').filter(m=>m.who==='Cliente'&&!m.readStond).length;return 0}
function shell(inner){
  const tabs=[['inicio','Início'],['dem','Demandas'],['aprov','Aprovar'],['pub','Publicar'],['gest','Gestão']];
  const b=k=>{const n=badge(k);return n?`<span class="bdg">${n}</span>`:''};
  return `<div class="app"><aside class="side"><img class="logo" src="${LOGO}" alt="">
   <div class="who"><span class="av">${esc((ME.name||'?')[0])}</span><div><b>${esc(ME.name)}</b><small>${esc(ME.role==='dona'?'Stond · dona':'Stond · equipe')}</small></div></div>
   <nav class="nav">${GROUPS.map(([t,it])=>(t?`<p class="sec">${t}</p>`:'')+it.map(([k,l])=>`<button data-go="${k}" ${k===S?'aria-current="page"':''}>${ic[k]}${l}${b(k)}</button>`).join('')).join('')}</nav>
   ${tt()}<button class="out" style="margin-top:0;padding-left:4px" data-out>Sair</button></aside>
   <main class="main"><div class="mhead"><img class="l" src="${LOGO}" alt=""><span style="display:flex;gap:10px;align-items:center">${tt()}<button class="out" data-out style="padding:0">Sair</button></span></div>${inner}</main>
   <nav class="tabbar">${tabs.map(([k,l])=>`<button data-go="${k}" ${k===S?'aria-current="page"':''}>${ic[k]}${l}${b(k)}</button>`).join('')}</nav></div>${MODAL?MODAL.html():''}`;
}
const topb=(h,p,act='')=>`<div class="top"><div><h2>${h}</h2>${p?`<p>${p}</p>`:''}</div>${act}</div>`;
const empty=t=>`<div class="empty">${t}</div>`;
const hcol=s=>s>70?'var(--ok)':s>55?'var(--warn)':'var(--red)';
const bar=(v,c)=>`<i class="hb"><u style="width:${Math.max(0,Math.min(100,v))}%;background:${c||hcol(v)}"></u></i>`;
const segF=(key,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button data-f="${key}" data-v="${esc(v)}" aria-pressed="${(FILT[key]??opts[0][0])===v}">${l}</button>`).join('')}</div>`;
const fv=(key,def)=>FILT[key]??def;

/* ---------- cálculos ---------- */
const month=(d=new Date())=>iso(d).slice(0,7);
const fin=()=>docs('fin');
const finMonth=(mk,type)=>fin().filter(f=>String(f.date||'').startsWith(mk)&&f.type===type);
const sum=a=>a.reduce((s,x)=>s+num(x.amount),0);
const late=()=>posts().filter(p=>p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado');
const queue=()=>posts().filter(p=>p.status==='aprovado'||p.publish_status);
function health(c){
  const ps=posts().filter(p=>p.client_id===c.id),pn=ps.filter(p=>p.status==='pendente');
  let s=80;const oldest=pn.map(p=>p.updated_at).sort()[0];
  if(oldest){const days=(Date.now()-new Date(oldest))/864e5;if(days>3)s-=Math.min(30,days*3)}
  const overdue=docs('fin').filter(f=>f.client===c.id&&f.type==='receita'&&!f.paid&&f.date&&f.date<today()).length;s-=overdue*15;
  const nota=num((c.data||{}).nota);if(nota)s+=(nota-7)*4;
  if(ps.some(p=>String(p.date).startsWith(month())))s+=8;
  return Math.round(Math.max(5,Math.min(100,s)));
}
const fee=c=>num((c.data||{}).fee);
const active=()=>CL().filter(c=>(c.status||'ativo')==='ativo');
const mrr=()=>active().reduce((s,c)=>s+fee(c),0);
const settings=k=>doc1('settings',k);

/* ---------- telas ---------- */
const V={};
/* espaço do Supabase (plano grátis: 1 GB de arquivos, 500 MB de banco) */
const LIM={files:1024**3,db:500*1024**2};
const mb=b=>b>=1024**3?(b/1024**3).toLocaleString('pt-BR',{maximumFractionDigits:2})+' GB':Math.round(b/1048576).toLocaleString('pt-BR')+' MB';
function space(){const u=D.usage;if(!u)return null;const f=u.files_bytes/LIM.files,d=u.db_bytes/LIM.db,pct=Math.round(Math.max(f,d)*100);return {u,f,d,pct,lvl:pct>=90?'red':pct>=70?'warn':'ok'}}
function spaceBanner(){const s=space();if(!s||s.lvl==='ok')return '';
  return `<div class="spc ${s.lvl}"><b>${s.lvl==='red'?'Espaço quase cheio':'Espaço passando de 70%'}</b><span>Arquivos ${mb(s.u.files_bytes)} de 1 GB (${Math.round(s.f*100)}%). ${s.lvl==='red'?'Apague vídeos antigos ou suba o plano do Supabase antes de enviar mais.':'Dá para continuar, mas já vale apagar vídeos antigos que foram publicados.'}</span><button class="btn sm ghost" data-go="adm">Ver espaço</button></div>`}
V.inicio=()=>{
  const now=new Date(),t0=today(),ev=docs('events').filter(e=>e.date===t0).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  const ptoday=posts().filter(p=>p.date===t0);
  const items=[...ev.map(e=>[e.start||'',e.client,e.title,'']),...ptoday.map(p=>[p.time||'',p.client_id,`${ty(p.type)} "${p.title}" vai ao ar`,p.status==='aprovado'?'<em class="chip ok">Aprovado</em>':p.status==='pendente'?'<em class="chip pend">Sem aprovação</em>':''])].sort((a,b)=>a[0].localeCompare(b[0]));
  const goal=num(settings('metas').mrr)||0,M=mrr(),A=active();
  const fixed=sum(docs('fin').filter(f=>f.type==='despesa'&&String(f.date||'').startsWith(month())));
  const alerts=[];
  A.forEach(c=>{const h=health(c);if(h<55)alerts.push([c.id,'Risco de cancelar · saúde '+h,'cli','Ver'])});
  docs('contracts').filter(k=>k.status==='assinado'&&k.renewAt&&k.renewAt>=t0&&(pd(k.renewAt)-now)/864e5<=30).forEach(k=>alerts.push([k.client,'Contrato vence '+fmtD(k.renewAt),'prop','Renovar']));
  pend().filter(p=>p.date&&p.date<=iso(new Date(now.getTime()+2*864e5))).forEach(p=>alerts.push([p.client_id,`"${p.title}" vai ao ar ${fmtD(p.date)} sem aprovação`,'aprov','Ver']));
  const leads=docs('leads').filter(l=>!['fechado','perdido'].includes(l.stage));
  return shell(topb(`Bom dia, ${esc(ME.name.split(' ')[0])}`,`${items.length} ${items.length===1?'coisa':'coisas'} para hoje, ${pend().length} posts com os clientes${alerts.length?' e '+alerts.length+' alertas':''}`,'<button class="btn red" data-new="post">Nova demanda</button>').replace('<h2>',`<p class="eyebrow">${WDL[now.getDay()]}, ${now.getDate()} de ${MES[now.getMonth()]}</p><h2>`)+spaceBanner()+`
  <div class="bento">
   <div class="bx hero w2 w2m"><span class="lb">Receita recorrente</span><div class="num">${brl(M)}${goal?`<small>meta ${brl(goal)}</small>`:''}</div>${goal?`<div class="prog"><b style="width:${Math.min(100,M/goal*100)}%"></b></div><span class="ft">${M>=goal?'Meta batida':'Faltam '+brl(goal-M)}</span>`:'<span class="ft">Defina a meta em Gestão da Stond</span>'}</div>
   <div class="bx"><span class="lb">Ticket médio</span><div class="num">${brl(A.length?M/A.length:0)}</div><span class="ft">${A.length} clientes ativos</span></div>
   <div class="bx"><span class="lb">Capacidade</span><div class="num">${A.length}<small>de ${num(settings('metas').capacidade)||5}</small></div><div class="prog"><b style="width:${A.length/(num(settings('metas').capacidade)||5)*100}%"></b></div><span class="ft">Clientes que a equipe atende bem</span></div>
   <div class="bx w2 w2m"><span class="lb">Para hoje</span>${items.length?`<div class="tl">${items.map(([h,c,t,x])=>`<div><b>${esc(h)}</b><span>${cdot(c)}${esc(t)}</span>${x}</div>`).join('')}</div>`:'<p class="wait">Nada marcado para hoje.</p>'}</div>
   <div class="bx w2 w2m"><span class="lb">Atenção</span>${alerts.length?`<div class="al">${alerts.slice(0,5).map(([c,t,go,b])=>`<div>${cdot(c)}<b>${esc(cli(c).name)}</b><small>${esc(t)}</small><button class="btn sm ghost" data-go="${go}">${b}</button></div>`).join('')}</div>`:'<p class="wait">Nenhum alerta. Tudo em dia.</p>'}</div>
   <div class="bx"><span class="lb">Esperando cliente</span><div class="num">${pend().length}</div><span class="ft">${[...new Set(pend().map(p=>cli(p.client_id).name))].join(', ')||'Nada pendente'}</span></div>
   <div class="bx"><span class="lb">Atrasadas</span><div class="num" style="${late().length?'color:var(--red)':''}">${late().length}</div><span class="ft">Demandas com prazo vencido</span></div>
   <div class="bx w2 w2m"><span class="lb">Comercial</span><div class="num">${leads.length}<small>leads · ${brl(sum(leads.map(l=>({amount:l.value}))))}/mês</small></div><span class="ft">${fixed?'Despesas do mês: '+brl(fixed):'Abra Comercial para ver o funil'}</span></div>
  </div>`);
};

/* Demandas */
const COLS=[['ideia','Ideias','#8a5560'],['producao','Em produção','#3f8fd8'],['aprovacao','Aprovação do cliente','#e0a33b'],['agendamento','Agendamento','#c868b8'],['publicado','Publicado','#3fbf7f']];
function colOf(p){if(isDone(p))return 'publicado';if(p.status==='aprovado')return 'agendamento';if(p.status==='pendente')return 'aprovacao';if(p.status==='reprovado')return 'producao';return p.stage==='producao'?'producao':'ideia'}
const cover=p=>{const m=(p.media||[])[0];if(!m)return '';return m.kind==='video'?(m.poster?mediaUrl(m.poster,p.client_id):''):mediaUrl(m.url,p.client_id)};
V.dem=()=>{
  const c=fv('dc','all'),list=posts().filter(p=>c==='all'||p.client_id===c).filter(p=>p.type!=='story'||fv('ds','0')==='1');
  const mk=fv('dm',month()),inM=list.filter(p=>!p.date||String(p.date).startsWith(mk)||colOf(p)!=='publicado');
  const [y,m]=mk.split('-').map(Number),prev=iso(new Date(y,m-2,1)).slice(0,7),next=iso(new Date(y,m,1)).slice(0,7);
  return shell(topb('Demandas',`Quadro de ${Mes(m-1)} · ${c==='all'?'todos os clientes':esc(cli(c).name)}`,'<button class="btn red" data-new="post">Nova demanda</button>')+`
  <div class="filters">${segF('dc',[['all','Todos'],...CL().map(k=>[k.id,k.name])])}<div class="seg"><button data-f="dm" data-v="${prev}">‹ ${Mes(pd(prev+'-01').getMonth())}</button><button data-f="dm" data-v="${next}">${Mes(pd(next+'-01').getMonth())} ›</button><button data-f="ds" data-v="${fv('ds','0')==='1'?'0':'1'}" aria-pressed="${fv('ds','0')==='1'}">Stories</button></div></div>
  <div class="kb">${COLS.map(([k,n,col])=>{const it=inM.filter(p=>colOf(p)===k&&(k!=='publicado'||String(p.date).startsWith(mk))).sort((a,b)=>(a.date||'9').localeCompare(b.date||'9'));return `<section class="kc" data-drop="${k}"><header style="--cc:${col}"><b>${n}</b><span>${it.length}</span></header>${it.map(p=>`<article class="kd" draggable="true" data-drag="${esc(p.id)}" data-edit-post="${esc(p.id)}">${cover(p)?`<img src="${cover(p)}" alt="" loading="lazy">`:''}<div class="kt"><span class="pill">${ty(p.type)}</span>${p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado'?'<span class="chip" style="color:var(--red);border-color:var(--red)">Atrasada</span>':''}${p.status==='reprovado'?'<span class="chip pend">Ajuste</span>':''}</div><b>${esc(p.title||'Sem título')}</b><div class="km">${cdot(p.client_id)}<small>${esc(cli(p.client_id).name)}</small><small class="kdt">${p.date?fmtD(p.date):''}</small></div></article>`).join('')}${k==='ideia'?'<button class="kadd" data-new="post">+ Nova demanda</button>':''}</section>`}).join('')}</div>`);
};

/* Aprovação */
V.aprov=()=>{
  const f=fv('af','pend'),L={pend:pend(),adj:posts().filter(p=>p.status==='reprovado'),ok:posts().filter(p=>p.status==='aprovado')}[f];
  const lastFb=p=>D.feedback.filter(x=>x.post_id===p.id).slice(-1)[0];
  return shell(topb('Aprovação','O que está com os clientes. Quando eles respondem no portal, aparece aqui')+`
  <div class="filters">${segF('af',[['pend','Esperando · '+pend().length],['adj','Ajustes pedidos · '+posts().filter(p=>p.status==='reprovado').length],['ok','Aprovados · '+posts().filter(p=>p.status==='aprovado').length]])}</div>
  ${L.length?`<div class="grid">${L.map(p=>{const fb=lastFb(p);return `<button class="card" data-edit-post="${esc(p.id)}"><div class="ph">${cover(p)?`<img src="${cover(p)}" alt="" loading="lazy">`:`<span class="noimg">${ty(p.type)}</span>`}<span class="k">${ty(p.type)}</span></div><div class="bd"><small>${cdot(p.client_id)}${esc(cli(p.client_id).name)} · ${fmtD(p.date)}${p.time?' · '+esc(p.time):''}</small><b>${esc(p.title)}</b>${fb&&fb.text?`<small style="color:var(--ink)">“${esc(fb.text)}”</small>`:''}</div></button>`}).join('')}</div>`:empty('Nada por aqui.')}`);
};

/* Agenda */
V.agenda=()=>{
  const now=new Date();if(!CALM)CALM=new Date(now.getFullYear(),now.getMonth(),1);
  const y=CALM.getFullYear(),m=CALM.getMonth(),sw=new Date(y,m,1).getDay(),nd=new Date(y,m+1,0).getDate(),cells=Math.ceil((sw+nd)/7)*7,mk=iso(CALM).slice(0,7),t0=today();
  const ev=docs('events').filter(e=>String(e.date).startsWith(mk)),ps=posts().filter(p=>String(p.date).startsWith(mk)&&p.type!=='story');
  let c='';for(let i=0;i<cells;i++){const d=i-sw+1;if(d<1||d>nd){c+='<div class="cell off"></div>';continue}
    const ds=`${mk}-${String(d).padStart(2,'0')}`,E=[...ev.filter(e=>e.date===ds).map(e=>[e.client,`${e.start||''} ${e.title}`,`data-edit-doc="events:${esc(e.id)}"`]),...ps.filter(p=>p.date===ds).map(p=>[p.client_id,`${p.time||''} ${p.title}`,`data-edit-post="${esc(p.id)}"`])];
    c+=`<div class="cell ${ds===t0?'today':''}" data-newday="${ds}"><span class="n">${d}</span>${E.map(([k,t,a])=>`<button class="ev" ${a} style="background:color-mix(in srgb,${esc(ccol(k))} 18%,transparent)"><i class="dot" style="background:${esc(ccol(k))}"></i><span>${esc(t)}</span></button>`).join('')}</div>`}
  return shell(topb(`${Mes(m)} ${y}`,'Reuniões, gravações, entregas e posts de todos os clientes',`<div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg"><button data-cal="-1">‹</button><button data-cal="1">›</button></div><button class="btn red" data-new="events">Novo evento</button></div>`)+`
  <div class="cal"><div class="wd">${WD.map(w=>`<div>${w}</div>`).join('')}</div><div class="cells">${c}</div></div>
  <div class="leg">${CL().map(k=>`<span><i class="dot" style="background:${esc(k.color)}"></i>${esc(k.name)}</span>`).join('')}</div>`);
};

/* Publicação */
V.pub=()=>{
  const Q=queue().sort((a,b)=>((a.publish_at||a.date||'')+(a.time||'')).localeCompare((b.publish_at||b.date||'')+(b.time||''))).filter(p=>fv('pf','fila')==='fila'?!isDone(p):isDone(p));
  const st=p=>p.publish_status==='publicado'?['Publicado','ok']:p.publish_status==='erro'?['Erro','']:p.publish_status==='agendado'?['Agendado','pend']:p.publish_status==='publicando'?['Publicando','pend']:['Aprovado, sem horário',''];
  const when=p=>p.publish_at?new Date(p.publish_at).toLocaleString('pt-BR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):`${fmtD(p.date)}${p.time?' · '+p.time:''}`;
  return shell(topb('Publicação','Aprovou no portal, o app agenda e publica no Instagram sozinho')+`
  <div class="flow">${[['Cliente aprova','no portal'],['Entra na fila','dia e hora do calendário'],['Publica sozinho','feed, carrossel ou Reels'],['Volta com o link','e marca Publicado']].map(([a,b],i)=>`<div><span>${i+1}</span><b>${a}</b><small>${b}</small></div>`).join('')}</div>
  <div class="filters">${segF('pf',[['fila','Na fila'],['feito','Publicados']])}</div>
  <div class="pgl"><div>${Q.length?`<div class="list">${Q.map(p=>{const [s,c]=st(p),k=p.keyword;return `<div class="row">${cover(p)?`<img src="${cover(p)}" alt="" style="width:46px;height:58px;object-fit:cover;border-radius:8px">`:`<span class="noimg" style="width:46px;height:58px">${ty(p.type)}</span>`}<div class="t"><b>${esc(p.title)}</b><small>${cdot(p.client_id)}${esc(cli(p.client_id).name)} · ${esc(when(p))}${k?` · palavra <span class="kw ${D.kw.has(k.toLowerCase())?'':'miss'}">${esc(k.toUpperCase())}</span>${D.kw.has(k.toLowerCase())?'':' falta criar'}`:''}${p.publish_error?` · <span style="color:var(--red)">${esc(p.publish_error)}</span>`:''}</small></div><span class="chip ${c}">${s}</span>${p.permalink?`<a class="btn sm ghost" href="${esc(p.permalink)}" target="_blank" rel="noopener">Ver post</a>`:`<button class="btn sm ghost" data-sched="${esc(p.id)}">${p.publish_status==='agendado'?'Mudar':'Agendar'}</button><button class="btn sm ghost" data-pubnow="${esc(p.id)}">Publicar agora</button>`}</div>`}).join('')}</div>`:empty(fv('pf','fila')==='fila'?'Nenhum post aprovado esperando publicação.':'Nada publicado pelo app ainda.')}</div>
  <div class="bx"><span class="lb">Contas conectadas</span><div class="al">${CL().map(c=>{const a=D.accounts.find(x=>x.client_id===c.id);return `<div>${cdot(c.id)}<b>${esc(c.name)}</b><small>${a?'@'+esc(a.username):''}</small>${a?`<button class="btn sm ghost" data-check="${esc(c.id)}">Testar</button>`:'<span class="chip">Não conectada</span>'}</div>`}).join('')}</div><span class="ft">Pelo app Stond no Meta · música da biblioteca do Instagram não funciona</span></div></div>`);
};

/* Clientes */
V.cli=()=>{
  const A=CL();
  const ren=docs('contracts').filter(k=>k.status==='assinado'&&k.renewAt&&k.renewAt>=today()&&(pd(k.renewAt)-new Date())/864e5<=30);
  const notas=A.map(c=>num((c.data||{}).nota)).filter(Boolean);
  const risk=A.filter(c=>health(c)<55);
  const SV=['Social media','Tráfego pago','Site','Branding','Vídeo','Sistemas'];
  return shell(topb('Clientes',`${active().length} ativos`,'<button class="btn red" data-new="client">Novo cliente</button>')+`
  <div class="ret"><div class="bx"><span class="lb">Nota média</span><div class="num">${notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toLocaleString('pt-BR',{maximumFractionDigits:1}):'—'}</div><span class="ft">Nota de 0 a 10 de cada cliente</span></div>
   <div class="bx"><span class="lb">Em risco</span><div class="num" style="${risk.length?'color:var(--red)':''}">${risk.length}</div><span class="ft">${risk.map(c=>esc(c.name)).join(', ')||'Ninguém'}</span></div>
   <div class="bx"><span class="lb">Renovam em 30 dias</span><div class="num">${ren.length}</div><span class="ft">${ren.map(k=>esc(cli(k.client).name)).join(', ')||'Nenhum'}</span></div>
   <div class="bx"><span class="lb">Receita recorrente</span><div class="num">${brl(mrr())}</div><span class="ft">Soma das mensalidades</span></div></div>
  <div class="cgrid">${A.map(c=>{const ps=posts().filter(p=>p.client_id===c.id),h=health(c),d=c.data||{},has=d.services||[],m=D.metrics.filter(x=>x.client_id===c.id).slice(-1)[0];return `<article class="cc"><div class="cv" style="background:linear-gradient(135deg,${esc(c.color)},color-mix(in srgb,${esc(c.color)} 30%,#0d0a0b))"></div><div class="cb"><span class="cav" style="background:${esc(c.color)}">${esc(c.name[0])}</span><div><b>${esc(c.name)}</b><small>@${esc(c.handle||'')}</small></div><span class="chip ${c.status==='ativo'?'ok':''}" style="margin-left:auto">${esc(c.status||'ativo')}</span></div>
   <div class="cs"><div><b>${ps.filter(p=>p.status==='pendente').length}</b><small>para aprovar</small></div><div><b>${ps.filter(p=>String(p.date).startsWith(month())).length}</b><small>posts no mês</small></div><div><b>${m?nf(m.followers):'—'}</b><small>seguidores</small></div></div>
   <div class="hl"><div><small style="flex:none">Saúde</small>${bar(h)}<small style="flex:none">${h}</small></div></div>
   <div class="cx"><span>Mensalidade <b>${fee(c)?brl(fee(c)):'—'}</b></span><span>Nota <b>${d.nota||'—'}</b></span>${d.renewAt?`<span>Renova <b>${fmtD(d.renewAt)}</b></span>`:''}</div>
   <div class="svc">${has.map(s=>`<span class="on">${esc(s)}</span>`).join('')}${SV.filter(s=>!has.includes(s)).slice(0,2).map(s=>`<span class="up">+ ${s}</span>`).join('')}</div>
   <div class="ca"><button class="btn sm ghost" data-edit-client="${esc(c.id)}">Editar</button><a class="btn sm ghost" href="https://portal.stond.com.br/?c=${esc(c.access_token)}" target="_blank" rel="noopener">Ver como cliente</a><button class="btn sm ghost" data-copy="https://portal.stond.com.br/?convite=${esc(c.access_token)}">Copiar convite</button></div></article>`}).join('')}</div>`);
};

/* Métricas */
V.met=()=>{
  const c=fv('mc',CL()[0]?.id),M=D.metrics.filter(x=>x.client_id===c),L=M.slice(-1)[0]||{},F=M[0]||{};
  return shell(topb('Métricas','Os números que o cliente vê no portal',`<button class="btn red" data-new="metric">Lançar números</button>`)+`<div class="filters">${segF('mc',CL().map(k=>[k.id,k.name]))}</div>
  <div class="bento"><div class="bx hero w2 w2m"><span class="lb">Seguidores</span><div class="num">${nf(L.followers)}${M.length>1?`<small>${L.followers-F.followers>=0?'+':''}${nf(L.followers-F.followers)} desde ${fmtD(F.date)}</small>`:''}</div><span class="ft">${L.date?'Última medição '+fmtD(L.date):'Sem medição ainda'}</span></div>
  <div class="bx"><span class="lb">Alcance</span><div class="num">${nf(L.reach)}</div></div><div class="bx"><span class="lb">Engajamento</span><div class="num">${L.engagement!=null?Number(L.engagement).toLocaleString('pt-BR')+'%':'—'}</div></div></div>
  <p class="eyebrow" style="margin-top:20px">Medições</p>${M.length?`<div class="list">${M.slice().reverse().map(r=>`<div class="row"><div class="t"><b>${fmtD(r.date)}</b><small>${nf(r.followers)} seguidores · ${nf(r.following)} seguindo · ${nf(r.posts)} posts${r.reach!=null?' · alcance '+nf(r.reach):''}${r.views!=null?' · visualizações '+nf(r.views):''}</small></div></div>`).join('')}</div>`:empty('Nenhuma medição.')}`);
};

/* Relatórios */
V.rel=()=>{
  const c=fv('rc',CL()[0]?.id),mk=fv('rm',iso(new Date(new Date().getFullYear(),new Date().getMonth()-1,1)).slice(0,7));
  const [y,m]=mk.split('-').map(Number),M=D.metrics.filter(x=>x.client_id===c),end=M.filter(x=>x.date<=iso(new Date(y,m,0))).slice(-1)[0],ini=M.filter(x=>x.date<mk+'-01').slice(-1)[0]||M[0];
  const ps=posts().filter(p=>p.client_id===c&&String(p.date).startsWith(mk)),ok=ps.filter(p=>['aprovado','publicado'].includes(p.status)||isDone(p));
  const fbs=D.feedback.filter(f=>f.client_id===c&&f.kind==='aprovado'&&String(f.created_at).startsWith(mk));
  const rep=doc1('reports',c+'_'+mk);
  const prev=iso(new Date(y,m-2,1)).slice(0,7),next=iso(new Date(y,m,1)).slice(0,7);
  return shell(topb('Relatórios','O relatório do mês. Você revisa, escreve o destaque e envia para o portal do cliente')+`<div class="filters">${segF('rc',CL().map(k=>[k.id,k.name]))}<div class="seg"><button data-f="rm" data-v="${prev}">‹</button><button aria-pressed="true">${Mes(m-1)} ${y}</button><button data-f="rm" data-v="${next}">›</button></div></div>
  <article class="rep"><div class="rh"><span class="cav sm" style="background:${esc(ccol(c))}">${esc(cli(c).name[0])}</span><div><b>${esc(cli(c).name)} · ${MES[m-1]}</b><small>O que a Stond entregou e o que mudou</small></div>${rep.sent?'<span class="chip ok" style="margin-left:auto">Enviado no portal</span>':''}</div>
   <div class="rk">${[['Seguidores',end?nf(end.followers):'—',end&&ini&&end!==ini?((end.followers-ini.followers>=0?'+':'')+nf(end.followers-ini.followers)):''],['Alcance',end&&end.reach!=null?nf(end.reach):'—',''],['Posts',String(ps.length),ok.length+' aprovados'],['Aprovações',String(fbs.length),'pelo portal']].map(([a,b,c2])=>`<div><small>${a}</small><b>${b}</b><em>${c2}</em></div>`).join('')}</div>
   <p class="rt"><b>Destaque</b>${esc(rep.destaque||'Escreva o destaque do mês')}</p><p class="rt"><b>Próximo mês</b>${esc(rep.proximo||'Escreva o plano do próximo mês')}</p>
   <div class="ca" style="padding:4px 0 0"><button class="btn sm ghost" data-edit-doc="reports:${esc(c+'_'+mk)}">Editar texto</button><button class="btn sm red" data-report-send="${esc(c+'_'+mk)}">${rep.sent?'Enviar de novo':'Enviar no portal'}</button></div></article>`);
};

/* Mensagens */
V.msg=()=>{
  const c=fv('gc',CL()[0]?.id),L=docs('messages').filter(m=>m.client===c).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
  return shell(topb('Mensagens','Conversa com cada cliente')+`<div class="filters">${segF('gc',CL().map(k=>[k.id,k.name]))}</div>
  <div class="list" style="padding:12px;gap:8px">${L.length?L.map(m=>`<div class="row" style="border:0;${m.who==='Cliente'?'':'justify-content:flex-end;text-align:right'}"><div class="t"><b style="font-weight:500">${esc(m.text)}</b><small>${esc(m.who==='Cliente'?cli(c).name:(m.by||'Stond'))} · ${m.at?new Date(m.at).toLocaleString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</small></div></div>`).join(''):'<p class="wait" style="padding:10px">Nenhuma mensagem com este cliente.</p>'}
  <form id="mf" style="display:flex;gap:8px;margin-top:6px"><input id="mt" placeholder="Escreva uma mensagem" style="flex:1" autocomplete="off"><button class="btn sm red">Enviar</button></form></div>`);
};

/* Gestão da Stond */
V.gest=()=>{
  const mk=month(),R=sum(finMonth(mk,'receita')),Dp=sum(finMonth(mk,'despesa')),cx=num(settings('caixa').saldo),ms=settings('metas');
  const fixas=sum(fin().filter(f=>f.type==='despesa'&&f.kind==='fixa'&&String(f.date||'').startsWith(mk)))||Dp;
  const fol=Dp?cx/Dp:0,lucro=R-Dp,mg=R?lucro/R*100:0;
  const top1=active().map(c=>fee(c)).sort((a,b)=>b-a)[0]||0,conc=mrr()?top1/mrr()*100:0;
  const obr=docs('obrig').filter(o=>!o.done);
  const sc=[['Caixa',Math.min(100,fol/6*100)],['Lucro',Math.max(0,Math.min(100,mg*2))],['Crescimento',ms.mrr?Math.min(100,mrr()/num(ms.mrr)*100):50],['Concentração',Math.max(0,100-conc)],['Obrigações em dia',obr.some(o=>o.due&&o.due<today())?40:100]];
  const score=Math.round(sc.reduce((s,x)=>s+x[1],0)/sc.length);
  const cats={};finMonth(mk,'despesa').forEach(f=>{cats[f.category||'Outros']=(cats[f.category||'Outros']||0)+num(f.amount)});
  const venc=[...fin().filter(f=>!f.paid&&f.type==='despesa'&&f.date>=today()),...obr.filter(o=>o.due>=today()).map(o=>({desc:o.title,date:o.due,amount:o.amount}))].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,5);
  const goals=[['Faturamento no ano',sum(fin().filter(f=>f.type==='receita'&&String(f.date).startsWith(String(new Date().getFullYear())))),num(ms.ano),1],['Clientes ativos',active().length,num(ms.clientes),0],['Reserva',cx,num(ms.reserva),1],['Receita recorrente',mrr(),num(ms.mrr),1]];
  return shell(topb('Gestão da Stond','Como a empresa está hoje','<button class="btn red" data-edit-doc="settings:metas">Metas e caixa</button>')+`
  <div class="bento">
   <div class="bx hero w2 h2 w2m"><span class="lb">Saúde da empresa</span><div class="num">${score}<small>de 100</small></div><div class="gs">${sc.map(([t,v])=>`<div class="gi"><small>${t}</small>${bar(v)}<b>${Math.round(v)}</b></div>`).join('')}</div><span class="ft">${conc>40?`Atenção: um cliente é ${Math.round(conc)}% da receita`:'Receita bem distribuída entre os clientes'}</span></div>
   <div class="bx"><span class="lb">Caixa hoje</span><div class="num">${brl(cx)}</div><span class="ft">${settings('caixa').atualizado?'Atualizado '+fmtD(settings('caixa').atualizado):'Atualize em Metas e caixa'}</span></div>
   <div class="bx"><span class="lb">Fôlego</span><div class="num">${Dp?fol.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—'}<small>meses</small></div><span class="ft">Caixa ÷ despesas do mês</span></div>
   <div class="bx"><span class="lb">Ponto de equilíbrio</span><div class="num">${brl(fixas)}</div><div class="prog"><b style="width:${fixas?Math.min(100,R/fixas*100):0}%;background:${R>=fixas?'var(--ok)':'var(--red)'}"></b></div><span class="ft">${R>=fixas?'Batido este mês':'Faltam '+brl(fixas-R)}</span></div>
   <div class="bx"><span class="lb">Lucro do mês</span><div class="num" style="color:${lucro>=0?'var(--ok)':'var(--red)'}">${brl(lucro)}</div><span class="ft">Margem ${Math.round(mg)}%</span></div>
   <div class="bx w2 w2m"><span class="lb">Resultado do mês</span><div class="dre"><div><span>Receitas</span><b>${brl(R)}</b></div>${Object.entries(cats).map(([k,v])=>`<div class="m"><span>${esc(k)}</span><b>−${brl(v)}</b></div>`).join('')}<div class="tot"><span>Lucro da Stond</span><b>${brl(lucro)}</b></div></div></div>
   <div class="bx w2 w2m"><span class="lb">Próximos vencimentos</span>${venc.length?`<div class="al">${venc.map(v=>`<div><b style="width:62px;flex:none">${fmtD(v.date).replace(/^\w+, /,'')}</b><small>${esc(v.desc)}</small><b style="font-weight:500">${v.amount?brl(v.amount):''}</b></div>`).join('')}</div>`:'<p class="wait">Nenhuma conta ou prazo pela frente.</p>'}</div>
   <div class="bx w4 w2m"><span class="lb">Metas de ${new Date().getFullYear()}</span><div class="mt">${goals.map(([n,a,g,money])=>`<div><small>${n}</small><b>${money?brl(a):a}<em>${g?'de '+(money?brl(g):g):'sem meta'}</em></b><div class="prog"><b style="width:${g?Math.min(100,a/g*100):0}%"></b></div></div>`).join('')}</div></div>
  </div>`);
};

/* Crescimento */
V.cres=()=>{
  const SV=['Social media','Tráfego pago','Site','Branding','Vídeo','Sistemas'],L=docs('leads'),src={};
  L.forEach(l=>{const s=l.source||'Outro';src[s]=src[s]||[0,0];src[s][0]++;if(l.stage==='fechado')src[s][1]++});
  const ref=L.filter(l=>/indica/i.test(l.source||''));
  const ms=settings('metas');
  return shell(topb('Crescimento','Onde a próxima receita está')+`
  <div class="bento">
   <div class="bx hero w2 w2m"><span class="lb">Meta de receita recorrente</span><div class="num">${brl(num(ms.mrr))}</div><div class="prog"><b style="width:${num(ms.mrr)?Math.min(100,mrr()/num(ms.mrr)*100):0}%"></b></div><span class="ft">Hoje ${brl(mrr())} · ${num(ms.mrr)>mrr()?'faltam '+brl(num(ms.mrr)-mrr()):'meta batida'}</span></div>
   <div class="bx w2 w2m"><span class="lb">Origem dos clientes</span>${Object.keys(src).length?`<div class="obar">${Object.entries(src).map(([n,[l,f]])=>`<div><small>${esc(n)}</small>${bar(l?f/l*100:0,'var(--red)')}<small>${f} de ${l}</small></div>`).join('')}</div><span class="ft">Leads que viraram cliente, por canal</span>`:'<p class="wait">Cadastre a origem dos leads em Comercial.</p>'}</div>
   <div class="bx w4 w2m"><span class="lb">Serviços por cliente</span><div class="mx"><div class="mh"><span></span>${SV.map(s=>`<small>${s}</small>`).join('')}</div>${active().map(c=>{const has=(c.data||{}).services||[];return `<div class="mr"><span>${cdot(c.id)}${esc(c.name)}</span>${SV.map(s=>has.includes(s)?'<i class="y">✓</i>':`<button class="o" data-offer="${esc(c.id)}|${esc(s)}">Oferecer</button>`).join('')}</div>`}).join('')}</div><span class="ft">Marque os serviços de cada cliente em Clientes, Editar</span></div>
   <div class="bx w2 w2m"><span class="lb">Indicações</span><div class="num">${ref.length}<small>leads por indicação</small></div>${ref.length?`<div class="al">${ref.slice(-3).map(l=>`<div><b>${esc(l.name)}</b><small>${esc(l.note||l.company||'')}</small><span class="chip">${esc(l.stage||'novo')}</span></div>`).join('')}</div>`:''}<span class="ft">Coloque "Indicação" na origem do lead</span></div>
   <div class="bx w2 w2m"><span class="lb">Vira case</span>${(()=>{const b=D.metrics.filter(m=>m.extra&&m.extra.best).slice(-1)[0];const p=b&&posts().find(x=>x.id===b.extra.best.post_id);return p?`<div class="cs2">${cover(p)?`<img src="${cover(p)}" alt="">`:''}<div><b>${esc(p.title)}</b><small>${esc(cli(p.client_id).name)} · ${nf(b.extra.best.views)} visualizações</small></div></div>`:'<p class="wait">Quando um post bater recorde nas métricas, ele aparece aqui.</p>'})()}</div>
  </div>`);
};

/* Comercial */
const STG=[['novo','Novo','#8a5560'],['contato','Em contato','#3f8fd8'],['proposta','Proposta enviada','#e0a33b'],['negociacao','Negociação','#c868b8'],['fechado','Fechado','#3fbf7f']];
V.com=()=>{
  const L=docs('leads'),src={};L.forEach(l=>{const s=l.source||'Outro';src[s]=(src[s]||0)+1});
  return shell(topb('Comercial',`${L.filter(l=>!['fechado','perdido'].includes(l.stage)).length} leads abertos`,'<button class="btn red" data-new="leads">Novo lead</button>')+`
  ${Object.keys(src).length?`<div class="ori big">${Object.entries(src).slice(0,4).map(([n,v])=>{const f=L.filter(l=>(l.source||'Outro')===n&&l.stage==='fechado').length;return `<div class="bx"><span class="lb">${esc(n)}</span><div class="num">${v}<small>leads</small></div><span class="ft">${Math.round(f/v*100)}% viraram cliente</span></div>`}).join('')}</div>`:''}
  <div class="kb">${STG.map(([k,n,c])=>{const it=L.filter(l=>(l.stage||'novo')===k);return `<section class="kc" data-drop-lead="${k}"><header style="--cc:${c}"><b>${n}</b><span>${it.length?brl(sum(it.map(l=>({amount:l.value})))):''}</span></header>${it.map(l=>`<article class="kd" draggable="true" data-drag-lead="${esc(l.id)}" data-edit-doc="leads:${esc(l.id)}"><b>${esc(l.name)}</b>${l.source?`<span class="og">${esc(l.source)}</span>`:''}<small>${esc(l.company||l.note||'')}</small><div class="km"><small class="kdt" style="margin:0">${l.value?brl(l.value)+'/mês':''}</small>${l.nextDate?`<small style="margin-left:auto">${fmtD(l.nextDate)}</small>`:''}</div></article>`).join('')}</section>`}).join('')}</div>`);
};

/* Propostas e contratos */
V.prop=()=>{
  const L=docs('contracts').sort((a,b)=>String(b.start||b.createdAt||'').localeCompare(String(a.start||a.createdAt||'')));
  const ST={rascunho:'',enviado:'pend',assinado:'ok',recusado:''};
  const total=k=>(k.services||[]).reduce((s,x)=>s+num(x.price)*(num(x.qty)||1),0)||num(k.value);
  return shell(topb('Propostas e contratos','Tudo o que foi proposto e assinado','<button class="btn red" data-new="contracts">Nova proposta</button>')+`
  ${L.length?`<div class="list">${L.map(k=>`<button class="row" data-edit-doc="contracts:${esc(k.id)}"><span class="ico2">${ic.prop}</span><div class="t"><b>${esc(k.client?cli(k.client).name:(k.contact||k.title||'Sem cliente'))}</b><small>${esc(k.kind==='contrato'?'Contrato':'Proposta')}${k.number?' '+esc(k.number):''}${k.title?' · '+esc(k.title):''}${k.renewAt?' · renova '+fmtD(k.renewAt):''}</small></div><b style="font-weight:500">${brl(total(k))}</b><span class="chip ${ST[k.status]||''}">${esc(k.status||'rascunho')}</span></button>`).join('')}</div>`:empty('Nenhuma proposta ainda.')}`);
};

/* Financeiro */
V.fin=()=>{
  const mk=fv('fm',month()),[y,m]=mk.split('-').map(Number),R=finMonth(mk,'receita'),Dp=finMonth(mk,'despesa');
  const months=[...Array(6)].map((_,i)=>{const d=new Date(y,m-6+i,1),k=iso(d).slice(0,7);return [MES[d.getMonth()].slice(0,3),sum(finMonth(k,'receita')),sum(finMonth(k,'despesa'))]});
  const mx=Math.max(1,...months.flatMap(x=>[x[1],x[2]]));
  const L=[...R,...Dp].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const prev=iso(new Date(y,m-2,1)).slice(0,7),next=iso(new Date(y,m,1)).slice(0,7);
  const pc={};const per={};active().forEach(c=>{const r=sum(fin().filter(f=>f.client===c.id&&f.type==='receita'&&String(f.date).startsWith(mk)))||fee(c);const d=sum(fin().filter(f=>f.client===c.id&&f.type==='despesa'&&String(f.date).startsWith(mk)));per[c.id]=[r,d]});
  Dp.forEach(f=>{pc[f.category||'Outros']=(pc[f.category||'Outros']||0)+num(f.amount)});const dt=sum(Dp)||1;
  return shell(topb('Financeiro',`${Mes(m-1)} ${y}`,`<div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg"><button data-f="fm" data-v="${prev}">‹</button><button data-f="fm" data-v="${next}">›</button></div><button class="btn red" data-new="fin">Novo lançamento</button></div>`)+`
  <div class="bento">
   <div class="bx"><span class="lb">Entrou</span><div class="num">${brl(sum(R.filter(f=>f.paid)))}</div><span class="ft">de ${brl(sum(R))} previstos</span></div>
   <div class="bx"><span class="lb">Saiu</span><div class="num">${brl(sum(Dp.filter(f=>f.paid)))}</div><span class="ft">de ${brl(sum(Dp))} previstos</span></div>
   <div class="bx hero w2 w2m"><span class="lb">Saldo do mês</span><div class="num">${brl(sum(R.filter(f=>f.paid))-sum(Dp.filter(f=>f.paid)))}<small>previsto ${brl(sum(R)-sum(Dp))}</small></div><span class="ft">${R.filter(f=>!f.paid&&f.date<today()).length} recebimentos atrasados</span></div>
   <div class="bx w2 h2 w2m"><span class="lb">Últimos 6 meses</span><svg class="ch" viewBox="0 0 300 140" aria-label="Receitas e despesas">${months.map((x,i)=>`<rect x="${i*50+8}" y="${120-x[1]/mx*110}" width="16" height="${x[1]/mx*110}" rx="3" fill="#f80b1d"/><rect x="${i*50+26}" y="${120-x[2]/mx*110}" width="16" height="${x[2]/mx*110}" rx="3" fill="currentColor" fill-opacity=".22"/><text x="${i*50+25}" y="136" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity=".55">${x[0]}</text>`).join('')}</svg><span class="ft"><i class="dot" style="background:#f80b1d;display:inline-block"></i> receitas &nbsp; <i class="dot" style="background:var(--muted);display:inline-block"></i> despesas</span></div>
   <div class="bx w2 w2m"><span class="lb">Para onde vai o dinheiro</span>${Object.keys(pc).length?`<div class="obar">${Object.entries(pc).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div><small>${esc(n)}</small>${bar(v/dt*100,'var(--red)')}<small>${Math.round(v/dt*100)}%</small></div>`).join('')}</div>`:'<p class="wait">Sem despesas no mês.</p>'}</div>
   <div class="bx w2 w2m"><span class="lb">Lucro por cliente</span><div class="obar">${active().map(c=>{const [r,d]=per[c.id];const p=r?(r-d)/r*100:0;return `<div><small>${esc(c.name)}</small>${bar(p,c.color)}<small>${r?Math.round(p)+'%':'—'}</small></div>`}).join('')}</div><span class="ft">Mensalidade menos despesas ligadas ao cliente</span></div>
  </div>
  <p class="eyebrow" style="margin-top:20px">Lançamentos</p>${L.length?`<div class="list">${L.map(f=>`<button class="row" data-edit-doc="fin:${esc(f.id)}">${f.client?cdot(f.client):'<i class="cd" style="background:var(--line)"></i>'}<div class="t"><b>${esc(f.desc||'Sem descrição')}</b><small>${fmtD(f.date)} · ${esc(f.category||'')}${f.client?' · '+esc(cli(f.client).name):''}</small></div><b style="font-weight:500;color:${f.type==='receita'?'var(--ok)':'var(--ink)'}">${f.type==='receita'?'+':'−'}${brl(f.amount)}</b><span class="chip ${f.paid?'ok':f.date<today()?'':'pend'}">${f.paid?(f.type==='receita'?'Recebido':'Pago'):f.date<today()?'Atrasado':'Aberto'}</span></button>`).join('')}</div>`:empty('Nenhum lançamento neste mês.')}`);
};

/* Administrativo */
V.adm=()=>{
  const E=settings('empresa'),O=docs('obrig').sort((a,b)=>String(a.due).localeCompare(String(b.due))),T=docs('tools'),Tm=docs('team'),Dc=docs('cdocs');
  const nfm=fin().filter(f=>f.type==='receita'&&String(f.date).startsWith(month()));
  return shell(topb('Administrativo','Empresa, prazos, notas, ferramentas e equipe')+`
  <div class="bento">
   <div class="bx hero w2 w2m"><span class="lb">Empresa</span><div class="kv">${[['Razão social',E.razao],['CNPJ',E.cnpj],['Regime',E.regime],['Domínio',E.dominio||'stond.com.br · renova 18 mai 2027'],['E-mail',E.email||'contato@stond.com.br'],['Banco',E.banco]].map(([a,b])=>`<div><small>${a}</small><b>${esc(b||'—')}</b></div>`).join('')}</div><button class="btn sm ghost" style="align-self:flex-start" data-edit-doc="settings:empresa">Editar</button></div>
   <div class="bx w2 w2m"><span class="lb">Obrigações e prazos</span>${O.length?`<div class="al">${O.map(o=>`<div data-edit-doc="obrig:${esc(o.id)}" style="cursor:pointer"><b style="width:62px;flex:none">${fmtD(o.due).replace(/^\w+, /,'')}</b><small>${esc(o.title)}</small><span class="chip ${o.done?'ok':o.due<today()?'':'pend'}">${o.done?'Feito':o.due<today()?'Atrasado':'Aberto'}</span></div>`).join('')}</div>`:'<p class="wait">Cadastre DAS, DEFIS, renovações.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-new="obrig">Adicionar</button></div>
   <div class="bx w2 w2m"><span class="lb">Notas fiscais · ${MES[new Date().getMonth()]}</span>${nfm.length?`<div class="al">${nfm.map(f=>`<div data-edit-doc="fin:${esc(f.id)}" style="cursor:pointer">${cdot(f.client)}<b>${esc(cli(f.client).name)}</b><small>${esc(f.nf||f.desc||'')}</small><span class="chip ${f.nf?'ok':'pend'}">${f.nf?'Emitida':'Emitir'}</span></div>`).join('')}</div>`:'<p class="wait">As receitas do mês aparecem aqui para emitir a nota.</p>'}</div>
   <div class="bx w2 w2m"><span class="lb">Ferramentas e assinaturas</span>${T.length?`<div class="al">${T.map(t=>`<div data-edit-doc="tools:${esc(t.id)}" style="cursor:pointer"><small style="color:var(--ink)">${esc(t.name)}</small><b style="font-weight:500">${num(t.amount)?brl(t.amount):'Grátis'}</b></div>`).join('')}</div><span class="ft">${brl(sum(T))}/mês</span>`:'<p class="wait">Nenhuma ferramenta cadastrada.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-new="tools">Adicionar</button></div>
   <div class="bx w2 w2m"><span class="lb">Equipe e freelas</span>${Tm.length?`<div class="al">${Tm.map(t=>`<div data-edit-doc="team:${esc(t.id)}" style="cursor:pointer"><span class="av xs" style="margin:0">${esc((t.name||'?')[0])}</span><b>${esc(t.name)}</b><small>${esc(t.role||'')}</small><b style="font-weight:500">${num(t.amount)?brl(t.amount):''}</b></div>`).join('')}</div>`:'<p class="wait">Cadastre quem trabalha com a Stond.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-new="team">Adicionar</button></div>
   ${(()=>{const sp=space();if(!sp)return '';const c=v=>v>=.9?'var(--red)':v>=.7?'var(--warn)':'var(--ok)';
     return `<div class="bx w4 w2m"><span class="lb">Espaço do sistema · Supabase grátis</span><div class="kv"><div><small>Fotos e vídeos</small><b>${mb(sp.u.files_bytes)} de 1 GB · ${sp.u.files_count} arquivos</b></div><div class="prog"><b style="width:${Math.min(100,sp.f*100)}%;background:${c(sp.f)}"></b></div><div><small>Banco de dados</small><b>${mb(sp.u.db_bytes)} de 500 MB</b></div><div class="prog"><b style="width:${Math.min(100,sp.d*100)}%;background:${c(sp.d)}"></b></div></div>${(sp.u.largest||[]).length?`<span class="ft">Maiores arquivos: ${sp.u.largest.slice(0,3).map(x=>esc(String(x.name).split('/').pop())+' ('+mb(x.bytes)+')').join(', ')}</span>`:''}<span class="ft">Aviso em amarelo a partir de 70% e vermelho a partir de 90%. Cada arquivo pode ter até 50 MB.</span></div>`})()}
   <div class="bx w4 w2m"><span class="lb">Documentos da empresa</span>${Dc.length?`<div class="docs">${Dc.map(d=>`<a class="doc" href="${esc(d.url)}" target="_blank" rel="noopener"><span>${esc(d.kind||'LINK')}</span>${esc(d.name)}</a>`).join('')}</div>`:'<p class="wait">Contrato social, cartão CNPJ, modelos.</p>'}<button class="btn sm ghost" style="align-self:flex-start" data-new="cdocs">Adicionar link</button></div>
  </div>`);
};

/* ---------- formulários ---------- */
const clientOpts=()=>[['','Stond (sem cliente)'],...CL().map(c=>[c.id,c.name])];
const FORMS={
 events:{t:'Evento',f:[['title','Título'],['date','Data','date'],['start','Início','time'],['end','Fim','time'],['client','Cliente','sel',clientOpts],['kind','Tipo','sel',[['reuniao','Reunião'],['gravacao','Gravação'],['entrega','Entrega'],['outro','Outro']]],['note','Anotação','area']]},
 leads:{t:'Lead',f:[['name','Nome'],['company','Empresa ou serviço'],['value','Valor por mês','num'],['source','Origem','sel',[['Indicação','Indicação'],['Instagram','Instagram'],['Site','Site'],['LinkedIn','LinkedIn'],['Outro','Outro']]],['stage','Etapa','sel',[...STG.map(s=>[s[0],s[1]]),['perdido','Perdido']]],['nextStep','Próximo passo'],['nextDate','Data do próximo passo','date'],['note','Anotação','area']]},
 contracts:{t:'Proposta ou contrato',f:[['kind','Tipo','sel',[['proposta','Proposta'],['contrato','Contrato']]],['client','Cliente','sel',clientOpts],['contact','Contato (se ainda não é cliente)'],['number','Número'],['title','Serviço'],['value','Valor por mês','num'],['start','Início','date'],['renewAt','Renova em','date'],['status','Situação','sel',[['rascunho','Rascunho'],['enviado','Enviado'],['assinado','Assinado'],['recusado','Recusado']]],['obs','Observações','area']]},
 fin:{t:'Lançamento',f:[['type','Tipo','sel',[['receita','Receita'],['despesa','Despesa']]],['desc','Descrição'],['amount','Valor','num'],['date','Data','date'],['category','Categoria'],['kind','Fixa ou variável','sel',[['variavel','Variável'],['fixa','Fixa']]],['client','Cliente','sel',clientOpts],['paid','Pago ou recebido','chk'],['nf','Nota fiscal (número)'],['note','Anotação','area']]},
 obrig:{t:'Obrigação',f:[['title','O que é'],['due','Vence em','date'],['amount','Valor','num'],['done','Feito','chk'],['note','Anotação','area']]},
 tools:{t:'Ferramenta',f:[['name','Nome'],['amount','Valor por mês','num'],['note','Anotação','area']]},
 team:{t:'Pessoa',f:[['name','Nome'],['role','Função'],['amount','Valor por mês','num'],['contact','Contato']]},
 cdocs:{t:'Documento',f:[['name','Nome'],['url','Link'],['kind','Tipo','sel',[['PDF','PDF'],['DOC','DOC'],['LINK','Link'],['ZIP','ZIP']]]]},
 reports:{t:'Relatório do mês',f:[['destaque','Destaque','area'],['proximo','Próximo mês','area']]},
 'settings:metas':{t:'Metas e caixa',f:[['mrr','Meta de receita recorrente','num'],['ano','Meta de faturamento no ano','num'],['clientes','Meta de clientes ativos','num'],['capacidade','Clientes que a equipe aguenta','num'],['reserva','Meta de reserva','num'],['saldo','Caixa hoje','num',null,'caixa']]},
 'settings:empresa':{t:'Empresa',f:[['razao','Razão social'],['cnpj','CNPJ'],['regime','Regime'],['dominio','Domínio'],['email','E-mail'],['banco','Banco']]},
};
const field=([k,l,t,o],v)=>{const id='f_'+k;const opts=typeof o==='function'?o():o;
  if(t==='sel')return `<div class="fld"><label for="${id}">${l}</label><select id="${id}" name="${k}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v??'')===String(a)?'selected':''}>${esc(b)}</option>`).join('')}</select></div>`;
  if(t==='area')return `<div class="fld full"><label for="${id}">${l}</label><textarea id="${id}" name="${k}" rows="3">${esc(v??'')}</textarea></div>`;
  if(t==='chk')return `<label class="fck"><input type="checkbox" name="${k}" ${v?'checked':''}> ${l}</label>`;
  return `<div class="fld"><label for="${id}">${l}</label><input id="${id}" name="${k}" type="${t==='num'?'text':t||'text'}" ${t==='num'?'inputmode="decimal"':''} value="${esc(v??'')}"></div>`};
function formModal(title,fields,vals,onSave,onDel,extra=''){
  MODAL={html:()=>`<div class="ovl" data-close><form class="fm" id="fm" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="hd"><b>${esc(title)}</b><button class="x" type="button" data-x aria-label="Fechar">✕</button></div><div class="fg">${fields.map(f=>field(f,vals[f[0]])).join('')}</div>${extra}<div class="fa">${onDel?'<button class="btn sm ghost" type="button" id="fdel">Excluir</button>':''}<span style="flex:1"></span><button class="btn sm ghost" type="button" data-x>Cancelar</button><button class="btn sm red" id="fsave">Salvar</button></div></form></div>`,onSave,onDel,fields};
  render();
}
function readForm(fields){const o={};const f=$('#fm');fields.forEach(([k,,t])=>{const el=f.elements[k];if(!el)return;o[k]=t==='chk'?el.checked:t==='num'?(el.value===''?'':num(el.value)):el.value.trim()});return o}
function openDoc(col,id,preset={}){
  const key=col==='settings'?'settings:'+id:col,F=FORMS[key];if(!F)return;
  const cur=id?(col==='settings'&&id==='metas'?{...doc1('settings','metas'),saldo:doc1('settings','caixa').saldo}:docs(col).find(d=>d.id===id)||doc1(col,id)):{...preset};
  formModal(F.t,F.f,cur,async v=>{
    if(key==='settings:metas'){const {saldo,...rest}=v;await saveDoc('settings','metas',{...doc1('settings','metas'),...rest});await saveDoc('settings','caixa',{saldo,atualizado:today()});return}
    await saveDoc(col,id,{...(id?docs(col).find(d=>d.id===id)||doc1(col,id):{}),...v,...(id?{}:{createdAt:new Date().toISOString()})});
  },id&&col!=='settings'&&col!=='reports'?async()=>delDoc(col,id):null);
}
const POSTF=[['title','Título'],['client_id','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['type','Formato','sel',[['carrossel','Carrossel'],['reels','Reels'],['post','Post'],['story','Stories']]],['date','Data','date'],['time','Hora','time'],['due','Prazo da produção','date'],['col','Etapa','sel',COLS.slice(0,4).map(c=>[c[0],c[1]])],['keyword','Palavra da automação'],['caption','Legenda','area'],['brief','Briefing','area'],['internal_note','Nota interna (cliente não vê)','area']];
function openPost(id){
  const p=id?posts().find(x=>x.id===id):{client_id:fv('dc','all')!=='all'?fv('dc'):CL()[0]?.id,type:'carrossel',status:'rascunho',stage:'ideia',media:[]};
  const media=(p.media||[]);
  const extra=`<div class="fld full"><label>Mídia</label><div class="mrow">${media.map((m,i)=>`<span class="mth">${m.kind==='video'?'<span class="noimg">vídeo</span>':`<img src="${mediaUrl(m.url,p.client_id)}" alt="">`}<button type="button" data-rmmedia="${i}" aria-label="Tirar">✕</button></span>`).join('')}<label class="mth add">+<input type="file" id="fmup" accept="image/*,video/*" multiple hidden></label></div></div>${id&&D.feedback.some(f=>f.post_id===id)?`<div class="fld full"><label>Conversa com o cliente</label>${D.feedback.filter(f=>f.post_id===id).map(f=>`<small class="hist">${esc(f.author||'Cliente')} · ${f.kind==='aprovado'?'aprovou':f.kind==='ajuste'?'pediu ajuste':'comentou'}${f.text?': '+esc(f.text):''}</small>`).join('')}</div>`:''}`;
  const vals={...p,col:colOf(p)==='publicado'?'agendamento':colOf(p)};
  POST_EDIT={...p,media:[...media]};
  formModal(id?'Demanda':'Nova demanda',POSTF,vals,async v=>{
    const {col,...rest}=v;const st=colStatus(col,POST_EDIT);
    const row={...POST_EDIT,...rest,...st,media:POST_EDIT.media};
    if(!row.id)row.id=`${row.client_id}-${Date.now().toString(36)}`;
    ['date','due'].forEach(k=>{if(!row[k])row[k]=null});
    await savePost(row);
  },id?async()=>{const {error}=await sb.from('posts').delete().eq('id',id);if(error)throw new Error(error.message);D.posts=D.posts.filter(x=>x.id!==id)}:null,extra);
}
let POST_EDIT=null;
function colStatus(col,p){
  if(col==='ideia')return {status:'rascunho',stage:'ideia'};
  if(col==='producao')return {status:'rascunho',stage:'producao'};
  if(col==='aprovacao')return {status:'pendente',stage:'aprovacao'};
  if(col==='agendamento')return {status:'aprovado',stage:'aprovado'};
  if(col==='publicado')return {status:'publicado',stage:'aprovado',publish_status:'publicado'};
  return {};
}
function openClient(id){
  const c=id?cli(id):{id:'',name:'',color:'#c868b8',status:'ativo',data:{}},d=c.data||{};
  const SV=['Social media','Tráfego pago','Site','Branding','Vídeo','Sistemas'];
  const F=[['name','Nome'],['handle','Instagram (sem @)'],['color','Cor','color'],['status','Situação','sel',[['ativo','Ativo'],['pausado','Pausado'],['inativo','Inativo']]],['fee','Mensalidade','num'],['since','Cliente desde','date'],['renewAt','Renova em','date'],['nota','Nota do cliente (0 a 10)','num'],['origem','Origem','sel',[['',''],['Indicação','Indicação'],['Instagram','Instagram'],['Site','Site'],['Outro','Outro']]]];
  const extra=`<div class="fld full"><label>Serviços</label><div class="svc" style="padding:0">${SV.map(s=>`<label class="fck"><input type="checkbox" data-svc="${esc(s)}" ${(d.services||[]).includes(s)?'checked':''}> ${s}</label>`).join('')}</div></div>`;
  formModal(id?'Cliente':'Novo cliente',F,{name:c.name,handle:c.handle,color:c.color,status:c.status,...d},async v=>{
    const services=[...document.querySelectorAll('[data-svc]')].filter(x=>x.checked).map(x=>x.dataset.svc);
    const {name,handle,color,status,...rest}=v;
    const row={id:c.id||name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),name,handle:handle.replace(/^@/,''),color,status,data:{...d,...rest,services}};
    const {data,error}=await sb.from('clients').upsert(row).select('id,name,handle,color,status,data,access_token').single();if(error)throw new Error(error.message);
    const i=D.clients.findIndex(x=>x.id===data.id);i>=0?D.clients[i]=data:D.clients.push(data);
  },null,extra);
}
function openMetric(){
  const c=fv('mc',CL()[0]?.id);
  formModal('Lançar números · '+cli(c).name,[['date','Data','date'],['followers','Seguidores','num'],['following','Seguindo','num'],['posts','Posts','num'],['reach','Alcance','num'],['views','Visualizações','num'],['engagement','Engajamento (%)','num']],{date:today()},async v=>{
    const row={client_id:c,...Object.fromEntries(Object.entries(v).map(([k,x])=>[k,x===''?null:x]))};
    const {error}=await sb.from('ig_metrics').upsert(row);if(error)throw new Error(error.message);
    D.metrics=D.metrics.filter(m=>!(m.client_id===c&&m.date===row.date)).concat([{...row,extra:{}}]).sort((a,b)=>a.date.localeCompare(b.date));
  });
}
function openSchedule(id){
  const p=posts().find(x=>x.id===id);const dt=p.publish_at?new Date(p.publish_at):p.date?new Date(`${p.date}T${(p.time||'19:00').padStart(5,'0')}:00`):new Date();
  const lv=new Date(dt.getTime()-dt.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  formModal('Agendar no Instagram',[['when','Dia e hora','datetime-local'],['keyword','Palavra da automação']],{when:lv,keyword:p.keyword},async v=>{
    if(!v.when)throw new Error('Escolha dia e hora.');
    await savePost({...p,keyword:v.keyword||null,publish_at:new Date(v.when).toISOString(),publish_status:'agendado',publish_error:null});
  },p.publish_status==='agendado'?async()=>savePost({...p,publish_at:null,publish_status:null}):null,`<p class="wait" style="margin:0">Na hora marcada o app publica sozinho na conta conectada do cliente. Para tirar da fila, use Excluir.</p>`);
}

/* ---------- render e eventos ---------- */
function render(){
  const m=$('.main'),y=m?m.scrollTop:0;
  document.getElementById('app').innerHTML=V[S]();
  const n=$('.main');if(n&&MODAL)n.scrollTop=y;
}
function go(s){S=s;MODAL=null;history.replaceState(null,'','#'+s);render();const m=$('.main');if(m)m.scrollTop=0}

document.addEventListener('click',async e=>{
  const t=e.target;
  if(t.closest('[data-theme-toggle]')){ls.set('stond-tema',document.documentElement.classList.contains('light')?'dark':'light');applyTheme();render();return}
  if(t.closest('[data-out]')){await sb.auth.signOut();location.reload();return}
  if(MODAL){
    if(t.closest('[data-x]')||(t.matches('[data-close]'))){MODAL=null;render();return}
    const rm=t.closest('[data-rmmedia]');if(rm){POST_EDIT.media.splice(+rm.dataset.rmmedia,1);rm.parentElement.remove();return}
    if(t.closest('#fdel')){if(!confirmDel(t.closest('#fdel')))return;try{await MODAL.onDel();MODAL=null;toast('Excluído');render()}catch(x){toast(x.message)}return}
    return;
  }
  const g=t.closest('[data-go]');if(g){go(g.dataset.go);return}
  const f=t.closest('[data-f]');if(f){FILT[f.dataset.f]=f.dataset.v;render();return}
  const cal=t.closest('[data-cal]');if(cal){CALM=new Date(CALM.getFullYear(),CALM.getMonth()+Number(cal.dataset.cal),1);render();return}
  const ep=t.closest('[data-edit-post]');if(ep){openPost(ep.dataset.editPost);return}
  const ed=t.closest('[data-edit-doc]');if(ed){const [c,i]=ed.dataset.editDoc.split(':');openDoc(c,i);return}
  const ec=t.closest('[data-edit-client]');if(ec){openClient(ec.dataset.editClient);return}
  const sc=t.closest('[data-sched]');if(sc){openSchedule(sc.dataset.sched);return}
  const nw=t.closest('[data-new]');if(nw){const k=nw.dataset.new;if(k==='post')openPost();else if(k==='client')openClient();else if(k==='metric')openMetric();else openDoc(k,null,k==='events'?{date:today(),kind:'reuniao'}:k==='fin'?{type:'despesa',date:today()}:k==='leads'?{stage:'novo'}:k==='contracts'?{kind:'proposta',status:'rascunho'}:{});return}
  const nd=t.closest('[data-newday]');if(nd&&t===nd||t.classList?.contains('n')){const c=t.closest('[data-newday]');if(c){openDoc('events',null,{date:c.dataset.newday,kind:'reuniao'});return}}
  const cp=t.closest('[data-copy]');if(cp){try{await navigator.clipboard.writeText(cp.dataset.copy);toast('Link copiado')}catch(x){toast(cp.dataset.copy)}return}
  const of=t.closest('[data-offer]');if(of){const [c,s]=of.dataset.offer.split('|');openDoc('leads',null,{name:cli(c).name,company:s,source:'Cliente atual',stage:'novo'});return}
  const pn=t.closest('[data-pubnow]');if(pn){if(!confirmDel(pn,'Toque de novo para publicar'))return;pn.disabled=true;pn.textContent='Publicando…';
    const {data,error}=await sb.functions.invoke('ig-publish',{body:{action:'now',post_id:pn.dataset.pubnow}});
    await load();render();toast(error?error.message:data.error?data.error:data.pending?'O vídeo ainda está processando na Meta. Ele sai sozinho em alguns minutos':'Publicado no Instagram');return}
  const ck=t.closest('[data-check]');if(ck){ck.disabled=true;ck.textContent='Testando…';const {data,error}=await sb.functions.invoke('ig-publish',{body:{action:'check',client_id:ck.dataset.check}});
    const ok=!error&&data&&data.ok;ck.disabled=false;ck.textContent=ok?'Pode publicar':'Sem permissão';ck.className='chip '+(ok?'ok':'');toast(ok?`Conta pronta para publicar${data.limit?` · ${data.limit.quota_usage||0} de ${(data.limit.config||{}).quota_total||100} posts nas últimas 24h`:''}`:'A conta ainda não pode publicar: '+((data&&data.error)||(error&&error.message)||''));return}
  const rs=t.closest('[data-report-send]');if(rs){const id=rs.dataset.reportSend;await saveDoc('reports',id,{...doc1('reports',id),client:id.split('_')[0],sent:true,sentAt:new Date().toISOString()});toast('Relatório marcado como enviado');render();return}
});
function confirmDel(b,msg='Toque de novo para excluir'){if(b.dataset.sure)return true;const old=b.textContent;b.dataset.sure='1';b.textContent=msg;setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent=old}},3000);return false}
document.addEventListener('submit',async e=>{
  if(e.target.id==='fm'){e.preventDefault();const b=$('#fsave');b.disabled=true;b.textContent='Salvando…';
    try{await MODAL.onSave(readForm(MODAL.fields));MODAL=null;toast('Salvo');render()}catch(x){toast(x.message);b.disabled=false;b.textContent='Salvar'}return}
  if(e.target.id==='mf'){e.preventDefault();const v=$('#mt').value.trim();if(!v)return;const c=fv('gc',CL()[0]?.id);
    try{await saveDoc('messages',null,{client:c,text:v,who:'Stond',by:ME.name,at:new Date().toISOString(),readStond:true});render();const i=$('#mt');if(i)i.focus()}catch(x){toast(x.message)}}
});
document.addEventListener('change',async e=>{
  if(e.target.id==='fmup'){const files=[...e.target.files];const c=$('#fm').elements.client_id.value;
    const sp=space();if(sp&&sp.f>=.98){toast('O espaço de arquivos está cheio. Apague vídeos antigos antes de enviar.');e.target.value='';return}
    for(const f of files){if(f.size>50*1048576){toast(f.name+' tem mais de 50 MB. Comprima o vídeo antes de enviar.');continue}
      const path=`${c}/${Date.now()}-${f.name.normalize('NFD').replace(/[^\w.-]+/g,'-')}`;toast('Enviando '+f.name);
      const {error}=await sb.storage.from('media').upload(path,f,{contentType:f.type,upsert:false});if(error){toast(error.message);continue}
      if(D.usage){D.usage.files_bytes+=f.size;D.usage.files_count++}
      POST_EDIT.media.push({url:MEDIA+path,kind:f.type.startsWith('video')?'video':'image'});
      const add=e.target.closest('.add');add.insertAdjacentHTML('beforebegin',`<span class="mth">${f.type.startsWith('video')?'<span class="noimg">vídeo</span>':`<img src="${MEDIA+path}" alt="">`}</span>`)}
    toast('Mídia enviada');}
});
/* arrastar cartões */
let DRAG=null;
document.addEventListener('dragstart',e=>{const k=e.target.closest('[data-drag],[data-drag-lead]');if(k){DRAG=k.dataset.drag?['post',k.dataset.drag]:['lead',k.dataset.dragLead];e.dataTransfer.effectAllowed='move'}});
document.addEventListener('dragover',e=>{if(DRAG&&e.target.closest(DRAG[0]==='post'?'[data-drop]':'[data-drop-lead]'))e.preventDefault()});
document.addEventListener('drop',async e=>{if(!DRAG)return;const z=e.target.closest(DRAG[0]==='post'?'[data-drop]':'[data-drop-lead]');if(!z)return;e.preventDefault();const [k,id]=DRAG;DRAG=null;
  try{if(k==='post'){const p=posts().find(x=>x.id===id);await savePost({...p,...colStatus(z.dataset.drop,p)})}
    else{const l=docs('leads').find(x=>x.id===id);await saveDoc('leads',id,{...l,stage:z.dataset.dropLead})}render()}catch(x){toast(x.message)}});

addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(V[h]&&h!==S&&ME)go(h)});
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&ME)location.reload()});
boot();
