/* Bounded requests, including a response body that stalls on a mobile network. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DG_CHECKOUT_REQUEST = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  async function postJson(url, body, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal
      });
      const data = await response.json().catch(() => null);
      return { response, data };
    } finally {
      clearTimeout(timer);
    }
  }
  return { postJson };
});
