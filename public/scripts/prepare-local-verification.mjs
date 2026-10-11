// Local-only fallback for a disk-constrained workstation. Text is copied; immutable
// media is hard-linked on the same volume. Never edit media in this output directory.
import {readdirSync,mkdirSync,copyFileSync,linkSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const site=resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=resolve(site,'public');
if(existsSync(output))throw new Error('Remove only the incomplete generated public output before running this helper.');
const excluded=new Set(['public','api','concierge','node_modules','package.json','package-lock.json','tsconfig.json','eslint.config.mjs','vercel.json','test-results','playwright-report']);
const media=new Set(['.jpg','.jpeg','.webp','.avif','.png','.mp4','.webm','.woff','.woff2','.glb','.gltf']);
function copy(source,target){
 mkdirSync(target,{recursive:true});
 for(const entry of readdirSync(source,{withFileTypes:true})){
  if(source===site&&(entry.name.startsWith('.')||excluded.has(entry.name)||/\.(log|pid)$/.test(entry.name)))continue;
  const from=resolve(source,entry.name),to=resolve(target,entry.name);
  if(entry.isDirectory())copy(from,to);
  else if(media.has(extname(entry.name)))linkSync(from,to);
  else copyFileSync(from,to);
 }
}
copy(site,output);
process.chdir(site);
await import('../concierge/publish.mjs');
console.log('Local verification output ready (media hard-linked; text copied).');
