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
const brl=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>{if(typeof v==='number')return isFinite(v)?v:0;const t=String(v??'').trim();if(/^-?\d+\.\d{1,2}$/.test(t))return Number(t);return Number(t.replace(/\./g,'').replace(',','.'))||0};
const today=()=>iso(new Date());
const mediaUrl=(u,c)=>!u?'':/^https?:/.test(u)?u:MEDIA+(c?c+'/':'')+u;
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3200)}

/* tema */
function applyTheme(){document.documentElement.classList.toggle('light',ls.get('stond-tema')!=='dark')}
applyTheme();
function tt(){const l=document.documentElement.classList.contains('light');
  return `<button class="tt" data-theme-toggle aria-label="${l?'Usar versão escura':'Usar versão clara'}"><span class="${l?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg></span><span class="${l?'':'on'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></span></button>`}

const sb=window.supabase.createClient(SB,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'sg-auth'}});

/* ---------- ícones ---------- */
const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${p}</svg>`;
const ic={
 auto:sv('<path d="M4 5h16v10H9l-5 4z"/><path d="M13 7l-3 4h4l-3 4"/>'),
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
const cphoto=id=>{const ph=((D.profiles||{})[id]||{}).photo;return !ph?'':/^https?:/.test(ph)?ph:MEDIA+id+'/'+ph};
const cdot=id=>`<i class="cd" style="background:${esc(ccol(id))}"></i>`;
const docs=col=>D.docs.filter(d=>d.collection===col).map(d=>({...d.data,id:d.id,client:d.client_id??d.data.client}));
const doc1=(col,id)=>{const d=D.docs.find(x=>x.collection===col&&x.id===id);return d?{...d.data}:{}};
const posts=()=>D.posts.filter(p=>p.stage!=='arquivado');
const pend=()=>posts().filter(p=>p.status==='pendente');
const isDone=p=>p.publish_status==='publicado'||p.status==='publicado';

async function load(){
  const q=(t,s='*')=>sb.from(t).select(s);
  const [c,p,f,m,d,a,l,k,g]=await Promise.all([q('clients','id,name,handle,color,status,data,access_token').order('created_at'),q('posts').order('date'),q('post_feedback').order('created_at'),q('ig_metrics').order('date'),q('agency_docs'),q('ig_accounts'),q('client_links'),q('dm_keywords').order('created_at'),q('dm_log','client_id,keyword,from_username,status,error,created_at').order('created_at',{ascending:false}).limit(150)]);
  for(const r of [c,p,f,m,d])if(r.error)throw new Error(r.error.message);
  D={clients:c.data,posts:p.data,feedback:f.data,metrics:m.data,docs:d.data,accounts:a.data||[],links:l.data||[]};
  try{const {data:u}=await sb.rpc('storage_usage');D.usage=u||null}catch(_){D.usage=null}
  try{const {data:pr}=await sb.from('ig_profiles').select('client_id,data');D.profiles=Object.fromEntries((pr||[]).map(x=>[x.client_id,x.data||{}]))}catch(_){D.profiles={}}
  try{const {data:md}=await sb.from('ig_media').select('*').order('ts');D.media=md||[]}catch(_){D.media=[]}
  D.kwRows=k.data||[];D.dmlog=g.data||[];
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
const GROUPS=[['',[['inicio','Hoje']]],
 ['Dia a dia',[['agenda','Calendário de posts'],['dem','Demandas'],['aprov','Aprovação'],['pub','Agendados']]],
 ['Planejar',[['plano','Planejamento dos meses']]],
 ['Resultados',[['met','Métricas'],['auto','Automações']]],
 ['Gestão',[['cli','Clientes'],['fin','Financeiro']]],
 ['Mais',[['msg','Mensagens'],['rel','Relatórios'],['inv','Investimento'],['lnk','Links curtos'],['com','Comercial'],['prop','Propostas e contratos'],['gest','Gestão da Stond'],['cres','Crescimento'],['adm','Administrativo']]]];
function badge(k){if(k==='aprov')return pend().length;if(k==='dem')return late().length;if(k==='pub')return queue().filter(p=>p.publish_status==='agendado').length;if(k==='msg')return docs('messages').filter(m=>m.who==='Cliente'&&!m.readStond).length;return 0}
function menuClosed(){const v=ls.get('sg-menu2');return v==null?['Mais']:v.split('|').filter(Boolean)}
function shell(inner){
  const tabs=[['inicio','Hoje'],['agenda','Posts'],['aprov','Aprovar'],['pub','Agendados'],['fin','Financeiro']];
  const b=k=>{const n=badge(k);return n?`<span class="bdg">${n}</span>`:''};
  return `<div class="app"><aside class="side"><div class="stop"><img class="logo" src="${LOGO}" alt="">${tt()}</div>
   <div class="who"><span class="av">${esc((ME.name||'?')[0])}</span><div><b>${esc(ME.name)}</b><small>${esc(ME.role==='dona'?'Stond · dona':'Stond · equipe')}</small></div></div>
   <nav class="nav">${GROUPS.map(([t,it0])=>{const it=it0.filter(([k])=>V[k]);if(!it.length)return '';const here=it.some(([k])=>k===S),open=!t||here||!menuClosed().includes(t),n=it.reduce((a,[k])=>a+badge(k),0);
     return (t?`<button class="sec" data-sec="${t}" aria-expanded="${open}"><span>${t}</span>${!open&&n?`<span class="bdg">${n}</span>`:''}<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>`:'')+(open?it.map(([k,l])=>`<button data-go="${k}" ${k===S?'aria-current="page"':''}>${ic[k]}${l}${b(k)}</button>`).join(''):'')}).join('')}</nav>
   <button class="out" style="margin-top:0;padding-left:4px" data-out>Sair</button></aside>
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
const fin=()=>docs('fin').filter(f=>!f.transfer);
/* dono do lançamento: Stond (pj, CNPJ) ou Pessoal (pf, CPF). Sem marca = Stond */
const contaOwn=id=>((docs('contas').find(c=>c.id===id)||{}).owner)||'pj';
const ownF=f=>f.owner||(f.account?contaOwn(f.account):'pj');
const finOf=(who='pj')=>fin().filter(f=>who==='all'||ownF(f)===who);
const finMonth=(mk,type,who='pj')=>finOf(who).filter(f=>String(f.date||'').startsWith(mk)&&f.type===type);
const sum=a=>a.reduce((s,x)=>s+num(x.amount),0);
const late=()=>posts().filter(p=>p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado');
const queue=()=>posts().filter(p=>p.status==='aprovado'||p.publish_status);
function health(c){
  const ps=posts().filter(p=>p.client_id===c.id),pn=ps.filter(p=>p.status==='pendente');
  let s=80;const oldest=pn.map(p=>p.updated_at).sort()[0];
  if(oldest){const days=(Date.now()-new Date(oldest))/864e5;if(days>3)s-=Math.min(30,days*3)}
  const overdue=finOf('pj').filter(f=>f.client===c.id&&f.type==='receita'&&!f.paid&&f.date&&f.date<today()).length;s-=overdue*15;
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
  const fixed=sum(finOf('pj').filter(f=>f.type==='despesa'&&String(f.date||'').startsWith(month())));
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
const cover=p=>{const m=(p.media||[]).find(x=>x.kind!=='pdf');if(!m)return '';return m.kind==='video'?(m.poster?mediaUrl(m.poster,p.client_id):''):mediaUrl(m.url,p.client_id)};
V.dem=()=>{
  const c=fv('dc','all'),list=posts().filter(p=>c==='all'||p.client_id===c).filter(p=>p.type!=='story'||fv('ds','0')==='1');
  const mk=fv('dm',month()),inM=list.filter(p=>!p.date||String(p.date).startsWith(mk)||colOf(p)!=='publicado');
  const [y,m]=mk.split('-').map(Number),prev=iso(new Date(y,m-2,1)).slice(0,7),next=iso(new Date(y,m,1)).slice(0,7);
  return shell(topb('Demandas',`Quadro de ${Mes(m-1)} · ${c==='all'?'todos os clientes':esc(cli(c).name)}`,'<button class="btn red" data-new="post">Nova demanda</button>')+`
  <div class="filters">${segF('dc',[['all','Todos'],...CL().map(k=>[k.id,k.name])])}<div class="seg"><button data-f="dm" data-v="${prev}">‹ ${Mes(pd(prev+'-01').getMonth())}</button><button data-f="dm" data-v="${next}">${Mes(pd(next+'-01').getMonth())} ›</button></div></div>
  <div class="kb">${COLS.map(([k,n,col])=>{const it=inM.filter(p=>colOf(p)===k&&(k!=='publicado'||String(p.date).startsWith(mk))).sort((a,b)=>(a.date||'9').localeCompare(b.date||'9'));return `<section class="kc" data-drop="${k}" style="--cc:${col}"><header><b>${n}</b><span>${it.length}</span></header>${it.map(p=>{const im=cover(p),late=p.due&&p.due<today()&&!isDone(p)&&p.status!=='aprovado';return `<article class="kd tr" draggable="true" data-drag="${esc(p.id)}" data-edit-post="${esc(p.id)}">${im?`<img class="kcov" src="${im}" alt="" loading="lazy">`:''}<div class="kin"><div class="klb"><span class="kl" data-ty="${esc(p.type||'post')}">${ty(p.type)}</span>${p.status==='reprovado'?'<span class="kl aj">Ajuste</span>':''}${late?'<span class="kl lt">Atrasada</span>':''}</div><b>${esc(p.title||'Sem título')}</b><div class="kft">${p.date?`<span class="kbd${late?' lt':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>${fmtD(p.date).replace(/^\w+, /,'')}${p.time?' · '+esc(p.time):''}</span>`:''}${(p.media||[]).length?`<span class="kbd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12.5 12.6 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/></svg>${(p.media||[]).length}</span>`:''}<span class="kav" style="background:${esc(ccol(p.client_id))}" title="${esc(cli(p.client_id).name)}">${esc((cli(p.client_id).name||'?')[0])}</span></div></div></article>`}).join('')}${k!=='publicado'&&k!=='aprovacao'&&k!=='agendamento'?`<button class="kadd tr" data-newcol="${k}">+ Adicionar um cartão</button>`:''}</section>`}).join('')}</div>`);
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
/* Agendados: o perfil do Instagram de cada cliente com o que vai entrar por cima (como vai ficar o feed) */
/* o feed começa no primeiro post de quando a Stond assumiu o perfil */
const FEED_INI={gabriel:'2026-10-08'};
function igGrid(){
  const ids=CL().map(c=>c.id),c=fv('pcl',ids[0]),cl=cli(c),pr=(D.profiles||{})[c]||{},m=D.metrics.filter(x=>x.client_id===c).slice(-1)[0]||{};
  const t0=today(),tab=fv('pgt','feed');
  /* o que estamos fazendo e ainda não foi ao ar: só os posts do app */
  const up=posts().filter(p=>p.client_id===c&&!isDone(p)&&(p.publish_status==='agendado'||((p.status==='aprovado'||p.status==='pendente')&&(p.date||'')>=t0)))
    .sort((a,b)=>((b.publish_at||b.date||'')+(b.time||'')).localeCompare((a.publish_at||a.date||'')+(a.time||'')));
  /* o feed como está hoje no Instagram; Reels de teste (não compartilhados no feed) ficam à parte */
  const all=(D.media||[]).filter(x=>x.client_id===c).sort((a,b)=>String(b.ts).localeCompare(String(a.ts)));
  const ini=FEED_INI[c]||'',feed=all.filter(x=>x.in_feed!==false&&String(x.ts).slice(0,10)>=ini).slice(0,45),tests=all.filter(x=>x.in_feed===false);
  const when=p=>{const d=p.publish_at?new Date(p.publish_at):pd(p.date);if(!d||isNaN(d))return '';const h=p.publish_at?d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):(p.time||'');return d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'}).replace('.','')+(h?' · '+h:'')};
  const I={reels:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',carrossel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="7.5" y="3.5" width="13" height="13" rx="2"/><path d="M16.5 20.5h-11a2 2 0 0 1-2-2v-11"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'};
  const pic=p=>{const im=cover(p);if(im)return `<img src="${esc(im)}" alt="" loading="lazy">`;const v=(p.media||[]).find(x=>x.kind==='video');
    return v?`<video src="${esc(mediaUrl(v.url,p.client_id))}#t=0.5" muted playsinline preload="metadata"></video>`:`<span class="igph">${esc(ty(p.type))}<small>${esc(p.title||'')}</small></span>`};
  const fmtIc=t=>/reel|video/i.test(t||'')?I.reels:/carros/i.test(t||'')?I.carrossel:'';
  const tile=p=>{const pe=p.status==='pendente'&&p.publish_status!=='agendado';return `<button class="igt up" data-edit-post="${esc(p.id)}" title="${esc(p.title||'')}">${pic(p)}<span class="igic">${fmtIc(p.type)}</span><span class="igb${pe?' pe':''}">${pe?'Falta aprovar · ':I.clock}${esc(when(p))}</span></button>`};
  const old=x=>`<a class="igt" href="${esc(x.permalink||'#')}" target="_blank" rel="noopener" title="${esc((x.caption||'').slice(0,90))}"><span class="igph">${esc(x.format||'post')}</span>${x.thumb?`<img src="${esc(x.thumb)}" alt="" loading="lazy" onerror="this.remove()">`:''}<span class="igic">${fmtIc(x.format)}</span></a>`;
  const test=x=>`<a class="igtest" href="${esc(x.permalink||'#')}" target="_blank" rel="noopener"><span class="igt">${x.thumb?`<img src="${esc(x.thumb)}" alt="" loading="lazy" onerror="this.remove()">`:''}<span class="igic">${I.reels}</span></span><b>${nf(x.views)} views</b><small>${esc(fmtD(String(x.ts).slice(0,10)).replace(/^\w+, /,''))}</small><small class="cap">${esc((x.caption||'').split('\n')[0].slice(0,60))}</small></a>`;
  const n=v=>v==null||v===''?'—':nf(v);
  const ph=cphoto(c),handle=String(pr.handle||cl.handle||'').replace(/^@/,'');
  return `<div class="filters">${segF('pcl',CL().map(k=>[k.id,k.name]))}</div>
  <div class="igp">
   <div class="igh">${ph?`<img class="igav" src="${esc(ph)}" alt="">`:`<span class="igav" style="background:${esc(cl.color||'#8a5560')}">${esc((cl.name||'?')[0])}</span>`}
    <div class="igi"><b>${handle?esc(handle):esc(cl.name)}</b>
     <div class="igs"><span><b>${n(pr.posts??m.posts)}</b> posts</span><span><b>${n(pr.followers??m.followers)}</b> seguidores</span><span><b>${n(pr.following??m.following)}</b> seguindo</span></div>
     ${pr.name?`<div class="ign">${esc(pr.name)}</div>`:''}${pr.bio||pr.bioNow?`<p class="igbio">${esc(pr.bioNow||pr.bio)}</p>`:''}</div></div>
   <div class="igtabs"><button data-f="pgt" data-v="feed" aria-pressed="${tab==='feed'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/></svg>Feed</button><button data-f="pgt" data-v="teste" aria-pressed="${tab==='teste'}">${I.reels}Reels de teste${tests.length?` (${tests.length})`:''}</button></div>
   ${tab==='teste'?`<p class="igft">Reels de teste só aparecem para quem não segue. Não entram no feed do perfil.</p>${tests.length?`<div class="igtests">${tests.map(test).join('')}</div>`:empty('Nenhum Reels de teste.')}`:
   `${up.length?`<p class="igft">${up.length} ${up.length>1?'posts nossos ainda vão':'post nosso ainda vai'} entrar por cima. O relógio mostra o dia e a hora.</p>`:''}
   <div class="igg">${up.map(tile).join('')}${feed.map(old).join('')}</div>
   ${!up.length&&!feed.length?empty('Nada agendado nem publicado para este cliente ainda.'):''}
   ${!feed.length&&up.length?'<p class="igft">Os posts que já estão no ar aparecem aqui quando a conta do Instagram estiver conectada.</p>':''}`}
  </div>`;
}
V.pub=()=>{
  if(fv('pf','perfil')==='perfil')return shell(topb('Agendados','Como o feed de cada cliente vai ficar: o que entra por cima do que já está no ar')+`
  <div class="filters">${segF('pf',[['perfil','Ver como perfil'],['fila','Lista da fila'],['feito','Publicados pelo app']])}</div>${igGrid()}`);
  const Q=queue().sort((a,b)=>((a.publish_at||a.date||'')+(a.time||'')).localeCompare((b.publish_at||b.date||'')+(b.time||''))).filter(p=>fv('pf','fila')==='fila'?!isDone(p):isDone(p));
  const st=p=>p.publish_status==='publicado'?['Publicado','ok']:p.publish_status==='erro'?['Erro','']:p.publish_status==='agendado'?['Agendado','pend']:p.publish_status==='publicando'?['Publicando','pend']:['Aprovado, sem horário',''];
  const when=p=>p.publish_at?new Date(p.publish_at).toLocaleString('pt-BR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):`${fmtD(p.date)}${p.time?' · '+p.time:''}`;
  return shell(topb('Agendados','Aprovou no portal, o app agenda e publica no Instagram sozinho')+`
  <div class="flow">${[['Cliente aprova','no portal'],['Entra na fila','dia e hora do calendário'],['Publica sozinho','feed, carrossel ou Reels'],['Volta com o link','e marca Publicado']].map(([a,b],i)=>`<div><span>${i+1}</span><b>${a}</b><small>${b}</small></div>`).join('')}</div>
  <div class="filters">${segF('pf',[['perfil','Ver como perfil'],['fila','Lista da fila'],['feito','Publicados pelo app']])}</div>
  <div class="pgl"><div>${Q.length?`<div class="list">${Q.map(p=>{const [s,c]=st(p),k=p.keyword;return `<div class="row">${cover(p)?`<img src="${cover(p)}" alt="" style="width:46px;height:58px;object-fit:cover;border-radius:8px">`:`<span class="noimg" style="width:46px;height:58px">${ty(p.type)}</span>`}<div class="t"><b>${esc(p.title)}</b><small>${cdot(p.client_id)}${esc(cli(p.client_id).name)} · ${esc(when(p))}${k?` · palavra <span class="kw ${D.kw.has(k.toLowerCase())?'':'miss'}">${esc(k.toUpperCase())}</span>${D.kw.has(k.toLowerCase())?'':' falta criar'}`:''}${p.publish_error?` · <span style="color:var(--red)">${esc(p.publish_error)}</span>`:''}</small></div><div class="ra"><span class="chip ${c}">${s}</span>${p.permalink?`<a class="btn sm ghost" href="${esc(p.permalink)}" target="_blank" rel="noopener">Ver post</a>`:`<button class="btn sm ghost" data-sched="${esc(p.id)}">${p.publish_status==='agendado'?'Mudar':'Agendar'}</button><button class="btn sm ghost" data-pubnow="${esc(p.id)}">Publicar agora</button>`}</div></div>`}).join('')}</div>`:empty(fv('pf','fila')==='fila'?'Nenhum post aprovado esperando publicação.':'Nada publicado pelo app ainda.')}</div>
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
  <div class="cgrid">${A.map(c=>{const ps=posts().filter(p=>p.client_id===c.id),h=health(c),d=c.data||{},has=d.services||[],m=D.metrics.filter(x=>x.client_id===c.id).slice(-1)[0],up=SV.filter(s=>!has.includes(s)).slice(0,2);
   const info=[fee(c)?brl(fee(c))+'/mês':'',d.renewAt?'renova '+fmtD(d.renewAt).replace(/^\w+, /,''):'',d.nota?'nota '+d.nota:''].filter(Boolean).join(' · ');
   return `<article class="cc" style="--cc:${esc(c.color)}"><div class="cb">${cphoto(c.id)?`<img class="cav" src="${esc(cphoto(c.id))}" alt="">`:`<span class="cav" style="background:${esc(c.color)}">${esc(c.name[0])}</span>`}<div style="min-width:0"><b>${esc(c.name)}</b><small>${c.handle?'@'+esc(c.handle):'Sem Instagram'}</small></div><span class="hpill" title="Saúde do cliente">${h}</span></div>
   <div class="cs"><div><b>${ps.filter(p=>p.status==='pendente').length}</b><small>para aprovar</small></div><div><b>${ps.filter(p=>String(p.date).startsWith(month())).length}</b><small>posts no mês</small></div><div><b>${m?nf(m.followers):'—'}</b><small>seguidores</small></div></div>
   <div class="cx">${info||'Sem mensalidade cadastrada'}</div>${up.length?`<div class="cx up">Oferecer: ${up.join(', ')}</div>`:''}
   <div class="ca"><button class="lk" data-edit-client="${esc(c.id)}">Editar</button><a class="lk" href="https://portal.stond.com.br/?c=${esc(c.access_token)}&ver=1" target="_blank" rel="noopener">Ver e editar como cliente</a><button class="lk" data-invite="${esc(c.id)}">${(c.data||{}).convite_em?'Reenviar convite':'Convidar por e-mail'}</button><button class="lk" data-copy="https://portal.stond.com.br/?convite=${esc(c.access_token)}">Copiar link</button></div></article>`}).join('')}</div>`);
};

/* Automação de direct (tipo ManyChat) */
V.auto=()=>{
  const ids=CL().map(c=>c.id),c=fv('ac',ids[0]),K=D.kwRows.filter(k=>k.client_id===c),acc=D.accounts.find(a=>a.client_id===c);
  const mo=month(),L=D.dmlog.filter(x=>x.client_id===c),cnt=(w,m)=>L.filter(x=>x.keyword===w&&(!m||String(x.created_at).startsWith(m))).length;
  const stl=s=>s==='link_enviado'?['Link enviado','ok']:s==='sent'?['Direct enviado','pend']:s==='aguardando_seguir'?['Esperando seguir','pend']:s==='aguardando_clique'?['Esperando clique','pend']:/err/.test(s||'')?['Erro','']:[s||'—',''];
  return shell(topb('Automação de direct','Quem comenta a palavra recebe o link no direct, sozinho','<button class="btn red" data-new="kw">Nova palavra</button>')+`
  <div class="flow">${[['Comenta a palavra','no post ou Reels'],['Resposta pública','no comentário'],['Direct com botão','"Me envie o link"'],['Confere se segue','e manda o link']].map(([a,b],i)=>`<div><span>${i+1}</span><b>${a}</b><small>${b}</small></div>`).join('')}</div>
  <div class="filters">${segF('ac',CL().map(k=>[k.id,k.name]))}</div>
  ${acc?'':`<div class="spc warn"><b>Conta não conectada</b><span>A automação só funciona depois de conectar o Instagram de ${esc(cli(c).name)} pelo app Stond no Meta.</span></div>`}
  <div class="pgl"><div>${K.length?`<div class="kwg">${K.map(k=>`<article class="kwc ${k.active?'':'off'}" data-edit-kw="${esc(k.id)}"><div class="kwh"><b>${esc(String(k.keyword).toUpperCase())}</b><span class="chip ${k.active?'ok':''}">${k.active?'Ligada':'Desligada'}</span></div>
     <p>${esc(k.opening_text||k.message||'')}</p><small>${(k.aliases||[]).length?`Aceita ${(k.aliases||[]).length} jeitos de escrever · `:''}${k.require_follow?'Só para quem segue':'Para todos'}</small>
     <div class="kwn"><div><b>${cnt(k.keyword,mo)}</b><small>no mês</small></div><div><b>${cnt(k.keyword)}</b><small>no total</small></div><a class="lk" href="${esc(k.link||'#')}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Abrir link</a></div></article>`).join('')}</div>`:empty('Nenhuma palavra ainda. Crie a primeira em Nova palavra.')}</div>
  <div class="bx"><span class="lb">Últimos disparos</span>${L.length?`<div class="al">${L.slice(0,12).map(x=>{const [t,cl]=stl(x.status);return `<div><b>@${esc(x.from_username||'?')}</b><small>${esc(String(x.keyword||'').toUpperCase())} · ${new Date(x.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}</small><span class="chip ${cl}" title="${esc(x.error||'')}">${esc(t)}</span></div>`}).join('')}</div>`:'<p class="wait">Quando alguém comentar uma palavra, aparece aqui.</p>'}</div></div>`);
};
const KWF=[['keyword','Palavra (o que a pessoa comenta)'],['aliases','Outros jeitos de escrever (separe por vírgula)'],['active','Ligada','chk'],['public_reply','Resposta pública no comentário'],['opening_text','1ª mensagem no direct','area'],['opening_button','Botão da 1ª mensagem'],['require_follow','Só manda o link para quem segue','chk'],['follow_text','Mensagem pedindo para seguir','area'],['follow_button','Botão "já sigo"'],['not_following_text','Se ainda não seguir','area'],['link_title','Mensagem junto com o link','area'],['link_button','Texto do botão do link'],['link','Link']];
function openKw(id){
  const c=fv('ac',CL()[0]?.id),cur=id?D.kwRows.find(k=>k.id===id):null,base=D.kwRows.find(k=>k.client_id===c)||{};
  const v0=cur?{...cur,aliases:(cur.aliases||[]).join(', ')}:{active:true,require_follow:true,opening_button:'Me envie o link',follow_text:base.follow_text||'Quase lá! Esse link é só pra quem me segue ✨ Assim que você me seguir, clica aqui embaixo.',follow_button:base.follow_button||'Estou seguindo',not_following_text:base.not_following_text||'Hmm, ainda não te achei nos seguidores 👀 Me segue e clica de novo aqui embaixo!',public_reply:'Te mandei no direct!',link_button:'Abrir o link'};
  formModal(cur?'Palavra '+String(cur.keyword).toUpperCase():'Nova palavra · '+cli(c).name,KWF,v0,async v=>{
    if(!v.keyword)throw new Error('Escreva a palavra.');if(!v.link)throw new Error('Coloque o link.');
    const row={...(cur||{client_id:c,message:'Oi, {nome}! Aqui está o link que você pediu: {link}'}),...v,keyword:v.keyword.toLowerCase(),aliases:v.aliases.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)};
    const {data,error}=await sb.from('dm_keywords').upsert(row).select().single();if(error)throw new Error(error.message);
    const i=D.kwRows.findIndex(k=>k.id===data.id);i>=0?D.kwRows[i]=data:D.kwRows.push(data);
    D.kw=new Set(D.kwRows.flatMap(x=>[x.keyword,...(x.aliases||[])]).map(w=>String(w).toLowerCase()));
  },cur?async()=>{const {error}=await sb.from('dm_keywords').delete().eq('id',cur.id);if(error)throw new Error(error.message);D.kwRows=D.kwRows.filter(k=>k.id!==cur.id)}:null,
  `<p class="wait" style="margin:0">Use {nome} para colocar o nome da pessoa. Teste comentando a palavra num post do cliente.</p>`);
}

/* Diagnóstico por post (ig_media, atualizado todo dia pelo ig-metrics) */
const med=a=>{const v=a.filter(x=>x!=null&&!isNaN(x)).sort((x,y)=>x-y);if(!v.length)return null;const h=v.length>>1;return v.length%2?v[h]:(v[h-1]+v[h])/2};const mi=a=>{const m=med(a);return m==null?null:Math.round(m)};
const pc=(x,d=0)=>x==null?'—':(x*100).toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d})+'%';
const capKey=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,45);
function diag(c){
  const all=(D.media||[]).filter(m=>m.client_id===c).sort((a,b)=>a.ts<b.ts?-1:1);
  if(!all.length)return `<p class="eyebrow" style="margin-top:20px">Diagnóstico</p>${empty('Clique em Puxar do Meta para trazer os números de cada post.')}`;
  const day=864e5,now=Date.now(),age=m=>(now-new Date(m.ts))/day;
  const eng=m=>m.reach?(m.interactions??0)/m.reach:null,ret=m=>m.duration_s&&m.avg_watch_s!=null?m.avg_watch_s/m.duration_s:null;
  // repetidos: mesmo começo de legenda até 30 dias, ou mesma duração no mesmo dia
  const R=all.filter(m=>m.format==='reels'),dup=new Set();
  R.forEach((a,i)=>R.slice(i+1).forEach(b=>{const dd=Math.abs(new Date(b.ts)-new Date(a.ts))/day;
    if((capKey(a.caption)&&capKey(a.caption)===capKey(b.caption)&&dd<=30)||(a.duration_s&&a.duration_s===b.duration_s&&dd<=2)){dup.add(a.ig_media_id);dup.add(b.ig_media_id)}}));
  const kind=m=>m.format!=='reels'?'feed':dup.has(m.ig_media_id)?'rep':'orig';
  const recent=x=>age(x)<=30,before=x=>age(x)>30&&age(x)<=150;
  const Rr=R.filter(recent),Rb=R.filter(before),Fd=all.filter(m=>m.format!=='reels');
  const rr=mi(Rr.map(m=>m.reach)),rb=mi(Rb.map(m=>m.reach)),fr=mi(Fd.filter(recent).map(m=>m.reach)),fb=mi(Fd.filter(before).map(m=>m.reach));
  const drop=rr!=null&&rb?1-rr/rb:null,nd=Rr.filter(m=>dup.has(m.ig_media_id)).length;
  const engR=med(all.filter(recent).map(eng)),watch=med(Rr.map(m=>m.avg_watch_s));
  let g;
  if(drop!=null&&drop>=.5&&Rb.length>=3)g=['Distribuição',`O alcance dos reels caiu ${pc(drop)} em relação aos meses anteriores.`+(nd?` ${nd} de ${Rr.length} reels dos últimos 30 dias são repetidos: o Instagram trata como conteúdo não original e para de recomendar. Publique um vídeo por vez e faça A/B pelo recurso Reels de teste.`:' Confira Configurações › Status da conta no app do cliente.')];
  else if(nd>=2)g=['Repetição',`${nd} reels dos últimos 30 dias são o mesmo vídeo postado mais de uma vez. Isso derruba a distribuição. Publique um por vez.`];
  else if(engR!=null&&engR<.03)g=['Engajamento',`Engajamento mediano de ${pc(engR,1)} nos últimos 30 dias. O conteúdo alcança mas não gera conversa: termine com pergunta ou palavra para comentar.`];
  else if(watch!=null&&watch<5)g=['Gancho',`Os reels seguram em média ${watch.toLocaleString('pt-BR',{maximumFractionDigits:1})} s. As pessoas saem antes de entender o assunto: mostre o resultado no primeiro segundo.`];
  else g=['Sem gargalo forte','Os números dos últimos 30 dias estão no ritmo dos meses anteriores.'];
  // gráfico de alcance por post
  const L=all.slice(-50),W=760,H=180,pl=38,pb=18,mx=Math.max(100,...L.map(m=>m.reach||0)),top=Math.ceil(mx/250)*250,bw=(W-pl-4)/L.length,y=v=>H-pb-(H-pb-6)*v/top;
  const COL={orig:'#8f0a19',rep:'#e8a11c',feed:'#cfc8c3'};let lastM='';
  const bars=L.map((m,i)=>{const x=pl+i*bw,v=m.reach||0,mo=m.ts.slice(5,7),lab=mo!==lastM?(lastM=mo,`<text x="${x.toFixed(1)}" y="${H-4}" class="ax">${MES[+mo-1].slice(0,3).toLowerCase()}</text>`):'';
    return `${lab}<a href="${esc(m.permalink||'#')}" target="_blank" rel="noopener"><rect x="${(x+bw*.12).toFixed(1)}" width="${(bw*.76).toFixed(1)}" y="${y(v).toFixed(1)}" height="${Math.max(1,y(0)-y(v)).toFixed(1)}" rx="2" fill="${COL[kind(m)]}"><title>${fmtD(m.ts.slice(0,10))} · alcance ${nf(v)} · ${esc(String(m.caption||'').slice(0,60))}</title></rect></a>`}).join('');
  const grid=[0,.25,.5,.75,1].map(f=>`<line x1="${pl}" x2="${W-4}" y1="${y(top*f)}" y2="${y(top*f)}" class="gl"/><text x="${pl-5}" y="${y(top*f)+3}" text-anchor="end" class="ax">${nf(top*f)}</text>`).join('');
  // reels recentes
  const rows=R.filter(m=>age(m)<=60).reverse().map(m=>`<tr><td>${fmtD(m.ts.slice(0,10))}</td><td class="cap"><a class="lnk" href="${esc(m.permalink)}" target="_blank" rel="noopener">${esc(String(m.caption||'Sem legenda').split('\n')[0].slice(0,48))}</a>${dup.has(m.ig_media_id)?' <span class="dtag">repetido</span>':''}</td><td class="n">${nf(m.reach)}</td><td class="n">${nf(m.views)}</td><td class="n">${m.avg_watch_s!=null?m.avg_watch_s.toLocaleString('pt-BR',{maximumFractionDigits:1})+' s':'—'}</td><td class="n">${pc(ret(m))}</td><td class="n">${pc(eng(m),1)}</td></tr>`).join('');
  // longo x curto e melhores
  const pool=R.filter(m=>!dup.has(m.ig_media_id)&&age(m)<=200),lg=pool.filter(m=>m.duration_s>=60),sh=pool.filter(m=>m.duration_s&&m.duration_s<=20);
  const cmp=(n,a)=>a.length?`<tr><td>${n}</td><td class="n">${a.length}</td><td class="n">${nf(mi(a.map(m=>m.views)))}</td><td class="n">${pc(med(a.map(eng)),1)}</td><td class="n">${nf(mi(a.map(m=>m.shares)))}</td></tr>`:'';
  const best=all.filter(m=>age(m)<=150&&(m.reach||0)>=100).sort((a,b)=>eng(b)-eng(a)).slice(0,3);
  return `<p class="eyebrow" style="margin-top:20px">Diagnóstico</p>
  <div class="dg">
    <div class="dg-g ${g[0]==='Sem gargalo forte'?'okk':''}"><span class="lb">Gargalo</span><b>${g[0]}</b><p>${g[1]}</p></div>
    <div class="dg-k"><div><span class="lb">Reels, 30 dias</span><b class="${drop!=null&&drop>=.3?'neg':''}">${nf(rr)}</b><small>alcance mediano</small></div><div><span class="lb">Reels, meses antes</span><b>${nf(rb)}</b><small>alcance mediano</small></div><div><span class="lb">Feed, 30 dias</span><b>${nf(fr)}</b><small>alcance mediano</small></div><div><span class="lb">Feed, meses antes</span><b>${nf(fb)}</b><small>alcance mediano</small></div></div>
    <div class="dg-c"><div class="dg-h"><b>Alcance de cada post</b><span class="leg"><i style="background:${COL.orig}"></i>Reels <i style="background:${COL.rep}"></i>Reels repetido <i style="background:${COL.feed}"></i>Feed</span></div><svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${bars}</svg></div>
    ${rows?`<div class="dg-c"><div class="dg-h"><b>Reels dos últimos 60 dias</b><small>Retenção = tempo assistido ÷ duração</small></div><div class="dg-t"><table><tr><th>Data</th><th>Reels</th><th class="n">Alcance</th><th class="n">Views</th><th class="n">Assistido</th><th class="n">Retenção</th><th class="n">Engaj.</th></tr>${rows}</table></div></div>`:''}
    <div class="dg-2">
      ${lg.length&&sh.length?`<div class="dg-c"><div class="dg-h"><b>Vídeo longo x curto</b><small>Reels originais, medianas</small></div><div class="dg-t"><table><tr><th>Tipo</th><th class="n">Reels</th><th class="n">Views</th><th class="n">Engaj.</th><th class="n">Compart.</th></tr>${cmp('Longo (60 s ou mais)',lg)}${cmp('Curto (até 20 s)',sh)}</table></div></div>`:''}
      ${best.length?`<div class="dg-c"><div class="dg-h"><b>O que mais engajou</b><small>Últimos 5 meses, por engajamento</small></div>${best.map(m=>`<a class="dg-b" href="${esc(m.permalink)}" target="_blank" rel="noopener"><span>${esc(String(m.caption||'').split('\n')[0].slice(0,60))}</span><small>${m.format} · ${fmtD(m.ts.slice(0,10))} · ${pc(eng(m),1)} · alcance ${nf(m.reach)}</small></a>`).join('')}</div>`:''}
    </div>
  </div>`;
}

