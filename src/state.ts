import type {Chat} from '../server/domain';
export function selectAvailableProvider(current:string,providers:{id:string;configured:boolean|number;hidden:boolean|number}[],dev:boolean){const visible=providers.filter(p=>p.configured&&!p.hidden);return (current==='mock'&&dev)||visible.some(p=>p.id===current)?current:visible[0]?.id||'';}
export function applyGenerationToActive(active:Chat|null,result:Chat){return active?.id===result.id?result:active;}
export function canClearDraft(activeId:string|undefined,requestChatId:string,currentVersion:number,requestVersion:number){return activeId===requestChatId&&currentVersion===requestVersion;}
