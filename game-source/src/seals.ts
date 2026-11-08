import type {Progress} from './state';
import questionData from './questions-data.json';
const INITIAL_REGISTERED=new Set(questionData.items.slice(0,150).map(i=>i.character));
export const ATTRIBUTES=['火','水','土','風','霊'] as const;
export type Attribute=typeof ATTRIBUTES[number];
export type PersonId='w'|'s';
export type PersonState={base:number;current:number;sealed:Attribute[]};
export type SealDebug={mode:'none'|'water'|'fire-water';chance:number};
export const SEAL_DEBUG_KEY='kanji-dungeon.seal-debug.v1';
export function defaultSealDebug():SealDebug{return {mode:'none',chance:5};}
export function loadSealDebug():SealDebug{try{const d=JSON.parse(localStorage.getItem(SEAL_DEBUG_KEY)??'null');return d&&['none','water','fire-water'].includes(d.mode)&&Number.isFinite(d.chance)&&d.chance>=0&&d.chance<=100?d:defaultSealDebug();}catch{return defaultSealDebug();}}
export function saveSealDebug(d:SealDebug){try{localStorage.setItem(SEAL_DEBUG_KEY,JSON.stringify(d));}catch{/* Session settings remain usable. */}}
export function ensureParty(state:Progress){state.party??={w:{base:150,current:150,sealed:[]},s:{base:150,current:150,sealed:[]}};return state.party;}
export function maximum(p:PersonState){return Math.max(1,Math.floor(p.base*(5-p.sealed.length)/5));}
export function eligible(state:Progress,_id:PersonId,attribute:Attribute){
 // Knowledge is shared by both characters; the seals themselves remain personal.
 if(attribute==='霊')return !!(state.spiritRegistered?.w||state.spiritRegistered?.s||state.journey?.spells.includes('reaper'));
 return state.journey?state.journey.registered.includes(attribute):INITIAL_REGISTERED.has(attribute);
}
export function seal(state:Progress,id:PersonId,attribute:Attribute){const p=ensureParty(state)[id],old=maximum(p);if(!eligible(state,id,attribute)||p.sealed.includes(attribute))return {success:false,old,max:old};p.sealed.push(attribute);const max=maximum(p);p.current=Math.min(p.current,max);return {success:true,old,max};}
export function release(state:Progress,id:PersonId,attribute:Attribute){const p=ensureParty(state)[id],old=maximum(p);if(!p.sealed.includes(attribute))return {success:false,old,max:old};p.sealed=p.sealed.filter(a=>a!==attribute);const max=maximum(p);p.current=Math.min(max,p.current+max-old);return {success:true,old,max};}
export function attributes(state:Progress,id:PersonId){return ATTRIBUTES.filter(a=>eligible(state,id,a));}
export function renderAttributes(parent:Element,state:Progress,id:PersonId){const p=ensureParty(state)[id],key=attributes(state,id).join('')+'/'+p.sealed.join('');if((parent as HTMLElement).dataset.attributeState===key)return;(parent as HTMLElement).dataset.attributeState=key;parent.replaceChildren();for(const a of attributes(state,id)){const span=document.createElement('span');span.className='attribute-symbol'+(p.sealed.includes(a)?' sealed':'');span.textContent=a;span.setAttribute('aria-label',a+(p.sealed.includes(a)?' 封印中':''));parent.append(span);}}

// Render sealed and unsealed maxima consistently across exploration and battle.
export function renderJiryoku(parent:Element,current:number,max:number,base:number,prefix=''){
 const reduced=max<base,key=[current,max,base,prefix].join('/');
 if((parent as HTMLElement).dataset.jiryoku===key)return;
 (parent as HTMLElement).dataset.jiryoku=key;parent.replaceChildren();
 parent.append(document.createTextNode(prefix+current+'/'));
 const effective=document.createElement('span');effective.className='effective-max'+(reduced?' reduced':'');effective.textContent=String(max);parent.append(effective);
 if(reduced){const original=document.createElement('small');original.className='original-max';original.textContent=' ◇'+base;original.setAttribute('aria-label','本来の最大字力 '+base);parent.append(original);}
}
