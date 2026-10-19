export type GenerationUsage={provider:string;model:string;costUsd:number|null;inputTokens:number|null;outputTokens:number|null};
const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function readUsage(provider:string,model:string,data:any):GenerationUsage{
 return {provider,model,costUsd:provider==='openrouter'?nonnegative(data?.usage?.cost):null,inputTokens:nonnegative(data?.usage?.prompt_tokens??data?.usage?.input_tokens??data?.usageMetadata?.promptTokenCount),outputTokens:nonnegative(data?.usage?.completion_tokens??data?.usage?.output_tokens??data?.usageMetadata?.candidatesTokenCount)};
}
export function usd(value:number|null){return value===null?'料金不明':value===0?'$0':value<0.000001?'$0.000001未満':'$'+value.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');}

// Rounded reference rate; this is not a live quote or a card settlement rate.
export const JPY_REFERENCE_RATE=158;
export const JPY_REFERENCE_DATE='2026-10-19';
export function costWithYen(value:number|null){
 if(value===null)return usd(null);
 const yen=value*JPY_REFERENCE_RATE;
 const estimate=yen===0?'0円':yen<0.01?'0.01円未満':yen.toLocaleString('ja-JP',{minimumFractionDigits:2,maximumFractionDigits:2})+'円';
 return `${usd(value)}（約${estimate}）`;
}
