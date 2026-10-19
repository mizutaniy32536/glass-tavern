import {z} from 'zod';
import {characterSchema} from './domain';
export const zetaHistorySchema=z.object({format:z.literal('zeta-glass-tavern'),version:z.literal(1),kind:z.literal('history'),roomId:z.string().min(1).max(200),title:z.string().max(100),exportedAt:z.string().datetime(),messages:z.array(z.object({id:z.string().min(1).max(200),role:z.enum(['user','assistant']),content:z.string().min(1).max(30000)})).max(2000),warnings:z.array(z.string().max(1000)).max(100)}).superRefine((v,c)=>{if(new Set(v.messages.map(m=>m.id)).size!==v.messages.length)c.addIssue({code:'custom',message:'会話のIDが重複しています'});if(new TextEncoder().encode(JSON.stringify(v)).length>1500000)c.addIssue({code:'custom',message:'会話は1.5MB以内にしてください'});});
export const zetaImportSchema=z.object({story:characterSchema,history:zetaHistorySchema.optional()});
const id=z.union([z.string().min(1).max(80),z.number().finite()]).transform(String);
const plotSchema=z.object({id,name:z.string().min(1).max(100),longDescription:z.string().max(30000).default(''),narrator:z.string().max(30000).optional().nullable(),characters:z.array(z.object({id,name:z.string().min(1).max(100),description:z.string().max(30000).default(''),imageUrl:z.string().max(10000).optional().nullable()})).min(1).max(12),intros:z.array(z.object({conversation:z.object({messages:z.array(z.object({type:z.string(),content:z.string().max(10000),senderType:z.string(),senderId:id.optional().nullable()})).max(100)})})).max(20).default([]),lorebooks:z.array(z.object({id,title:z.string().max(200),items:z.array(z.object({id,name:z.string().max(200),keywords:z.array(z.string().max(100)).max(30),content:z.string().max(6000),sequence:z.number().finite().default(0)})).max(100)})).max(20).default([])});
export function previewZeta(plot:unknown|undefined,history:unknown|undefined){
 const h=history===undefined?undefined:zetaHistorySchema.parse(history);if(h)h.messages=h.messages.map(m=>m.role==='assistant'?{...m,content:m.content.replace(/^@ナレーター[:：][ \t]*/gm,'@: ')}:m);const warnings=[...(h?.warnings||[])];
 if(plot===undefined&&!h)throw Error('作品JSONまたは会話JSONを選んでください');
 let story:any;
 if(plot!==undefined){const p=plotSchema.parse(plot);if(new Set(p.characters.map(c=>c.id)).size!==p.characters.length)throw Error('キャラクターIDが重複しています');
 const intro=(p.intros[0]?.conversation.messages||[]).filter(m=>{if(m.type!=='text'||m.senderType!=='BOT'){warnings.push('イントロのテキスト以外・ユーザー発言は除外しました');return false;}return true;}).map(m=>{const member=p.characters.find(c=>c.id===m.senderId);return '@'+(member?.name||'')+': '+m.content;}).join('\n');
 if(p.intros.length>1)warnings.push('イントロは公開設定の先頭1件を使用します');
 if(p.characters.some(c=>c.imageUrl))warnings.push('外部の画像URLは取得していません。画像は作品編集から追加できます');
 story={title:p.name,world:[p.longDescription,p.narrator?'語りの指示:\n'+p.narrator:''].filter(Boolean).join('\n\n'),intro,cast:p.characters.map(c=>({id:c.id,name:c.name,prompt:c.description,avatar:'',stats:[]})),lore:p.lorebooks.flatMap(b=>b.items.map(i=>({...i,id:b.id+':'+i.id,keywords:i.keywords.map(k=>k.trim()).filter(Boolean)}))),source:{zeta:{plotId:p.id,lorebooks:p.lorebooks.map(b=>({id:b.id,title:b.title})),selection:'published-root'}}};
 }else{warnings.push('他の作者の非公開設定は含まれません。世界観と人物設定を手入力してください');story={title:h!.title||'読み込んだ会話',world:'',intro:'',cast:Array.from(new Set(h!.messages.filter(m=>m.role==='assistant').flatMap(m=>Array.from(m.content.matchAll(/^@([^@:\n：*]+)[:：]/gm),x=>x[1].trim())).filter(Boolean))).slice(0,12).map((name,i)=>({id:'history-cast-'+i,name,prompt:'',avatar:'',stats:[]})),lore:[],source:{zeta:{historyOnly:true}}};}
 if(!plot&&h){const names=new Set(h.messages.filter(m=>m.role==='assistant').flatMap(m=>Array.from(m.content.matchAll(/^@([^@:\n：*]+)[:：]/gm),x=>x[1].trim())).filter(Boolean));if(names.size>12)warnings.push('履歴の人物が12人を超えるため、人物設定は先頭12人です。履歴本文は全員分残ります');}
 if(!story.cast.length)story.cast=[{id:crypto.randomUUID(),name:'キャラクター',prompt:'',avatar:'',stats:[]}];
 warnings.push('保存した履歴はすべて残ります。AIに送る会話は直近60件です。それ以前の履歴は送信前に自動整理します（選択したAIの料金が発生）。手入力メモは任意です');
 return {story:characterSchema.parse(story),history:h,warnings:[...new Set(warnings)]};
}
