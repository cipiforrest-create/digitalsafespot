// Only authored interface copy is translated; visitor/model text is never rewritten.
export function pageLanguage():'bs'|'en'|'de'{
 const lang=document.documentElement.lang;
 return lang==='en'||lang==='de'?lang:'bs';
}
export function ui(bs:string,en:string,de:string):string{
 const lang=pageLanguage();return lang==='en'?en:lang==='de'?de:bs;
}
