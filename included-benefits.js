/* Decorative benefit scenes run only while visible. */
(() => {
 const cards=[...document.querySelectorAll('.benefit-card')];
 if(!cards.length||!('IntersectionObserver' in window))return;
 const visible=new Set();
 const video=document.querySelector('.lesson-real-video');
 const recording=video?.closest('.benefit-card');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function chapter(){
  const index=Math.min(2,Math.floor((video?.currentTime||0)/3));
  video?.classList.toggle('is-calculator',index===1);
 }
 function sync(){
  cards.forEach(c=>c.classList.toggle('benefit-visible',visible.has(c)&&!document.hidden));
  if(!video)return;
  if(!visible.has(recording)||document.hidden||reduced.matches){video.pause();return}
  if(!video.getAttribute('src'))video.src=video.dataset.src;
  video.muted=true;
  video.play().catch(()=>{});
 }
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target));sync()},{threshold:.15});
 cards.forEach(c=>observer.observe(c));document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',sync);video?.addEventListener('timeupdate',chapter);chapter();
})();
