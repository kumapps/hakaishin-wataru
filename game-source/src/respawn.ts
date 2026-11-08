import type {Progress} from './state';

// Logical zones are independent of display names. Weighted links describe
// revival distance, so opening a shortcut does not collapse the main route.
export type RespawnMap={areas:Record<string,string>;links:readonly (readonly [string,string,number])[];enemies:Record<string,{zone:string;respawns:boolean}>;distance:number};
export const SHRINE_RESPAWNS:RespawnMap={
 areas:{'入口':'entrance','根の広間':'root','火薬庫':'powder','風の回廊':'wind','水路の間':'water','水路の帰り道':'water','封印の間':'seal','遺跡の裏通路':'seal','隠し書庫':'seal','ボス祭壇':'altar'},
 links:[['entrance','root',1],['root','powder',1],['powder','wind',1],['wind','water',1],['water','seal',1],['seal','altar',1],['root','water',3]],
 enemies:{entrance:{zone:'entrance',respawns:true},root:{zone:'root',respawns:true},powder:{zone:'powder',respawns:true},wind:{zone:'wind',respawns:true},water:{zone:'water',respawns:true},boss:{zone:'altar',respawns:false},reaper:{zone:'seal',respawns:false}},
 distance:2
};
export function zoneDistance(map:RespawnMap,from:string,to:string){
 const distances=new Map([[from,0]]),pending=new Set(map.links.flatMap(([a,b])=>[a,b]));
 while(pending.size){const current=[...pending].sort((a,b)=>(distances.get(a)??Infinity)-(distances.get(b)??Infinity))[0],distance=distances.get(current)??Infinity;if(!Number.isFinite(distance))break;if(current===to)return distance;pending.delete(current);
  for(const [a,b,cost]of map.links){const next=a===current?b:b===current?a:null;if(next&&cost>0&&distance+cost<(distances.get(next)??Infinity))distances.set(next,distance+cost);}
 }
 return from===to?0:Infinity;
}
// Permanent victories keep gates and acquired events intact after revival.
export function preserveVictories(s:Progress){const j=s.journey;if(!j)return;const cleared=new Set(j.cleared??[]);for(const id of j.defeated)cleared.add(id);if(j.entranceOpened||j.entranceRespawned)cleared.add('entrance');j.cleared=[...cleared];}
export function hasCleared(s:Progress,id:string){return !!(s.journey?.cleared?.includes(id)||s.journey?.defeated.includes(id));}
export function advanceRespawns(s:Progress,fromArea:string,toArea:string,map=SHRINE_RESPAWNS){
 const from=map.areas[fromArea],to=map.areas[toArea],j=s.journey;
 if(!j||!from||!to||from===to)return [];
 preserveVictories(s);
 const revived=j.defeated.filter(id=>{const enemy=map.enemies[id];if(!enemy?.respawns)return false;const distance=zoneDistance(map,enemy.zone,to);return Number.isFinite(distance)&&distance>=map.distance;});
 j.defeated=j.defeated.filter(id=>!revived.includes(id));return revived;
}
