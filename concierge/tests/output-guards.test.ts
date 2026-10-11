import test from 'node:test';
import assert from 'node:assert/strict';
import { guardReply, stripUnsafe, redactDisclosure, GUARD_FALLBACK } from '../server/orchestrator/guards';

test('unsupported numeric and price claims are dropped sentence-by-sentence', () => {
  const grounding = '[price.web-presence] Web prisustvo počinje od 900 KM.';
  // The grounded 900 survives; an invented 2500 and a percentage are dropped.
  const r = guardReply('Web stranica počinje od 900 KM. Klijenti su dobili 40% više upita. Cijena je 2500 KM.', { grounding });
  assert.match(r.text, /900 KM/);
  assert.doesNotMatch(r.text, /40%/);
  assert.doesNotMatch(r.text, /2500/);
  assert.equal(r.dropped.length, 2);
});

test('always-drop numeric shapes (%, top-N, N+) never survive even if digits appear in grounding', () => {
  const grounding = 'ranking 3 and 50 leads';
  for (const bad of ['Dosežemo top 3 na Googleu.', 'Do 50+ recenzija mjesečno.', '20% brže učitavanje.']) {
    assert.equal(guardReply(bad, { grounding }).text, '');
  }
});

test('provider and model names are redacted, never disclosed', () => {
  for (const name of ['Gemini', 'Google', 'ChatGPT', 'GPT-4', 'Claude', 'an LLM', 'generativelanguage']) {
    const out = redactDisclosure(`Odgovaram koristeći ${name} u pozadini.`);
    assert.doesNotMatch(out, /gemini|google|chatgpt|gpt|claude|llm|generativelanguage/i);
    assert.match(out, /AI/);
  }
});

test('false action claims in bs/en/de are dropped', () => {
  const bad = [
    'Poslali smo vaš upit timu.',
    'Zakazao sam vam termin.',
    'Sačuvali smo podatke u CRM.',
    'I have sent your enquiry to the team.',
    'We booked your appointment.',
    'Ich habe Ihre Anfrage gesendet.',
  ];
  for (const sentence of bad) assert.equal(guardReply(sentence).text, '', sentence);
});

test('legitimate replies without numbers or claims pass unchanged', () => {
  const good = 'Rado objašnjavam opcije. Recite mi koji vam je cilj i predložit ću sljedeći korak.';
  assert.equal(guardReply(good).text, good);
});

test('a grounded price sentence is preserved while an ungrounded one beside it is dropped', () => {
  const grounding = '[price.landing-starter] Landing stranica počinje od 500 KM.';
  const r = guardReply('Landing počinje od 500 KM. Web shop je tačno 9999 KM.', { grounding });
  assert.match(r.text, /500 KM/);
  assert.doesNotMatch(r.text, /9999/);
});

test('unsafe HTML and javascript URIs are stripped', () => {
  assert.equal(stripUnsafe('Zdravo <img src=x onerror=alert(1)> svijete'), 'Zdravo  svijete'.replace(/\s{2,}/g, ' ').trim());
  assert.doesNotMatch(stripUnsafe('Klikni <a href="javascript:alert(1)">ovdje</a>'), /javascript:|<a|<\/a>/i);
  assert.equal(guardReply('<script>alert(1)</script>Pomoći ću vam rado.').text, 'Pomoći ću vam rado.');
});

test('a fully-removed reply falls back to a safe localized line', () => {
  const r = guardReply('Klijenti su dobili 300% više prihoda.', { grounding: '' });
  assert.equal(r.text, '');
  assert.ok(GUARD_FALLBACK.bs.length > 0 && GUARD_FALLBACK.en.length > 0 && GUARD_FALLBACK.de.length > 0);
});