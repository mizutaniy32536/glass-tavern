import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import type {Chat} from '../server/domain';

const PAGE_SIZE=30;
/** Mount one history per chat, after the page transition has actually mounted it. */
export function MessageHistory({messages,renderMessage,children}:{messages:Chat['messages'];renderMessage:(message:Chat['messages'][number],index:number)=>ReactNode;children:ReactNode}){
 const viewport=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
 const [start,setStart]=useState(()=>Math.max(0,messages.length-PAGE_SIZE));
 const pinned=useRef(true),initialized=useRef(false),prepend=useRef<{height:number;top:number}|null>(null);
 const [atBottom,setAtBottom]=useState(true);
 const loadEarlier=()=>{const el=viewport.current;if(!el||!start||prepend.current)return;prepend.current={height:el.scrollHeight,top:el.scrollTop};setStart(value=>Math.max(0,value-PAGE_SIZE));};
 useLayoutEffect(()=>{
  const el=viewport.current;if(!el)return;
  if(prepend.current){const before=prepend.current;el.scrollTop=before.top+el.scrollHeight-before.height;prepend.current=null;}
  else if(pinned.current)el.scrollTop=el.scrollHeight;
  initialized.current=true;
 },[start,messages,children]);
 useLayoutEffect(()=>{
  const el=viewport.current,body=content.current;if(!el||!body)return;
  const observer=new ResizeObserver(()=>{if(pinned.current&&!prepend.current)el.scrollTop=el.scrollHeight;});
  observer.observe(el);observer.observe(body);return()=>observer.disconnect();
 },[]);
 return <div className="history-shell"><div className="messages" ref={viewport} aria-label="会話履歴" tabIndex={0} onScroll={()=>{
  const el=viewport.current;if(!el||!initialized.current||prepend.current)return;
  pinned.current=el.scrollHeight-el.clientHeight-el.scrollTop<48;setAtBottom(pinned.current);
  if(el.scrollTop<80&&!pinned.current)loadEarlier();
 }}><div ref={content}>
 {start>0&&<button className="text-button history-earlier" onClick={loadEarlier}>以前の会話を読み込む（残り{start}件）</button>}
 {messages.slice(start).map((message,index)=>renderMessage(message,start+index))}{children}
 </div></div>{!atBottom&&<button className="button history-latest" onClick={()=>{const el=viewport.current;if(el){pinned.current=true;el.scrollTop=el.scrollHeight;setAtBottom(true);}}}>最新へ ↓</button>}</div>;
}
