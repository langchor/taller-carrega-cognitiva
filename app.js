import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
const labels=['Càrrega intrínseca','Càrrega estranya (extrínseca)','Processament pertinent'];
const ADMIN_UID='ytdNbb9Qz0RxK3zj5Ndwh7cLfT82';
let app,auth,db,fs,fa,user=null,isAdmin=false,strategies,mode='actual',sessionId='',caseId='',group='Grup 1',sessions=[],caseNames=[],responses=[],unsubSessions,unsubCases,unsubResponses;
let scores=[50,30,60],picks={actual:[[],[],[]],improve:[[],[],[]]};
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const msg=(id,s)=>$(id).textContent=s;
const sid=()=>fs.doc(db,'sessions',sessionId), cid=()=>fs.doc(db,'sessions',sessionId,'cases',caseId);
function fresh(){scores=[50,30,60];picks={actual:[[],[],[]],improve:[[],[],[]]};renderChoices();renderSliders();renderCharts()}
function triangle(values){if(!values)return '<p class="note">Encara no hi ha valoracions.</p>';const c=[160,130],r=100,a=[-Math.PI/2,Math.PI*5/6,Math.PI/6],pt=(v,i)=>[c[0]+r*v/100*Math.cos(a[i]),c[1]+r*v/100*Math.sin(a[i])],coords=v=>v.map((x,i)=>pt(x,i).join(',')).join(' ');return `<svg viewBox="0 0 320 265" role="img" aria-label="Triangle de valoracions">${[20,40,60,80,100].map(v=>`<polygon points="${coords([v,v,v])}" fill="none" stroke="#d5e1ec"/>`).join('')}${a.map(v=>`<line x1="160" y1="130" x2="${160+r*Math.cos(v)}" y2="${130+r*Math.sin(v)}" stroke="#b8c8d8"/>`).join('')}${[20,40,60,80,100].map(v=>`<text x="166" y="${pt(v,0)[1]+4}" font-size="9" fill="#526579">${v}</text>`).join('')}<polygon points="${coords(values)}" fill="#2687b3" fill-opacity=".24" stroke="#17749d" stroke-width="2.5"/>${values.map((v,i)=>{const p=pt(v,i);return `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#17749d" tabindex="0"><title>${esc(labels[i])}: ${v.toFixed(1)} / 100</title></circle>`}).join('')}<text x="160" y="15" text-anchor="middle" font-size="12">Intrínseca</text><text x="25" y="240" font-size="12">Extrínseca</text><text x="295" y="240" text-anchor="end" font-size="12">Pertinent</text></svg><div class="summary">${values.map((v,i)=>`${labels[i]}: ${v.toFixed(1)}`).join(' · ')}</div>`}
function renderChoices(){
 let html='<div class="columns">';
 labels.forEach((label,col)=>{
  const a=picks[mode][col];
  const n=Math.min(10,Math.max(5,a.length));
  html+=`<div><h3>${esc(label)}</h3>`;
  for(let i=0;i<n;i++)html+=`<div class="choice"><small>Estratègia ${i+1}</small><select data-col="${col}" data-row="${i}"><option value="">— Selecciona —</option>${strategies[mode][col].map((x,j)=>`<option value="${j}" ${a[i]===j?'selected':''}>${esc(x)}</option>`).join('')}</select>${i>=5?`<button type="button" class="secondary" data-remove="${col}" data-index="${i}" aria-label="Retira l’estratègia ${i+1}">−</button>`:''}</div>`;
  if(n<10)html+=`<button type="button" class="secondary" data-add="${col}">+ Afegeix una estratègia</button>`;
  html+='</div>';
 });
 $('choices').innerHTML=html+'</div>';
 $('choices').querySelectorAll('select').forEach(el=>el.onchange=()=>{picks[mode][+el.dataset.col][+el.dataset.row]=el.value===''?null:+el.value});
 $('choices').querySelectorAll('[data-add]').forEach(el=>el.onclick=()=>{const a=picks[mode][+el.dataset.add];if(a.length<10){while(a.length<5)a.push(null);a.push(null);renderChoices()}});
 $('choices').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{const a=picks[mode][+el.dataset.remove];const i=+el.dataset.index;if(i>=5){a.splice(i,1);renderChoices()}});
}
function renderSliders(){$('sliders').innerHTML=labels.map((l,i)=>`<div class="slider-row"><div class="slider-head"><label for="score${i}">${esc(l)}</label><span id="scoreLabel${i}">${scores[i]}</span></div><input type="range" id="score${i}" min="0" max="100" step="1" value="${scores[i]}"></div>`).join('');scores.forEach((_,i)=>$(`score${i}`).oninput=e=>{scores[i]=+e.target.value;msg(`scoreLabel${i}`,scores[i]);renderCharts()})}
const mean=()=>responses.length?labels.map((_,i)=>responses.reduce((s,r)=>s+(Number(r.scores?.[i])||0),0)/responses.length):null;
function bar(values){
 if(!values)return '<p class="note">Pendent de valoracions.</p>';
 const classical=$('model').value==='classic',total=values[0]+values[1]+(classical?values[2]:0),max=Math.max(100,total),colors=['#3679b5','#e3a04c','#26997a'],over=total>100,ref=100/max*100;
 return `<p><strong>${classical?'Model clàssic: I + E + P':'Sweller revisat: I + E'}</strong></p><div style="position:relative;padding-top:22px"><span style="position:absolute;top:0;left:${ref}%;transform:translateX(-100%);font-size:12px;font-weight:700">100</span><div style="position:relative;display:flex;height:24px;background:#e8edf3;border-radius:6px;overflow:hidden">${values.slice(0,classical?3:2).map((v,i)=>`<div style="width:${v/max*100}%;background:${colors[i]}" title="${esc(labels[i])}: ${v.toFixed(1)}"></div>`).join('')}${over?`<div style="position:absolute;left:${ref}%;right:0;top:0;bottom:0;background:#b91c1c"></div>`:''}</div><div style="position:absolute;left:calc(${ref}% - 2px);top:18px;bottom:-4px;border-left:2px solid #18304a"></div></div><p style="${over?'color:#b91c1c;font-weight:700':''}"><strong>${total.toFixed(1)} / 100</strong> · ${over?'Excés: +'+(total-100).toFixed(1)+' punts':total===100?'Al llindar de referència':'Per sota de la referència en '+(100-total).toFixed(1)+' punts'}</p>${classical?'':`<p>Processament pertinent (separat): <strong>${values[2].toFixed(1)} / 100</strong></p>`}<p class="note">El llindar de 100 és una convenció didàctica, no una mesura real de saturació de la memòria de treball.</p>`;
}
function renderCharts(){const m=mean();$('personalChart').innerHTML=triangle(scores)+bar(scores);$('studentGlobal').innerHTML=triangle(m)+bar(m);$('globalChart').innerHTML=triangle(m)+bar(m);$('averages').innerHTML=m?labels.map((l,i)=>`<p><strong>${esc(l)}</strong>: ${m[i].toFixed(1)} / 100</p>`).join(''):'<p class="note">Pendent de valoracions.</p>';const n=sessions.find(s=>s.id===sessionId)?.groupCount||0;const submitted=new Set(responses.map(r=>r.group));msg('count',`${responses.length} / ${n} grups han enviat una valoració.`);$('participation').innerHTML=Array.from({length:n},(_,i)=>{const g=`Grup ${i+1}`;return `<li>${g}: ${submitted.has(g)?'Valoració enviada':'Pendent'}</li>`}).join('');$('responses').innerHTML=responses.length?`<table><thead><tr><th>Grup</th>${labels.map(l=>`<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${responses.slice().sort((a,b)=>a.group.localeCompare(b.group,undefined,{numeric:true})).map(r=>`<tr><td>${esc(r.group)}</td>${r.scores.map(x=>`<td>${Number(x).toFixed(0)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<p class="note">Encara no hi ha respostes.</p>'}
function groupOptions(){const n=sessions.find(s=>s.id===sessionId)?.groupCount||5;$('group').innerHTML=Array.from({length:n},(_,i)=>`<option>Grup ${i+1}</option>`).join('');if(!Array.from($('group').options).some(x=>x.value===group))group='Grup 1';$('group').value=group;msg('activeGroupCount',sessionId?`Nombre de grups de la sessió activa: ${n}`:'Cap sessió activa');}
function sessionOptions(){for(const id of ['session','teacherSession']){$(id).innerHTML=sessions.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');$(id).value=sessionId}groupOptions()}
function caseOptions(){for(const id of ['case','teacherCase']){$(id).innerHTML=caseNames.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$(id).value=caseId}}
function subscribeSessions(){if(unsubSessions)unsubSessions();unsubSessions=fs.onSnapshot(fs.collection(db,'sessions'),snap=>{sessions=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));if(!sessions.some(s=>s.id===sessionId))sessionId=sessions[0]?.id||'';sessionOptions();subscribeCases()},error)}
function subscribeCases(){if(unsubCases)unsubCases();if(!sessionId){caseNames=[];caseId='';caseOptions();subscribeResponses();return}unsubCases=fs.onSnapshot(fs.collection(db,'sessions',sessionId,'cases'),snap=>{caseNames=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));if(!caseNames.some(c=>c.id===caseId))caseId=caseNames[0]?.id||'';caseOptions();subscribeResponses()},error)}
function subscribeResponses(){if(unsubResponses)unsubResponses();responses=[];let first=true;let previousOwn;let previousGroup=group;fresh();if(!sessionId||!caseId){renderCharts();return}unsubResponses=fs.onSnapshot(fs.collection(db,'sessions',sessionId,'cases',caseId,'responses'),snap=>{responses=snap.docs.map(d=>({id:d.id,...d.data()}));const own=JSON.stringify(responses.find(r=>r.group===group)||null);if(first||(previousGroup===group&&own!==previousOwn)){restore()}else renderCharts();first=false;previousOwn=own;previousGroup=group},error)}
function restore(){const r=responses.find(r=>r.group===group);if(r){scores=r.scores.slice();picks=Object.fromEntries(["actual","improve"].map(k=>[k,[0,1,2].map(i=>r.picks?.[k]?.[i]||[])]));msg('submitStatus','Hi ha una valoració d’aquest grup. En enviar, s’actualitzarà.')}else{scores=[50,30,60];picks={actual:[[],[],[]],improve:[[],[],[]]};msg('submitStatus','Encara no hi ha valoració d’aquest grup.')}renderChoices();renderSliders();renderCharts()}
function error(e){console.error(e);msg('connection','Error: '+(e.code||e.message));}
async function ensureStudent(){if(user)return;await fa.signInAnonymously(auth)}
async function submit(){if(!sessionId||!caseId)return alert('Encara no hi ha una sessió i un cas disponibles.');if(!user)return alert('Espera que es connecti Firebase.');const record={group,scores:[...scores],picks:Object.fromEntries(["actual","improve"].map(k=>[k,Object.fromEntries(picks[k].map((a,i)=>[String(i),Array.from(a,x=>x??null)]))])),updatedAt:new Date().toISOString(),ownerUid:user.uid};try{await fs.setDoc(fs.doc(db,'sessions',sessionId,'cases',caseId,'responses',group),record);msg('submitStatus','Valoració enviada correctament.')}catch(e){msg('submitStatus','No s’ha pogut enviar: '+e.message)}}
async function teacherLogin(){try{const email=$('teacherEmail').value.trim(),password=$('teacherPassword').value;if(!email||!password)return alert('Introdueix el correu i la contrasenya.');await fa.signInWithEmailAndPassword(auth,email,password);$('teacherPassword').value='';if(auth.currentUser?.uid!==ADMIN_UID){await fa.signOut(auth);alert('Aquest compte no té permisos de professorat.')}}catch(e){alert('No s’ha pogut iniciar sessió: '+e.message)}}
async function teacherLogout(){await fa.signOut(auth);await ensureStudent()}
function teacherUI(){isAdmin=user?.uid===ADMIN_UID;$('teacherLogin').classList.toggle('hidden',isAdmin);$('teacherTools').classList.toggle('hidden',!isAdmin);$('teacherLogout').classList.toggle('hidden',!isAdmin);msg('teacherStatus',isAdmin?'Sessió de professorat iniciada.':'Inicia sessió amb el compte de professorat.');}
async function addSession(){if(!isAdmin)return;const name=$('newSession').value.trim(),n=Number($('groupCount').value);if(!name||!Number.isInteger(n)||n<1||n>100)return alert('Indica un nom i entre 1 i 100 grups.');try{const ref=await fs.addDoc(fs.collection(db,'sessions'),{name,groupCount:n,createdAt:new Date().toISOString()});sessionId=ref.id;$('newSession').value='';subscribeSessions()}catch(e){alert(e.message)}}
async function addCase(){if(!isAdmin||!sessionId)return;const name=$('newCase').value.trim();if(!name)return;try{await fs.addDoc(fs.collection(db,'sessions',sessionId,'cases'),{name,createdAt:new Date().toISOString()});$('newCase').value=''}catch(e){alert(e.message)}}
async function clearCase(){if(!isAdmin||!caseId)return;if(!confirm('Vols esborrar totes les valoracions del cas actual? Aquesta acció no es pot desfer.'))return;try{for(const r of responses)await fs.deleteDoc(fs.doc(db,'sessions',sessionId,'cases',caseId,'responses',r.id))}catch(e){alert(e.message)}}
async function deleteCase(){
  if(!isAdmin||!sessionId||!caseId)return;
  const current=caseNames.find(c=>c.id===caseId);
  if(!current)return;
  if(!confirm(`Vols eliminar definitivament el cas «${current.name}» i totes les seves valoracions? Aquesta acció no es pot desfer.`))return;
  const deletingSession=sessionId,deletingCase=caseId;
  try{
    const responseCollection=fs.collection(db,'sessions',deletingSession,'cases',deletingCase,'responses');
    // Firestore does not cascade deletes: remove every response before the case itself.
    while(true){
      const snapshot=await fs.getDocs(fs.query(responseCollection,fs.limit(300)));
      if(snapshot.empty)break;
      const batch=fs.writeBatch(db);
      snapshot.docs.forEach(doc=>batch.delete(doc.ref));
      await batch.commit();
    }
    await fs.deleteDoc(fs.doc(db,'sessions',deletingSession,'cases',deletingCase));
    msg('teacherActionStatus','Cas eliminat correctament.');
  }catch(e){msg('teacherActionStatus','No s’ha pogut eliminar el cas: '+e.message);console.error(e)}
}
async function changeGroups(){if(!isAdmin||!sessionId)return;const n=Number($('groupCount').value);if(!Number.isInteger(n)||n<1||n>100)return alert('Entre 1 i 100 grups.');await fs.updateDoc(sid(),{groupCount:n})}
let sessionBusy=false;
async function manageSession(action){
 if(!isAdmin||!sessionId||sessionBusy)return;
 const id=sessionId, ref=fs.doc(db,'sessions',id), current=sessions.find(s=>s.id===id);
 if(!current)return;
 let name,n;
 if(action==='edit'){
  name=prompt('Nom de la sessió:',current.name);if(name===null)return;name=name.trim();
  const count=prompt('Nombre de grups (1–100):',current.groupCount);if(count===null)return;n=Number(count);
  if(!name||!Number.isInteger(n)||n<1||n>100)return alert('Indica un nom i entre 1 i 100 grups.');
 }else if(!confirm(action==='delete'?`Eliminar la sessió «${current.name}», tots els casos i totes les valoracions?`:`Reiniciar totes les valoracions de «${current.name}»? Els casos es conservaran.`))return;
 sessionBusy=true;const buttons=['editSession','resetSession','deleteSession'];buttons.forEach(b=>$(b).disabled=true);
 try{
  const cases=await fs.getDocs(fs.collection(ref,'cases'));
  if(action==='edit'){
   if(n<current.groupCount){for(const c of cases.docs){const rs=await fs.getDocs(fs.collection(c.ref,'responses'));if(rs.docs.some(r=>Number(r.id.replace('Grup ',''))>n))throw new Error('Hi ha valoracions de grups que quedarien fora. Reinicia les valoracions abans de reduir el nombre de grups.');}}
   await fs.updateDoc(ref,{name,groupCount:n});
  }else{
   for(const c of cases.docs){const rs=await fs.getDocs(fs.collection(c.ref,'responses'));for(const r of rs.docs)await fs.deleteDoc(r.ref);if(action==='delete')await fs.deleteDoc(c.ref);}
   if(action==='delete')await fs.deleteDoc(ref);
  }
  msg('sessionActionStatus',action==='edit'?'Sessió actualitzada.':action==='delete'?'Sessió eliminada.':'Valoracions de la sessió esborrades.');
 }catch(e){msg('sessionActionStatus','No s’ha pogut completar l’operació: '+e.message+' Revisa les dades abans de tornar-ho a provar.');}
 finally{sessionBusy=false;buttons.forEach(b=>$(b).disabled=false);}
}
function csv(){const rows=[['Sessió','Cas','Grup',...labels]];for(const r of responses)rows.push([sessions.find(s=>s.id===sessionId)?.name,caseNames.find(c=>c.id===caseId)?.name,r.group,...r.scores]);const blob=new Blob(['\ufeff'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='valoracions-taller.csv';a.click();URL.revokeObjectURL(a.href)}
function toggle(teacher){$('student').classList.toggle('hidden',teacher);$('teacher').classList.toggle('hidden',!teacher);$('studentTab').classList.toggle('active',!teacher);$('teacherTab').classList.toggle('active',teacher)}
async function main(){strategies=await fetch('./strategies.json?v=20261124-compact').then(r=>r.json());if(!firebaseConfig){msg('connection','Falta configurar firebase-config.js');return}const a=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');fa=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');fs=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');app=a.initializeApp(firebaseConfig);auth=fa.getAuth(app);db=fs.getFirestore(app);fa.onAuthStateChanged(auth,async u=>{user=u;teacherUI();if(!u){try{await ensureStudent()}catch(e){error(e)}return}msg('connection','Firebase connectat');$('setup').classList.add('hidden');if(!unsubSessions)subscribeSessions()});$('studentTab').onclick=()=>toggle(false);$('teacherTab').onclick=()=>toggle(true);$('actualTab').onclick=()=>{mode='actual';$('actualTab').classList.add('active');$('improveTab').classList.remove('active');renderChoices()};$('improveTab').onclick=()=>{mode='improve';$('improveTab').classList.add('active');$('actualTab').classList.remove('active');renderChoices()};$('session').onchange=e=>{sessionId=e.target.value;caseId='';sessionOptions();subscribeCases()};$('teacherSession').onchange=e=>{sessionId=e.target.value;caseId='';sessionOptions();subscribeCases()};$('case').onchange=e=>{caseId=e.target.value;caseOptions();subscribeResponses()};$('teacherCase').onchange=e=>{caseId=e.target.value;caseOptions();subscribeResponses()};$('group').onchange=e=>{group=e.target.value;restore()};$('model').onchange=()=>{$('teacherModel').value=$('model').value;renderCharts()};$('teacherModel').onchange=()=>{$('model').value=$('teacherModel').value;renderCharts()};$('submit').onclick=submit;$('login').onclick=teacherLogin;$('teacherLogout').onclick=teacherLogout;$('addSession').onclick=addSession;$('addCase').onclick=addCase;$('clear').onclick=clearCase;$('deleteCase').onclick=deleteCase;$('editSession').onclick=()=>manageSession('edit');$('resetSession').onclick=()=>manageSession('reset');$('deleteSession').onclick=()=>manageSession('delete');$('export').onclick=csv;renderChoices();renderSliders();renderCharts()}
main().catch(error);
