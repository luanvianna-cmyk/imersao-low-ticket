(function () {
  "use strict";
  var html = document.documentElement, tr = document.querySelector(".sl-trilho");
  if (!tr || !window.requestAnimationFrame) return;
  var palco = tr.querySelector(".sl-palco"), faixa = document.querySelector(".campaign-nav");
  var cards = Array.prototype.slice.call(tr.querySelectorAll(".aut-selo-card"));
  var infos = Array.prototype.slice.call(tr.querySelectorAll(".sl-info"));
  var lista = tr.querySelector(".sl-infos"), copy = tr.querySelector(".autoridade-copy"), cta = copy && copy.querySelector(":scope > .btn");
  var foto = tr.querySelector(".aut-photo"), prem = tr.querySelector(".sl-premio");
  var N = cards.length, F = N + (prem ? 2 : 1), SEG = 0.55, cur = -2, ligado = false, raf = 0, imprimindo = false;
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)"), largo = window.matchMedia("(min-width: 1024px)");
  if (lista) { lista.setAttribute("role", "region"); lista.setAttribute("tabindex", "0"); lista.setAttribute("aria-label", "Detalhes das certificações da Digital Growth"); }
  function marcaMobile() {
    if (ligado || !lista || !infos.length) return;
    var nearest = 0, distance = Infinity;
    infos.concat(prem ? [prem] : []).forEach(function (info, k) {
      var delta = Math.abs(info.getBoundingClientRect().left - lista.getBoundingClientRect().left);
      if (delta < distance) { nearest = k; distance = delta; }
    });
    cards.forEach(function (card, k) { card.setAttribute("aria-pressed", String(k === nearest)); });
  }
  if (lista) lista.addEventListener("scroll", marcaMobile, { passive: true });
  function limpa() {
    tr.style.height = ""; palco.style.top = ""; cur = -2; palco.classList.remove("sl-det", "sl-prem", "sl-trophy");
    if (foto) foto.querySelector(".aut-photo-img").setAttribute("aria-label", "Equipe da Digital Growth com o troféu do selo Mercado Ads Parceiro Premier"); palco.style.removeProperty("--sl-dx");
    if (prem) { prem.inert = false; prem.removeAttribute("aria-hidden"); }
    cards.forEach(function (c) { c.classList.remove("on"); c.removeAttribute("aria-current"); });
    infos.forEach(function (f) { f.classList.remove("on", "out"); f.inert = false; f.removeAttribute("aria-hidden"); var s = f.querySelector(".sl-info-selo"); if (s) { s.style.transform = ""; s.style.transition = ""; } });
    marcaMobile();
  }
  function voa(k) {   // FLIP: o selo grande nasce no lugar e no tamanho do selo pequeno e cresce até o seu lugar
    var big = infos[k] && infos[k].querySelector(".sl-info-selo"), small = cards[k] && cards[k].querySelector(".aut-selo-card-img");
    if (!big || !small || mq.matches) return;
    big.style.transition = "none"; big.style.transform = "";
    var a = small.getBoundingClientRect(), b = big.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var s = Math.min(a.width / b.width, a.height / b.height);
    big.style.transform = "translate(" + (a.left + a.width / 2 - (b.left + b.width * s / 2)) + "px," + (a.top + a.height / 2 - (b.top + b.height * s / 2)) + "px) scale(" + s + ")";
    big.getBoundingClientRect();   // aplica o ponto de partida antes de animar
    big.style.transition = "transform .6s cubic-bezier(0.22, 1, 0.36, 1)";
    big.style.transform = "";
  }
  function ativa(k) {   // k = -1: visão geral; 0..N-1: selo k em destaque
    if (k === cur) return;
    var antes = cur;
    palco.classList.toggle("sl-det", k >= 0);
    palco.classList.toggle("sl-trophy", k >= 1); // A mão com o troféu entra no Premier Partner.
    if (foto) foto.querySelector(".aut-photo-img").setAttribute("aria-label", k >= 1 ? "Mão segurando o troféu Mercado Ads Parceiro Premier, Líder em Resultados" : "Equipe da Digital Growth com o troféu do selo Mercado Ads Parceiro Premier");
    palco.classList.toggle("sl-prem", k === N);   // fase do prêmio: k = N
    if (prem) { prem.inert = k !== N; if (k === N) prem.removeAttribute("aria-hidden"); else prem.setAttribute("aria-hidden", "true"); }
    infos.forEach(function (f, i) {
      var sai = i === antes && i !== k;
      f.classList.toggle("out", sai);
      if (sai) setTimeout(function () { f.classList.remove("out"); }, 260);
      f.classList.toggle("on", i === k);
      f.inert = i !== k;
      if (i === k) f.removeAttribute("aria-hidden"); else f.setAttribute("aria-hidden", "true");
    });
    cards.forEach(function (c, i) { c.classList.toggle("on", i === k); c.setAttribute("aria-pressed", String(i === k)); if (i === k) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current"); });
    cur = k;
    if (k >= 0 && k < N) voa(k);
  }
  function topo() { return parseFloat(palco.style.top) || 0; }
  function dist() { return tr.offsetHeight - palco.offsetHeight; }
  function quadro() {
    raf = 0;
    if (!ligado) return;
    var d = dist(), p = d > 0 ? Math.max(0, Math.min(1, (topo() - tr.getBoundingClientRect().top) / d)) : 0;
    ativa(Math.min(F - 1, Math.floor(p * F)) - 1);
  }
  function tick() { if (!raf) raf = requestAnimationFrame(quadro); }
  function mede() {
    if (!ligado) return;
    var vh = window.innerHeight, f = faixa ? faixa.offsetHeight : 0, livre = vh - f, h = palco.offsetHeight;
    if (h > livre - 8) { desliga(); return; }   // não cabe: volta a lista
    palco.style.top = Math.round(f + (livre - h) / 2) + "px";
    tr.style.height = Math.round(h + F * SEG * vh) + "px";
    if (foto && copy) palco.style.setProperty("--sl-dx", (copy.offsetLeft - foto.offsetLeft) + "px");   // da coluna da foto à do texto
    if (cta && copy) copy.style.setProperty("--sl-base", Math.round(copy.getBoundingClientRect().bottom - cta.getBoundingClientRect().top + 24) + "px");
    tick();
  }
  function desliga() { ligado = false; html.classList.remove("sl-on"); limpa(); }
  function liga() {
    if (imprimindo) return;
    ligado = !mq.matches && largo.matches;
    html.classList.toggle("sl-on", ligado);
    if (!ligado) { limpa(); return; }
    mede();
  }
  cards.forEach(function (c, k) {
    c.addEventListener("click", function () {
      if (!ligado) {
        if (lista && infos[k]) lista.scrollTo({left: infos[k].offsetLeft - infos[0].offsetLeft, behavior: mq.matches ? 'auto' : 'smooth'});
        return;
      }
      var y = tr.getBoundingClientRect().top + window.scrollY - topo() + dist() * ((k + 1.5) / F);
      window.scrollTo({ top: y, behavior: mq.matches ? "auto" : "smooth" });
    });
  });
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", function () { liga(); });
  window.addEventListener("load", liga);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(liga);
  if (mq.addEventListener) mq.addEventListener("change", liga);
  if (largo.addEventListener) largo.addEventListener("change", liga);
  if ("ResizeObserver" in window) new ResizeObserver(function () { if (ligado) requestAnimationFrame(mede); }).observe(palco);
  window.addEventListener("beforeprint", function () { imprimindo = true; desliga(); });
  window.addEventListener("afterprint", function () { imprimindo = false; liga(); });
  liga();
})();
