const enc=new TextEncoder();
export function base64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes));}
export function unbase64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
export async function key(secret:string){const bytes=unbase64(secret);if(bytes.length!==32)throw Error('Encryption secret must be 32 bytes');return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);}
export async function encrypt(value:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(secret),enc.encode(value));return base64(iv)+'.'+base64(new Uint8Array(data));}
export async function decrypt(value:string,secret:string){const [iv,data]=value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(iv)},await key(secret),unbase64(data)));}
export async function hash(value:string){return base64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
