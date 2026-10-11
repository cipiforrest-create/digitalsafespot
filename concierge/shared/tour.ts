import type {PageId} from './catalogue';
// The guided tour visits service content only. It never parks on a film frame or scrubs a cinematic sequence:
// cinematic websites are one service stop that lists the experiences and invites the visitor to open them.
export const cinematicExperiences=['hotel','luksuzni satovi','nekretnine','stomatološka ordinacija','parfemi','patike','stomatologija','istraživanje dubina','automobili'] as const;
export const tourStops = [
 {id:'services',page:'services',title:'Usluge na jednom mjestu',focus:'Give a short overview of the main Digital X services visible here: cinematic websites, AI assistants, SEO / AEO / GEO, automation and advertising. Say that the next stops show the most important ones.'},
 {id:'launch',page:'launch',title:'Smart Website Launch',focus:'Present the featured Smart Website Launch offer: cinematic website up to five pages plus the AI lead assistant for the first three months. Use only catalogue prices and scope.'},
 {id:'cinematic',page:'cinematic',section:'examples',title:'Cinematic web stranice',focus:`Present cinematic websites as one service. Say there are ${cinematicExperiences.length} live cinematic experiences (for example ${cinematicExperiences.slice(0,5).join(', ')} and more) and invite the visitor to click any of them to walk through the experience themselves. Do not describe every example; the tour does not open them.`},
 {id:'concierge',page:'concierge',title:'AI Concierge i AI sistemi',focus:'Explain the AI assistant that answers, guides and prepares a summary 24/7, and the private knowledge systems. Phone, SMS, appointments and CRM need verified integration.'},
 {id:'visibility',page:'visibility',title:'SEO / AEO / GEO',focus:'Explain crawlable useful content, technical structure and search discoverability without guaranteeing rankings or AI mentions. Mention the free website analysis.'},
 {id:'automate',page:'automate',title:'Automatizacija',focus:'Explain connected workflows: enquiries, CRM, appointments, notifications and reports, and that scope is confirmed before work starts.'},
 {id:'growth',page:'growth',title:'Oglašavanje i rast',focus:'Explain targeted campaigns and measurement based on actual consented data.'},
 {id:'shop',page:'shop',title:'Shop — gotove ponude',focus:'Show the category choices and smaller services. Mention Smart Website Launch and maintenance; use only catalogue prices.'},
 {id:'blog',page:'blog',title:'Blog i vodiči',focus:'Explain that the guides answer practical questions (costs, SEO, automation, speed) so visitors can learn before they buy.'},
 {id:'contact',page:'contact',section:'strategy',title:'Vaš sljedeći korak',focus:'Wrap up with one natural question about what fits their business. Do not submit any form or claim anything was sent.'},
] as const satisfies readonly {id:string;page:PageId;section?:string;title:string;focus:string}[];
export type TourStopId=typeof tourStops[number]['id'];
export const tourStopIds=tourStops.map(s=>s.id) as [TourStopId,...TourStopId[]];
