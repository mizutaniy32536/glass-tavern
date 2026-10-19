import {it,expect,vi,afterEach} from 'vitest';
import {readUsage,usd,costWithYen} from '../server/usage';
import {generate} from '../server/providers';
afterEach(()=>vi.unstubAllGlobals());
it('uses the billed cost including zero, never upstream estimates or null as zero',()=>{
 expect(readUsage('openrouter','m',{usage:{cost:0,cost_details:{upstream_inference_cost:8}}}).costUsd).toBe(0);
 for(const cost of [null,undefined,'0.2',-1,NaN,Infinity])expect(readUsage('openrouter','m',{usage:{cost}}).costUsd).toBeNull();
 expect(readUsage('openai','m',{usage:{cost:0.1}}).costUsd).toBeNull();
 expect(readUsage('openrouter','m',{usage:{cost:0.0012116,prompt_tokens:3604,completion_tokens:1227}})).toMatchObject({costUsd:0.0012116,inputTokens:3604,outputTokens:1227});
});
it('does not display a small positive charge as free',()=>{expect(usd(null)).toBe('料金不明');expect(usd(0)).toBe('$0');expect(usd(0.0000001)).toBe('$0.000001未満');expect(usd(0.0012116)).toBe('$0.001212');});
it('records costs even when a summary response is truncated and rejected',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({usage:{cost:0.003},choices:[{finish_reason:'length',message:{content:'partial'}}]}))));const usage=vi.fn();await expect(generate('openrouter','model','test',[{role:'user',content:'test'}],true,usage)).rejects.toThrow('途中');expect(usage).toHaveBeenCalledWith(expect.objectContaining({costUsd:0.003}));});

it('shows approximate yen without treating unknown or tiny charges as free',()=>{
 expect(costWithYen(null)).toBe('料金不明');
 expect(costWithYen(0)).toBe('$0（約0円）');
 expect(costWithYen(0.0042116)).toBe('$0.004212（約0.67円）');
 expect(costWithYen(0.000001)).toBe('$0.000001（約0.01円未満）');
 expect(costWithYen(10)).toBe('$10（約1,580.00円）');
});
