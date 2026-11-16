/* Apoio das funções /api: fala com o checkout público do DG Labs de servidor
   para servidor. O DG Labs recusa chamada de navegador vinda de outro domínio
   (sem CORS, guarda de origem) e não pode ser embutido em iframe; por isso o
   lightbox da LP posta aqui, na mesma origem, e esta função repassa.
   Arquivo com "_" no nome: a Vercel não o publica como rota. */
'use strict';

const config = require('../checkout-config.js');

/* Abaixo do limite de execução da função na Vercel: quem desiste primeiro é
   este repasse, e o comprador segue para a página de venda. */
const TIMEOUT_MS = 8000;

/* Mesma lista de src/lib/utm.ts do DG Labs; click id acima do teto é descartado. */
const UTM_LIMITS = {
  utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_term: 200, utm_content: 200,
  gclid: 200, gbraid: 200, wbraid: 200, fbclid: 200, ttclid: 512
};
const CLICK_IDS = new Set(['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid']);

/* Cookies que identityFromRequest lê no DG Labs. Nenhum outro é repassado. */
const TRACKING_COOKIE = /^(_fbp|_fbc|_ga|_ga_[A-Za-z0-9]+|_ttp)$/;

const PAYMENT_HOSTS = ['mercadopago.com.br', 'mercadopago.com', 'mercadolivre.com.br', 'mercadolibre.com'];

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(body));
}

function header(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value || '';
}

/* Só a própria LP chama: POST JSON com Origin do mesmo host. Sem isso a função
   seria um repasse aberto para o checkout do DG Labs. */
function sameOriginJsonPost(req) {
  if (req.method !== 'POST') return false;
  if (header(req, 'content-type').split(';')[0].trim().toLowerCase() !== 'application/json') return false;
  const site = header(req, 'sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const host = (header(req, 'x-forwarded-host') || header(req, 'host')).toLowerCase();
  let originHost = '';
  try { originHost = new URL(header(req, 'origin')).host.toLowerCase(); } catch { return false; }
  return Boolean(host) && originHost === host;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!raw) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16384) return null;
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function text(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanUtm(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const out = {};
  for (const key of Object.keys(UTM_LIMITS)) {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (!value) continue;
    if (value.length > UTM_LIMITS[key]) {
      if (!CLICK_IDS.has(key)) out[key] = value.slice(0, UTM_LIMITS[key]);
      continue;
    }
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function cleanAttribution(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const out = {};
  for (const key of ['landing', 'referrer', 'page']) {
    const value = text(input[key], 600);
    if (value) out[key] = value;
  }
  if (typeof input.firstTouchAt === 'string' || typeof input.firstTouchAt === 'number') out.firstTouchAt = input.firstTouchAt;
  return Object.keys(out).length ? out : undefined;
}

function cleanCoupon(value) {
  const code = typeof value === 'string' ? value.trim() : '';
  return code.length >= 3 && code.length <= 40 ? code : '';
}

/* Página de venda do DG Labs, com a campanha e o cupom na URL: destino quando
   o repasse não consegue criar a cobrança. Nenhum dado pessoal vai na URL. */
function fallbackUrl(utm, coupon) {
  const url = new URL(`${config.origin}/p/${config.slug}`);
  for (const [key, value] of Object.entries(utm || {})) url.searchParams.set(key, value);
  if (coupon) url.searchParams.set('cupom', coupon);
  url.hash = 'comprar';
  return url.toString();
}

function forwardHeaders(req) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const agent = header(req, 'user-agent');
  if (agent) headers['User-Agent'] = agent.slice(0, 512);
  const referer = header(req, 'referer');
  if (referer) headers.Referer = referer.slice(0, 1000);
  const cookies = header(req, 'cookie').split(';').map((part) => part.trim()).filter((part) => {
    const name = part.split('=')[0];
    return TRACKING_COOKIE.test(name) && part.length <= 600;
  });
  if (cookies.length) headers.Cookie = cookies.join('; ');
  return headers;
}

/* POST ao DG Labs. Devolve { status, data } ou null em falha de rede/tempo. */
async function postToDgLabs(path, req, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${config.origin}${path}`, {
      method: 'POST',
      headers: forwardHeaders(req),
      body: JSON.stringify(body),
      redirect: 'error',
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, data: data && typeof data === 'object' ? data : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isPaymentUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return PAYMENT_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

module.exports = {
  config, send, sameOriginJsonPost, readJson, text, cleanUtm, cleanAttribution, cleanCoupon,
  fallbackUrl, postToDgLabs, isPaymentUrl
};
