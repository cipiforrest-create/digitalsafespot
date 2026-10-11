import { CinematicSequence } from "./cinematic/CinematicSequence.js?v=handoff-v3";
// Replace this sample catalogue with verified inventory before enabling checkout.
export const products = [
  { id: 'ambre', name: 'Ambre Nocturne', category: 'amber', family: 'AMBRÉ · EAU DE PARFUM', notes: 'Jantar · Vanilija · Sandalovina', top: 'Bergamot', heart: 'Jantar, vanilija', base: 'Sandalovina', price: 185, size: '50 ml', badge: 'STAR ODABIR', image: 'ambre', description: 'Toplina jantara susreće mekoću vanilije. Dubok, obavijajući miris za trenutke koji zaslužuju da traju.' },
  { id: 'rose', name: 'Rose Velours', category: 'floral', family: 'FLORAL · EAU DE PARFUM', notes: 'Ruža · Božur · Bijeli mošus', top: 'Ružičasti biber', heart: 'Ruža, božur', base: 'Bijeli mošus', price: 165, size: '50 ml', badge: 'CVJETNI POTPIS', image: 'rose', description: 'Baršunasta ruža u nježnom zagrljaju božura i bijelog mošusa. Intiman, elegantan trag koji ostaje blizu kože.' },
  { id: 'oud', name: 'Oud Impérial', category: 'woody', family: 'BOISÉ · EXTRAIT DE PARFUM', notes: 'Oud · Šafran · Tamjan', top: 'Šafran', heart: 'Oud, tamjan', base: 'Kedar, koža', price: 245, size: '50 ml', badge: 'INTENZIVNA ESENCIJA', image: 'oud', description: 'Plemenito drvo, topli šafran i dimni tamjan. Snažna kompozicija s tihom, neodoljivom prisutnošću.' },
  { id: 'iris', name: 'Iris Lumière', category: 'fresh', family: 'POUDRÉ · EAU DE PARFUM', notes: 'Iris · Bergamot · Vetiver', top: 'Bergamot', heart: 'Iris', base: 'Vetiver, mošus', price: 175, size: '50 ml', badge: 'SVJEŽA PERSPEKTIVA', image: 'iris', description: 'Svježina bergamota otvara put puderastom irisu i čistom vetiveru. Prozračan miris, poput prvog jutarnjeg svjetla.' },
  { id: 'discovery', name: 'The Discovery Set', category: 'gift', family: 'STAR · DISCOVERY COLLECTION', notes: 'Ambre Nocturne · Rose Velours · Oud Impérial', top: 'Tri mirisna svijeta', heart: 'Jantar, ruža, oud', base: 'Poklon kolekcija', price: 95, size: '3 × 10 ml', badge: 'POKLON KOLEKCIJA', image: 'gifts', description: 'Tri različita karaktera u jednom setu. Otkrijte toplinu jantara, nježnost ruže i dubinu ouda kroz mali ritual istraživanja.' },
];
const $ = (selector) => document.querySelector(selector);
const formatPrice = (value) => `${new Intl.NumberFormat('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} KM`;
const imagePath = (product) => `./public/images/luxury/${product.image}.png`;
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 7l-1.4-1.5a5 5 0 0 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/></svg>';
function readStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The bag still works for this visit when storage is unavailable. */ } }
const knownIds = new Set(products.map(p => p.id));
const storedBag = readStorage('star-bag-v1', []);
let bag = Array.isArray(storedBag) ? [...new Map(storedBag.filter(item => item && knownIds.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0).map(item => [item.id, { id: item.id, quantity: Math.min(item.quantity, 20) }])).values()] : [];
const storedFavorites = readStorage('star-favorites-v1', []);
const favorites = new Set(Array.isArray(storedFavorites) ? storedFavorites.filter(id => knownIds.has(id)) : []);
let activeFilter = 'all';
let onlyFavorites = false;
let search = '';
let toastTimer;
function notify(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000); }
function renderProducts() {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = products.filter(p => p.category !== 'gift' && (activeFilter === 'all' || p.category === activeFilter) && (!onlyFavorites || favorites.has(p.id)) && normalize(`${p.name} ${p.notes} ${p.family}`).includes(normalize(search)));
  $('#product-grid').innerHTML = visible.map(p => `<article class="product-card"><div class="product-visual"><button class="product-open" data-product="${p.id}" aria-label="Pogledajte ${p.name}"><img src="${imagePath(p)}" alt="${p.name}, ${p.size} — ${p.notes}" width="1024" height="1536" loading="lazy" decoding="async"/><span class="quick-view">OTKRIJTE MIRIS ↗</span></button><span class="product-badge">${p.badge}</span><button class="favorite icon-button" data-favorite="${p.id}" aria-label="Omiljeni parfem: ${p.name}" aria-pressed="${favorites.has(p.id)}">${heart}</button></div><div class="product-meta"><p class="product-type">${p.family}</p><h3><button class="product-name" data-product="${p.id}">${p.name}</button></h3><p class="product-notes">${p.notes}</p><div class="product-bottom"><span class="product-price">${formatPrice(p.price)}</span><button class="add-button" data-add="${p.id}" aria-label="Dodaj ${p.name} u korpu">U korpu <span aria-hidden="true">+</span></button></div></div></article>`).join('');
  $('#empty-state').hidden = visible.length > 0;
  $('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'miris' : visible.length === 0 ? 'mirisa' : 'mirisa'}`;
  document.querySelectorAll('[data-filter]').forEach(button => { const selected = button.dataset.filter === activeFilter; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  $('#wishlist-toggle').setAttribute('aria-pressed', String(onlyFavorites));
}
function setFilter(filter) { activeFilter = filter; onlyFavorites = false; search = ''; $('#search-input').value = ''; renderProducts(); }
const lastFocus = new WeakMap();
function openDialog(dialog) { lastFocus.set(dialog, document.activeElement); dialog.showModal(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => { if (event.target.closest('[data-close]')) dialog.close(); else if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { lastFocus.get(dialog)?.focus(); });
});
function openProduct(id) { const p = products.find(p => p.id === id); if (!p) return; $('#product-detail').innerHTML = `<img class="detail-image" src="${imagePath(p)}" alt="${p.name}"/><div class="detail-copy"><p class="eyebrow">${p.family}</p><h2 id="detail-title">${p.name}</h2><p>${p.description}</p><ul class="note-list"><li><strong>Otvaranje</strong> ${p.top}</li><li><strong>Srce</strong> ${p.heart}</li><li><strong>Baza</strong> ${p.base}</li></ul><span class="size-label">${p.size}</span><div class="detail-price">${formatPrice(p.price)}</div><button class="button button-gold" data-add="${p.id}">Dodaj u korpu <span>+</span></button><p class="sample-note">Ogledni proizvod i cijena. Kupovina još nije dostupna.</p></div>`; openDialog($('#product-dialog')); }
function renderBag() {
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  $('#bag-count').textContent = count;
  $('#bag-toggle').setAttribute('aria-label', `Otvori korpu (${count})`);
  $('#bag-items').innerHTML = bag.length ? bag.map(item => { const p = products.find(p => p.id === item.id); return `<article class="bag-item"><img src="${imagePath(p)}" alt="${p.name}" width="65" height="90"/><div><h3>${p.name}</h3><p>${p.size} · ${formatPrice(p.price)}</p><div class="bag-controls"><button class="quantity-button" data-quantity="${p.id}" data-delta="-1" aria-label="Smanji količinu: ${p.name}">−</button><span aria-label="Količina">${item.quantity}</span><button class="quantity-button" data-quantity="${p.id}" data-delta="1" aria-label="Povećaj količinu: ${p.name}" ${item.quantity >= 20 ? 'disabled' : ''}>+</button><button class="remove-item" data-remove="${p.id}">Ukloni</button></div></div></article>`; }).join('') : '<p class="bag-empty">Vaša korpa čeka prvi miris.<br />Otkrijte kolekciju i pronađite svoj potpis.</p>';
  const total = bag.reduce((sum, item) => sum + products.find(p => p.id === item.id).price * item.quantity, 0);
  $('#bag-summary').innerHTML = bag.length ? `<span>Ukupno (ogledni iznos)</span><strong>${formatPrice(total)}</strong>` : '';
  saveStorage('star-bag-v1', bag);
}
function addToBag(id) { const p = products.find(p => p.id === id); if (!p) return; const item = bag.find(i => i.id === id); if (item?.quantity >= 20) return notify('Maksimalna količina u oglednoj korpi je 20.'); if (item) item.quantity++; else bag.push({ id, quantity: 1 }); renderBag(); notify(`${p.name} je dodan u korpu.`); }
document.addEventListener('click', event => {
  const productButton = event.target.closest('[data-product]'); if (productButton) openProduct(productButton.dataset.product);
  const addButton = event.target.closest('[data-add]'); if (addButton) addToBag(addButton.dataset.add);
  const favoriteButton = event.target.closest('[data-favorite]'); if (favoriteButton) { const id = favoriteButton.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); saveStorage('star-favorites-v1', [...favorites]); renderProducts(); document.querySelector(`[data-favorite="${id}"]`)?.focus({ preventScroll: true }); notify(favorites.has(id) ? 'Miris je dodan u omiljene.' : 'Miris je uklonjen iz omiljenih.'); }
  const filterButton = event.target.closest('[data-filter]'); if (filterButton) setFilter(filterButton.dataset.filter);
  const collection = event.target.closest('[data-collection]'); if (collection) setFilter(collection.dataset.collection);
  const quantity = event.target.closest('[data-quantity]'); if (quantity) { const item = bag.find(i => i.id === quantity.dataset.quantity); if (item) { item.quantity = Math.min(20, item.quantity + Number(quantity.dataset.delta)); bag = bag.filter(i => i.quantity > 0); renderBag(); const replacement = document.querySelector(`[data-quantity="${quantity.dataset.quantity}"][data-delta="${quantity.dataset.delta}"]:not(:disabled)`); (replacement || $('#bag-dialog [data-close]')).focus(); } }
  const remove = event.target.closest('[data-remove]'); if (remove) { bag = bag.filter(item => item.id !== remove.dataset.remove); renderBag(); $('#bag-dialog [data-close]').focus(); }
});
function setMenu(open) { $('#mobile-menu').hidden = !open; $('#menu-toggle').setAttribute('aria-expanded', String(open)); $('#menu-toggle').setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni'); }
$('#menu-toggle').addEventListener('click', () => setMenu($('#mobile-menu').hidden));
$('#mobile-menu').querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
$('#bag-toggle').addEventListener('click', () => openDialog($('#bag-dialog')));
$('#footer-bag').addEventListener('click', () => openDialog($('#bag-dialog')));
$('#gift-open').addEventListener('click', () => openProduct('discovery'));
function openFilm() { $('#top').scrollIntoView({ behavior: 'smooth' }); }
['film-toggle', 'story-film', 'story-more', 'footer-film'].forEach(id => $(`#${id}`).addEventListener('click', openFilm));
$('#search-toggle').addEventListener('click', () => { $('#search-bar').hidden = false; $('#fragrances').scrollIntoView(); $('#search-input').focus({ preventScroll: true }); });
$('#search-input').addEventListener('input', event => { search = event.target.value; renderProducts(); });
$('#search-clear').addEventListener('click', () => { search = ''; $('#search-input').value = ''; renderProducts(); $('#search-input').focus(); });
$('#reset-filters').addEventListener('click', () => setFilter('all'));
$('#wishlist-toggle').addEventListener('click', () => { onlyFavorites = !onlyFavorites; activeFilter = 'all'; search = ''; $('#search-input').value = ''; renderProducts(); $('#fragrances').scrollIntoView(); });
$('#year').textContent = new Date().getFullYear();
renderProducts();
renderBag();

const cinematic = new CinematicSequence(document.querySelector("[data-cinematic-sequence]"));
document.querySelector("[data-cinematic-sequence]").cinematicSequence = cinematic;



