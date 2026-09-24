import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminPasswordProblem } from '../utils/adminPassword.js';

test('accepts a long password mixing letters with digits or symbols', () => {
  assert.equal(adminPasswordProblem('Yagmur-Sonrasi-Toprak-71', 'admin'), undefined);
  assert.equal(adminPasswordProblem('k9#Vt2!mQx8Lw5', 'admin'), undefined);
});

test('rejects short, whitespace-padded and repetitive passwords', () => {
  assert.match(adminPasswordProblem('Ab1!', 'admin') ?? '', /en az 12/);
  assert.match(adminPasswordProblem(' Yagmur-Sonrasi-71 ', 'admin') ?? '', /boşluk/);
  assert.match(adminPasswordProblem('aaaa1111aaaa1111', 'admin') ?? '', /tekrarlı/);
});

test('rejects passwords without a mix of character types', () => {
  assert.match(adminPasswordProblem('onlylettersandnothingelse', 'admin') ?? '', /rakam veya sembol/);
  assert.match(adminPasswordProblem('123456789012345', 'admin') ?? '', /harf/);
});

test('rejects the username inside the password', () => {
  assert.match(adminPasswordProblem('my-Tugba-password-9', 'tugba') ?? '', /kullanıcı adı/);
});

test('rejects the password that leaked in the repository history, in any casing', () => {
  for (const leaked of ['UlkuTe2391!', 'ulkute2391!', 'ULKUTE2391!']) {
    assert.match(adminPasswordProblem(leaked, 'someone-else') ?? '', /açığa çıktı/);
  }
});
