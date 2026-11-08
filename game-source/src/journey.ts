import {hasCleared} from './respawn';
import questionData from './questions-data.json';
import {ensureParty,maximum} from './seals';
import type {Progress} from './state';
import {tiles,clear,type Point} from './map';
export const GROUPS={entrance:['球','打','身','指','持'],root:['重','銀','柱','根','葉'],powder:['薬','炭','油','温','陽'],wind:['速','軽','進','追','息'],water:['氷','流','波','深','洋'],spirit:['死','神','悪','暗','守']};
export function journey(s:Progress){return s.journey??={registered:questionData.items.slice(0,150).map(i=>i.character),acquired:[],defeated:[],practiceSeen:[],secrets:[],spells:[],powderGuideDone:false,completed:false};}
export function acquire(s:Progress,key:keyof typeof GROUPS){const j=journey(s);if(j.acquired.includes(key))return false;const chars=GROUPS[key].filter(c=>!j.registered.includes(c));j.acquired.push(key);j.registered.push(...chars);s.learning??={};for(const c of chars)s.learning[c]={mastery:1,streak:0,total:0,correct:0,recent:[]};for(const p of Object.values(ensureParty(s))){p.base+=chars.length;p.current=Math.min(maximum(p),p.current+chars.length);}return true;}
export function syncGates(s:Progress){const j=journey(s);for(let x=9;x<=13;x++)tiles[42][x]=(j.entranceOpened||hasCleared(s,'entrance'))?0:5;for(let x=15;x<=19;x++)tiles[21][x]=j.acquired.includes('root')?0:5;for(let x=25;x<=26;x++)tiles[40][x]=j.shortcutOpened?0:5;for(let x=3;x<=24;x++)tiles[6][x]=j.rocksCleared?0:6;for(let y=3;y<=5;y++)tiles[y][26]=hasCleared(s,'powder')&&j.rocksCleared?0:5;for(let y=7;y<=10;y++)tiles[y][53]=j.acquired.includes('wind')?0:5;for(let x=56;x<=58;x++)tiles[23][x]=j.waterGateOpened?0:5;tiles[20][57]=j.waterGateOpened?0:4;for(let y=7;y<=10;y++){tiles[y][79]=hasCleared(s,'water')?0:5;tiles[y][104]=j.acquired.includes('spirit')&&s.read.includes('guardian-record')?0:5;}for(let y=24;y<=26;y++)for(let x=91;x<=94;x++)tiles[y][x]=j.libraryShortcutOpened?0:6;}
export type MapEnemy={id:'entrance'|'root'|'powder'|'wind'|'water'|'boss'|'reaper';kind:'stone'|'root'|'wind'|'water'|'boss'|'reaper';center:Point;positions:Point[];count:1|2|3;enabled:boolean};
export function mapEnemies(s:Progress):MapEnemy[]{const j=journey(s);return [
 {id:'entrance',kind:'stone',center:{x:11.5,y:47.5},positions:[{x:11.5,y:47.5}],count:1,enabled:j.acquired.includes('entrance')&&!j.defeated.includes('entrance')},
 {id:'root',kind:'root',center:{x:19.5,y:34.5},positions:[{x:19.5,y:34.5}],count:1,enabled:!j.defeated.includes('root')},
 {id:'powder',kind:'root',center:{x:16.5,y:8.5},positions:[{x:14.7,y:8.5},{x:18.3,y:8.5}],count:2,enabled:j.spells.includes('gunpowder')&&!j.defeated.includes('powder')},
 {id:'wind',kind:'wind',center:{x:44.5,y:16.5},positions:[{x:44.5,y:16.5},{x:41.3,y:16.5},{x:47.7,y:16.5}],count:3,enabled:!j.defeated.includes('wind')},
 {id:'water',kind:'water',center:{x:70.5,y:14.5},positions:[{x:68.7,y:14.5},{x:72.3,y:14.5}],count:2,enabled:j.acquired.includes('water')&&!j.defeated.includes('water')},
 {id:'boss',kind:'boss',center:{x:116.5,y:11.5},positions:[{x:116.5,y:11.5}],count:1,enabled:j.acquired.includes('spirit')&&!j.defeated.includes('boss')},
 {id:'reaper',kind:'reaper',center:{x:94.5,y:37.5},positions:[{x:94.5,y:37.5}],count:1,enabled:j.acquired.includes('spirit')&&!j.defeated.includes('reaper')}
];}
