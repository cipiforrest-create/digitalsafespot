import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const file='.env.concierge.local';
if(existsSync(file)){console.log('Existing local configuration preserved.');}else{writeFileSync(file,`GEMINI_API_KEY=\nCONCIERGE_SESSION_SECRET=${randomBytes(48).toString('hex')}\nDX_GEMINI_MODEL=gemini-2.5-flash\nDX_CONCIERGE_LIVE_MODEL=gemini-3.1-flash-live-preview\nN8N_WEBHOOK_URL=\n`,{mode:0o600});console.log('Local configuration created with a fresh session secret. Add your own server-side AI credential.');}
