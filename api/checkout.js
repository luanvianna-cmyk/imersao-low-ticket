/* POST /api/checkout: cria a cobrança no DG Labs e devolve o link do Mercado Pago.
   Entrada (do lightbox): { guest:{name,email,phone}, bump, coupon?, utm?, attribution? }.
   Saída: { url } para seguir ao Mercado Pago; { error, code?, offerId? } para
   mostrar na tela; { fallback } para levar à página de venda do DG Labs. */
'use strict';

const {
  config, send, sameOriginJsonPost, readJson, text, cleanUtm, cleanAttribution, cleanCoupon,
  fallbackUrl, postToDgLabs, isPaymentUrl
} = require('./_dglabs.js');

/* Página aberta antes de uma mudança no cadastro do DG Labs: a LP não tem como
   se atualizar sozinha, então a venda segue pela página de venda. */
const STALE_CODES = new Set(['PAYMENT_TERMS_CHANGED', 'QUOTE_CHANGED']);

module.exports = async function handler(req, res) {
  if (!sameOriginJsonPost(req)) {
    return send(res, 403, { error: 'Não foi possível iniciar o pagamento. Recarregue a página e tente de novo.' });
  }
  const input = await readJson(req);
  if (!input || !input.guest || typeof input.guest !== 'object') {
    return send(res, 400, { error: 'Preencha seu nome, e-mail e WhatsApp para continuar.' });
  }

  const utm = cleanUtm(input.utm);
  const coupon = cleanCoupon(input.coupon);
  const withBump = input.bump === true;

  /* Os ids vêm só da configuração do servidor: o navegador nunca escolhe o que é cobrado. */
  const body = {
    productId: config.product.id,
    productTerms: config.product.terms,
    bumpTerms: withBump ? [{ offerId: config.bump.offerId, ...config.bump.terms }] : [],
    bumpOfferIds: withBump ? [config.bump.offerId] : undefined,
    coupon: coupon || undefined,
    utm,
    attribution: cleanAttribution(input.attribution),
    guest: {
      name: text(input.guest.name, 120),
      email: text(input.guest.email, 254),
      phone: text(input.guest.phone, 32)
    }
  };

  const fallback = { fallback: fallbackUrl(utm, coupon) };
  const result = await postToDgLabs('/api/checkout/public', req, body);
  if (!result) return send(res, 200, fallback);

  const { status, data } = result;
  if (status >= 200 && status < 300) {
    return isPaymentUrl(data && data.url) ? send(res, 200, { url: data.url }) : send(res, 200, fallback);
  }
  /* 400 e 409 trazem a frase certa para o comprador (e-mail inválido, oferta
     que saiu do ar, evento encerrado). O resto vira a página de venda. */
  const message = data && typeof data.error === 'string' ? data.error : '';
  const code = data && typeof data.code === 'string' ? data.code : undefined;
  if ((status === 400 || status === 409) && message && !STALE_CODES.has(code)) {
    const offerId = data && typeof data.offerId === 'string' ? data.offerId : undefined;
    return send(res, status, { error: message, code, offerId });
  }
  return send(res, 200, fallback);
};
