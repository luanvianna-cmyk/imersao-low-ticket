(function () {
  "use strict";
  var sim = document.querySelector("[data-calc-sim]");
  if (!sim) return;
  var CURVAS = [["A", 10], ["B", 7], ["C", 5]];
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, minimumFractionDigits: 0 });
  function R(v, f) { var s = (f || brl).format(Math.abs(v)).replace(/ /g, " "); return v < 0 ? "−" + s : s; }
  function pct(v) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%"; }
  function fmt(f, v) {
    if (f === "brl") return R(v, brl0);
    if (f === "pct") return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
    var c = CURVAS[Math.round(v)]; return "Curva " + c[0] + " · ROAS " + c[1] + "x";
  }
  function faixa(t) { t = Math.round(t * 1e6) / 1e6; return t <= 3 ? "Saudável" : t <= 5 ? "Administrável" : t <= 7 ? "Alerta" : "Crítico"; }
  function conta(painel) {
    var v = {}, q = function (s) { return painel.querySelector(s); };
    Array.prototype.forEach.call(painel.querySelectorAll("input[type=range]"), function (i) { v[i.dataset.k] = parseFloat(i.value); });
    var val = q(".cs-res-v"), apoio = q(".cs-res-s"), calc = painel.dataset.calc, partes = null, neg = false;
    if (calc === "preco") {
      var d = Math.max(0.3, 1 - (v.comissao + v.margem) / 100), p = (v.custo + v.frete) / d;
      val.textContent = R(p); apoio.textContent = "Sobram " + R(p * v.margem / 100) + " de margem em cada venda";
      partes = [v.custo / p, v.frete / p, v.comissao / 100, v.margem / 100];
    } else if (calc === "lucro") {
      var s = v.preco - v.preco * v.comissao / 100 - v.custo - v.frete; neg = s < 0;
      val.textContent = R(s); apoio.textContent = neg ? "Essa venda dá prejuízo" : pct(s / v.preco * 100) + " do preço";
      partes = [Math.min(1, v.custo / v.preco), Math.min(1, v.frete / v.preco), v.comissao / 100, Math.max(0, s / v.preco)];
    } else if (calc === "roas") {
      var c = CURVAS[Math.round(v.curva)];
      val.textContent = R(v.valor / c[1]); apoio.textContent = R(v.valor, brl0) + " ÷ ROAS " + c[1] + "x";
      Array.prototype.forEach.call(painel.querySelectorAll(".cs-cv"), function (el) {
        var r = +el.dataset.r; el.classList.toggle("on", r === c[1]); el.querySelector("b").textContent = R(v.valor / r, brl0);
      });
    } else if (calc === "tacos") {
      var t = v.fat > 0 ? v.gasto / v.fat * 100 : 0;
      val.textContent = pct(t); apoio.textContent = faixa(t);
      q(".cs-semaf i").style.setProperty("--cs-x", (Math.min(Math.max(t, 0), 10) * 10).toFixed(1) + "%");
    }
    val.classList.toggle("neg", neg);
    if (partes) Array.prototype.forEach.call(painel.querySelectorAll(".cs-comp i"), function (el, k) {
      el.style.setProperty("--cs-w", (Math.max(0, partes[k]) * 100).toFixed(1) + "%");
    });
  }
  function barra(i) {
    var mn = +i.min, mx = +i.max, v = +i.value, o = sim.querySelector('output[for="' + i.id + '"]');
    i.style.setProperty("--cs-p", ((v - mn) / (mx - mn) * 100).toFixed(1) + "%");
    if (o) o.textContent = fmt(i.dataset.f, v);
    if (i.dataset.f === "curva") i.setAttribute("aria-valuetext", fmt("curva", v));
  }
  sim.addEventListener("input", function (e) {
    var i = e.target; if (!i.matches || !i.matches("input[type=range]")) return;
    barra(i); conta(i.closest(".cs-painel"));
  });
  var abas = Array.prototype.slice.call(sim.querySelectorAll('[role="tab"]'));
  function abre(k, foca) {
    abas.forEach(function (a, j) {
      var on = j === k, pn = document.getElementById(a.getAttribute("aria-controls"));
      a.setAttribute("aria-selected", on ? "true" : "false"); a.tabIndex = on ? 0 : -1; pn.hidden = !on;
    });
    if (foca) abas[k].focus();
    var card = sim.closest(".bc-calc"); if (card) card.setAttribute("data-aba", abas[k].id.slice(5));   // capa da aba aberta
  }
  abas.forEach(function (a, k) {
    a.addEventListener("click", function () { abre(k, false); });
    a.addEventListener("keydown", function (e) {
      var n = abas.length, j = e.key === "ArrowRight" ? (k + 1) % n : e.key === "ArrowLeft" ? (k + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
      if (j >= 0) { e.preventDefault(); abre(j, true); }
    });
  });
})();