/* Keep one copy of the proof blocks, in reading order at each breakpoint. */
(() => {
  const seals = document.querySelector('.hero-seals');
  const numbers = document.querySelector('.trust-strip');
  const bonus = document.getElementById('bonus');
  if (!seals || !numbers || !bonus) return;

  const sealsHome = document.createComment('Original desktop seals position');
  const numbersHome = document.createComment('Original desktop numbers position');
  seals.before(sealsHome);
  numbers.before(numbersHome);
  const section = document.createElement('section');
  section.className = 'mobile-proof-section';
  section.setAttribute('aria-label', 'Reconhecimentos e resultados da Digital Growth');
  section.hidden = true;
  bonus.after(section);

  const mobile = matchMedia('(max-width:760px)');
  function arrange() {
    if (mobile.matches) {
      section.append(seals, numbers);
      section.hidden = false;
    } else {
      sealsHome.after(seals);
      numbersHome.after(numbers);
      section.hidden = true;
    }
    document.documentElement.classList.toggle('mobile-proof-relocated', mobile.matches);
  }
  mobile.addEventListener('change', arrange);
  arrange();
})();
