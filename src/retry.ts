export type SendAttempt={chatId:string;requestId:string;draftVersion:number;content:string;provider:string;regenerate:boolean};
export function sameSubmission(a:SendAttempt,b:Omit<SendAttempt,'requestId'|'draftVersion'>){return a.chatId===b.chatId&&a.content===b.content&&a.provider===b.provider&&a.regenerate===b.regenerate;}
export function chooseAttempt(previous:SendAttempt|null,input:Omit<SendAttempt,'requestId'>):SendAttempt{return previous&&sameSubmission(previous,input)?previous:{...input,requestId:crypto.randomUUID()};}
export function isUnconfirmed(error:unknown){return error instanceof TypeError||error instanceof SyntaxError||(error as {code?:string})?.code==='generation_pending';}
export async function retryNetworkOnce<T>(send:()=>Promise<T>,stillActive:()=>boolean=()=>true):Promise<T>{try{return await send();}catch(error){if(!(error instanceof TypeError||error instanceof SyntaxError)||!stillActive())throw error;return send();}}
