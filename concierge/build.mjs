import { build } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, cpSync,rmSync } from 'node:fs';
import {resolve,dirname} from 'node:path';
await build({entryPoints:['concierge/shared/catalogue.ts'],outfile:'.concierge/catalogue.cjs',bundle:true,platform:'node',format:'cjs',target:'node24'});
await import('./pages.mjs');
// Centar znanja is generated into /znanje/ before the static copy below picks it up.
await import('./znanje/build.mjs');
mkdirSync('ai-concierge-preview/assets', { recursive: true });
if (existsSync('concierge/client/main.ts')) await build({ entryPoints: ['concierge/client/main.ts'], outdir: 'ai-concierge-preview/assets', bundle: true, splitting: true, format: 'esm', target: ['es2022'], minify: true, sourcemap: false, entryNames: '[name]', chunkNames: '[name]-[hash]' });
for (const name of ['session', 'chat', 'audit', 'brief', 'execution']) {
  if (existsSync(`concierge/server/${name}.ts`)) await build({ entryPoints: [`concierge/server/${name}.ts`], outfile: `.concierge/${name}.cjs`, bundle: true, platform: 'node', format: 'cjs', target: 'node24', packages: 'external' });
}
if (existsSync('concierge/server/lead.ts')) await build({ entryPoints: ['concierge/server/lead.ts'], outfile: '.concierge/lead.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node24', packages: 'external' });
console.log('Concierge assets built; existing site files preserved.');
// Build an isolated static output; server sources, dependencies and local secrets are never served.
const output=resolve('public');if(dirname(output)!==process.cwd())throw new Error('Output must remain inside the site workspace');
rmSync(output,{recursive:true,force:true});mkdirSync(output, { recursive: true });
const excluded = new Set(['public','api','concierge','node_modules','package.json','package-lock.json','tsconfig.json','eslint.config.mjs','vercel.json','test-results','playwright-report']);
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (entry.name.startsWith('.') || /\.(log|pid)$/.test(entry.name) || excluded.has(entry.name)) continue;
  cpSync(entry.name, `public/${entry.name}`, { recursive: true });
}
// The 3D homepage (X hero + cinema story) is the site's indexable homepage at /. /ai-concierge-preview/ is a
// separate concierge landing page. The classic index.html stays in the repo as the source of the homepage's
// search and social head (visual-pages.mjs) and is no longer published.
await import('./publish.mjs');
