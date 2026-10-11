import test from 'node:test';
import assert from 'node:assert/strict';
import { enhanceFinalPolishHtml, shouldPolishPath } from '../lib/final-polish.mjs';

const doc = (body, head = '') => `<!doctype html><html><head>${head}</head><body><main>${body}</main></body></html>`;

test('German shop landing is included in final polish routing', () => {
  assert.equal(shouldPolishPath('/de/shop/'), true);
});

test('German shop landing replaces literal machine-translated copy', () => {
  const html = enhanceFinalPolishHtml(doc(`
    <h1>Dienstleistungen so klar<br/><i>Digitale Produkte.</i></h1>
    <p>Wählen Sie ein Web, KI, Automatisierung, Wachstum oder Inhalte als klares digitales Produkt. Für komplexere Anforderungen bitten wir Sie um ein Maß an Auswertung.</p>
    <h2>Den nächsten Zug auswählen</h2>
    <h3>Premium Web Präsenz</h3><p>Präsentationsseite mit übersichtlichem Angebot, mobilem Design, Basis-SEO und Kontakt während.</p>
    <h3>Einführung des elektronischen Geschäftsverkehrs</h3><p>Kompletter Handel mit Kategorien, Produkten, Lieferung, Zahlung und Schulung.</p>
    <h3>Benutzerdefinierte Anwendung</h3><p>Portal, Buchung, Board oder Bedienwerkzeug angepasst an Ihren Prozess.</p>
    <h3>KI Zweites Gehirn-Betriebssystem</h3><p>Privates Geschäftsgedächtnis mit Co-Pilot-Assistenten, verwandten Quellen und genehmigten Befehlen.</p>
    <h3>Automatisch starten</h3><p>Ein vorrangiger Workflow von der Abfrage zur Aufgabe, Benachrichtigung oder CRM-Aufzeichnung.</p>
    <h3>Überprüfungssystem</h3><p>Automatische Überprüfungsanfrage nach Abschluss der Dienstleistung, mit Follow-up.</p>
    <span>&amp; Markeninhalt</span><h3>Inhaltssystem</h3><p>Planen, kopieren, Visuals und kurzes Video, das als ein einheitliches Content-System formatiert ist.</p>
    <strong>Beurteilung auf Anfrage</strong><a>Benutzerdefinierte Anfrage</a>
  `), '<title>Digital X Shop · Digitale Dienste und Systeme</title><meta name="description" content="Wählen Sie ein Web, KI, Automatisierung, Wachstum oder Inhalte als klares digitales Produkt. Für komplexere Anforderungen bitten wir Sie um ein Maß an Auswertung.">'), '/de/shop/');

  assert.doesNotMatch(html, /Maß an Auswertung|Den nächsten Zug|Premium Web Präsenz|elektronischen Geschäftsverkehrs|Benutzerdefinierte Anwendung|Zweites Gehirn-Betriebssystem|Automatisch starten|Überprüfungssystem|Markeninhalt|Inhaltssystem|Beurteilung auf Anfrage|Benutzerdefinierte Anfrage|Kontakt während/);
  assert.match(html, /klar definiertes digitales Produkt/);
  assert.match(html, /Passende Lösung auswählen/);
  assert.match(html, /Premium-Webpräsenz/);
  assert.match(html, /E-Commerce Launch/);
  assert.match(html, /Individuelle Anwendung/);
  assert.match(html, /AI Second Brain OS/);
  assert.match(html, /Automation Starter/);
  assert.match(html, /Bewertungssystem/);
  assert.match(html, /Content & Marke/);
  assert.match(html, /Content-System/);
  assert.match(html, /Preis auf Anfrage/);
  assert.match(html, /Individuelle Anfrage/);
});
