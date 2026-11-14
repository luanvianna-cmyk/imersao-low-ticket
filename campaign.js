(() => {
  const video = document.getElementById('hero-video');
  const hero = document.getElementById('hero');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  let motionPaused = reduce.matches || saveData;
  let inView = true;
  function updateMotion() {
    document.body.classList.toggle('motion-paused', motionPaused);
  }
  function sync() {
    if (motionPaused || !inView || document.hidden) { video.pause(); return; }
    if (!video.getAttribute('src')) {
      video.src = matchMedia('(max-width: 760px)').matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
      video.muted = true;
      video.load();
    }
    video.play().catch(() => { video.classList.add('playback-unavailable'); });
  }
  reduce.addEventListener('change', () => { motionPaused = reduce.matches || saveData; updateMotion(); sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  updateMotion(); sync();
  let activeTestimonial = null;
  document.querySelectorAll('.yt-facade').forEach(button => {
    button.addEventListener('click', () => {
      if (activeTestimonial) activeTestimonial.frame.replaceWith(activeTestimonial.button);
      const frame = document.createElement('iframe');
      frame.src = button.dataset.src + '&autoplay=1';
      frame.title = button.dataset.title;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      button.replaceWith(frame);
      activeTestimonial = { frame, button };
    });
  });
})();
