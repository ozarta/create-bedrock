/** Malformed progress is disposable. No item claim or output may be recovered from it. */
export function decodeProgress(raw:unknown):unknown {
 if(typeof raw!=='string')return raw;
 try{return JSON.parse(raw);}catch{return {corrupt:true};}
}