/* Métricas */
V.met=()=>{
  const c=fv('mc',CL()[0]?.id),M=D.metrics.filter(x=>x.client_id===c),L=M.slice(-1)[0]||{},F=M[0]||{};
  return shell(topb('Métricas','Os números que o cliente vê no portal',`<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-ig-connect>Reconectar Instagram</button><button class="btn" data-sync-met>Puxar do Meta</button><button class="btn red" data-new="metric">Lançar números</button></span>`)+`<div class="filters">${segF('mc',CL().map(k=>[k.id,k.name]))}</div>
  <div class="bento"><div class="bx hero w2 w2m"><span class="lb">Seguidores</span><div class="num">${nf(L.followers)}${M.length>1?`<small>${L.followers-F.followers>=0?'+':''}${nf(L.followers-F.followers)} desde ${fmtD(F.date)}</small>`:''}</div><span class="ft">${L.date?'Última medição '+fmtD(L.date):'Sem medição ainda'}</span></div>
  <div class="bx"><span class="lb">Alcance</span><div class="num">${nf(L.reach)}</div></div><div class="bx"><span class="lb">Engajamento</span><div class="num">${L.engagement!=null?Number(L.engagement).toLocaleString('pt-BR')+'%':'—'}</div></div></div>
  ${diag(c)}
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
  const fixas=sum(finOf('pj').filter(f=>f.type==='despesa'&&f.kind==='fixa'&&String(f.date||'').startsWith(mk)))||Dp;
  const fol=Dp?cx/Dp:0,lucro=R-Dp,mg=R?lucro/R*100:0;
  const top1=active().map(c=>fee(c)).sort((a,b)=>b-a)[0]||0,conc=mrr()?top1/mrr()*100:0;
  const obr=docs('obrig').filter(o=>!o.done);
  const sc=[['Caixa',Math.min(100,fol/6*100)],['Lucro',Math.max(0,Math.min(100,mg*2))],['Crescimento',ms.mrr?Math.min(100,mrr()/num(ms.mrr)*100):50],['Concentração',Math.max(0,100-conc)],['Obrigações em dia',obr.some(o=>o.due&&o.due<today())?40:100]];
  const score=Math.round(sc.reduce((s,x)=>s+x[1],0)/sc.length);
  const cats={};finMonth(mk,'despesa').forEach(f=>{cats[f.category||'Outros']=(cats[f.category||'Outros']||0)+num(f.amount)});
  const venc=[...finOf('pj').filter(f=>!f.paid&&f.type==='despesa'&&f.date>=today()),...obr.filter(o=>o.due>=today()).map(o=>({desc:o.title,date:o.due,amount:o.amount})),...fatAll('pj').map(x=>({desc:'Fatura '+x.conta.name,date:x.vence,amount:x.total}))].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,5);
  const goals=[['Faturamento no ano',sum(finOf('pj').filter(f=>f.type==='receita'&&String(f.date).startsWith(String(new Date().getFullYear())))),num(ms.ano),1],['Clientes ativos',active().length,num(ms.clientes),0],['Reserva',cx,num(ms.reserva),1],['Receita recorrente',mrr(),num(ms.mrr),1]];
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
  <div class="kb">${STG.map(([k,n,c])=>{const it=L.filter(l=>(l.stage||'novo')===k);return `<section class="kc" data-drop-lead="${k}" style="--cc:${c}"><header><b>${n}</b><span>${it.length?brl(sum(it.map(l=>({amount:l.value})))):''}</span></header>${it.map(l=>`<article class="kd" draggable="true" data-drag-lead="${esc(l.id)}" data-edit-doc="leads:${esc(l.id)}"><b>${esc(l.name)}</b>${l.source?`<span class="og">${esc(l.source)}</span>`:''}<small>${esc(l.company||l.note||'')}</small><div class="km"><small class="kdt" style="margin:0">${l.value?brl(l.value)+'/mês':''}</small>${l.nextDate?`<small style="margin-left:auto">${fmtD(l.nextDate)}</small>`:''}</div></article>`).join('')}</section>`}).join('')}</div>`);
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
const untilOpts=()=>{const d=new Date(),o=[['','Sem data para acabar']];for(let i=0;i<36;i++){const x=new Date(d.getFullYear(),d.getMonth()+i,1);o.push([iso(x).slice(0,7),MES[x.getMonth()]+' de '+x.getFullYear()])}return o};
const fixOn=(f,mk)=>f.kind==='fixa'&&(!f.until||mk<=f.until);
const CAT0={receita:['Mensalidades','Projetos avulsos','Outras receitas'],despesa:['Pró-labore','Folha da equipe','Freelancers','Impostos sobre vendas','Impostos','Contabilidade','Mídia paga','Ferramentas e software','Aluguel','Marketing','Tarifas e juros','Outras despesas'],
 pf_receita:['Pró-labore','Reembolso da Stond','Outras entradas'],pf_despesa:['Moradia','Contas da casa','Mercado','Alimentação fora','Saúde','Transporte','Lazer','Educação','Compras','Assinaturas pessoais','Outros gastos']};
const cats=(t,who='pj')=>{const k=(who==='pf'?'pf_':'')+t,s=doc1('settings','categorias');return (s[k]&&s[k].length?s[k]:CAT0[k])};
const FO=()=>fv('fo','all');
const OWN=[['pj','Stond (CNPJ)'],['pf','Pessoal (CPF)']];
const ownLb=w=>w==='pf'?'Pessoal':'Stond';
const catOpts=()=>{const w=FO(),ws=w==='all'?['pj','pf']:[w],seen=new Set();return [['',''],...ws.flatMap(o=>['receita','despesa'].flatMap(t=>cats(t,o))).filter(c=>!seen.has(c)&&seen.add(c)).map(c=>[c,c])]};
const contasAll=()=>docs('contas');
const contas=()=>contasAll().filter(c=>FO()==='all'||(c.owner||'pj')===FO());
const contaOpts=()=>[['','Sem conta'],...contasAll().map(c=>[c.id,c.name+' · '+ownLb(c.owner)])];
const contaNome=id=>(contasAll().find(c=>c.id===id)||{}).name||'';
const saldoConta=id=>{const c=contasAll().find(x=>x.id===id)||{},F=docs('fin');return num(c.inicial)+sum(F.filter(f=>f.account===id&&f.paid&&f.type==='receita'))-sum(F.filter(f=>f.account===id&&f.paid&&f.type==='despesa'))};
/* Faturas de cartão: compra antes do dia de fechamento entra na fatura do mês; depois, na seguinte.
   O que já foi pago sai das faturas mais antigas: o que o cartão deve é distribuído da fatura mais nova para a mais velha. */
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const dia=(y,m,d)=>new Date(y,m,Math.min(d,dim(y,m)));
const FER=['01-01','04-21','05-01','09-07','10-12','11-02','11-15','11-20','12-25'];
const util=d=>{while(d.getDay()===0||d.getDay()===6||FER.includes(iso(d).slice(5)))d.setDate(d.getDate()+1);return d};
const fatDe=(c,s)=>{const F=num(c.fecha),V=num(c.vence),d=pd(s);let y=d.getFullYear(),m=d.getMonth();if(d.getDate()>=F){m++;if(m>11){m=0;y++}}const fe=dia(y,m,F);let vm=m+(V<=F?1:0),vy=y;if(vm>11){vm-=12;vy++}return {fecha:iso(fe),vence:iso(util(dia(vy,vm,V)))}};
const fatGroups=c=>{if(c.kind!=='cartao'||!num(c.fecha)||!num(c.vence))return [];const g={};fin().filter(f=>f.account===c.id&&f.date).forEach(f=>{const k=fatDe(c,f.date);const x=g[k.vence]||(g[k.vence]={...k,conta:c,bruto:0,itens:[]});x.bruto+=(f.type==='despesa'?1:-1)*num(f.amount);x.itens.push(f)});let D=Math.max(0,-saldoConta(c.id)+sum(fin().filter(f=>f.account===c.id&&!f.paid&&f.type==='despesa')));const L=Object.values(g).sort((a,b)=>b.vence.localeCompare(a.vence));L.forEach(x=>{x.total=Math.min(Math.max(0,x.bruto),D);D-=x.total});return L.reverse()};
const faturas=c=>fatGroups(c).filter(x=>x.vence>=today()&&x.total>0.004);
/* fechamento e vencimento da fatura que vence no mês ym (AAAA-MM) */
const fatMes=(c,ym)=>{const F=num(c.fecha),V=num(c.vence),[y,m]=ym.split('-').map(Number);const cm=new Date(y,m-1-(V<=F?1:0),1);return {fecha:iso(dia(cm.getFullYear(),cm.getMonth(),F)),vence:iso(util(dia(y,m-1,V)))}};
const fatSt=x=>x.bruto>0.004&&x.total<=0.004?['Paga','ok']:x.fecha>today()?['Aberta','pend']:x.vence<today()?['Atrasada','']:['Fechada',''];
/* limite tomado = o que o cartão deve + parcelas futuras já compradas (fixas ainda não cobradas não contam) */
const limUsado=c=>Math.max(0,-saldoConta(c.id))+sum(fin().filter(f=>f.account===c.id&&!f.paid&&f.type==='despesa'&&f.kind!=='fixa'));
const fatAll=who=>contasAll().filter(c=>who==='all'||(c.owner||'pj')===who).flatMap(faturas);
/* Stond x Pessoal: o que a Stond pagou ou recebeu numa conta pessoal e ainda não foi acertado */
/* cruzado = lançamento da Stond em conta pessoal, ou pessoal em conta da Stond. Positivo: a Stond te deve */
const cruzados=()=>fin().filter(f=>f.account&&contaOwn(f.account)!==ownF(f)&&!f.reemb);
const sinal=f=>(ownF(f)==='pj'?1:-1)*(f.type==='despesa'?1:-1);
const deve=()=>cruzados().reduce((s,f)=>s+sinal(f)*num(f.amount),0);
/* Painel novo da Visão geral (aprovado em 10/11): sobra, rosca, contas e cartões */
const sigla=n=>{const w=String(n||'').split(/[\s·()]+/).filter(Boolean);if(!w.length)return '?';if(w[0].length<=4)return w[0];return w.length>1&&/^[A-ZÀ-Ú]/.test(w[1])?w[0][0]+w[1][0]:w[0].slice(0,2)};
const KIND={banco:'Conta bancária',caixa:'Dinheiro',digital:'Conta digital'};
function fdTop(mk,Dp){
  const Ra=sum(finMonth(mk,'receita','all')),gj=sum(finMonth(mk,'despesa','pj')),gf=sum(finMonth(mk,'despesa','pf'));
  const C=contasAll(),ban=C.filter(c=>c.kind!=='cartao').map(c=>[c,saldoConta(c.id)]).filter(x=>x[1]>0.004).sort((a,b)=>b[1]-a[1]);
  const car=C.filter(c=>c.kind==='cartao').map(c=>[c,Math.max(0,-saldoConta(c.id))]);
  const tem=ban.reduce((s,x)=>s+x[1],0),deve=car.reduce((s,x)=>s+x[1],0),sob=Math.max(0,Ra-gj-gf),base=Math.max(Ra,gj+gf);
  const P=[['Sobrou',sob,'var(--ok)'],['Você',gf,'var(--pink)'],['Stond',gj,'var(--red)']],pc=v=>base?Math.round(v/base*100):0;
  const R0=15.9155;let off=25;const arcs=base?P.filter(x=>x[1]>0).map(([n,v,c])=>{const p=v/base*100,g=p>2?1:0;const t=`<circle cx="21" cy="21" r="${R0}" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="${(p-g).toFixed(2)} ${(100-p+g).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"><title>${n}: ${brl(v)}</title></circle>`;off-=p;return t}).join(''):'';
  const st=(c,n,v)=>`<div class="fd-st"><small><i style="background:${c}"></i>${n}</small><b>${brl(v)}</b></div>`;
  const fat=c=>{const F=faturas(c)[0];return F?{v:F.total,vence:F.vence,txt:`Fatura de ${MES[pd(F.vence).getMonth()]} · ${F.fecha<=today()?'fechada':'fecha '+fmtD(F.fecha).replace(/^\w+, /,'')}`}:{v:Math.max(0,-saldoConta(c.id)),vence:'',txt:'Fatura atual'}};
  const grad=c=>{const h=String(c.color||'#8f0a19');return `linear-gradient(135deg, color-mix(in srgb, ${h} 82%, #ffffff), color-mix(in srgb, ${h} 88%, #000000))`};
  return `<div class="bx w2 w2m fd-hero"><span class="lb">Sobra de verdade</span><div class="num">${brl(tem-deve)}</div><span class="ft" style="margin-top:0">O que está nas contas menos o que os cartões devem</span>
    <div class="fd-sts">${st('var(--ok)','Entrou',Ra)}${st('var(--red)','Stond gastou',gj)}${st('var(--pink)','Você gastou',gf)}</div></div>
   <div class="bx w2 w2m"><span class="lb">Para onde foi o que entrou</span>${base?`<div class="fd-donut"><svg viewBox="0 0 42 42" width="150" height="150" role="img" aria-label="Divisão do que entrou"><circle cx="21" cy="21" r="${R0}" fill="none" stroke="var(--line)" stroke-width="5"/>${arcs}<text x="21" y="21" text-anchor="middle" font-size="6.2" font-weight="600" fill="var(--ink)">${pc(sob)}%</text><text x="21" y="26" text-anchor="middle" font-size="2.7" fill="var(--muted)">sobrou</text></svg>
    <div class="fd-lg">${P.map(([n,v,c])=>`<div><i style="background:${c}"></i><span>${n}<small>${brl(v)}</small></span><b>${pc(v)}%</b></div>`).join('')}</div></div>`:'<p class="wait">Nada entrou neste mês ainda.</p>'}</div>
   <div class="bx w2 w2m"><div class="fd-top"><span class="lb">Minhas contas</span><b>${brl(tem)}</b></div>${ban.map(([c,v])=>`<button class="fd-row" data-edit-doc="contas:${esc(c.id)}"><span class="fd-av" style="background:${esc(c.color||'#8f0a19')}">${esc(sigla(c.name))}</span><span class="t"><b>${esc(c.name)}</b><small>${esc(c.note&&c.note.length<60?c.note:(KIND[c.kind]||'Conta')+' · '+ownLb(c.owner))}</small></span><b class="v">${brl(v)}</b></button>`).join('')||'<p class="wait">Nenhuma conta com saldo.</p>'}</div>
   ${car.length?`<div class="bx w2 w2m"><div class="fd-top"><span class="lb">Cartões</span><b>${brl(deve)} <small>em faturas</small></b></div><div class="fd-cards">${car.map(([c])=>{const L=num(c.limite),u=limUsado(c),f=fat(c);return `<button class="fd-cc" data-f="ft" data-v="cart" style="background:${grad(c)}"><div class="h"><span>${esc(c.name)}</span><span>${f.vence?'Vence '+fmtD(f.vence).replace(/^\w+, /,''):''}</span></div><div class="f">${brl(f.v)}</div><div class="d">${f.txt}</div>${L?`<div class="pb"><i style="width:${Math.min(100,u/L*100).toFixed(0)}%"></i></div><div class="lim"><span>Livre ${brl(Math.max(0,L-u))}${u-Math.max(0,-saldoConta(c.id))>0.004?` · parcelas ${brl(u-Math.max(0,-saldoConta(c.id)))}`:''}</span><span>Limite ${brl(L)}</span></div>`:''}</button>`}).join('')}</div></div>`:''}`}
/* Caixa único: o que entrou no mês, quanto a Stond e a Helo gastaram, onde o dinheiro está e quanto limite sobra */
function ondeBox(mk){
  const Ra=sum(finMonth(mk,'receita','all')),gj=sum(finMonth(mk,'despesa','pj')),gf=sum(finMonth(mk,'despesa','pf'));
  const C=contasAll(),ban=C.filter(c=>c.kind!=='cartao').map(c=>[c,saldoConta(c.id)]).filter(x=>x[1]>0.004).sort((a,b)=>b[1]-a[1]);
  const car=C.filter(c=>c.kind==='cartao').map(c=>[c,Math.max(0,-saldoConta(c.id))]);
  const tem=ban.reduce((s,x)=>s+x[1],0),deve=car.reduce((s,x)=>s+x[1],0);
  const sob=Math.max(0,Ra-gj-gf),base=Math.max(Ra,gj+gf)||1;
  /* cor da conta, clareada se for escura demais e com tom mais claro quando duas contas têm a mesma cor */
  let usadas={};const cor=c=>{let h=String(c.color||'#888888').toLowerCase();const m=h.match(/^#([0-9a-f]{6})$/);if(m){const n=parseInt(m[1],16),l=(0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255))/255;if(l<0.2)h=`color-mix(in srgb, ${h} 45%, #9aa3ad)`}const k=usadas[h]=(usadas[h]||0)+1;return k>1?`color-mix(in srgb, ${h} ${100-k*25}%, #ffffff)`:h};
  const CC={};ban.forEach(([c])=>CC[c.id]=cor(c));usadas={};car.forEach(([c])=>CC[c.id]=cor(c));
  const seg=(v,t,cor,tt)=>v>0?`<i style="flex:${(v/t*1000).toFixed(0)} 1 0;background:${esc(cor)}" title="${esc(tt)}: ${brl(v)}"></i>`:'';
  const lg=(cor,n,v,p)=>`<div><i style="background:${esc(cor)}"></i><small>${esc(n)}</small><b>${brl(v)}</b>${p!=null?`<em>${p}%</em>`:''}</div>`;
  const ent=[['Stond gastou',gj,'var(--red)'],['Você gastou',gf,'var(--warn)'],['Sobrou',sob,'var(--ok)']];
  return `<div class="bx w2 h2 w2m onde"><span class="lb">Onde está o dinheiro</span>
   <div class="osec"><div class="oh"><small>Entrou no mês</small><b style="color:var(--ok)">${brl(Ra)}</b></div>
    <div class="sbar">${ent.map(([n,v,c])=>seg(v,base,c,n)).join('')}</div>
    <div class="olg">${ent.map(([n,v,c])=>lg(c,n,v,Ra?Math.round(v/Ra*100):null)).join('')}</div></div>
   <div class="osec"><div class="oh"><small>Guardado nas contas</small><b>${brl(tem)}</b></div>
    ${ban.length?`<div class="sbar">${ban.map(([c,v])=>seg(v,tem,CC[c.id],c.name)).join('')}</div><div class="olg g2c">${ban.map(([c,v])=>lg(CC[c.id],c.name,v)).join('')}</div>`:'<p class="wait">Nenhuma conta com saldo.</p>'}</div>
   ${car.length?`<div class="osec"><div class="oh"><small>Cartões</small><b>${brl(deve)} <span style="font-size:12px;color:var(--muted);font-weight:400">em faturas</span></b></div>${car.map(([c,v])=>{const L=num(c.limite);return `<div class="ocard"><div><span><i style="background:${esc(CC[c.id])}"></i>${esc(c.name)}</span><b>${L?brl(Math.max(0,L-limUsado(c)))+' livre':brl(v)}</b></div>${L?`<div class="sbar thin"><i style="flex:${(Math.min(v,L)/L*1000).toFixed(0)} 1 0;background:${esc(CC[c.id])}"></i>${limUsado(c)-v>0.004?`<i style="flex:${(Math.min(limUsado(c)-v,L)/L*1000).toFixed(0)} 1 0;background:${esc(CC[c.id])};opacity:.45"></i>`:''}<i style="flex:${(Math.max(0,L-limUsado(c))/L*1000).toFixed(0)} 1 0;background:var(--line)"></i></div><small>Fatura ${brl(v)}${limUsado(c)-v>0.004?` + próximas ${brl(limUsado(c)-v)}`:''} de ${brl(L)} de limite</small>`:`<small>Abra a conta e informe o limite</small>`}</div>`}).join('')}</div>`:''}
   <div class="ofoot"><small>Sobra de verdade (contas menos faturas)</small><b>${brl(tem-deve)}</b></div></div>`}
/* A Helo não separa o dinheiro: o que é de um lado e foi pago pelo outro só aparece como informação, sem dívida */
function mistoBox(mk){const xs=fin().filter(f=>f.type==='despesa'&&f.account&&contaOwn(f.account)!==ownF(f)&&String(f.date||'').startsWith(mk));if(!xs.length)return '';
  const pf=sum(xs.filter(f=>ownF(f)==='pf')),pj=sum(xs.filter(f=>ownF(f)==='pj'));
  return `<div class="bx w2 w2m"><span class="lb">Gastos misturados no mês</span><div class="num">${brl(pf)}</div><span class="ft">Gastos pessoais pagos com conta ou cartão da Stond${pj?` · ${brl(pj)} da Stond pagos com conta pessoal`:''}. Só para você saber, ninguém deve nada.</span></div>`}
function deveBox(){const xs=cruzados(),d=deve();if(!xs.length&&!contasAll().some(c=>c.owner==='pf'))return '';
  return `<div class="bx w2 w2m"><span class="lb">${d>=0?'A Stond te deve':'Você deve à Stond'}</span><div class="num" style="color:${d>0?'var(--warn)':d<0?'var(--red)':'var(--ok)'}">${brl(Math.abs(d))}</div><span class="ft">${xs.length?`${xs.length} ${xs.length>1?'lançamentos':'lançamento'} em conta trocada (Stond na pessoal ou pessoal na Stond)`:'Tudo acertado entre a Stond e você'}</span>${xs.length?`<div style="margin-top:10px"><button class="btn sm fx gr" data-acerto>Acertei</button></div>`:''}</div>`}
const isPessoa=f=>/pró-labore|folha|freela/i.test(f.category||'');
const isImposto=f=>/imposto|contabil/i.test(f.category||'');
const finSt=f=>f.paid?(f.type==='receita'?'Recebido':'Pago'):f.date&&f.date<today()?'Atrasado':'Em aberto';
const FT=[['visao','Visão geral'],['lanc','Lançamentos'],['pr','A pagar e receber'],['contas','Contas'],['cart','Cartões'],['cat','Categorias']];
function finRow(f){return `<tr><td>${f.date?fmtD(f.date):'—'}</td><td><button class="lnk" data-edit-doc="fin:${esc(f.id)}"><b>${esc(f.desc||'Sem descrição')}</b></button>${f.client?`<small>${cdot(f.client)}${esc(cli(f.client).name)}</small>`:''}${FO()==='all'?`<small><span class="chip ${ownF(f)==='pf'?'pend':''}">${ownLb(ownF(f))}</span></small>`:''}${f.account&&contaOwn(f.account)!==ownF(f)?`<small>${ownF(f)==='pj'?(f.type==='despesa'?'Pago com conta pessoal':'Caiu em conta pessoal'):(f.type==='despesa'?'Pago com conta ou cartão da Stond':'Caiu na conta da Stond')}</small>`:''}${f.kind==='fixa'?`<small>Fixa${f.until?' até '+MES[+f.until.slice(5,7)-1].slice(0,3)+'/'+f.until.slice(2,4):', sem data para acabar'}</small>`:''}</td><td><span class="cat ${f.type}">${esc(f.category||'Sem categoria')}</span></td><td class="mut">${esc(contaNome(f.account)||'—')}</td><td><button class="pg ${f.paid?'on':f.date&&f.date<today()?'late':''}" data-paid="${esc(f.id)}" aria-pressed="${!!f.paid}" title="${finSt(f)}">${f.paid?'✓':''}</button></td><td class="val ${f.type}">${f.type==='receita'?'+':'−'} ${brl(f.amount)}</td></tr>`}
V.fin=()=>{
  const tab=fv('ft','visao'),who=FO(),mk=fv('fm',month()),[y,m]=mk.split('-').map(Number),R=finMonth(mk,'receita',who),Dp=finMonth(mk,'despesa',who);
  const fm_=(k,t)=>finMonth(k,t,who),fall=()=>finOf(who);
  const prev=iso(new Date(y,m-2,1)).slice(0,7),next=iso(new Date(y,m,1)).slice(0,7);
  const nav=`<div class="mnav"><button data-f="fm" data-v="${prev}" aria-label="Mês anterior">‹</button><b>${Mes(m-1)} ${y}</b><button data-f="fm" data-v="${next}" aria-label="Próximo mês">›</button></div>`;
  const act=`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm fx rd" data-newfin="despesa">+ Despesa</button><button class="btn sm fx gr" data-newfin="receita">+ Recebimento</button></div>`;
  const ownSel=`<div class="filters" style="margin:0 0 12px">${segF('fo',[['all','Tudo'],['pj','Stond (CNPJ)'],['pf','Pessoal (CPF)']])}</div>`;
  const tabs=ownSel+`<div class="ftabs">${FT.map(([k,l])=>`<button data-f="ft" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='visao'){
    const months=[...Array(6)].map((_,i)=>{const d=new Date(y,m-6+i,1),k=iso(d).slice(0,7);return [MES[d.getMonth()].slice(0,3),sum(fm_(k,'receita')),sum(fm_(k,'despesa'))]});
    const mx=Math.max(1,...months.flatMap(x=>[x[1],x[2]]));
    const pc={},rc={};Dp.forEach(f=>{pc[f.category||'Outros']=(pc[f.category||'Outros']||0)+num(f.amount)});R.forEach(f=>{const k=f.client?cli(f.client).name:(f.category||'Outras');rc[k]=(rc[k]||0)+num(f.amount)});
    const dt=sum(Dp)||1,rt=sum(R)||1,per={};active().forEach(c=>{const r=sum(R.filter(f=>f.client===c.id))||fee(c);const d=sum(Dp.filter(f=>f.client===c.id));per[c.id]=[r,d]});
    const prm=iso(new Date(y,m-2,1)).slice(0,7),rPrev=sum(fm_(prm,'receita')),dPrev=sum(fm_(prm,'despesa'));
    const dlt=(a,b)=>b&&b>=a*0.1?`${a>=b?'+':''}${Math.round((a-b)/b*100)}% vs mês anterior`:b?`${brl(b)} no mês anterior`:'sem mês anterior';
    const up=fall().filter(f=>!f.paid&&f.date&&f.date<=iso(new Date(Date.now()+15*864e5))).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
    const saldo=contas().reduce((s,c)=>s+saldoConta(c.id),0);
    const rp=sum(R.filter(f=>f.paid)),dp=sum(Dp.filter(f=>f.paid)),rf=sum(R)-rp,df=sum(Dp)-dp;
    body=`<div class="bento fdash">
     ${fdTop(mk,Dp)}
     <div class="bx w2 w2m"><span class="lb">Próximas contas</span>${up.length?`<div class="mini">${up.map(f=>`<button class="mrow" data-edit-doc="fin:${esc(f.id)}"><span class="cat ${f.type}">${f.type==='receita'?'Receber':'Pagar'}</span><b>${esc(f.desc||'')}</b><small class="${f.date<today()?'late':''}">${f.date<today()?'atrasado · ':''}${fmtD(f.date)}</small><em>${brl(f.amount)}</em></button>`).join('')}</div>`:'<p class="wait">Nada vencendo nos próximos 15 dias.</p>'}</div>
     <div class="bx w2 h2 w2m"><span class="lb">Últimos 6 meses</span><svg class="ch" viewBox="0 0 300 140" aria-label="Receitas e despesas">${months.map((x,i)=>`<rect x="${i*50+8}" y="${120-x[1]/mx*110}" width="16" height="${x[1]/mx*110}" rx="3" fill="var(--ok)"/><rect x="${i*50+26}" y="${120-x[2]/mx*110}" width="16" height="${x[2]/mx*110}" rx="3" fill="var(--red)" fill-opacity=".75"/><text x="${i*50+25}" y="136" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity=".55">${x[0]}</text>`).join('')}</svg><span class="ft"><i class="dot" style="background:var(--ok);display:inline-block"></i> receitas &nbsp; <i class="dot" style="background:var(--red);display:inline-block"></i> despesas</span></div>
     <div class="bx w2 w2m"><span class="lb">De onde veio a receita</span>${Object.keys(rc).length?`<div class="obar">${Object.entries(rc).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div><small>${esc(n)}</small>${bar(v/rt*100,'var(--ok)')}<small>${Math.round(v/rt*100)}%</small></div>`).join('')}</div>`:'<p class="wait">Sem receitas no mês.</p>'}</div>
     <div class="bx w2 w2m"><span class="lb">Gastos por categoria</span>${Dp.length?(()=>{const g={};Dp.forEach(f=>{const k=f.category||'Outros';g[k]=g[k]||{pj:0,pf:0};g[k][ownF(f)]+=num(f.amount)});const L=Object.entries(g).map(([k,v])=>[k,v.pj,v.pf,v.pj+v.pf]).sort((a,b)=>b[3]-a[3]).slice(0,6),mx=L[0][3]||1;return `${who==='all'?'<div class="fd-leg"><span><i style="background:var(--red)"></i>Stond</span><span><i style="background:var(--pink)"></i>Você</span></div>':''}${L.map(([k,a,b,t])=>`<div class="fd-cat"><span>${esc(k)}</span><div class="bar">${a>0?`<i style="width:${(a/mx*100).toFixed(1)}%;background:var(--red)" title="Stond ${brl(a)}"></i>`:''}${b>0?`<i style="width:${(b/mx*100).toFixed(1)}%;background:var(--pink)" title="Você ${brl(b)}"></i>`:''}</div><b>${brl(t)}</b></div>`).join('')}`})():'<p class="wait">Sem despesas no mês.</p>'}</div>
     ${who==='pf'?'':`<div class="bx w2 w2m"><span class="lb">Lucro por cliente</span><div class="obar">${active().map(c=>{const [r,d]=per[c.id];const p=r?(r-d)/r*100:0;return `<div><small>${esc(c.name)}</small>${bar(p,c.color)}<small>${r?Math.round(p)+'%':'—'}</small></div>`}).join('')}</div><span class="ft">Mensalidade menos despesas ligadas ao cliente</span></div>`}
    </div>`;
  }
  if(tab==='lanc'){
    const sub=fv('fs','todas'),q=(fv('fq','')||'').toLowerCase();
    const SUBS=[['todas','Todas',()=>true],['rec','Recebimentos',f=>f.type==='receita'],['fixa','Despesas fixas',f=>f.type==='despesa'&&f.kind==='fixa'],['var','Despesas variáveis',f=>f.type==='despesa'&&f.kind!=='fixa'],['imp','Impostos',isImposto],['pes','Pessoas',isPessoa]];
    const all=[...R,...Dp].filter(f=>!q||[f.desc,f.category,cli(f.client).name,contaNome(f.account)].join(' ').toLowerCase().includes(q));
    const L=all.filter(SUBS.find(s=>s[0]===sub)[2]).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const r=sum(L.filter(f=>f.type==='receita')),d=sum(L.filter(f=>f.type==='despesa'));
    const prevFix=fall().filter(f=>String(f.date||'').startsWith(prev)&&fixOn(f,mk)),hasFix=Dp.some(f=>f.kind==='fixa')||R.some(f=>f.kind==='fixa');
    body=`<div class="fbar">${nav}<input class="fsearch" id="fq" type="search" placeholder="Buscar lançamento" value="${esc(fv('fq',''))}" aria-label="Buscar lançamento">${prevFix.length&&!hasFix?`<button class="btn sm ghost" data-fincopy>Trazer ${prevFix.length} fixa${prevFix.length>1?'s':''} de ${MES[(m+10)%12]}</button>`:''}</div>
    <div class="fsub">${SUBS.map(([k,l,fn])=>`<button data-f="fs" data-v="${k}" aria-pressed="${sub===k}" class="s-${k}">${l} <i>${all.filter(fn).length}</i></button>`).join('')}</div>
    <div class="ftot"><div><small>Receitas</small><b style="color:var(--ok)">${brl(r)}</b></div><div><small>Despesas</small><b style="color:var(--red)">${brl(d)}</b></div><div><small>Saldo</small><b>${brl(r-d)}</b></div></div>
    <div class="ftable"><form class="qf" id="qf"><span class="lb">Lançamento rápido</span><select name="type" aria-label="Tipo"><option value="despesa">Despesa</option><option value="receita">Recebimento</option></select>${who==='all'?`<select name="owner" aria-label="De quem é">${OWN.map(([a,b])=>`<option value="${a}">${b.replace(/ \(.*/,'')}</option>`).join('')}</select>`:`<input type="hidden" name="owner" value="${who}">`}<input name="desc" placeholder="Descrição" required aria-label="Descrição"><input name="amount" inputmode="decimal" placeholder="Valor" required aria-label="Valor" style="width:96px"><input name="date" type="date" value="${mk===month()?today():mk+'-01'}" aria-label="Data"><select name="category" aria-label="Categoria">${catOpts().map(([a,b])=>`<option value="${esc(a)}">${esc(b||'Categoria')}</option>`).join('')}</select><select name="account" aria-label="Conta">${contaOpts().map(([a,b])=>`<option value="${esc(a)}">${esc(b)}</option>`).join('')}</select><button class="btn sm red">Lançar</button></form>
    ${L.length?`<div class="tw"><table class="tb"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Pago?</th><th style="text-align:right">Valor</th></tr></thead><tbody>${L.map(finRow).join('')}</tbody></table></div>`:empty(q?'Nada encontrado com essa busca.':'Nenhum lançamento aqui neste mês.')}</div>`;
  }
  if(tab==='pr'){
    const t=today(),w=iso(new Date(Date.now()+7*864e5)),mo=iso(new Date(Date.now()+30*864e5));
    const open=fall().filter(f=>!f.paid&&f.date);
    const G=[['Atrasados',f=>f.date<t,'late'],['Hoje e próximos 7 dias',f=>f.date>=t&&f.date<=w,''],['Próximos 30 dias',f=>f.date>w&&f.date<=mo,'']];
    const FT=fatAll(who),fat=FT.length?`<p class="eyebrow" style="margin:14px 0 6px">Faturas de cartão · ${brl(FT.reduce((s,x)=>s+x.total,0))}</p><div class="list">${FT.map(x=>`<div class="row"><div class="t"><b>Fatura ${esc(x.conta.name)}</b><small>Vence ${fmtD(x.vence)} · ${x.fecha<=t?'fechada':'fecha '+fmtD(x.fecha).replace(/^\w+, /,'')}</small></div><b style="font-weight:500">${brl(x.total)}</b></div>`).join('')}</div><p class="wait" style="margin-top:6px">Para pagar, lance uma transferência da conta para o cartão.</p>`:'';
    const col=type=>{const a=open.filter(f=>f.type===type);return (type==='despesa'?fat:'')+G.map(([l,fn,c])=>{const xs=a.filter(fn).sort((p,q)=>p.date.localeCompare(q.date));return xs.length?`<p class="eyebrow ${c}" style="margin:14px 0 6px">${l} · ${brl(sum(xs))}</p><div class="list">${xs.map(f=>`<div class="row"><div class="t"><b>${esc(f.desc||'')}</b><small>${fmtD(f.date)}${f.client?' · '+esc(cli(f.client).name):''}${f.category?' · '+esc(f.category):''}</small></div><b style="font-weight:500">${brl(f.amount)}</b><button class="btn sm ${type==='receita'?'fx gr':'ghost'}" data-paid="${esc(f.id)}">${type==='receita'?'Recebi':'Paguei'}</button></div>`).join('')}</div>`:''}).join('')||'<p class="wait" style="margin-top:12px">Nada em aberto.</p>'};
    body=`<div class="g2"><section><h3 class="h3">A receber <small>${brl(sum(open.filter(f=>f.type==='receita')))}</small></h3>${col('receita')}</section><section><h3 class="h3">A pagar <small>${brl(sum(open.filter(f=>f.type==='despesa')))}</small></h3>${col('despesa')}</section></div>`;
  }
  if(tab==='contas'){
    const sc=fall().filter(f=>!f.account&&f.paid);
    body=`<div class="cgrid">${contas().map(c=>`<button class="acc" data-edit-doc="contas:${esc(c.id)}" style="--cc:${esc(c.color||'#8f0a19')}"><span class="lb">${esc({banco:'Conta bancária',caixa:'Dinheiro',cartao:'Cartão de crédito',digital:'Conta digital'}[c.kind]||'Conta')} · ${ownLb(c.owner)}</span><b>${esc(c.name)}</b><div class="num">${brl(saldoConta(c.id))}</div><small>${(n=>n+(n===1?' lançamento':' lançamentos'))(docs('fin').filter(f=>f.account===c.id).length)}</small>${c.kind==='cartao'?(num(c.fecha)&&num(c.vence)?`<small>Fecha dia ${num(c.fecha)} · vence dia ${num(c.vence)}</small>${faturas(c).map(x=>`<small>Fatura ${fmtD(x.vence).replace(/^\w+, /,'')} · ${x.fecha<=today()?'fechada':'aberta'} · ${brl(x.total)}</small>`).join('')}`:'<small>Abra e preencha os dias de fechamento e vencimento</small>'):''}</button>`).join('')}<button class="acc add" data-new="contas" data-owner="${who==='pf'?'pf':'pj'}"><b>+ Nova conta</b><small>Banco, conta digital, cartão ou dinheiro</small></button></div>
    ${sc.length?`<p class="wait" style="margin-top:14px">${sc.length} lançamentos pagos estão sem conta. Abra e escolha a conta para o saldo ficar certo.</p>`:''}`;
  }
  if(tab==='cart'){
    const CC=contas().filter(c=>c.kind==='cartao');
    if(!CC.length)body=`<p class="wait">Nenhum cartão aqui. Cadastre em Contas, com o tipo Cartão de crédito.</p>`;
    else{
      const cid=CC.some(c=>c.id===fv('fc'))?fv('fc'):CC[0].id,c=CC.find(x=>x.id===cid),G=fatGroups(c);
      if(!num(c.fecha)||!num(c.vence))body=`${segF('fc',CC.map(x=>[x.id,esc(x.name)]))}<p class="wait" style="margin-top:14px">Falta dizer o dia em que a fatura fecha e vence. <button class="btn sm ghost" data-edit-doc="contas:${esc(c.id)}">Preencher</button></p>`;
      else{
        const def=(G.find(x=>x.vence>=today()&&x.total>0.004)||G.find(x=>x.vence>=today())||{vence:today()}).vence.slice(0,7);
        const ym=/^\d{4}-\d{2}$/.test(fv('fcm_'+cid)||'')?fv('fcm_'+cid):def,[fy,fmn]=ym.split('-').map(Number);
        const x=G.find(g=>g.vence.startsWith(ym))||{...fatMes(c,ym),bruto:0,total:0,itens:[]},[st,stc]=fatSt(x);
        const pv=iso(new Date(fy,fmn-2,1)).slice(0,7),nx=iso(new Date(fy,fmn,1)).slice(0,7);
        const fnav=`<div class="mnav"><button data-f="fcm_${esc(cid)}" data-v="${pv}" aria-label="Fatura anterior">‹</button><b>${Mes(fmn-1)} ${fy}</b><button data-f="fcm_${esc(cid)}" data-v="${nx}" aria-label="Próxima fatura">›</button></div>`;
        const its=x.itens.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
        const cats={};its.filter(f=>f.type==='despesa').forEach(f=>{cats[f.category||'Outros']=(cats[f.category||'Outros']||0)+num(f.amount)});
        body=`<div class="filters" style="margin:0 0 12px">${segF('fc',CC.map(k=>[k.id,esc(k.name)]))}</div><div class="fbar">${fnav}</div>
        <div class="bento"><div class="bx hero w2 w2m" style="--cc:${esc(c.color||'#8f0a19')}"><span class="lb">Fatura de ${Mes(fmn-1).toLowerCase()} · ${esc(c.name)} <span class="chip ${stc}">${st}</span></span><div class="num">${brl(x.bruto>0?x.bruto:0)}</div><span class="ft">Fecha ${fmtD(x.fecha)} · vence ${fmtD(x.vence)}${x.bruto>0.004&&x.total<x.bruto-0.004?` · já pago ${brl(x.bruto-x.total)}, falta ${brl(x.total)}`:''}</span></div>
        <div class="bx"><span class="lb">Limite usado</span><div class="num">${brl(limUsado(c))}</div><span class="ft">Fatura atual mais parcelas futuras${num(c.limite)?` · livre ${brl(Math.max(0,num(c.limite)-limUsado(c)))}`:""}</span></div>
        <div class="bx"><span class="lb">Compras</span><div class="num">${its.filter(f=>f.type==='despesa').length}</div><span class="ft">${Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>esc(k)+' '+brl(v)).join(' · ')||'Nada nesta fatura'}</span></div></div>
        <div class="ftable" style="margin-top:14px">${its.length?`<div class="tw"><table class="tb"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Pago?</th><th style="text-align:right">Valor</th></tr></thead><tbody>${its.map(finRow).join('')}</tbody></table></div>`:empty('Nenhuma compra nesta fatura.')}</div>
        <p class="wait" style="margin-top:10px">Compras até o dia ${num(c.fecha)-1} entram na fatura que vence no dia ${num(c.vence)}. Para pagar, lance uma transferência da conta para o cartão.</p>`;
      }
    }
  }
  if(tab==='cat'){
    const cw=who==='pf'?'pf':'pj';body=`${who==='all'?'<p class="wait" style="margin:0 0 12px">Mostrando as categorias da Stond. Escolha Pessoal (CPF) acima para ver as suas.</p>':''}<div class="g2">${['receita','despesa'].map(t=>`<section><h3 class="h3">${t==='receita'?'Receitas':'Despesas'}</h3><div class="list">${cats(t,cw).map(c=>{const xs=(t==='receita'?R:Dp).filter(f=>f.category===c);return `<div class="row"><span class="cat ${t}">${esc(c)}</span><small style="margin-left:auto;color:var(--muted)">${xs.length} no mês</small><b style="font-weight:500;min-width:90px;text-align:right">${brl(sum(xs))}</b></div>`}).join('')}</div></section>`).join('')}</div><button class="btn sm ghost" style="margin-top:14px" data-editcats="${cw}">Editar categorias ${cw==='pf'?'pessoais':'da Stond'}</button>`;
  }
  return shell(topb('Financeiro',(who==='pj'?'Stond · ':who==='pf'?'Pessoal · ':'')+(tab==='visao'||tab==='cat'?`${Mes(m-1)} ${y}`:''),act)+tabs+(tab==='visao'||tab==='cat'?`<div style="margin:0 0 14px">${nav}</div>`:'')+body);
};

/* Administrativo */
V.adm=()=>{
  const E=settings('empresa'),O=docs('obrig').sort((a,b)=>String(a.due).localeCompare(String(b.due))),T=docs('tools'),Tm=docs('team'),Dc=docs('cdocs');
  const nfm=finOf('pj').filter(f=>f.type==='receita'&&String(f.date).startsWith(month()));
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
 fin:{t:'Lançamento',f:[['type','Tipo','sel',[['receita','Recebimento'],['despesa','Despesa']]],['owner','De quem é','sel',OWN],['desc','Descrição'],['amount','Valor','num'],['date','Vencimento','date'],['category','Categoria','sel',catOpts],['account','Conta','sel',contaOpts],['kind','Fixa ou variável','sel',[['variavel','Variável'],['fixa','Fixa (todo mês)']]],['until','Se fixa, até quando','sel',untilOpts],['client','Cliente','sel',clientOpts],['paid','Pago ou recebido','chk'],['nf','Nota fiscal (número)'],['note','Anotação','area']]},
 contas:{t:'Conta',f:[['name','Nome (ex.: Nubank PJ)'],['owner','De quem é','sel',OWN],['kind','Tipo','sel',[['banco','Conta bancária'],['digital','Conta digital'],['cartao','Cartão de crédito'],['caixa','Dinheiro']]],['inicial','Saldo inicial','num'],['limite','Cartão: limite total','num'],['fecha','Cartão: dia em que a fatura fecha','num'],['vence','Cartão: dia em que a fatura vence','num'],['color','Cor','color']]},
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
function formModal(title,fields,vals,onSave,onDel,extra='',saveLabel='Salvar'){
  MODAL={html:()=>`<div class="ovl" data-close><form class="fm" id="fm" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="hd"><b>${esc(title)}</b><button class="x" type="button" data-x aria-label="Fechar">✕</button></div><div class="fg">${fields.map(f=>field(f,vals[f[0]])).join('')}</div>${extra}<div class="fa">${onDel?'<button class="btn sm ghost" type="button" id="fdel">Excluir</button>':''}<span style="flex:1"></span><button class="btn sm ghost" type="button" data-x>Cancelar</button><button class="btn sm red" id="fsave">${esc(saveLabel)}</button></div></form></div>`,onSave,onDel,fields};
  render();
}
function readForm(fields){const o={};const f=$('#fm');fields.forEach(([k,,t])=>{const el=f.elements[k];if(!el)return;o[k]=t==='chk'?el.checked:t==='num'?(el.value===''?'':num(el.value)):el.value.trim()});return o}
function openDoc(col,id,preset={}){
  const key=col==='settings'?'settings:'+id:col,F=FORMS[key];if(!F)return;
  const cur=id?(col==='settings'&&id==='metas'?{...doc1('settings','metas'),saldo:doc1('settings','caixa').saldo}:docs(col).find(d=>d.id===id)||doc1(col,id)):{...preset};
  if(col==='fin'&&!cur.owner)cur.owner=ownF(cur);
  formModal(F.t,F.f,cur,async v=>{
    if(key==='settings:metas'){const {saldo,...rest}=v;await saveDoc('settings','metas',{...doc1('settings','metas'),...rest});await saveDoc('settings','caixa',{saldo,atualizado:today()});return}
    await saveDoc(col,id,{...(id?docs(col).find(d=>d.id===id)||doc1(col,id):{}),...v,...(id?{}:{createdAt:new Date().toISOString()})});
  },id&&col!=='settings'&&col!=='reports'?async()=>delDoc(col,id):null);
}
const POSTF=[['title','Título'],['client_id','Cliente','sel',()=>CL().map(c=>[c.id,c.name])],['type','Formato','sel',[['carrossel','Carrossel'],['reels','Reels'],['post','Post'],['story','Stories']]],['date','Data','date'],['time','Hora','time'],['due','Prazo da produção','date'],['col','Etapa','sel',COLS.slice(0,4).map(c=>[c[0],c[1]])],['keyword','Palavra da automação'],['caption','Legenda','area'],['brief','Briefing','area'],['internal_note','Nota interna (cliente não vê)','area']];
function openPost(id,col){
  const p=id?posts().find(x=>x.id===id):{client_id:fv('dc','all')!=='all'?fv('dc'):CL()[0]?.id,type:'carrossel',status:'rascunho',stage:['ideia','producao'].includes(col)?col:'ideia',media:[]};
  const media=(p.media||[]);
  const extra=`<div class="fld full"><label>Mídia</label><div class="mrow">${media.map((m,i)=>`<span class="mth">${m.kind==='video'?'<span class="noimg">vídeo</span>':m.kind==='pdf'?`<a class="noimg" href="${mediaUrl(m.url,p.client_id)}" target="_blank" rel="noopener" title="${esc(m.name||'PDF')}">PDF</a>`:`<img src="${mediaUrl(m.url,p.client_id)}" alt="">`}<button type="button" data-rmmedia="${i}" aria-label="Tirar">✕</button></span>`).join('')}<label class="mth add">+<input type="file" id="fmup" accept="image/*,video/*,application/pdf,.pdf" multiple hidden></label></div></div>${id&&D.feedback.some(f=>f.post_id===id)?`<div class="fld full"><label>Conversa com o cliente</label>${D.feedback.filter(f=>f.post_id===id).map(f=>`<small class="hist">${esc(f.author||'Cliente')} · ${f.kind==='aprovado'?'aprovou':f.kind==='ajuste'?'pediu ajuste':'comentou'}${f.text?': '+esc(f.text):''}</small>`).join('')}</div>`:''}`;
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
  const F=[['name','Nome'],['handle','Instagram (sem @)'],['color','Cor','color'],['status','Situação','sel',[['ativo','Ativo'],['pausado','Pausado'],['inativo','Inativo']]],['fee','Mensalidade','num'],['since','Cliente desde','date'],['renewAt','Renova em','date'],['email','E-mail do cliente'],['nota','Nota do cliente (0 a 10)','num'],['origem','Origem','sel',[['',''],['Indicação','Indicação'],['Instagram','Instagram'],['Site','Site'],['Outro','Outro']]]];
  const extra=`<div class="fld full"><label>Serviços</label><div class="svc" style="padding:0">${SV.map(s=>`<label class="fck"><input type="checkbox" data-svc="${esc(s)}" ${(d.services||[]).includes(s)?'checked':''}> ${s}</label>`).join('')}</div></div>`;
  formModal(id?'Cliente':'Novo cliente',F,{name:c.name,handle:c.handle,color:c.color,status:c.status,...d},async v=>{
    const services=[...document.querySelectorAll('[data-svc]')].filter(x=>x.checked).map(x=>x.dataset.svc);
    const {name,handle,color,status,...rest}=v;
    const row={id:c.id||name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),name,handle:handle.replace(/^@/,''),color,status,data:{...d,...rest,services}};
    const {data,error}=await sb.from('clients').upsert(row).select('id,name,handle,color,status,data,access_token').single();if(error)throw new Error(error.message);
    const i=D.clients.findIndex(x=>x.id===data.id);i>=0?D.clients[i]=data:D.clients.push(data);
  },null,extra);
}
function openInvite(id){
  const c=cli(id),d=c.data||{};
  const extra=`<p class="sub" style="margin:0 20px 6px;font-size:12.5px">${d.convite_em?'Último convite enviado em '+new Date(d.convite_em).toLocaleDateString('pt-BR')+'. ':''}O e-mail sai de naoresponda@stond.com.br com o botão "Abrir meu portal". Se a pessoa já tiver conta, ela recebe um link de acesso.</p>`;
  formModal('Convidar '+c.name,[['email','E-mail do cliente']],{email:d.email||''},async v=>{
    if(!v.email)throw new Error('Digite o e-mail');
    const {data,error}=await sb.functions.invoke('convite',{body:{client_id:id,email:v.email}});
    let e=data&&data.error;if(!data?.ok&&!e&&error){try{e=(await error.context.json()).error}catch(_){e=error.message}}
    if(!data?.ok)throw new Error(e||'Não deu para enviar agora');
    c.data={...d,email:data.email,convite_em:new Date().toISOString()};
    return data.kind==='link'?'Link de acesso enviado para '+data.email:'Convite enviado para '+data.email;
  },null,extra,'Enviar convite');
}
function openConnect(){
  const c=fv('mc',CL()[0]?.id);
  const SC='pages_show_list,pages_read_engagement,pages_manage_metadata,business_management,instagram_basic,instagram_manage_comments,instagram_manage_messages,instagram_content_publish,instagram_manage_insights';
  const extra=`<ol class="sub" style="margin:0 20px 8px;padding-left:18px;font-size:12.5px;line-height:1.6"><li>Abra o <a href="https://developers.facebook.com/tools/explorer/1350565907033729/?method=GET&path=me%2Faccounts&version=v23.0" target="_blank" rel="noopener">Explorador da Graph API</a> (app Stond já selecionado)</li><li>Em Permissões, adicione: <code style="font-size:11px;word-break:break-all">${SC.replaceAll(',',', ')}</code></li><li>Clique em <b>Generate Access Token</b>, confirme com o seu Facebook e marque a Página do ${esc(cli(c).name)}</li><li>Copie o token e cole aqui. Ele vai direto para o banco, ninguém mais vê</li></ol>`;
  formModal('Reconectar Instagram · '+cli(c).name,[['token','Token do Facebook','password']],{},async v=>{
    if(!v.token)throw new Error('Cole o token');
    const {data,error}=await sb.functions.invoke('ig-connect',{body:{client_id:c,token:v.token}});
    let e=data&&data.error;if(!data?.ok&&!e&&error){try{e=(await error.context.json()).error}catch(_){e=error.message}}
    if(!data?.ok)throw new Error(e||'Não deu para conectar');
    const miss=SC.split(',').filter(x=>!(data.scopes||[]).includes(x));
    return '@'+data.username+' conectado'+(miss.length?'. Faltou: '+miss.join(', '):'. Todas as permissões ok');
  },null,extra,'Conectar');
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
  if(t.closest('[data-ig-connect]')){openConnect();return}
  const sy=t.closest('[data-sync-met]');if(sy){const c=fv('mc',CL()[0]?.id);sy.disabled=true;sy.textContent='Puxando…';
    try{const {data,error}=await sb.functions.invoke('ig-metrics',{body:{action:'now',client_id:c}});if(error)throw new Error((await error.context.json().catch(()=>({}))).error||error.message);
      const r=(data.res||[])[0]||{};if(r.error)throw new Error(r.error);await load();render();toast(r.errors&&r.errors.length?'Seguidores atualizados. Alcance e visualizações precisam da permissão de métricas no Meta.':'Números atualizados do Meta')}
    catch(x){toast(x.message);sy.disabled=false;sy.textContent='Puxar do Meta'}return}
  const ek=t.closest('[data-edit-kw]');if(ek){openKw(ek.dataset.editKw);return}
  const sm=t.closest('[data-sec]');if(sm){const k=sm.dataset.sec,c=menuClosed();ls.set('sg-menu2',(c.includes(k)?c.filter(x=>x!==k):[...c,k]).join('|'));render();return}
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
  const iv=t.closest('[data-invite]');if(iv){openInvite(iv.dataset.invite);return}
  const sc=t.closest('[data-sched]');if(sc){openSchedule(sc.dataset.sched);return}
  const nf_=t.closest('[data-newfin]');if(nf_){const ty_=nf_.dataset.newfin;const ow=FO()==='pf'?'pf':'pj';openDoc('fin',null,{type:ty_,owner:ow,date:today(),category:ty_==='receita'&&ow==='pj'?'Mensalidades':''});return}
  const pd_=t.closest('[data-paid]');if(pd_){const f=fin().find(x=>x.id===pd_.dataset.paid);if(!f)return;pd_.disabled=true;
    try{await saveDoc('fin',f.id,{...doc1('fin',f.id),paid:!f.paid,paidAt:f.paid?null:today()});toast(f.paid?'Voltou para em aberto':f.type==='receita'?'Marcado como recebido':'Marcado como pago');render()}catch(x){toast(x.message);pd_.disabled=false}return}
  const fc=t.closest('[data-fincopy]');if(fc){fc.disabled=true;const mk=fv('fm',month()),[y,m]=mk.split('-').map(Number),prev=iso(new Date(y,m-2,1)).slice(0,7);
    const xs=finOf(FO()).filter(f=>String(f.date||'').startsWith(prev)&&fixOn(f,mk));const last=new Date(y,m,0).getDate();
    try{for(const f of xs){const rest=doc1('fin',f.id);const day=Math.min(+String(f.date).slice(8,10)||1,last);await saveDoc('fin',null,{...rest,client:f.client||'',date:`${mk}-${String(day).padStart(2,'0')}`,paid:false,paidAt:null,createdAt:new Date().toISOString()})}
      toast(xs.length+' despesas fixas trazidas');render()}catch(x){toast(x.message);fc.disabled=false}return}
  const ecb=t.closest('[data-editcats]');if(ecb){const c=doc1('settings','categorias'),w=ecb.dataset.editcats==='pf'?'pf':'pj',p=w==='pf'?'pf_':'';formModal(w==='pf'?'Categorias pessoais':'Categorias da Stond',[['receita','Receitas (uma por linha)','area'],['despesa','Despesas (uma por linha)','area']],{receita:cats('receita',w).join('\n'),despesa:cats('despesa',w).join('\n')},async v=>{
      const sp=x=>String(x||'').split('\n').map(z=>z.trim()).filter(Boolean);await saveDoc('settings','categorias',{...c,[p+'receita']:sp(v.receita),[p+'despesa']:sp(v.despesa)})});return}
  if(t.closest('[data-acerto]')){openAcerto();return}
  const nc=t.closest('[data-newcol]');if(nc){openPost(null,nc.dataset.newcol);return}
  const nw=t.closest('[data-new]');if(nw){const k=nw.dataset.new;if(k==='post')openPost();else if(k==='kw')openKw();else if(k==='client')openClient();else if(k==='metric')openMetric();else openDoc(k,null,k==='events'?{date:today(),kind:'reuniao'}:k==='fin'?{type:'despesa',owner:FO()==='pf'?'pf':'pj',date:today()}:k==='contas'?{owner:nw.dataset.owner||'pj'}:k==='leads'?{stage:'novo'}:k==='contracts'?{kind:'proposta',status:'rascunho'}:{});return}
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
function openAcerto(){
  const xs=cruzados(),d=deve(),pj=contasAll().filter(c=>(c.owner||'pj')==='pj'),pf=contasAll().filter(c=>c.owner==='pf');
  const lst=`<div class="list" style="margin:4px 0 8px;max-height:220px;overflow:auto">${xs.map(f=>`<div class="row"><div class="t"><b>${esc(f.desc||'')}</b><small>${f.date?fmtD(f.date):''} · ${esc(contaNome(f.account))}</small></div><b style="font-weight:500">${sinal(f)<0?'−':''}${brl(f.amount)}</b></div>`).join('')}</div><p class="wait">${d>=0?`A Stond transfere ${brl(d)} para você.`:`Você transfere ${brl(-d)} para a Stond.`} Os lançamentos acima ficam marcados como acertados, e o saldo das duas contas é corrigido. Isso não entra como receita nem despesa.</p>`;
  formModal(d>=0?'A Stond te paga de volta':'Você devolve à Stond',[['date','Data do acerto','date'],['de','Conta da Stond','sel',[['','Sem conta'],...pj.map(c=>[c.id,c.name])]],['para','Sua conta pessoal','sel',[['','Sem conta'],...pf.map(c=>[c.id,c.name])]]],{date:today(),de:pj[0]?.id||'',para:pf[0]?.id||''},async v=>{
    const amt=Math.abs(d),now=new Date().toISOString(),stondPaga=d>=0,base={amount:amt,date:v.date,paid:true,paidAt:v.date,transfer:true,kind:'variavel',client:'',createdAt:now,category:'Acerto Stond x pessoal'};
    if(amt){await saveDoc('fin',null,{...base,owner:'pj',account:v.de,type:stondPaga?'despesa':'receita',desc:stondPaga?'Reembolso para a Helo':'Devolução da Helo'});
      await saveDoc('fin',null,{...base,owner:'pf',account:v.para,type:stondPaga?'receita':'despesa',desc:stondPaga?'Reembolso da Stond':'Devolução para a Stond'})}
    for(const f of xs)await saveDoc('fin',f.id,{...doc1('fin',f.id),reemb:v.date});
    return 'Acerto registrado';
  },null,lst,'Registrar acerto');
}
function confirmDel(b,msg='Toque de novo para excluir'){if(b.dataset.sure)return true;const old=b.textContent;b.dataset.sure='1';b.textContent=msg;setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent=old}},3000);return false}
document.addEventListener('submit',async e=>{
  if(e.target.id==='fm'){e.preventDefault();const b=$('#fsave'),bl=b.textContent;b.disabled=true;b.textContent=bl==='Salvar'?'Salvando…':'Enviando…';
    try{const m=await MODAL.onSave(readForm(MODAL.fields));MODAL=null;toast(typeof m==='string'?m:'Salvo');render()}catch(x){toast(x.message);b.disabled=false;b.textContent=bl}return}
  if(e.target.id==='qf'){e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));if(!v.desc||!num(v.amount))return toast('Preencha descrição e valor');
    const b=f.querySelector('button');b.disabled=true;try{await saveDoc('fin',null,{...v,owner:v.owner||'pj',amount:num(v.amount),kind:'variavel',paid:false,client:'',createdAt:new Date().toISOString()});toast('Lançado');render();const d=$('#qf input[name=desc]');if(d)d.focus()}catch(x){toast(x.message);b.disabled=false}return}
  if(e.target.id==='mf'){e.preventDefault();const v=$('#mt').value.trim();if(!v)return;const c=fv('gc',CL()[0]?.id);
    try{await saveDoc('messages',null,{client:c,text:v,who:'Stond',by:ME.name,at:new Date().toISOString(),readStond:true});render();const i=$('#mt');if(i)i.focus()}catch(x){toast(x.message)}}
});
document.addEventListener('input',e=>{if(e.target.id==='fq'){FILT.fq=e.target.value;const p=e.target.selectionStart;render();const i=$('#fq');if(i){i.focus();try{i.setSelectionRange(p,p)}catch(_){}}}});
document.addEventListener('change',async e=>{
  if(e.target.id==='fmup'){const files=[...e.target.files];const c=$('#fm').elements.client_id.value;
    const sp=space();if(sp&&sp.f>=.98){toast('O espaço de arquivos está cheio. Apague vídeos antigos antes de enviar.');e.target.value='';return}
    for(const f of files){if(f.size>50*1048576){toast(f.name+' tem mais de 50 MB. Comprima o arquivo antes de enviar.');continue}
      const path=`${c}/${Date.now()}-${f.name.normalize('NFD').replace(/[^\w.-]+/g,'-')}`;toast('Enviando '+f.name);
      const {error}=await sb.storage.from('media').upload(path,f,{contentType:f.type,upsert:false});if(error){toast(error.message);continue}
      if(D.usage){D.usage.files_bytes+=f.size;D.usage.files_count++}
      const kind=f.type.startsWith('video')?'video':(f.type==='application/pdf'||/\.pdf$/i.test(f.name))?'pdf':'image';
      POST_EDIT.media.push(kind==='pdf'?{url:MEDIA+path,kind,name:f.name}:{url:MEDIA+path,kind});
      const add=e.target.closest('.add');add.insertAdjacentHTML('beforebegin',`<span class="mth">${kind==='video'?'<span class="noimg">vídeo</span>':kind==='pdf'?`<a class="noimg" href="${MEDIA+path}" target="_blank" rel="noopener" title="${esc(f.name)}">PDF</a>`:`<img src="${MEDIA+path}" alt="">`}</span>`)}
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
