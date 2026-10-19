import {describe,it,expect} from 'vitest';
import {normalizeStory} from '../server/domain';
import {mergePlotSettings} from '../src/plot-merge';
const image='data:image/png;base64,iVBORw0KGgo=';
const existing=()=>({...normalizeStory({title:'既存作品',world:'旧世界',intro:'元の出だし',cover:image,cast:[{id:'old',name:'アキ',prompt:'旧設定',avatar:image,stats:[{id:'love',name:'好感度',min:0,max:100,initial:30,instructions:''}]},{id:'extra',name:'追加人物',prompt:'維持'}],lore:[{id:'manual',name:'手動',keywords:[],content:'維持'}],playerName:'ユミ',continuationMemo:'約束を維持',source:{other:'keep',zeta:{roomId:'keep'}}}),id:'story-id'});
const incoming=()=>normalizeStory({title:'ZIP題名',world:'新世界',intro:'新イントロ',cast:[{id:'zeta-id',name:'アキ',prompt:'新設定'},{id:'extra',name:'レン',prompt:'新人物'}],lore:[{id:'book:item',name:'設定集',keywords:['鍵'],content:'新設定'}],source:{zeta:{plotId:'plot'}}});
describe('existing story plot merge',()=>{
 it('updates settings while preserving identity, portraits, personal notes and stats',()=>{const old=existing(),before=structuredClone(old),m=mergePlotSettings(old,incoming());expect(old).toEqual(before);expect(m.id).toBe(old.id);expect(m.title).toBe(old.title);expect(m.cover).toBe(image);expect(m.playerName).toBe(old.playerName);expect(m.continuationMemo).toBe(old.continuationMemo);expect(m.cast[0]).toEqual({...old.cast[0],prompt:'新設定'});expect(m.cast[1]).toEqual(old.cast[1]);expect(m.world).toBe('新世界');expect(m.intro).toBe('新イントロ');expect(m.source).toMatchObject({other:'keep',zeta:{roomId:'keep',plotId:'plot'}});expect(new Set(m.cast.map(c=>c.id)).size).toBe(3);});
 it('reimport does not duplicate cast or lore',()=>{const first=mergePlotSettings(existing(),incoming());expect(mergePlotSettings(first,incoming())).toEqual(first);});
 it('blank values do not erase settings',()=>{const p=incoming();p.world='';p.intro='';p.cast[0].prompt='';const m=mergePlotSettings(existing(),p);expect(m.world).toBe('旧世界');expect(m.intro).toBe('元の出だし');expect(m.cast[0].prompt).toBe('旧設定');});
 it('rejects overflow atomically',()=>{const old=existing();old.cast=Array.from({length:12},(_,i)=>({...old.cast[1],id:String(i),name:'人物'+i}));expect(()=>mergePlotSettings(old,incoming())).toThrow();expect(old.cast).toHaveLength(12);});
});
