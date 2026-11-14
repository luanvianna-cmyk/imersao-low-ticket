/* Original DG scroll approach adapted to the campaign: batch reads, smooth writes, sleep at rest. */
(() => {
  'use strict';
  const root=document.documentElement, reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const ticket=document.querySelector('.hero-ticket'), stage=document.querySelector('.ticket-motion-stage');
  if (!ticket || !stage || !('IntersectionObserver' in window)) return;
  const small=matchMedia('(max-width:760px)');
  const clamp=x=>Math.max(0,Math.min(1,x)), ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const groups=[
    ['.trust-grid','p'],
    ['#programa .container','.section-heading,.pl-lab'],
    ['#o-que-voce-leva .container','.section-heading,.included-offer,.benefits-grid>article'],
    ['.growth-layout','.gk-showcase,.growth-copy'],
    ['#para-quem .container','.section-heading,.audience-grid>article'],
    ['#depoimentos .container','.section-heading,.dep-card'],
    ['#inscricao .container','.section-heading,.offer-ticket'],
    ['#duvidas .container','.section-heading,.faq-item']
  ];
  const entries=[];
  groups.forEach(([parent,selector])=>{
    const box=document.querySelector(parent); if(!box)return;
    [...box.querySelectorAll(selector)].forEach((el,i)=>{
      el.classList.add('dg-scroll-item');entries.push({el,box,delay:(i%3)*.07,value:1});
    });
  });
  const anchors=[...new Set(entries.map(e=>e.box))], visible=new Set();
  const observer=new IntersectionObserver(es=>{es.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target));schedule()}, {rootMargin:'160px'});
  [...anchors,stage].forEach(e=>observer.observe(e));
  let frame=0, initial=true, printing=false, ticketState=null;
  const set=(el,key,n)=>el.style.setProperty(key,n.toFixed(4));
  function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint)}
  function paint(){
    frame=0;
    const enabled=!reduce.matches&&!printing;
    root.classList.toggle('dg-scroll-on',enabled);
    if(!enabled){initial=true;ticketState=null;return}
    const vh=innerHeight, rects=new Map();
    anchors.forEach(a=>{if(visible.has(a)||initial)rects.set(a,a.getBoundingClientRect())});
    const tr=stage.getBoundingClientRect();
    let moving=false;
    entries.forEach(e=>{
      const r=rects.get(e.box);if(!r)return;
      const target=ease((vh*.96-r.top)/(vh*.58)-e.delay);
      if(initial)e.value=r.top<vh*.9?1:target;
      else e.value+=(target-e.value)*.2;
      if(Math.abs(target-e.value)<.001)e.value=target;else moving=true;
      set(e.el,'--dg-y',(1-e.value)*(small.matches?24:54));
      set(e.el,'--dg-scale',.97+.03*e.value);set(e.el,'--dg-opacity',.35+.65*e.value);
      if(e.el.matches('.growth-art')){set(e.el,'--dg-art-y',(1-e.value)*22);set(e.el,'--dg-art-r',(1-e.value)*-3)}
      if(e.el.matches('.offer-ticket'))set(e.el,'--dg-offer-r',(1-e.value)*7);
    });
    if(visible.has(stage)||initial){
      const entry=ease((vh*.94-tr.top)/(vh*.65));
      const travel=clamp((vh*.32-tr.top)/(Math.max(vh,tr.height)*.8));
      const target=small.matches?entry:travel;
      if(ticketState===null)ticketState=target;else ticketState+=(target-ticketState)*.16;
      if(Math.abs(target-ticketState)<.001)ticketState=target;else moving=true;
      const p=ticketState;
      set(ticket,'--ticket-y',small.matches?(1-p)*28:-p*30);
      set(ticket,'--ticket-rx',small.matches?(1-p)*4:p*-5);
      set(ticket,'--ticket-ry',small.matches?0:2-p*4);
      set(ticket,'--ticket-rz',small.matches?0:1.5-p*3);
      set(ticket,'--ticket-scale',small.matches?.975+p*.025:1-p*.025);
      set(ticket,'--ticket-open',p*(small.matches?8:14));
      [...ticket.querySelectorAll('.ticket-dates>span')].forEach((date,i)=>{
        const focus=clamp(1-Math.abs(p*3-(i+.5)));
        set(date,'--date-y',-focus*5);set(date,'--date-light',.16+focus*.6);set(date,'--date-glow',focus*.11);
      });
    }
    initial=false;
    if(moving)schedule();
  }
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  addEventListener('load',schedule);reduce.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else schedule()});
  addEventListener('beforeprint',()=>{printing=true;paint()});addEventListener('afterprint',()=>{printing=false;schedule()});
  document.fonts?.ready.then(schedule);schedule();
})();
