/* Existing DG demos, coordinated into one visible-only showcase. */
(() => {
 'use strict';
 const root=document.querySelector('.gk-showcase');if(!root)return;
 const scenes=[...root.querySelectorAll('[data-gk-scene]')],buttons=[...document.querySelectorAll('[data-gk-select]')];
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),video=root.querySelector('video');
 const captions=['DG Growth Kit + Imersão Mercado Ads','Experimente as calculadoras do Growth Kit','Agentes de IA em uso','Trecho real do curso de uso'];
 let current=0,visible=false,timers=[],frame=0,manualUntil=0;
 const canRun=()=>visible&&!document.hidden&&!reduce.matches;
 function stop(){timers.forEach(clearTimeout);timers=[];cancelAnimationFrame(frame);frame=0;video.pause();root.classList.remove('is-running')}
 function after(ms,fn){timers.push(setTimeout(()=>{if(canRun())fn()},ms))}
 function moveRange(input,to){
  const from=+input.value,start=performance.now(),duration=1100;
  function step(now){if(!canRun())return;const p=Math.min(1,(now-start)/duration),e=p*p*(3-2*p);input.value=String(from+(to-from)*e);input.dispatchEvent(new Event('input',{bubbles:true}));if(p<1)frame=requestAnimationFrame(step);else frame=0}
  frame=requestAnimationFrame(step);
 }
 function calculatorDemo(){
  const tabs=[...root.querySelectorAll('.cs-aba')];
  tabs[0].click();
  after(650,()=>moveRange(root.querySelector('#cs-preco-margem'),22));
  after(2900,()=>{tabs[1].click();moveRange(root.querySelector('#cs-lucro-preco'),175)});
  after(5600,()=>{tabs[2].click();moveRange(root.querySelector('#cs-roas-valor'),3500)});
  after(8200,()=>tabs[3].click());
 }
 function chatDemo(){
  const messages=[...root.querySelectorAll('.ag-m')],people=[...root.querySelectorAll('.ag-p')];
  messages.forEach(e=>e.classList.remove('vis'));people.forEach(e=>e.classList.remove('on'));
  if(reduce.matches){messages.filter(e=>e.dataset.i==='0'&&!e.classList.contains('ag-dig')).forEach(e=>e.classList.add('vis'));people[0]?.classList.add('on');return}
  people.forEach((p,i)=>{
   const group=messages.filter(e=>e.dataset.i===String(i));
   after(100+i*2200,()=>{p.classList.add('on');group[0]?.classList.add('vis')});
   after(350+i*2200,()=>group[1]?.classList.add('vis'));
   after(650+i*2200,()=>group[2]?.classList.add('vis'));
   after(1200+i*2200,()=>{group[2]?.classList.remove('vis');group[3]?.classList.add('vis')});
  });
 }
 function show(k,manual=false){
  stop();current=k;
  if(manual)manualUntil=Date.now()+24000;
  scenes.forEach((scene,i)=>{const on=i===k;scene.classList.toggle('is-active',on);scene.inert=!on;scene.setAttribute('aria-hidden',String(!on))});
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.gkSelect===k)));
  root.querySelector('.gk-scene-caption').textContent=captions[k];
  if(k===2)chatDemo();
  if(!canRun())return;
  root.classList.add('is-running');
  if(k===1&&!manual&&Date.now()>=manualUntil)calculatorDemo();
  if(k===3){
   if(!video.src)video.src=video.dataset.src;
   video.muted=true;video.play().catch(()=>{});
   const steps=[...root.querySelectorAll('.gk-course-steps span')];steps.forEach(e=>e.classList.remove('on'));
   steps[0].classList.add('on');after(1800,()=>steps[1].classList.add('on'));after(3600,()=>steps[2].classList.add('on'));
  }
  after(Math.max([3800,11000,12000,6500][k],manualUntil-Date.now()),()=>{
   if(root.contains(document.activeElement)){show(current,true);return}
   show((k+1)%scenes.length);
  });
 }
 buttons.forEach(b=>b.addEventListener('click',()=>{show(+b.dataset.gkSelect,true);if(matchMedia('(max-width:760px)').matches)root.scrollIntoView({block:'start',behavior:reduce.matches?'auto':'smooth'})}));
 // A person manipulating a calculator owns it; the demo never moves their input.
 root.addEventListener('pointerdown',e=>{if(e.target.closest('.calc-sim')){stop();manualUntil=Date.now()+24000}});
 root.addEventListener('keydown',e=>{if(e.target.closest('.calc-sim')){stop();manualUntil=Date.now()+24000}});
 root.addEventListener('focusout',()=>{if(canRun())after(24000,()=>{if(!root.contains(document.activeElement))show((current+1)%scenes.length)})});
 function sync(){if(canRun())show(current);else {stop();if(reduce.matches&&current===2)chatDemo()}}
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync()}, {threshold:.25}).observe(root);
 document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
})();
