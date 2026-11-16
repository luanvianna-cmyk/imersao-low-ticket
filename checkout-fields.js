/* Validation stays aligned with the DG Labs guest checkout; no account is created here. */
(function (root, factory) {
  const fields = factory();
  if (typeof module === 'object' && module.exports) module.exports = fields;
  else root.DG_CHECKOUT_FIELDS = fields;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const CONTROL_RE = /\p{Cc}/gu;
  function normalizeName(raw) {
    const value = raw.normalize('NFKC').replace(CONTROL_RE, '').replace(/\s+/g, ' ').trim();
    if (value.length < 2 || value.length > 60) return null;
    const lower = value.toLowerCase();
    return lower.includes('@') || lower.includes('http') || lower.includes('://') ? null : value;
  }
  function normalizeEmail(raw) {
    const value = raw.normalize('NFKC').trim().toLowerCase();
    return value.length <= 254 && !/\p{Cc}/u.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  }
  function normalizePhone(raw) {
    let digits = raw.replace(/\D+/g, '');
    if (digits.length === 12 || digits.length === 13) {
      if (!digits.startsWith('55')) return null;
      digits = digits.slice(2);
    }
    if (digits.length !== 10 && digits.length !== 11) return null;
    if (digits[0] === '0' || digits[1] === '0') return null;
    if (digits.length === 11 && digits[2] !== '9') return null;
    return '+55' + digits;
  }
  function formatPhone(raw) {
    const normalized = normalizePhone(raw);
    // Preserve invalid input, so formatting never silently drops a digit.
    if (!normalized) return raw.trim();
    const digits = normalized.slice(3), local = digits.slice(2);
    return '(' + digits.slice(0, 2) + ') ' + local.slice(0, -4) + '-' + local.slice(-4);
  }
  const DOMAIN_TYPOS = {
    'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com',
    'gmail.con': 'gmail.com', 'gmail.com.br': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yahoo.con': 'yahoo.com'
  };
  function suggestEmail(raw) {
    const email = normalizeEmail(raw);
    if (!email) return null;
    const [local, domain] = email.split('@');
    return DOMAIN_TYPOS[domain] ? local + '@' + DOMAIN_TYPOS[domain] : null;
  }
  function validate(values) {
    const errors = {};
    if (!normalizeName(values.name)) errors.name = 'Digite seu nome.';
    if (!normalizeEmail(values.email)) errors.email = 'Digite um e-mail válido, como voce@exemplo.com.';
    const confirmation = values.emailConfirm || '';
    if (!confirmation.trim()) errors.emailConfirm = 'Digite seu e-mail novamente.';
    else if (!normalizeEmail(confirmation) || normalizeEmail(confirmation) !== normalizeEmail(values.email)) {
      errors.emailConfirm = 'Os e-mails estão diferentes. Confira o endereço nos dois campos.';
    }
    if (!normalizePhone(values.phone)) errors.phone = 'Inclua o DDD, por exemplo (11) 90000-0000.';
    return errors;
  }
  return { normalizeName, normalizeEmail, normalizePhone, formatPhone, suggestEmail, validate };
});
