import test from 'node:test';
import assert from 'node:assert/strict';
import { isLeadRequest, detectLeadIntent, detectControl } from '../shared/lead-intent';
import * as leadAction from '../server/orchestrator/lead-action';

// The client router sends a text turn to the v2 action flow only on an explicit contact/offer ask or a stated
// service need. Navigation-style asks must stay on the site-action chat path.
test('client routing: explicit contact and service-need asks route to the action flow (BA/EN/DE)', () => {
  for (const message of [
    'I need a new AI-powered website. Please contact me.',
    'Trebam novu web stranicu sa AI. Kontaktirajte me.',
    'Javite mi se oko ponude.',
    'Ich brauche eine neue Webseite mit KI. Bitte kontaktieren Sie mich.',
    'Can I get a quote?',
  ]) {
    assert.equal(isLeadRequest(message), true, message);
    assert.equal(detectLeadIntent(message), true, `server agrees: ${message}`);
  }
});

test('client routing: navigation and info asks stay on the site-action chat path', () => {
  for (const message of [
    'I want to see your examples',
    'Pokaži mi primjere',
    'Take me to the SEO page',
    'Was kostet eine Webseite?',
    'Otvori kontakt stranicu',
    '',
  ]) assert.equal(isLeadRequest(message), false, message);
});

test('the server module re-exports the same detectors (single source of truth)', () => {
  assert.equal(leadAction.detectLeadIntent, detectLeadIntent);
  assert.equal(leadAction.detectControl, detectControl);
  assert.equal(detectControl('did you save it?'), 'status');
  assert.equal(detectControl('marko-confirm@example.com'), null);
});
