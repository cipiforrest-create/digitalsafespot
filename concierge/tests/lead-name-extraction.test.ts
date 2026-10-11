import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanName, collectFromMessage } from '../server/orchestrator/lead-action';

// Regression cover for the contactName greediness found in production: a visitor who answers the name question with
// one run-on sentence ("My name is Marko Petrovic, email …, phone …, budget around 4000 EUR, timeline 2 months")
// used to have the ENTIRE tail stored as contactName. The name must be bounded to the name, and the trailing
// detail must be preserved as enquiry context rather than discarded. Pure helpers: no I/O, no model, no env.

test('contactName extraction is bounded to the name (serial)', async (t) => {
  await t.test('the production run-on case keeps only the name', () => {
    assert.equal(
      cleanName('Marko Petrovic, email marko.petrovic@example.com, phone +387 61 555 212. Budget around 4000 EUR, timeline 2 months. Please create the enquiry'),
      'Marko Petrovic',
    );
  });

  await t.test('"My name is First Last, email ..." stops at the detail clause', () => {
    assert.equal(cleanName('My name is Ana Kovac, email ana@example.com'), 'Ana Kovac');
    assert.equal(cleanName('my name is john smith'), 'john smith');
  });

  await t.test('"I\'m First Last and my email is ..." stops at the conjunction', () => {
    assert.equal(cleanName("I'm Ivan Horvat and my email is ivan@example.com"), 'Ivan Horvat');
    assert.equal(cleanName('I am Sara Begic and my phone is +387 61 000 111'), 'Sara Begic');
  });

  await t.test('Bosnian variants ("Zovem se ...", "Ja sam ...", "Ime je ...")', () => {
    assert.equal(cleanName('Zovem se Amar Hodzic, email amar@example.com'), 'Amar Hodzic');
    assert.equal(cleanName('Ja sam Lejla Đinđić, broj +387 61 222 333'), 'Lejla Đinđić');
    assert.equal(cleanName('Ime je Mirza Salihović'), 'Mirza Salihović');
    assert.equal(cleanName('Zovem se Emina Šehić, moj budžet je 4000 EUR'), 'Emina Šehić');
  });

  await t.test('German variants', () => {
    assert.equal(cleanName('Ich heiße Hans Müller, meine E-Mail ist hans@example.com'), 'Hans Müller');
    assert.equal(cleanName('Mein Name ist Klaus Weber'), 'Klaus Weber');
  });

  await t.test('punctuation boundaries (comma, semicolon, period, newline)', () => {
    assert.equal(cleanName('Marko Petrovic.'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic; budget 4000'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic\nemail marko@example.com'), 'Marko Petrovic');
    assert.equal(cleanName('  Marko   Petrovic  '), 'Marko Petrovic');
  });

  await t.test('name followed by phone / budget / company / website is truncated at the cue', () => {
    assert.equal(cleanName('Marko Petrovic phone +387 61 555 212'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic budget around 4000 EUR'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic company Bakery Doo'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic website example.com'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic firma Pekara'), 'Marko Petrovic');
    assert.equal(cleanName('Marko Petrovic 4000 EUR'), 'Marko Petrovic');
  });

  await t.test('legitimate multi-word names are NOT truncated', () => {
    assert.equal(cleanName('Ana Marija Kovacevic'), 'Ana Marija Kovacevic');
    assert.equal(cleanName('John R. Smith'), 'John R. Smith');
    assert.equal(cleanName('Jean-Luc Picard'), 'Jean-Luc Picard');
    assert.equal(cleanName("Conor O'Brien"), "Conor O'Brien");
    assert.equal(cleanName('Ludwig van der Berg'), 'Ludwig van der Berg');
    assert.equal(cleanName('Đorđe Šarić Hadžić'), 'Đorđe Šarić Hadžić');
    assert.equal(cleanName('My name is Ana Marija Kovacevic'), 'Ana Marija Kovacevic');
  });

  await t.test('collectFromMessage stores the bounded name and keeps the detail as the enquiry message', () => {
    const args = collectFromMessage(
      {},
      'My name is Marko Petrovic, email marko.petrovic@example.com, phone +387 61 555 212. Budget around 4000 EUR, timeline 2 months.',
      'contactName',
    );
    assert.equal(args.contactName, 'Marko Petrovic');
    assert.equal(args.contactEmail, 'marko.petrovic@example.com');
    assert.equal(args.phone, '+387 61 555 212');
    // No visitor-supplied context is lost: the trailing detail becomes the enquiry message.
    assert.ok(args.message && /4000 EUR/.test(args.message), `expected budget preserved, got ${args.message}`);
    assert.ok(!/4000/.test(args.contactName ?? ''), 'contactName must not absorb the budget');
  });

  await t.test('an existing enquiry message is never overwritten by the name remainder', () => {
    const args = collectFromMessage(
      { message: 'I need a new bakery website.' },
      'My name is Marko Petrovic, budget around 4000 EUR',
      'contactName',
    );
    assert.equal(args.contactName, 'Marko Petrovic');
    assert.equal(args.message, 'I need a new bakery website.');
  });

  await t.test('a non-name answer still fills the slot (no silent data loss)', () => {
    const args = collectFromMessage({}, '12345', 'contactName');
    assert.equal(args.contactName, '12345');
  });
});
