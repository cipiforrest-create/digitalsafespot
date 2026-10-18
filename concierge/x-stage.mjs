// X hero: the first screen of the Digital X homepage (the preview home, above the 3D cinema story).
// The talking X monolith fills the background; the voice orb sits on the X crossing. Layers share one cover
// box: the SVG uses xMidYMid slice, the images object-fit: cover, so the light map, bloom and traced edges stay
// aligned with the plate. Geometry is in plate pixels (1536x1024) and mirrors concierge/x-stage-assets.py.
const M='/media/x-stage';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Two mirrored strokes run from the upper notch around the silhouette to the inner apex; the seam and the
// lit triangle's base follow. pathLength="1" lets CSS draw every stroke with the same dash values.
const TRACE=['M767.5 505L650 377L524 377L652 518L512 667L662 666L767.5 557','M767.5 505L885 377L1010 377L882 518L1022 667L872 666L767.5 557','M767.5 518L652 518','M767.5 518L882 518','M662 666L872 666'];
const SIZES='(max-width:760px) 200vw, 100vw';
const set=ext=>[768,1152,1536].map(w=>`${M}/environment-${w}.${ext} ${w}w`).join(', ');
/** Preload for pages where the stage is the first screen (the plate is the LCP element). */
export function xStageHead({css='/css/x-stage.css'}={}){return `<link rel="preload" as="image" type="image/avif" imagesrcset="${set('avif')}" imagesizes="${SIZES}" fetchpriority="high"><link rel="stylesheet" href="${css}">`;}
function scene(alt){
 const paths=cls=>TRACE.map(d=>`<path class="${cls}" d="${d}" pathLength="1"/>`).join('');
 // Order matters: the veil darkens only the plate, so the traced edges and the ignition light read on black.
 // The light layers share the plate's sizes, so none of them counts as a larger LCP candidate than the plate.
 return `<div class="xs-scene" aria-hidden="true"><div class="xs-camera">
<picture class="xs-plate"><source type="image/avif" srcset="${set('avif')}" sizes="${SIZES}"><img src="${M}/environment-1536.webp" srcset="${set('webp')}" sizes="${SIZES}" width="1536" height="1024" alt="${esc(alt)}" fetchpriority="high" decoding="async"></picture>
<div class="xs-dark"></div>
<svg class="xs-storm" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><radialGradient id="xs-sky-glow"><stop stop-color="#fff" stop-opacity=".65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><g class="xs-storm-left"><ellipse cx="555" cy="285" rx="290" ry="170" fill="url(#xs-sky-glow)"/><path d="M580 118l-23 42 18 17-42 42 22 17-47 73m48-73-45-13-27 9"/></g><g class="xs-storm-right"><ellipse cx="1020" cy="290" rx="280" ry="160" fill="url(#xs-sky-glow)"/><path d="M1018 132l26 31-15 29 37 28-17 30 35 59m-35-59 43-11 26 16"/></g></svg>
<div class="xs-glow"><img class="xs-light" src="${M}/light-1536.webp" srcset="${M}/light-1536.webp 1536w" sizes="${SIZES}" width="1536" height="1024" alt="" role="presentation" loading="eager" decoding="async" fetchpriority="low"></div>
<img class="xs-voice" src="${M}/light-1536.webp" srcset="${M}/light-1536.webp 1536w" sizes="${SIZES}" width="1536" height="1024" alt="" role="presentation" loading="eager" decoding="async" fetchpriority="low">
<div class="xs-halo"><img class="xs-bloom" src="${M}/bloom-768.webp" srcset="${M}/bloom-768.webp 768w" sizes="${SIZES}" width="768" height="512" alt="" role="presentation" loading="eager" decoding="async" fetchpriority="low"></div>
<svg class="xs-fx" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><radialGradient id="xs-flare-fill"><stop offset="0" stop-color="#fff"/><stop offset=".18" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#e8edf5" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<g class="xs-ripples"><ellipse cx="768" cy="684" rx="352" ry="17"/><ellipse cx="768" cy="684" rx="352" ry="17"/><ellipse cx="768" cy="684" rx="352" ry="17"/></g>
<g class="xs-trace">${paths('xs-edge xs-edge--glow')}${paths('xs-edge')}</g><g class="xs-current">${paths('xs-spark')}</g>
<g class="xs-flare-wrap"><circle class="xs-flare" cx="767.5" cy="511" r="150" fill="url(#xs-flare-fill)"/></g></svg>
</div><div class="xs-grade"></div></div>`;
}
// Goal ids are the concierge goal codes; a click sends the matching goal label from shared/contracts.ts.
const goals=[['customers','i-users','Želim više<br>klijenata'],['visibility','i-search','AI ne preporučuje<br>moju firmu'],['website','i-screen','Web stranici<br>treba novi izgled'],['response','i-bolt','Presporo odgovaramo<br>na upite']];
const sides=[['lu','WEB STRANICE<br>ZA NOVU ERU<br>POSLOVANJA'],['ll','STRATEGIJA<br>DIZAJN<br>AI AUTOMATIZACIJA<br>AEO RAST'],['ru','UPEČATLJIVO<br>INTELIGENTNO<br>SVRSISHODNO'],['rl','VIŠE POSJETILACA<br>KVALITETNIJI UPITI<br>JASNIJI PROCES<br>SNAŽNIJI BREND']];
const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
/** The heading is an h2: the cinema story below keeps the page's single h1. */
export function xHero(){
 return `<section class="xs-stage xh" id="asistent" data-x-stage data-state="idle" aria-labelledby="xh-title">
<div class="xh-focus">${scene('Monumentalni X od crnog mramora na vodi, osvijetljen bijelim svjetlom')}
<div class="xh-core"><canvas class="xh-wave" data-x-wave width="1560" height="240" aria-hidden="true"></canvas><button class="xh-orb" type="button" data-talk aria-label="Pokrenite glasovni razgovor s DIGITAL X asistentom"><span class="xh-sheen" aria-hidden="true"></span>${icon('i-mic')}</button>
<p class="xh-status" data-x-status>Spreman za razgovor</p><p class="xh-caption">UPOZNAJTE DIGITAL X <span aria-hidden="true">·</span> <button type="button" data-text>NAPIŠITE PORUKU</button></p></div></div>
<div class="xh-heading"><h2 id="xh-title" class="xh-title">Vaša web stranica može<br><span>više od dobrog izgleda.</span></h2><p class="xh-lead">Neka razumije posjetioce, prepozna prilike<br class="xh-break"> i pretvori interes u sljedeći korak.</p></div>
${sides.map(([id,text])=>`<p class="xh-side xh-side--${id}">${text}<span aria-hidden="true"></span></p>`).join('')}
<div class="xh-goals" role="group" aria-label="Šta želite unaprijediti?">${goals.map(([id,svg,label])=>`<button class="xh-goal" type="button" data-goal="${id}" aria-pressed="false">${icon(svg)}<span>${label}</span></button>`).join('')}</div>
<div class="xh-actions"><button class="xh-button xh-primary" type="button" data-talk>${icon('i-mic')}<span>Razgovaraj s DIGITAL X AI</span>${icon('i-arrow')}</button><button class="xh-button xh-secondary" type="button" data-audit><span>Pokreni AI analizu</span>${icon('i-arrow')}</button><button class="xh-button xh-secondary" type="button" data-tour-start><span>Provedi me kroz ponudu</span>${icon('i-arrow')}</button></div>
<p class="xh-signoff">STVARNI RAZGOVORI. KONKRETNA RJEŠENJA.</p></section>`;
}
