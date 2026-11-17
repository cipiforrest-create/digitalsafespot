// Page paths for client-side navigation. The full catalogue (page copy, FAQs) is not needed in the browser bundle, so
// concierge/build.mjs writes the id -> production path map to shared/page-routes.json and this module reads only that.
// Same matching rules as pageFromPath/previewPath in shared/catalogue.ts (a unit test keeps the two in step).
import routes from '../shared/page-routes.json';
import type {PageId} from '../shared/catalogue';
const paths=routes as Record<PageId,string>;
const ids=Object.keys(paths) as PageId[];
export type {PageId};
export const previewPath=(id:PageId):string=>id==='home'?'/':paths[id];
export function pageFromPath(path:string):PageId|undefined {const clean=path.replace(/^\/(?:en|de)(?=\/|$)/,'').replace(/\/index\.html$/,'/').replace(/\/$/,'');if(clean==='')return 'home';return ids.find(id=>previewPath(id).replace(/\/$/,'')===clean)||ids.find(id=>`/ai-concierge-preview/${id}`===clean);}
