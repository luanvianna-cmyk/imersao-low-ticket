const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../checkout-fields.js');

test('all four fields are required, including repeated email', () => {
  assert.deepEqual(f.validate({ name: 'Ana', email: 'ana@example.test', emailConfirm: ' ANA@EXAMPLE.TEST ', phone: '11987654321' }), {});
  assert.deepEqual(Object.keys(f.validate({ name: '', email: '', emailConfirm: '', phone: '' })), ['name', 'email', 'emailConfirm', 'phone']);
  assert.ok(f.validate({ name: 'Ana', email: 'ana@example.test', phone: '11987654321' }).emailConfirm);
});
test('different email blocks progression, including after a primary email correction', () => {
  const values = { name: 'Ana', email: 'ana@example.test', emailConfirm: 'other@example.test', phone: '11987654321' };
  assert.ok(f.validate(values).emailConfirm);
  values.emailConfirm = values.email;
  assert.deepEqual(f.validate(values), {});
  values.email = 'changed@example.test';
  assert.ok(f.validate(values).emailConfirm);
});
test('name and email tolerate autofill spacing and capitalization', () => {
  assert.equal(f.normalizeName('  Ana   Silva  '), 'Ana Silva');
  assert.equal(f.normalizeEmail(' ANA@EXAMPLE.TEST '), 'ana@example.test');
  assert.equal(f.normalizeEmail('ana @example.test'), null);
  assert.equal(f.normalizeName('http://example.test'), null);
});
test('email typos produce optional suggestions, not silent corrections', () => {
  assert.equal(f.suggestEmail('ana@gmial.com'), 'ana@gmail.com');
  assert.equal(f.normalizeEmail('ana@gmial.com'), 'ana@gmial.com');
  assert.equal(f.suggestEmail('ana@empresa.com.br'), null);
  assert.equal(f.suggestEmail('ana@gmail.com'), null);
  assert.equal(f.suggestEmail('not-an-email'), null);
});
test('pasted BR phones and country codes retain the same destination', () => {
  for (const input of ['11987654321', '(11) 98765-4321', '+55 11 98765-4321', '5511987654321']) {
    assert.equal(f.normalizePhone(input), '+5511987654321');
    assert.equal(f.formatPhone(input), '(11) 98765-4321');
  }
  assert.equal(f.formatPhone('1133334444'), '(11) 3333-4444');
  assert.equal(f.formatPhone('55987654321'), '(55) 98765-4321');
});
test('formatting never discards excess digits or repairs an invalid phone', () => {
  for (const input of ['119876543210000', '+1 212 555 1234', '11987', '01987654321']) {
    assert.equal(f.normalizePhone(input), null);
    assert.equal(f.formatPhone(input), input);
  }
});
