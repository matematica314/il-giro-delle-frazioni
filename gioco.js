'use strict';
const $=id=>document.getElementById(id);
const track=[
 [1840,660,0],[1831,802,'1/12'],[1782,919,'1/10'],[1684,1029,'1/8'],[1560,1112,'?'],
 [1450,1190,'1/6'],[1341,1241,'1/5'],[1208,1284,'1/4'],[1073,1292,'?'],[928,1299,'1/3'],
 [799,1275,'2/5'],[679,1246,'1/2'],[556,1182,'?'],[442,1111,'3/4'],[350,1003,'?'],
 [291,889,'4/5'],[262,773,'?'],[272,628,1],[330,514,'11/10'],[394,391,'?'],
 [509,278,'6/5'],[617,217,'7/5'],[754,148,'?'],[881,112,'3/2'],[1007,95,'8/5'],
 [1131,95,'9/5'],[1285,105,2],[1415,135,'9/4'],[1521,190,'?'],[1620,258,'7/2'],
 [1711,333,'?'],[1790,435,4],[1831,544,' ']
];
const colors=['Cerchio blu','Triangolo rosso','Quadrato giallo','Esagono verde'];
const draft=colors.map((_,i)=>({name:'Squadra '+(i+1),shape:i}));
let teams=[],active=0,phase='setup',endAt=0,notice='Configura le squadre per cominciare.',origin=0,candidate=null,afterLoan=null,bonus=0,turnDie='',session=0,values=[];
let pausedAt=0;
function warnBeforeExit(event){
 event.preventDefault();
 event.returnValue=true;
}
function togglePause(){
 if(pausedAt){
   if(endAt)endAt+=Date.now()-pausedAt;
   pausedAt=0;
   document.querySelectorAll('[data-pause-lock]').forEach(el=>{el.disabled=false;el.removeAttribute('data-pause-lock')});
   panel(false);
 }else{
   if(!alive())return;
   pausedAt=Date.now();
   document.querySelectorAll('#card input:enabled,#card button:enabled').forEach(el=>{el.disabled=true;el.dataset.pauseLock=''});
 }
 draw();tick();
}
const rand=n=>Math.floor(Math.random()*n);
const current=()=>teams[active];
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=v=>String(v).split('/').map(Number);
function pair(v){let [n,d=1]=parse(v);return [n,d]}
function compare(a,b){const [n,d]=pair(a),[m,e]=pair(b);return n*e-m*d}
function frac(v){let [n,d]=parse(v);return d===undefined?String(n):'<span class="fraction" aria-label="'+n+' fratto '+d+'"><span>'+n+'</span><span>'+d+'</span></span>'}
function shape(i){return '<i aria-hidden="true" class="shape s'+i+'"></i>'}
function ranking(){return [...teams].sort((a,b)=>Number(!!a.debt)-Number(!!b.debt)||b.coins-a.coins)}
function standings(detail=false){return ranking().map(t=>'<div class="row '+(phase!=='end'&&t===current()?'active':'')+'">'+shape(t.shape)+'<span class="name">'+esc(t.name)+(t.debt&&(detail||phase==='end')?'<br><small>'+(phase==='end'?'Bancarotta':'Debito: '+t.debt)+'</small>':'')+'</span><b>'+t.coins+'</b></div>').join('')}
function panel(open){$('panel').hidden=!open;$('menu').setAttribute('aria-expanded',String(open));if(open)$('close').focus();else $('menu').focus()}
$('menu').onclick=()=>panel(true);$('close').onclick=()=>panel(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('panel').hidden)panel(false)});
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('full').textContent='Usa F11 per lo schermo intero'}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'Esci da schermo intero':'Schermo intero'});
function editors(){
 $('teams').innerHTML='';
 draft.slice(0,Number($('count').value)).forEach((t,i)=>{
 const row=document.createElement('div');row.className='teamedit';
 const input=document.createElement('input');input.value=t.name;input.maxLength=22;input.setAttribute('aria-label','Nome squadra '+(i+1));input.oninput=()=>t.name=input.value;
 const sel=document.createElement('select');sel.setAttribute('aria-label','Pedina squadra '+(i+1));colors.forEach((c,j)=>sel.add(new Option(c,j)));sel.value=t.shape;
 sel.onchange=()=>{const other=draft.find(o=>o.shape===Number(sel.value));other.shape=t.shape;t.shape=Number(sel.value);editors()};row.append(input,sel);$('teams').append(row)
 })
}
$('count').onchange=editors;
function draw(){
 $('notice').textContent=pausedAt?'Partita in pausa':notice;$('rows').innerHTML=standings();$('roll').disabled=!!pausedAt||!['setup','ready'].includes(phase);
 $('roll').textContent=phase==='setup'?'Inizia la partita':phase==='end'?'Partita conclusa':phase==='moving'?turnDie:'⚄  Lancia il dado';
 $('pieces').innerHTML=teams.map((t,i)=>{const [x,y]=track[t.pos],peers=teams.filter(q=>q.pos===t.pos),j=peers.indexOf(t);
 const dx=(x-1040)/820,dy=(y-690)/610;
 return '<span title="'+esc(t.name)+'" class="marker '+(i===active&&phase!=='end'?'active':'')+'" style="left:'+((x+40*dx+(j-(peers.length-1)/2)*36*(-dy))/20.48)+'%;top:'+((y+40*dy+(j-(peers.length-1)/2)*36*dx)/14.69)+'%">'+shape(t.shape)+'</span>'}).join('');
 $('labels').innerHTML=values.map((v,i)=>{if(v===track[i][2])return '';const [x,y]=track[i];const digits=Math.max(...String(v).split('/').map(s=>s.length));return '<div class="value" style="left:'+x/20.48+'%;top:'+y/14.69+'%;font-size:'+Math.min(2,7/digits)+'cqw;background:'+(green.has(i)?'#aaf0b5':'#d1f3fa')+'">'+frac(v)+'</div>'}).join('');
 $('heading').textContent=phase==='setup'?'Prepara la partita':phase==='end'?'Classifica finale':pausedAt?'Partita in pausa':'Partita in corso';$('setup').hidden=phase!=='setup';$('manage').hidden=phase==='setup';
 if(phase!=='setup'){$('manage').innerHTML=standings(true)+(phase==='end'?'<button id="export">Esporta classifica CSV</button><button id="again">Nuova partita</button>':'<button id="pause">'+(pausedAt?'Riprendi il gioco':'Pausa')+'</button><button id="stop">Termina partita</button>');
 if($('pause'))$('pause').onclick=togglePause;
 if($('stop'))$('stop').onclick=()=>{if(confirm('Terminare la partita e mostrare la classifica finale?'))finish('Partita terminata')};if($('export'))$('export').onclick=exportCSV;if($('again'))$('again').onclick=()=>{phase='setup';teams=[];values=[];notice='Prepara una nuova partita.';$('card').hidden=true;$('clock').textContent='';draw()}}
}
const green=new Set([2,5,7,10,13,15,20,24,29]);
function card(title,body,actions=[]){const el=$('card');el.hidden=false;el.innerHTML='<h2>'+esc(title)+'</h2>'+body;
 actions.forEach(([label,fn],i)=>{const b=document.createElement('button');b.textContent=label;if(i===0)b.className='main';b.onclick=()=>{if(alive())fn()};el.append(b)})}
