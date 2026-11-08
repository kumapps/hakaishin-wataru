import {ATTRIBUTES,type Attribute,type SealDebug} from './seals';

export type EatingAbility={chance:number;weights:Readonly<Partial<Record<Attribute,number>>>};
const NONE:EatingAbility={chance:0,weights:{}};
// Per-enemy data, independent from the player's knowledge and seal state.
const DEMO_EATERS:Record<string,Record<string,EatingAbility>>={
 water:{e:{chance:5,weights:{水:1}}},
 boss:{e:{chance:10,weights:{水:1}}},
 reaper:{e:{chance:15,weights:{火:1,水:1}}}
};
export function enemyEatingAbility(encounterId:string|undefined,actorId:string,debug:SealDebug):EatingAbility{
 if(encounterId){const ability=DEMO_EATERS[encounterId]?.[actorId]??NONE;return {...ability,chance:encounterId==='water'&&actorId==='e'?debug.chance:ability.chance,weights:{...ability.weights}};}
 return {chance:debug.mode==='none'?0:debug.chance,weights:debug.mode==='fire-water'?{火:1,水:1}:debug.mode==='water'?{水:1}:{}};
}
export function rollEating(ability:EatingAbility,random= Math.random){return Number.isFinite(ability.chance)&&ability.chance>0&&random()*100<ability.chance;}
export function drawEatingAttribute(ability:EatingAbility,random= Math.random):Attribute|undefined{
 const entries=ATTRIBUTES.map(attribute=>({attribute,weight:ability.weights[attribute]??0})).filter(e=>Number.isFinite(e.weight)&&e.weight>0);
 const total=entries.reduce((sum,e)=>sum+e.weight,0);if(!total)return undefined;
 let value=random()*total;for(const e of entries){value-=e.weight;if(value<0)return e.attribute;}return entries.at(-1)?.attribute;
}
