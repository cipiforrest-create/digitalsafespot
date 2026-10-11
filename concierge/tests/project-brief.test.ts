import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyBrief, captureField, declineField, applyMessage, applyAuditUrl,
  advance, nextFieldToAsk, reviewSummary, toBriefCard, isDecline,
} from '../server/orchestrator/project-brief';
import { projectBriefSchema, REQUIRED_FIELDS, type BriefFieldKey } from '../shared/project-brief';

const SID = 'sid-brief-test';
const fresh = () => emptyBrief(SID, null);
const status = (b: ReturnType<typeof fresh>, k: BriefFieldKey) => b.fields.find(f => f.key === k)!;

// ---------- Core guard: never store a value that is not quotable from its supporting text ----------
test('captureField rejects a value that is not present in its supporting quote', () => {
  const b = fresh();
  const ok = captureField(b, 'company', 'Acme d.o.o.', 'the visitor talked about pricing', 'visitor');
  assert.equal(ok, false);
  assert.equal(status(b, 'company').status, 'unknown');
});

test('captureField stores a value that is quotable from the message', () => {
  const b = fresh();
  const ok = captureField(b, 'company', 'Acme', 'We are Acme and need help', 'visitor');
  assert.equal(ok, true);
  assert.equal(status(b, 'company').value, 'Acme');
  assert.equal(status(b, 'company').evidence.length, 1);
});

// ---------- Unstated budget stays null (never guessed) ----------
test('a message with no budget leaves the budget field unknown/null', () => {
  const b = applyMessage(fresh(), 'Trebamo bolju vidljivost na Googleu');
  assert.equal(status(b, 'budget').status, 'unknown');
  assert.equal(status(b, 'budget').value, null);
});

test('a stated budget with a currency token is captured', () => {
  const b = applyMessage(fresh(), 'Budžet nam je oko 5000 KM za početak');
  assert.equal(status(b, 'budget').status, 'known');
  assert.match(status(b, 'budget').value!, /5000\s*KM/i);
});

test('a bare number without a currency or budget word is NOT treated as a budget', () => {
  const b = applyMessage(fresh(), 'Imamo 3 lokacije i 12 zaposlenih');
  assert.equal(status(b, 'budget').status, 'unknown');
});

// ---------- Provenance stacks across turns, value not overwritten ----------
test('evidence stacks across turns while the first captured value is kept', () => {
  const b = fresh();
  captureField(b, 'company', 'Acme', 'We are Acme', 'visitor', 1);
  captureField(b, 'company', 'Acme Corp', 'Officially Acme Corp now', 'visitor', 2);
  assert.equal(status(b, 'company').value, 'Acme');           // first value kept
  assert.equal(status(b, 'company').evidence.length, 2);      // evidence stacked
});


// ---------- One question at a time ----------
test('advance asks at most one question and marks the asked field', () => {
  const b = fresh();
  const { brief, card } = advance(b, 'bs');
  assert.equal(typeof card.question, 'string');
  assert.equal(card.askedField, 'problem');           // first missing field in priority order
  assert.equal(brief.askedField, 'problem');
});

// ---------- No repeated fields: a known field is not asked again ----------
test('a field that is already known is never asked again', () => {
  let b = applyMessage(fresh(), 'Ne stižemo odgovarati na upite i gubimo klijente');
  assert.equal(status(b, 'problem').status, 'known');
  const asked = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const { brief, card } = advance(b, 'bs');
    b = brief;
    if (card.askedField) { asked.add(card.askedField); applyMessage(b, 'preskoči'); }
  }
  assert.equal(asked.has('problem'), false);
});

// ---------- Decline respected: a declined field is never asked again ----------
test('a declined field is remembered and never re-asked', () => {
  const b = fresh();
  b.askedField = 'budget';
  applyMessage(b, 'preskoči, nije bitno');              // explicit decline of the asked field
  assert.equal(status(b, 'budget').status, 'declined');
  assert.notEqual(nextFieldToAsk(b), 'budget');
});

