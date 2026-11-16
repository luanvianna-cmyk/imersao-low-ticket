/* Lightbox de checkout: o mesmo formulário da página de venda do DG Labs, aberto
   pelos CTAs da LP. O envio vai para /api/checkout (mesma origem), que cria a
   cobrança no DG Labs e devolve o link do Mercado Pago. Validação e máscara
   seguem src/lib/payments/payment-fields.ts e src/lib/phone.ts do DG Labs. */
(() => {
  'use strict';

  /* ── campanha: guardada na chegada, antes de qualquer clique ───────────── */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid'];
  const UTM_STORE = 'dg_lp_utm', ATTR_STORE = 'dg_lp_attr';
  const read = (key) => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };
  const write = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento: segue sem campanha */ } };
  function utmFromUrl() {
    const params = new URLSearchParams(location.search), out = {};
    UTM_KEYS.forEach((key) => { const value = (params.get(key) || '').trim(); if (value) out[key] = value.slice(0, 512); });
    return Object.keys(out).length ? out : null;
  }
  (function storeArrival() {
    const utm = utmFromUrl();
    if (utm && !read(UTM_STORE)) write(UTM_STORE, utm);
    if (read(ATTR_STORE)) return;
    let referrer = '';
    try { if (document.referrer && new URL(document.referrer).host !== location.host) referrer = document.referrer.slice(0, 600); } catch { /* referrer ilegível */ }
    const query = new URLSearchParams();
    Object.entries(utm || {}).forEach(([key, value]) => { if (key.startsWith('utm_')) query.set(key, value.slice(0, 120)); });
    const search = query.toString();
    write(ATTR_STORE, { landing: location.pathname + (search ? '?' + search : ''), referrer, at: Date.now() });
  })();
  const collectUtm = () => utmFromUrl() || read(UTM_STORE) || undefined;
  function collectAttribution() {
    const stored = read(ATTR_STORE) || {}, out = { page: location.pathname };
    if (typeof stored.landing === 'string') out.landing = stored.landing;
    if (typeof stored.referrer === 'string' && stored.referrer) out.referrer = stored.referrer;
    if (typeof stored.at === 'number') out.firstTouchAt = stored.at;
    return out;
  }

  const cfg = window.DG_CHECKOUT, dialog = document.getElementById('dg-checkout');
  /* Sem <dialog> ou sem a configuração, os CTAs seguem pelo href de sempre. */
  if (!cfg || !dialog || typeof dialog.showModal !== 'function') return;

  const $ = (selector) => dialog.querySelector(selector);
  const form = $('form'), submit = $('.dg-ck-submit'), submitLabel = $('[data-ck="submit-label"]'), alertBox = $('[data-ck="alert"]');
  const brl = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const product = cfg.product, bump = cfg.bump;

  /* ── regras dos campos (as mesmas do servidor) ─────────────────────────── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, CONTROL_RE = /\p{Cc}/gu;
  function normalizeName(raw) {
    const value = raw.normalize('NFKC').replace(CONTROL_RE, '').replace(/\s+/g, ' ').trim();
    if (value.length < 2 || value.length > 60) return null;
    const lower = value.toLowerCase();
    return lower.includes('@') || lower.includes('http') || lower.includes('://') ? null : value;
  }
  function normalizeEmail(raw) {
    const value = raw.normalize('NFKC').trim().toLowerCase();
    if (!value || value.length > 254 || /\p{Cc}/u.test(value) || !EMAIL_RE.test(value)) return null;
    return value;
  }
  function normalizePhone(raw) {
    let digits = raw.replace(/\D+/g, '');
    if (!digits) return null;
    if (digits.length === 12 || digits.length === 13) {
      if (!digits.startsWith('55')) return null;
      digits = digits.slice(2);
    }
    if (digits.length !== 10 && digits.length !== 11) return null;
    if (digits[0] === '0' || digits[1] === '0') return null;
    if (digits.length === 11 && digits[2] !== '9') return null;
    return '+55' + digits;
  }
  function maskPhone(raw) {
    let digits = raw.replace(/\D+/g, '');
    const international = raw.trim().startsWith('+');
    if (digits.startsWith('55') && ((international && (digits.length === 12 || digits.length === 13)) || digits.length === 13)) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return '(' + digits;
    const ddd = digits.slice(0, 2), rest = digits.slice(2);
    if (rest.length <= 4) return '(' + ddd + ') ' + rest;
    const split = rest.length === 9 ? 5 : 4;
    return '(' + ddd + ') ' + rest.slice(0, split) + '-' + rest.slice(split);
  }

  const ORDER = ['name', 'email', 'emailConfirm', 'phone'];
  const inputs = Object.fromEntries(ORDER.map((key) => [key, $('[data-ck-field="' + key + '"]')]));
  const errorNodes = Object.fromEntries(ORDER.map((key) => [key, $('[data-ck-error="' + key + '"]')]));
  const touched = {};
  function fieldErrors() {
    const errors = {}, email = normalizeEmail(inputs.email.value), confirm = normalizeEmail(inputs.emailConfirm.value);
    if (!normalizeName(inputs.name.value)) errors.name = 'Digite seu nome.';
    if (!email) errors.email = 'Digite um e-mail válido.';
    if (!confirm || confirm !== email) errors.emailConfirm = 'Os e-mails não são iguais.';
    if (!normalizePhone(inputs.phone.value)) errors.phone = 'Digite um WhatsApp com DDD, por exemplo (11) 90000-0000.';
    return errors;
  }
  const emailHint = $('[data-ck="email-hint"]');
  function renderFields() {
    const errors = fieldErrors();
    ORDER.forEach((key) => {
      const message = touched[key] ? errors[key] : '';
      errorNodes[key].textContent = message || '';
      errorNodes[key].hidden = !message;
      if (message) inputs[key].setAttribute('aria-invalid', 'true'); else inputs[key].removeAttribute('aria-invalid');
    });
    const valid = Object.keys(errors).length === 0;
    emailHint.classList.toggle('is-ok', valid);
    emailHint.textContent = valid
      ? 'Enviamos para ' + inputs.email.value.trim() + ' assim que o pagamento confirmar.'
      : 'O acesso e a senha chegam neste e-mail. Confira antes de pagar.';
    return errors;
  }
  ORDER.forEach((key) => {
    inputs[key].addEventListener('input', () => {
      if (key === 'phone') inputs.phone.value = maskPhone(inputs.phone.value);
      renderFields();
    });
    inputs[key].addEventListener('blur', () => { touched[key] = true; renderFields(); });
  });

  /* ── order bump, cupom e total ─────────────────────────────────────────── */
  const bumpBox = $('[data-ck="bump"]'), bumpInput = $('[data-ck="bump-input"]');
  let bumpAvailable = Boolean(bump && bump.offerId), coupon = null, couponBusy = false;
  const couponOpen = $('[data-ck="coupon-open"]'), couponRow = $('[data-ck="coupon-row"]'), couponInput = $('[data-ck="coupon-input"]');
  const couponApply = $('[data-ck="coupon-apply"]'), couponApplied = $('[data-ck="coupon-applied"]'), couponText = $('[data-ck="coupon-text"]');
  const couponMessage = $('[data-ck="coupon-message"]');
  const bumpOn = () => bumpAvailable && bumpInput.checked;
  const productCents = () => (coupon && !coupon.pending ? coupon.finalCents : product.priceCents);
  const totalCents = () => productCents() + (bumpOn() ? bump.priceCents : 0);

  function setText(name, value) { const node = $('[data-ck="' + name + '"]'); if (node) node.textContent = value; }
  function renderTotals() {
    const discount = coupon && !coupon.pending ? coupon.discountCents : 0;
    $('[data-ck="line-product"]').hidden = !(discount > 0 || bumpOn());
    $('[data-ck="line-discount"]').hidden = !(discount > 0);
    $('[data-ck="line-bump"]').hidden = !bumpOn();
    setText('line-discount-label', coupon ? 'Cupom ' + coupon.code : 'Cupom');
    setText('line-discount-value', '− ' + brl(discount));
    setText('total', brl(totalCents()));
    setText('terms', totalCents() > 0 ? 'Pix ou cartão em até ' + product.maxInstallments + 'x sem juros' : '');
  }
  function renderCoupon() {
    couponOpen.hidden = Boolean(coupon) || !couponRow.hidden;
    couponApplied.hidden = !coupon;
    if (coupon) {
      couponRow.hidden = true;
      couponText.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = coupon.code;
      couponText.append('Cupom ', strong, coupon.pending ? ' informado' : ' aplicado');
      const detail = document.createElement('small');
      detail.textContent = coupon.pending ? 'O desconto será conferido no pagamento.' : coupon.discountCents > 0 ? 'Você economiza ' + brl(coupon.discountCents) + '.' : 'Cupom registrado no seu pedido.';
      couponText.append(detail);
    }
    couponApply.disabled = couponBusy;
    couponApply.textContent = couponBusy ? 'Aplicando…' : 'Aplicar';
    renderTotals();
  }
  function couponNote(message, link) {
    couponMessage.textContent = message || '';
    couponMessage.hidden = !message;
    if (message && link) {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.textContent = 'Resgatar na página da Imersão';
      couponMessage.append(' ', anchor);
    }
  }
  async function applyCoupon() {
    if (couponBusy) return;
    const code = couponInput.value.trim().toUpperCase();
    if (code.length < 3) { couponNote('Digite o código do cupom.'); couponInput.focus(); return; }
    couponBusy = true; couponNote(''); renderCoupon();
    let data = null;
    try {
      const response = await fetch('/api/cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      data = await response.json().catch(() => null);
    } catch { /* sem resposta: o cupom segue para ser conferido no pagamento */ }
    couponBusy = false;
    if (data && data.ok && data.code) {
      coupon = { code: data.code, discountCents: data.discountCents || 0, finalCents: typeof data.finalCents === 'number' ? data.finalCents : product.priceCents };
      couponNote('');
    } else if (data && data.fallback) {
      couponNote(data.error || 'Este cupom é resgatado na página da Imersão.', data.fallback);
    } else if (!data || data.unavailable) {
      coupon = { code, pending: true, discountCents: 0, finalCents: product.priceCents };
      couponNote('');
    } else {
      couponNote(data.error || 'Cupom inválido.');
    }
    renderCoupon();
    if (!coupon) couponInput.focus();
  }
  couponOpen.addEventListener('click', () => { couponRow.hidden = false; renderCoupon(); couponInput.focus(); });
  couponApply.addEventListener('click', applyCoupon);
  couponInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); applyCoupon(); } });
  $('[data-ck="coupon-remove"]').addEventListener('click', () => { coupon = null; couponInput.value = ''; couponRow.hidden = true; couponNote(''); renderCoupon(); couponOpen.focus(); });
  bumpInput.addEventListener('change', renderTotals);

  /* ── textos de preço, lidos da configuração ────────────────────────────── */
  setText('label', product.label);
  setText('product-name', product.title);
  setText('price-installments', product.maxInstallments + 'x de ' + brl(Math.round(product.priceCents / product.maxInstallments)));
  setText('price-cash', 'ou ' + brl(product.priceCents) + ' à vista');
  setText('price-compare', brl(product.compareAtCents));
  setText('line-product-value', brl(product.priceCents));
  if (bumpAvailable) {
    setText('bump-title', bump.headline);
    setText('bump-body', bump.body);
    setText('bump-price', '+ ' + brl(bump.priceCents));
    setText('line-bump-value', brl(bump.priceCents));
  } else bumpBox.hidden = true;

  /* ── abrir e fechar ────────────────────────────────────────────────────── */
  let busy = false, opener = null;
  function notice(message, info) {
    alertBox.textContent = message || '';
    alertBox.hidden = !message;
    alertBox.classList.toggle('is-info', Boolean(info));
  }
  function setBusy(value, label) {
    busy = value;
    submit.disabled = value;
    submitLabel.textContent = label || 'Garantir minha vaga';
    form.setAttribute('aria-busy', String(value));
  }
  function track(event, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event }, detail || {}));
  }
  function open(trigger) {
    if (dialog.open) return;
    opener = trigger || null;
    notice('');
    dialog.showModal();
    document.documentElement.classList.add('dg-ck-open');
    renderFields(); renderCoupon();
    const first = ORDER.map((key) => inputs[key]).find((input) => !input.value) || inputs.name;
    /* No celular o foco abriria o teclado por cima do resumo do pedido. */
    if (matchMedia('(min-width:601px)').matches) first.focus({ preventScroll: true }); else $('.dg-ck-close').focus({ preventScroll: true });
    track('dg_lp_checkout_open', { cta: trigger ? (trigger.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '' });
  }
  /* A limpeza roda aqui, na hora, e não só no evento `close`: ele chega depois
     e a página não pode ficar com a rolagem travada nesse intervalo. */
  function afterClose() {
    document.documentElement.classList.remove('dg-ck-open');
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }
  function close() {
    if (busy || !dialog.open) return;
    dialog.close();
    afterClose();
  }
  dialog.addEventListener('close', afterClose);
  /* Esc: fecha pelo mesmo caminho, e não fecha enquanto o pagamento está abrindo. */
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  let pressedOutside = false;
  dialog.addEventListener('mousedown', (event) => { pressedOutside = event.target === dialog; });
  dialog.addEventListener('click', (event) => { if (event.target === dialog && pressedOutside) close(); });
  $('[data-checkout-close]').addEventListener('click', close);
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-checkout-open]');
    if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(trigger);
  });
  /* Volta do Mercado Pago pelo botão do navegador: o botão não pode ficar travado. */
  addEventListener('pageshow', (event) => { if (event.persisted) { setBusy(false); notice(''); } });

  /* ── envio ─────────────────────────────────────────────────────────────── */
  function salePage() {
    const url = new URL(cfg.origin + '/p/' + cfg.slug);
    Object.entries(collectUtm() || {}).forEach(([key, value]) => url.searchParams.set(key, value));
    if (coupon) url.searchParams.set('cupom', coupon.code);
    url.hash = 'comprar';
    return url.toString();
  }
  function goToSalePage(target) {
    setBusy(true, 'Abrindo a página da Imersão…');
    notice('Vamos concluir sua inscrição na página da Imersão no DG Labs. Seus dados precisam ser confirmados lá.', true);
    track('dg_lp_checkout_fallback');
    setTimeout(() => location.assign(target || salePage()), 1600);
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || couponBusy) return;
    const errors = fieldErrors();
    if (Object.keys(errors).length) {
      ORDER.forEach((key) => { touched[key] = true; });
      renderFields();
      notice('Preencha seu nome, e-mail e WhatsApp para continuar.');
      inputs[ORDER.find((key) => errors[key])].focus();
      return;
    }
    notice('');
    setBusy(true, 'Abrindo o pagamento…');
    const withBump = bumpOn(), discount = coupon && !coupon.pending ? coupon.discountCents : 0;
    const items = [{ item_id: product.id, item_name: product.title, price: product.priceCents / 100, quantity: 1 }];
    if (withBump) items.push({ item_id: bump.offerId, item_name: bump.targetTitle, price: bump.priceCents / 100, quantity: 1, item_category: 'oferta' });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    track('begin_checkout', { ecommerce: Object.assign({ currency: 'BRL', value: Math.max(product.priceCents + (withBump ? bump.priceCents : 0) - discount, 0) / 100, items }, coupon ? { coupon: coupon.code } : {}) });

    let response = null, data = null;
    try {
      response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest: { name: inputs.name.value, email: inputs.email.value, phone: inputs.phone.value },
          bump: withBump,
          coupon: coupon ? coupon.code : undefined,
          utm: collectUtm(),
          attribution: collectAttribution()
        })
      });
      data = await response.json().catch(() => null);
    } catch { /* rede fora do ar: cai na página de venda */ }

    if (response && response.ok && data && typeof data.url === 'string' && data.url) {
      location.assign(data.url);
      return;
    }
    /* Só 400 e 409 trazem uma frase para corrigir aqui; o resto segue pela página de venda. */
    if (response && (response.status === 400 || response.status === 409) && data && typeof data.error === 'string' && data.error) {
      if (data.offerId && bump && data.offerId === bump.offerId) {
        bumpInput.checked = false; bumpAvailable = false; bumpBox.hidden = true; renderTotals();
      }
      setBusy(false);
      notice(data.error);
      return;
    }
    goToSalePage(data && typeof data.fallback === 'string' ? data.fallback : null);
  });

  renderFields(); renderCoupon();
})();
