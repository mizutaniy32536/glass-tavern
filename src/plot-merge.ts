import {normalizeStory,type Character} from '../server/domain';
import type {StoryDraft} from './StoryEditor';
const key=(s:string)=>s.trim().normalize('NFKC').toLocaleLowerCase();
export function mergePlotSettings(current:StoryDraft,plot:Omit<Character,'id'>):StoryDraft {
 const cast=current.cast.map(m=>({...m}));
 for(const incoming of plot.cast){const matches=cast.filter(m=>key(m.name)===key(incoming.name));if(matches.length>1)throw Error('同名の人物が複数いるため追加できません');const existing=matches[0];if(existing){existing.prompt=incoming.prompt.trim()?incoming.prompt:existing.prompt;existing.avatar=existing.avatar||incoming.avatar;}else cast.push({...incoming,id:cast.some(m=>m.id===incoming.id)?crypto.randomUUID():incoming.id});}
 const lore=[...(current.lore||[])];for(const incoming of plot.lore||[]){const i=lore.findIndex(l=>l.id===incoming.id);if(i<0)lore.push(incoming);else lore[i]=incoming;}
 const source={...current.source,zeta:{...(current.source?.zeta as object||{}),...(plot.source?.zeta as object||{})}};
 return {...normalizeStory({...current,world:plot.world.trim()?plot.world:current.world,intro:plot.intro.trim()?plot.intro:current.intro,cover:current.cover||plot.cover,cast,lore,source}),id:current.id};
}
