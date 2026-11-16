/* POST /api/cupom: prévia do desconto, repassada a /api/cupom/validar do DG Labs.
   Entrada: { code }. Saída: { ok:true, code, discountCents, finalCents } quando
   vale; { ok:false, error } quando não vale; { ok:false, unavailable:true } quando
   a prévia não pôde ser feita (a compra segue e o DG Labs confere no checkout);
   { ok:false, fallback } para cupom de gratuidade, que é resgatado na página de venda. */
'use strict';

const { config, send, sameOriginJsonPost, readJson, cleanCoupon, fallbackUrl, postToDgLabs } = require('./_dglabs.js');

module.exports = async function handler(req, res) {
  if (!sameOriginJsonPost(req)) return send(res, 403, { ok: false, error: 'Não foi possível validar o cupom agora.' });
  const input = await readJson(req);
  const code = cleanCoupon(input && input.code);
  if (!code) return send(res, 200, { ok: false, error: 'Cupom inválido.' });

  const result = await postToDgLabs('/api/cupom/validar', req, { code, itemType: 'product', itemId: config.product.id });
  const data = result && result.data;
  if (!result || !data || result.status === 429 || result.status >= 500) {
    return send(res, 200, { ok: false, unavailable: true, error: 'Não foi possível validar o cupom agora. Ele será conferido no pagamento.' });
  }
  if (data.ok === true && typeof data.code === 'string') {
    if (data.gift === true) {
      return send(res, 200, { ok: false, fallback: fallbackUrl(undefined, data.code), error: 'Este cupom é resgatado na página da Imersão.' });
    }
    const discountCents = Number.isFinite(data.discountCents) ? Math.max(0, Math.trunc(data.discountCents)) : 0;
    const finalCents = Number.isFinite(data.finalCents) ? Math.max(0, Math.trunc(data.finalCents)) : config.product.priceCents;
    return send(res, 200, { ok: true, code: data.code, discountCents, finalCents });
  }
  return send(res, 200, { ok: false, error: typeof data.error === 'string' && data.error ? data.error : 'Cupom inválido.' });
};
