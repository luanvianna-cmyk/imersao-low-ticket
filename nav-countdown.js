/* Fixed event deadline in Brasilia time; never resets per visit. */
(() => {
 const root=document.querySelector('.nav-countdown');if(!root)return;
 const deadline=Date.parse(root.dataset.deadline);
 if(!Number.isFinite(deadline))return;
 const units=root.querySelector('.nav-countdown-units'),label=root.querySelector('.nav-countdown-label'),ended=root.querySelector('.nav-countdown-ended');
 const fields=Object.fromEntries([...root.querySelectorAll('[data-countdown]')].map(e=>[e.dataset.countdown,e]));
 let interval;
 function update(){
  const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
  const values={days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60};
  Object.entries(values).forEach(([key,value])=>fields[key].textContent=String(value).padStart(2,'0'));
  const finished=seconds===0;
  units.hidden=finished;label.hidden=finished;ended.hidden=!finished;
  // Explicit display because flex styles must not override the hidden state.
  units.style.display=finished?'none':'';label.style.display=finished?'none':'';
  root.setAttribute('aria-label',finished?'A Imersão começou em 23 de novembro, às 19h30, horário de Brasília':`A Imersão começa em ${values.days} dias, ${values.hours} horas, ${values.minutes} minutos e ${values.seconds} segundos. Início em 23 de novembro, às 19h30, horário de Brasília.`);
  if(finished)clearInterval(interval);
 }
 function sync(){clearInterval(interval);update();if(!document.hidden&&Date.now()<deadline)interval=setInterval(update,1000)}
 const nav=document.querySelector('.campaign-nav');
 const measure=()=>document.documentElement.style.setProperty('--campaign-nav-height',`${nav.getBoundingClientRect().height}px`);
 if('ResizeObserver' in window)new ResizeObserver(measure).observe(nav);
 addEventListener('resize',measure);document.addEventListener('visibilitychange',sync);measure();sync();
})();