function alive(){if(pausedAt||phase==='end')return false;if(endAt&&Date.now()>=endAt){finish('Tempo scaduto');return false}return true}
function finish(msg){if(phase==='end')return;if(phase==='moving')current().pos=origin;phase='end';pausedAt=0;window.removeEventListener('beforeunload',warnBeforeExit);session++;notice=msg;endAt=0;$('card').hidden=true;$('clock').textContent=msg==='Tempo scaduto'?'00:00':'';draw();panel(true)}
function tick(){if(!endAt)return;if(!alive())return;const s=Math.ceil((endAt-Date.now())/1000);$('clock').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
setInterval(tick,180);
$('setup').onsubmit=e=>{e.preventDefault();teams=draft.slice(0,+$('count').value).map((t,i)=>({...t,name:t.name.trim()||'Squadra '+(i+1),coins:1,debt:0,pos:0}));
 values=track.map(v=>v[2]);active=0;phase='ready';window.addEventListener('beforeunload',warnBeforeExit);session++;endAt=+$('minutes').value?Date.now()+60000*Number($('minutes').value):0;notice='Comincia '+current().name+'.';panel(false);draw();tick()};
function ready(extra=false,msg=''){if(!alive())return;if(!extra)active=(active+1)%teams.length;phase='ready';$('card').hidden=true;notice=(msg?msg+' · ':'')+(extra?'Tira ancora, ':'Tocca a ')+current().name;draw()}
function settle(delta,next){const t=current();t.coins+=delta;if(t.coins<0){
 const missing=-t.coins;t.coins=0;t.debt+=2*missing;phase='loan';afterLoan=next;draw();
 card('Non hai credito','<p>Chiedi al banco '+missing+' '+(missing===1?'gettone':'gettoni')+' per coprire il pagamento. Dovrai restituire il doppio quando potrai.</p><p>Da restituire in tutto: <b>'+t.debt+'</b></p>',[['Chiedi il prestito',()=>{const resume=afterLoan;afterLoan=null;resume()}]]);return}
 if(t.debt&&t.coins>=t.debt){t.coins-=t.debt;notice='Prestito restituito al banco.';t.debt=0}draw();next()}
function mod(i){return (i+track.length)%track.length}
function threshold(i){return typeof track[i][2]==='number'}
async function roll(){
 if(phase==='setup'){panel(true);return}if(phase!=='ready'||!alive())return;
 const die=1+rand(6),t=current(),token=session;
 phase='moving';origin=t.pos;bonus=0;turnDie=['⚀','⚁','⚂','⚃','⚄','⚅'][die-1]+' '+die;notice=t.name+' · '+turnDie;draw();
 for(let i=0;i<die;i++){await new Promise(r=>setTimeout(r,210));while(pausedAt&&token===session)await new Promise(r=>setTimeout(r,100));
 if(token!==session||!alive())return;
 t.pos=mod(t.pos+1);
 if(threshold(t.pos))bonus++;draw()}
 settle(bonus,land)
}
$('roll').onclick=roll;
function land(){const p=current().pos,v=values[p];phase='land';draw();if(v==='?'){mission(p);return}
 if(threshold(p)&&v>0){
   card('Casella gialla · '+v,'<p>Hai guadagnato 1 gettone per il passaggio. Vuoi scrivere una frazione che vale '+v+'?</p><p>Se è corretta, guadagni un altro gettone. Se sbagli, restituisci un gettone.</p>',[['Scrivo una frazione',()=>entry(true)],['Passo',()=>ready()]]);
   return;
 }
 if(v===' '||threshold(p)){ready(false,turnDie+' · '+(v===' '?'Casella bianca':v));return}
 card(current().name+' · '+turnDie,'<p>Sei sulla frazione <strong class="math">'+frac(v)+'</strong>.</p><p>Vuoi sostituirla con una equivalente? Risposta corretta +1 gettone, errata −1.</p>',[['Sostituisco',()=>entry(true)],['Passo',()=>ready()]])}
function feedback(title,body,next,label='Continua'){phase='feedback';draw();card(title,'<p>'+body+'</p>',[[label,next]])}
function bounds(){const p=current().pos;return [values[p-1],values[p+1]]}
function inside(v){const [a,b]=bounds();return compare(v,a)>0&&compare(v,b)<0}
function interval(){const [a,b]=bounds();return '<p class="math">'+frac(a)+' &lt; ? &lt; '+frac(b)+'</p>'}
const bands=[
 '2/15 1/7 3/20 2/13 4/25 4/15 3/11 2/7 3/10 5/16 5/9 3/5 5/8 2/3 10/13 7/9 11/14 5/6 7/8 9/10',
 '10/9 9/8 8/7 7/6 13/11 24/17 17/12 10/7 13/9 16/11',
 '5/2 8/3 6/2 11/3 15/4'
].map(group=>group.split(' '));
function apparent(v){const [n,d]=pair(v);return n%d===0}
function fits(v){return inside(v)&&(current().pos!==28||!apparent(v))}
function mission(p){
 phase='mission';
 if(rand(2)===0){entry(false);return}
 const wantYes=rand(2)===0;
 const pool=bands[p<17?0:p<26?1:2].filter(v=>fits(v)===wantYes);
 candidate=pool[rand(pool.length)];
 const prompt=p===28?'È compresa tra gli estremi ed è impropria non apparente?':'È strettamente compresa tra i due estremi?';
 card('Questa frazione può stare qui?',interval()+'<p class="math">'+frac(candidate)+'</p><p>'+prompt+'</p>');
 let choice=null;
 const submit=document.createElement('button');
 submit.textContent='Conferma risposta';submit.disabled=true;submit.className='main submit-choice';
 const options=[true,false].map(value=>{
   const btn=document.createElement('button');
   btn.textContent=value?'Sì':'No';btn.setAttribute('aria-pressed','false');
   btn.onclick=()=>{
     if(!alive())return;
     choice=value;
     options.forEach(other=>other.setAttribute('aria-pressed',String(other===btn)));
     submit.disabled=false;
   };
   $('card').append(btn);return btn;
 });
 submit.onclick=()=>{if(choice!==null&&alive())missionResult(choice===fits(candidate))};
 $('card').append(submit);
}
function entry(equiv){phase=equiv?'equiv':'mission';const p=current().pos,v=values[p],kind=p<17?'propria':p===28?'impropria non apparente':'impropria';
 card(equiv?'Una frazione equivalente':'Inserisci una frazione',equiv?'<p>Scrivi in un altro modo <b class="math">'+frac(v)+'</b>.</p>':interval()+'<p>Scrivi una frazione '+kind+' compresa tra questi valori.</p>');
 const form=document.createElement('form');form.innerHTML='<div class="entry"><input aria-label="Numeratore" placeholder="num." maxlength="7" pattern="[0-9]{1,7}" inputmode="numeric" required><input aria-label="Denominatore" placeholder="den." maxlength="7" pattern="[0-9]{1,7}" inputmode="numeric" required></div> <button class="main">Conferma</button><p role="alert"></p>';
 $('card').append(form);const [n,d]=form.querySelectorAll('input');n.focus();
 form.onsubmit=e=>{e.preventDefault();if(!alive())return;if(!Number(d.value)){form.lastChild.textContent='Il denominatore deve essere diverso da zero.';d.focus();return}
 const ans=Number(n.value)+'/'+Number(d.value);if(!equiv){candidate=ans;missionResult(fits(ans));return}
 if(ans===v){form.lastChild.textContent='Prova con un numeratore e un denominatore diversi.';return}
 const ok=compare(v,ans)===0;if(ok&&!threshold(p))values[p]=ans;
 settle(ok?1:-1,()=>feedback(ok?'Equivalenza corretta!':'Le frazioni hanno valori diversi',frac(v)+(ok?' = ':' ≠ ')+frac(ans)+(ok?(threshold(p)?' · +1 gettone per la risposta.':' · +1 gettone. La casella è aggiornata.'):' · −1 gettone. La casella conserva il suo valore.'),()=>ready(),'Passa il turno'))}}
function missionResult(ok){const [a,b]=bounds(),answer=frac(candidate)+(inside(candidate)?' è ':' non è ')+'strettamente compresa tra '+frac(a)+' e '+frac(b)+'.'+(current().pos===28&&inside(candidate)&&apparent(candidate)?' Il suo valore è intero: è apparente. Qui serve una frazione impropria non apparente.':'');
 if(ok){settle(1,()=>feedback('Risposta corretta!',answer+' Guadagni un gettone e tiri ancora.',()=>ready(true),'Prepara il nuovo lancio'));return}
 const t=current();t.pos=origin;settle(-bonus,()=>feedback('Ritorna alla partenza del lancio',answer+' La pedina è tornata indietro e i passaggi sulle soglie sono stati compensati.',()=>ready(),'Passa il turno'))}
function exportCSV(){const safe=v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 const data=[['Posizione','Squadra','Gettoni','Debito verso il banco','Esito']];let last='',rank=0;ranking().forEach((t,i)=>{const key=Boolean(t.debt)+'/'+t.coins;if(key!==last)rank=i+1;last=key;data.push([rank,t.name,t.coins,t.debt,t.debt?'Bancarotta':'In classifica'])});
 const blob=new Blob(['\uFEFF'+data.map(row=>row.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Classifica_Giro_delle_Frazioni.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
if(!window.CSS||!CSS.supports('width','1cqw')||!CSS.supports('container-type','inline-size')){
 document.documentElement.classList.add('legacy');
 $('compat').hidden=false;
 function resizeBoard(){
   const width=Math.min(innerWidth,innerHeight*2048/1469);
   const style=document.documentElement.style;
   style.setProperty('--board-width',width+'px');
   style.setProperty('--board-height',width*1469/2048+'px');
   style.setProperty('--game-text',Math.max(12,Math.min(25,width*.0185))+'px');
   style.setProperty('--score-text',Math.max(11,Math.min(23,width*.0145))+'px');
   style.setProperty('--piece-text',width*.0162+'px');
 }
 resizeBoard();window.addEventListener('resize',resizeBoard);
}
editors();draw();panel(true);
