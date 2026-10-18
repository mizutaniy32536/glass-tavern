import {it,expect} from 'vitest';
import {parseGeneratedReply,responseFormatInstruction,applyStats,importCard} from '../server/domain';
const id='b398fba9-21d5-4e36-ba80-3d6263be48a4';
const character={...importCard({name:'test'}),id:'c',stats:[{id,name:'好感度',min:0,max:100,initial:25,instructions:'会話に応じる'}]};
it('recovers text from the malformed live reply but never invents or applies its stats',()=>{const reply='```json\n{"text":"こんにちは。","stats":{"id":"'+id+'":26}}\n```';const parsed=parseGeneratedReply(reply);expect(parsed).toEqual({text:'こんにちは。'});expect(applyStats(character,{[id]:25},parsed.stats)).toEqual({[id]:25});});
it('updates valid real-ID stats and leaves prose free of JSON wrappers',()=>{const parsed=parseGeneratedReply(JSON.stringify({text:'こんにちは。',stats:{[id]:26}}));expect(parsed.text).toBe('こんにちは。');expect(applyStats(character,{[id]:25},parsed.stats)).toEqual({[id]:26});});
it('provides a syntactically valid example containing actual stat IDs',()=>{const instruction=responseFormatInstruction(character,{[id]:25});const sample=instruction.split('例: ')[1].split('\n')[0];expect(JSON.parse(sample)).toEqual({text:'返答の本文',stats:{[id]:25}});expect(instruction).not.toContain('数値}');});
it('recovers complete escaped text only and rejects broken text',()=>{expect(parseGeneratedReply('{"text":"a\\n\\\"b\\\"","stats":broken}')).toEqual({text:'a\n"b"'});expect(()=>parseGeneratedReply('{"text":"unfinished')).toThrow('返答形式');expect(()=>parseGeneratedReply('{"stats":{}}')).toThrow('本文');expect(parseGeneratedReply('こんにちは。')).toEqual({text:'こんにちは。'});});
