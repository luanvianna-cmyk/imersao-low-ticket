// Reuses the approved DG Labs iPhone-style contact flow and cadence.
(function(){
const root=document.querySelector('.dg-wa');if(!root)return;
const launcher=root.querySelector('.wa-float'),panel=root.querySelector('.dg-wa-chat'),field=root.querySelector('textarea'),link=root.querySelector('.dg-wa-send'),nudge=root.querySelector('[data-wa-nudge]'),nudgeCopy=root.querySelector('[data-wa-nudge-copy]');
const STEPS=[
{html:'Você está preparado pra <span class="bf-yellow">Black Friday</span>?',label:'Você está preparado pra Black Friday?',reply:'Olá! Quero me preparar para a Black Friday.'},
{html:'Quer saber o que está incluído na Imersão?',label:'Quer saber o que está incluído na Imersão?',reply:'Olá! Quero saber o que está incluído na Imersão Mercado Ads de R$ 39,90.'},
{html:'Posso tirar sua dúvida antes da <span class="bf-yellow">Black Friday</span>?',label:'Posso tirar sua dúvida antes da Black Friday?',reply:'Olá! Tenho uma dúvida antes da Black Friday.'}
];
const STORE='dg_imersao_wa_nudge_v1',FIRST=8000,SHOW=7000,GAP=20000;
let highest=0,stopped=false,savedWait=0;
try{const saved=JSON.parse(sessionStorage.getItem(STORE)||'null');if(saved){highest=Math.max(0,Math.min(3,Number(saved.highest)||0));stopped=saved.stopped===true;savedWait=Math.max(0,Math.min(SHOW+GAP,Number(saved.waitRemaining)||0));}}catch{}
let mode=stopped?'stopped':'idle',accrued=0,started=document.hidden?null:performance.now(),timer=0,frame=0,hideAt=0,nextAt=savedWait;
function visibleNow(){return accrued+(started===null?0:performance.now()-started);}
function track(action,step){if(window.dgLandingTrack)window.dgLandingTrack('dg_lp_whatsapp_nudge_'+action,{step:String(step)});}
function persist(){try{sessionStorage.setItem(STORE,JSON.stringify({highest:highest,stopped:stopped,waitRemaining:Math.max(0,Math.ceil(nextAt-visibleNow()))}));}catch{}}
function resizeField(){field.style.height='auto';field.style.height=Math.min(88,field.scrollHeight)+'px';}
function updateLink(){resizeField();link.href='https://wa.me/551135881234?text='+encodeURIComponent(field.value.trim()||'Olá! Quero tirar uma dúvida sobre a Imersão Mercado Ads de R$ 39,90.');}
function measureViewport(){const v=window.visualViewport,height=v?v.height:innerHeight,bottom=v?Math.max(0,innerHeight-v.height-v.offsetTop):0;root.style.setProperty('--wa-visible-height',height+'px');root.style.setProperty('--wa-keyboard',bottom+'px');root.classList.toggle('is-typing',!panel.hidden&&document.activeElement===field&&bottom>100);}
function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus();measureViewport();}
function open(){panel.hidden=false;resizeField();measureViewport();launcher.setAttribute('aria-expanded','true');root.querySelector('[data-wa-close]').focus({preventScroll:true});}
function clearTimer(){if(timer){clearTimeout(timer);timer=0;}}
function hideNudge(){nudge.classList.remove('is-visible');nudge.setAttribute('aria-hidden','true');nudge.inert=true;}
function stop(dismiss){if(mode==='stopped')return;const step=highest;mode='stopped';stopped=true;clearTimer();hideNudge();nextAt=0;persist();if(dismiss&&step)track('dismiss',step);}
function progress(){const range=document.documentElement.scrollHeight-innerHeight;return range>0?Math.max(0,Math.min(1,scrollY/range)):0;}
function eligible(step,now){return step===1?now>=FIRST:step===2?progress()>=.4:progress()>=.75;}
function arm(delay){clearTimer();timer=setTimeout(pump,Math.max(16,Math.ceil(delay)));}
function autoHide(){hideNudge();mode='waiting';persist();pump();}
function show(step){const item=STEPS[step-1],now=visibleNow();mode='showing';highest=step;hideAt=now+SHOW;nextAt=hideAt+GAP;nudgeCopy.innerHTML=item.html;nudge.querySelector('[data-wa-nudge-open]').setAttribute('aria-label',item.label+' Abrir no chat da Digital Growth.');nudge.inert=false;nudge.setAttribute('aria-hidden','false');requestAnimationFrame(()=>nudge.classList.add('is-visible'));persist();track('impression',step);arm(SHOW);}
function pump(){clearTimer();if(stopped||document.hidden)return;if(document.querySelector('dialog[open]')){arm(1000);return;}const now=visibleNow();if(mode==='showing'){if(now>=hideAt){autoHide();return;}arm(hideAt-now);return;}const step=highest+1;if(step>STEPS.length)return;if(!eligible(step,now)){if(step===1)arm(FIRST-now);return;}if(now<nextAt){arm(nextAt-now);return;}show(step);}
function scrollPump(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;pump();});}
launcher.addEventListener('click',()=>{stop(false);if(!panel.hidden){close();return;}open();});
root.querySelector('[data-wa-close]').addEventListener('click',close);
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
field.addEventListener('input',updateLink);
field.addEventListener('focus',measureViewport);field.addEventListener('blur',measureViewport);
if(window.visualViewport){window.visualViewport.addEventListener('resize',measureViewport);window.visualViewport.addEventListener('scroll',measureViewport);}
addEventListener('resize',measureViewport,{passive:true});measureViewport();
root.querySelector('[data-wa-nudge-open]').addEventListener('click',()=>{const step=highest,item=STEPS[step-1];track('click',step);stop(false);field.value=item.reply;updateLink();open();});
root.querySelector('[data-wa-nudge-close]').addEventListener('click',()=>stop(true));
addEventListener('scroll',scrollPump,{passive:true});
addEventListener('resize',scrollPump,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(started!==null){accrued+=performance.now()-started;started=null;}clearTimer();persist();}else{started=performance.now();pump();}});
addEventListener('pagehide',persist);
updateLink();
requestAnimationFrame(pump);
})();
