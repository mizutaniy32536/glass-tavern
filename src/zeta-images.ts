import {validAvatar} from '../server/domain';
import {readAvatar} from './import';
export type ZetaImage={name:string;avatar:string};
export function zetaImageURL(value:unknown):string|undefined{try{const u=new URL(String(value));return u.protocol==='https:'&&u.hostname==='image.zeta-ai.io'&&!u.port&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
/** Public image CDN only, no cookies and no redirects. Save pixels, never a hotlink. */
export async function loadZetaImage(value:unknown,assets?:Map<string,Uint8Array>){
 if(typeof value!=='string'||!value)return '';
 if(validAvatar(value))return readAvatar(new File([Uint8Array.from(atob(value.split(',')[1]),c=>c.charCodeAt(0))],'image',{type:value.slice(5,value.indexOf(';'))}));
 const url=zetaImageURL(value);if(!url)return '';
 const bytes=assets?.get(url);let blob:Blob;
 if(bytes)blob=new Blob([bytes as BlobPart]);else{const r=await fetch(url,{credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('画像の取得に失敗しました');const reader=r.body!.getReader();const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>10*1024*1024){await reader.cancel();throw Error('画像が10MBを超えています');}chunks.push(part.value);}blob=new Blob(chunks as BlobPart[],{type:r.headers.get('content-type')||''});}
 return readAvatar(new File([blob],'zeta-image',{type:blob.type||'image/png'}));
}
export async function hydrateZetaImages(raw:any,assets?:Map<string,Uint8Array>){
 const result={...raw};const warnings:string[]=[];
 const load=async(value:unknown,label:string)=>{try{return await loadZetaImage(value,assets);}catch{warnings.push(label+'の画像を取得できませんでした。画像は手動で追加できます');return '';}};
 if(raw?.kind==='history'){
 result.images=[];
 for(const c of (Array.isArray(raw.images)?raw.images:[]).slice(0,12)){if(typeof c.name==='string'){const avatar=await load(c.avatar||c.imageUrl,c.name);if(avatar)result.images.push({name:c.name,avatar});}}
 }else if(Array.isArray(raw?.characters)){
 result.characters=[];for(const c of raw.characters.slice(0,12))result.characters.push({...c,avatar:await load(c.avatar||c.imageUrl,c.name)});
 }
 result.cover=await load(raw.cover||raw.imageUrl,'作品');
 result.imageWarnings=warnings;
 return result;
}
