// Builds the KODENT cinematic preview (a Next.js app kept in its own project) as a static example at /cinematic-kodent/.
// The source project is never modified: it is copied to a temporary folder, patched for the sub-path and for whole-film
// video preloading, exported, and the export replaces ./cinematic-kodent.
// Usage: node concierge/tools/build-kodent-example.mjs ["C:\\path\\to\\PROJECT KODENT"]
import {cpSync,existsSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const source=resolve(process.argv[2]||'C:/Users/DT User2/claudecode/PROJECT KODENT'),work=join(tmpdir(),'digital-x-kodent-export'),target=resolve('cinematic-kodent');
const BASE='/cinematic-kodent';
rmSync(work,{recursive:true,force:true});mkdirSync(work,{recursive:true});
for(const f of ['src','public','package.json','tsconfig.json','next-env.d.ts'])cpSync(join(source,f),join(work,f),{recursive:true});
symlinkSync(join(source,'node_modules'),join(work,'node_modules'),'junction');
// Preview-only metadata routes (robots, sitemap) are server routes and meaningless under a sub-path.
for(const f of ['src/app/robots.ts','src/app/sitemap.ts'])rmSync(join(work,f),{force:true});
const patch=(file,pairs)=>{let t=readFileSync(join(work,file),'utf8');for(const [a,b] of pairs){if(!t.includes(a))throw new Error(`${file}: expected snippet not found: ${a.slice(0,60)}`);t=t.replace(a,b);}writeFileSync(join(work,file),t);};
writeFileSync(join(work,'next.config.ts'),`import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, output: 'export', basePath: '${BASE}', trailingSlash: true, images: {unoptimized: true} };
export default config;
`);
patch('src/lib/media.ts',[
 ["export const mediaUrl = (file: string, mobile = false) => `/media/${file}${mobile ? '-mobile' : ''}.mp4`;",
  `export const BASE = '${BASE}';
export const mediaUrl = (file: string, mobile = false) => \`\${BASE}/media/\${file}\${mobile ? '-mobile' : ''}.mp4\`;`],
 ["export const posterUrl = (file: string) => `/media/${file}.webp`;",
  `export const posterUrl = (file: string) => \`\${BASE}/media/\${file}.webp\`;
// Whole-film preload: after the hero is on screen, every chapter video for this device is fetched once, in story
// order, and kept as a local blob. A chapter that mounts later plays and seeks from memory instead of the network.
const local = new Map<string, string>();
export const mediaSrc = (file: string, mobile = false) => local.get(mediaUrl(file, mobile)) ?? mediaUrl(file, mobile);
let warming = false;
export function warmMedia(mobile: boolean) {
  const connection = (navigator as Navigator & {connection?: {saveData?: boolean; effectiveType?: string}}).connection;
  if (warming || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  warming = true;
  const queue = chapters.filter(c => c.kind !== 'hero').map(c => mediaUrl(c.file, mobile));
  void (async () => { for (const url of queue) { try { const r = await fetch(url, {priority: 'low'} as RequestInit); if (r.ok) local.set(url, URL.createObjectURL(await r.blob())); } catch { /* the network URL still works */ } } })();
}`]]);
patch('src/components/CinematicJourney.tsx',[
 ["import {useEffect, useRef, useState, type CSSProperties} from 'react';","import {useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';"],
 ["import {chapters, services, mediaUrl, posterUrl, type Chapter} from '@/lib/media';","import {BASE, chapters, services, mediaSrc, posterUrl, warmMedia, type Chapter} from '@/lib/media';"],
 [" const scrub=chapter.kind==='hero'&&!mobile;"," const scrub=chapter.kind==='hero'&&!mobile;\n const src=useMemo(()=>mediaSrc(chapter.file,mobile),[loaded,chapter.file,mobile]);"],
 ["`/media/${chapter.file}-start.webp`","`${BASE}/media/${chapter.file}-start.webp`"],
 ["src={mediaUrl(chapter.file,mobile)}","src={src}"],
 [" const handleBlocked=useRef(()=>setBlocked(true)).current;"," const handleBlocked=useRef(()=>setBlocked(true)).current;\n useEffect(()=>{if(reduced)return;const t=setTimeout(()=>warmMedia(mobile),1200);return()=>clearTimeout(t);},[reduced,mobile]);"],
]);
patch('src/app/layout.tsx',[["url:'/media/hero.webp'",`url:'${BASE}/media/hero.webp'`]]);
execFileSync(process.execPath,[join(work,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:work,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const out=join(work,'out');if(!existsSync(join(out,'index.html')))throw new Error('Export produced no index.html');
rmSync(target,{recursive:true,force:true});cpSync(out,target,{recursive:true});
console.log(`KODENT exported to ${target}`);
