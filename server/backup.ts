import {systemPromptSchema} from './system-prompt';
import {z} from 'zod';
import {normalizeStoredStory,validAvatar} from './domain';
import {summarySchema,validMemory} from './memory';
export const BACKUP_LIMIT=20*1024*1024;
const id=z.string().min(1).max(200);
const record=z.record(z.unknown());
const stats=z.record(z.number().finite());
const message=z.object({id,role:z.enum(['user','assistant']),content:z.string().max(30000),statsBefore:stats.optional(),source:record.optional()}).strict();
const chat=z.object({id,characterId:id,messages:z.array(message).max(20000),stats,metadata:record.optional(),memoryNotes:z.string().max(10000).optional(),memory:z.object({version:z.literal(1),count:z.number().int().nonnegative(),digest:z.string(),summary:summarySchema}).strict().optional()}).strict();
export const backupSchema=z.object({format:z.literal('glass-tavern-backup'),version:z.literal(1),exportedAt:z.string().datetime(),characters:z.array(z.object({id,data:z.unknown()}).strict()).max(500),chats:z.array(chat).max(500),settings:z.object({systemPrompt:systemPromptSchema.optional(),providers:z.array(z.object({id:z.enum(['openrouter','gemini','openai','anthropic']),model:z.string().min(1).max(160).regex(/^[a-zA-Z0-9._:/-]+$/),hidden:z.boolean()}).strict()).max(4),theme:z.enum(['light','dark']).optional(),selectedProvider:z.string().max(30).optional()}).strict()}).strict();
export type Backup=z.infer<typeof backupSchema>;
export function parseBackup(raw:unknown):Backup {
 if(new TextEncoder().encode(JSON.stringify(raw)).length>BACKUP_LIMIT)throw Error('バックアップは20MB以内にしてください');
 const b=backupSchema.parse(raw);
 for(const list of [b.characters,b.chats,b.settings.providers])if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('IDが重複しています');
 const ids=new Set(b.characters.map(c=>c.id));
 for(const c of b.characters){const story=normalizeStoredStory(c.data);if(story.cast.some(m=>!validAvatar(m.avatar)))throw Error('画像形式が不正です');if(new TextEncoder().encode(JSON.stringify(c.data)).length>1000000)throw Error('作品情報は1MB以内にしてください');}
 for(const c of b.chats){if(!ids.has(c.characterId))throw Error('会話に対応する作品がありません');if(new Set(c.messages.map(m=>m.id)).size!==c.messages.length)throw Error('発言IDが重複しています');if(new TextEncoder().encode(JSON.stringify(c)).length>1500000)throw Error('会話は1.5MB以内にしてください');}
 return b;
}
export async function checkBackupMemory(b:Backup){for(const c of b.chats)if(c.memory&&!await validMemory(c))throw Error('自動メモと会話が一致しません。元のバックアップを選んでください');}