test('isDecline recognizes multilingual skip phrases and ignores normal answers', () => {
  assert.equal(isDecline('preskoči'), true);
  assert.equal(isDecline('rather not say'), true);
  assert.equal(isDecline('keine Angabe'), true);
  assert.equal(isDecline('Acme d.o.o.'), false);
});

// ---------- Audit URL reuse: website comes from the audit, not re-asked ----------
test('an owner-bound audit URL fills the website field with audit provenance', () => {
  const b = applyAuditUrl(fresh(), 'https://example.test/');
  assert.equal(status(b, 'website').status, 'known');
  assert.equal(status(b, 'website').value, 'https://example.test/');
  assert.equal(status(b, 'website').evidence[0].source, 'audit');
  assert.notEqual(nextFieldToAsk(b), 'website');        // never asked again
});

// ---------- Typed extraction: email and website in one message ----------
test('email and website are extracted without confusing one for the other', () => {
  const b = applyMessage(fresh(), 'Pišite na ivan@acme.ba, sajt je https://acme.ba');
  assert.equal(status(b, 'contactEmail').value, 'ivan@acme.ba');
  assert.equal(status(b, 'website').value, 'https://acme.ba');
});

// ---------- Ready for review once required fields are known, without re-asking ----------
test('Flow D: the brief reaches ready_for_review without re-asking known fields', () => {
  let b = fresh();
  b = applyMessage(b, 'Ne stižemo odgovarati na upite i gubimo klijente');  // problem
  const answers: Record<string, string> = {
    company: 'Firma Acme', website: 'https://acme.ba', budget: 'preskoči',
    timeline: 'nije bitno', contactName: 'Zovem se Ivan', contactEmail: 'ivan@acme.ba',
  };
  const askedFields: string[] = [];
  for (let i = 0; i < 10 && b.status !== 'ready_for_review'; i++) {
    const { brief, card } = advance(b, 'bs');
    b = brief;
    if (!card.askedField) break;
    assert.equal(askedFields.includes(card.askedField), false, `re-asked ${card.askedField}`);
    askedFields.push(card.askedField);
    applyMessage(b, answers[card.askedField] ?? 'nešto');
  }
  advance(b, 'bs');
  assert.equal(b.status, 'ready_for_review');
  for (const k of REQUIRED_FIELDS) assert.equal(status(b, k).status, 'known', `${k} known`);
});

// ---------- Review summary is evidence-only and the card hides internals ----------
test('the review summary contains only captured values and the card is bounded', () => {
  const b = fresh();
  captureField(b, 'problem', 'gubimo upite', 'gubimo upite svaki dan', 'visitor');
  captureField(b, 'contactName', 'Ivan', 'ja sam Ivan', 'visitor');
  captureField(b, 'contactEmail', 'ivan@acme.ba', 'mail ivan@acme.ba', 'visitor');
  advance(b, 'bs');
  const summary = reviewSummary(b, 'bs');
  assert.match(summary, /gubimo upite/);
  assert.match(summary, /ivan@acme\.ba/);
  const card = toBriefCard(b, 'bs');
  assert.equal(card.status, 'ready_for_review');
  assert.equal(card.question, null);
  assert.ok(!JSON.stringify(card).includes('"evidence"'));   // raw evidence not exposed in the card
});

// ---------- Contract validity ----------
test('a brief driven through several turns always satisfies the strict schema', () => {
  let b = fresh();
  b = applyMessage(b, 'Trebamo redizajn i budžet nam je 8000 EUR');
  const { brief } = advance(b, 'en');
  assert.equal(projectBriefSchema.safeParse(brief).success, true);
});

// ---------- A known value is not overridden by a later decline ----------
test('declineField does not override an already-captured value', () => {
  const b = fresh();
  captureField(b, 'company', 'Acme', 'we are Acme', 'visitor');
  declineField(b, 'company');
  assert.equal(status(b, 'company').status, 'known');
  assert.equal(status(b, 'company').value, 'Acme');
});
