const { test } = require('node:test');
const assert = require('node:assert/strict');
const checkout = require('../api/checkout.js');
const coupon = require('../api/cupom.js');
const config = require('../checkout-config.js');
const { postJson } = require('../checkout-request.js');

// No network or orders: every upstream request is replaced inside each test.
function request(body, origin = 'https://lp.example') {
  return { method: 'POST', headers: { host: 'lp.example', origin,
    'content-type': 'application/json', 'sec-fetch-site': 'same-origin',
    cookie: 'session=private; _fbp=tracking' }, body };
}
async function run(handler, req) {
  const res = { setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  await handler(req, res);
  return res;
}
const guest = { name: 'QA Teste', email: 'qa@example.test', phone: '11999999999' };

test('foreign origins and missing guest never reach payment service', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network'); });
  assert.equal((await run(checkout, request({ guest }, 'https://other.example'))).statusCode, 403);
  assert.equal((await run(checkout, request({}))).statusCode, 400);
  assert.equal(fetch.mock.calls.length, 0);
});
test('product and bump IDs are server-owned; private cookies are not forwarded', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) };
    return { status: 200, json: async () => ({ url: 'https://www.mercadopago.com.br/checkout/test' }) };
  });
  const res = await run(checkout, request({ guest, bump: true, productId: 'tampered', priceCents: 1 }));
  assert.equal(res.statusCode, 200);
  assert.equal(sent.body.productId, config.product.id);
  assert.deepEqual(sent.body.bumpOfferIds, [config.bump.offerId]);
  assert.equal(sent.body.priceCents, undefined);
  assert.equal(sent.options.headers.Cookie, '_fbp=tracking');
});
test('unsafe payment URL falls back without personal details', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ status: 200,
    json: async () => ({ url: 'https://mercadopago.com.br.attacker.example/pay' }) }));
  const res = await run(checkout, request({ guest, utm: { utm_source: 'qa' }, coupon: 'TESTE' }));
  const url = new URL(res.body.fallback);
  assert.equal(url.origin, config.origin);
  assert.equal(url.searchParams.get('utm_source'), 'qa');
  assert.equal(url.searchParams.get('cupom'), 'TESTE');
  assert.ok(!res.body.fallback.includes(guest.email));
});
test('business errors remain visible; stale quotes go to live product', async t => {
  let code = 'OFFER_UNAVAILABLE';
  t.mock.method(globalThis, 'fetch', async () => ({ status: 409,
    json: async () => ({ error: 'Oferta indisponivel', code, offerId: config.bump.offerId }) }));
  const res = await run(checkout, request({ guest }));
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.offerId, config.bump.offerId);
  code = 'QUOTE_CHANGED';
  assert.ok((await run(checkout, request({ guest }))).body.fallback);
});
test('coupons: valid discount, unavailable service, and gift redirect', async t => {
  let status = 200, data = { ok: true, code: 'TESTE', discountCents: 500, finalCents: 3439 };
  t.mock.method(globalThis, 'fetch', async () => ({ status, json: async () => data }));
  assert.equal((await run(coupon, request({ code: 'TESTE' }))).body.finalCents, 3439);
  status = 503;
  assert.equal((await run(coupon, request({ code: 'TESTE' }))).body.unavailable, true);
  status = 200; data = { ok: true, code: 'TESTE', gift: true };
  assert.ok((await run(coupon, request({ code: 'TESTE' }))).body.fallback);
});
test('mobile network timeout aborts a request that never returns headers', async t => {
  t.mock.method(globalThis, 'fetch', (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  await assert.rejects(postJson('/test', {}, 20), { name: 'AbortError' });
});
test('timeout also bounds a stalled JSON body, allowing fallback', async t => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({ status: 200,
    json: () => new Promise((resolve, reject) => signal.addEventListener('abort',
      () => reject(signal.reason), { once: true })) }));
  assert.equal((await postJson('/test', {}, 20)).data, null);
});
