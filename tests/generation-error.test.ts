import {it,expect} from 'vitest';
import {generationFailure} from '../server/generation-error';
import {decodeApiResponse,isUnconfirmed,chooseAttempt} from '../src/retry';
it.each(['memory','reply'] as const)('preserves %s failure and allows a new attempt without replaying a failed ID',async stage=>{
 const failure=generationFailure(Error('自動メモの返答が不完全です'),stage);
 let caught:unknown;
 try{await decodeApiResponse(new Response(JSON.stringify(failure),{status:502}));}catch(e){caught=e;}
 expect(isUnconfirmed(caught)).toBe(false);
 expect((caught as Error).message).toContain('自動メモの返答が不完全です');
 expect((caught as Error).message).toContain(stage==='memory'?'整理で停止':'会話の生成で停止');
 const input={chatId:'chat',draftVersion:0,content:'draft',provider:'openrouter',regenerate:false};
 const old=chooseAttempt(null,input);
 expect(chooseAttempt(isUnconfirmed(caught)?old:null,input).requestId).not.toBe(old.requestId);
});
