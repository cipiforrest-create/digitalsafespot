export const xCoreStates = [
 ['01-x-core-hero',0,10,'dark'],['02-x-core-activation',10,17,'light'],['03-x-core-split',17,25,'dark'],
 ['04-x-core-neural-transition',25,32,'light'],['05-ai-systems',32,40,'fade'],['06-ai-to-cinematic-web',40,47,'fade'],
 ['07-cinematic-web',47,55,'fade'],['08-cinematic-web-to-seo',55,62,'dark'],['09-seo-aeo-geo',62,70,'fade'],
 ['10-seo-to-automation',70,77,'fade'],['11-automation',77,84,'dark'],['12-automation-to-reconnect',84,89,'fade'],
 ['13-reconnect-orbit',89,93,'fade'],['14-connected-system',93,97,'light'],['15-final-reconvergence',97,100,'fade'],
].map(([name,start,end,transition],index)=>({name,start:Number(start)/100,end:Number(end)/100,transition,scale: index===2?1:1.025,anchor:index===0?[.53,.5]:[.5,.5]}));
const chapters=[
 ['Uvod','Infrastruktura za rast u AI eri.','Web. AI. Pretraga. Automatizacija. Povezani u jedan sistem.',0],
 ['AI sistemi','AI sistemi','Inteligentni sistemi koji razumiju potrebe vašeg poslovanja i pomažu u svakodnevnom radu.',.32],
 ['Cinematic web','Cinematic web','Digitalna iskustva koja privlače pažnju, jasno predstavljaju ponudu i vode do upita.',.47],
 ['SEO / AEO / GEO','SEO / AEO / GEO','Vidljivost u klasičnoj i AI pretrazi, uz lokalnu prepoznatljivost.',.62],
 ['Automatizacija','Automatizacija','Povezani procesi koji smanjuju ručni rad i održavaju poslovanje u pokretu.',.77],
 ['Jedan sistem','Jedno jezgro. Četiri pokretača rasta.','Strategija, kreativnost, pretraga i inteligentni sistemi — povezani u jednu infrastrukturu.',.89],
];
export function xCore(){return `<section id="x-core" class="x-core" data-x-core data-x-manifest='${JSON.stringify(xCoreStates)}' aria-label="X Core — povezani sistem za rast">
<link rel="stylesheet" href="/ai-concierge-preview/x-core.css">
<div class="x-core-sticky"><div class="x-core-art"><img class="x-core-poster" src="/ai-concierge-preview/media/x-core-v1/01-x-core-hero-1024.webp" srcset="/ai-concierge-preview/media/x-core-v1/01-x-core-hero-640.webp 640w, /ai-concierge-preview/media/x-core-v1/01-x-core-hero-1024.webp 1024w, /ai-concierge-preview/media/x-core-v1/01-x-core-hero-1672.webp 1672w" sizes="100vw" width="1672" height="941" loading="lazy" decoding="async" alt="Metalni X u tamnom prostoru s bijelim osvjetljenjem"><canvas aria-hidden="true"></canvas></div>
<div class="x-core-content">${chapters.map(([label,title,body,p],i)=>`<article class="x-core-copy" id="x-core-chapter-${i}" data-x-copy="${p}"><p class="x-core-eyebrow">X CORE / ${String(i+1).padStart(2,'0')} — ${label}</p><h2>${title}</h2><p>${body}</p>${i===0?'<div class="x-core-actions"><a href="#x-core-chapter-1" data-x-seek="0.32">Istražite X Core <span aria-hidden="true">↓</span></a><button data-audit>Besplatna analiza sajta ↗</button></div>':''}</article>`).join('')}</div>
<div class="x-core-controls"><nav aria-label="X Core oblasti">${chapters.slice(1,5).map(([label,,,p],i)=>`<a href="#x-core-chapter-${i+1}" data-x-seek="${p}">${label}</a>`).join('')}</nav><a class="x-core-skip" href="#cinematic">Nastavite na sadržaj ↓</a><div class="x-core-progress" aria-hidden="true"><i></i></div></div>
</div></section>`;}
