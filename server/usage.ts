export type GenerationUsage={provider:string;model:string;costUsd:number|null;inputTokens:number|null;outputTokens:number|null};
const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function readUsage(provider:string,model:string,data:any):GenerationUsage{
 return {provider,model,costUsd:provider==='openrouter'?nonnegative(data?.usage?.cost):null,inputTokens:nonnegative(data?.usage?.prompt_tokens??data?.usage?.input_tokens??data?.usageMetadata?.promptTokenCount),outputTokens:nonnegative(data?.usage?.completion_tokens??data?.usage?.output_tokens??data?.usageMetadata?.candidatesTokenCount)};
}
export function usd(value:number|null){return value===null?'料金不明':value===0?'$0':value<0.000001?'$0.000001未満':'$'+value.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');}
