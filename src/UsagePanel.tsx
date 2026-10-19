import React,{useEffect,useState} from 'react';
import {usd,type GenerationUsage} from '../server/usage';
type Entry={id:string;stage:string;status:string;created:number;usage:GenerationUsage};
type Ledger={entries:Entry[];total:{requests:number;knownUsd:number;unknown:number|null}};
export function UsagePanel({chatId,busy,revision}:{chatId:string;busy:boolean;revision:string}){
 const [ledger,setLedger]=useState<Ledger|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const abort=new AbortController();setError(false);fetch('/api/chats/'+chatId+'/usage',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Ledger>}).then(setLedger).catch(()=>{if(!abort.signal.aborted)setError(true)});return()=>abort.abort();},[chatId,busy,revision]);
 const entries=ledger?.entries||[],known=entries.reduce((n,e)=>n+(e.usage.costUsd??0),0),unknown=entries.filter(e=>e.usage.costUsd===null).length;
 return <details className="usage-panel glass"><summary>{busy?'生成中 · 料金は応答後に更新':error?'料金を取得できません':!ledger?'料金を確認中…':entries.length?'直近の送信 '+(unknown?`判明分 ${usd(known)}＋不明${unknown}件`:usd(known)):'生成料金 · まだ記録がありません'}</summary><div>
 <p>米ドル（USD）。要約と会話のAPI返答に含まれる利用額を記録します。</p>
 {entries.map(e=><p key={e.id}><strong>{e.stage==='memory'?'要約':'会話'} {usd(e.usage.costUsd)}</strong> · {e.usage.model}{e.status==='failed'?' · 処理失敗':e.status==='cancelled'?' · 停止':e.status==='pending'?' · 処理中':''}<br/>入力 {e.usage.inputTokens??'不明'} / 出力 {e.usage.outputTokens??'不明'} トークン</p>)}
 {!!ledger?.total.requests&&<p>この会話の記録済み合計：{usd(ledger.total.knownUsd)}{ledger.total.unknown?` ＋料金不明 ${ledger.total.unknown}件`:''}</p>}
 <p>表示開始前の生成は含みません。タイムアウト・停止時は課金されても料金が届かない場合があります。不明は無料という意味ではありません。料金記録はバックアップ復元には含まれません。</p>
 <a href="https://openrouter.ai/activity" target="_blank" rel="noreferrer">OpenRouterの利用履歴を確認</a>
 </div></details>;
}
