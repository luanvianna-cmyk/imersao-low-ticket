/* Reuses the original LP's reversible ticket tear, with a mobile price-stage trigger. */
(() => {
 'use strict';
 const ticket=document.querySelector('#inscricao .combo-ticket');if(!ticket)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),stacked=matchMedia('(max-width:1100px)');
 let frame=0,value=null,focused=false;
 const clamp=v=>Math.max(0,Math.min(1,v));
 function paint(){
  frame=0;
  if(reduced.matches||document.hidden){ticket.style.removeProperty('--rasgo');value=null;return}
  const box=(stacked.matches?ticket.querySelector('.combo-pay-stage'):ticket).getBoundingClientRect();
  if(box.bottom < -200||box.top>innerHeight+200)return;
  const target=focused?0:clamp((innerHeight*.82-box.top)/(innerHeight*.42));
  if(value===null)value=target;
  value+=(target-value)*.18;
  if(Math.abs(target-value)<.002)value=target;else frame=requestAnimationFrame(paint);
  ticket.style.setProperty('--rasgo',(value*value*(3-2*value)).toFixed(4));
 }
 function tick(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint)}
 ticket.addEventListener('focusin',()=>{focused=true;value=0;ticket.style.setProperty('--rasgo','0');tick()});
 ticket.addEventListener('focusout',()=>{focused=false;tick()});
 addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);addEventListener('load',tick);
 reduced.addEventListener('change',tick);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else tick()});
 document.fonts?.ready.then(tick);tick();
})();
