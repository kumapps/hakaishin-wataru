import {clear,lineClear,type Point} from './map';
import {pathTo} from './pathfinding';
import type {MapEnemy} from './journey';
import type {Progress} from './state';
export type EnemySettings={detection:number;viewAngle:number;speed:number;rangeScale:number;grace:number};
export const defaultEnemySettings=():EnemySettings=>({detection:3.2,viewAngle:360,speed:2.2,rangeScale:1,grace:1});
export function enemySettings(s:Progress):EnemySettings{const d=defaultEnemySettings(),v=s.enemyExploration;return {detection:limit(v?.detection,d.detection,1,8),viewAngle:limit(v?.viewAngle,d.viewAngle,90,360),speed:limit(v?.speed,d.speed,.5,3),rangeScale:limit(v?.rangeScale,d.rangeScale,.5,1.5),grace:limit(v?.grace,d.grace,0,3)};}
function limit(v:number|undefined,fallback:number,min:number,max:number){return v!==undefined&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;}
type Rect={left:number;right:number;top:number;bottom:number};
export type EnemyRule={movement:'fixed'|'chase';trigger:'contact'|'sight'|'area';area?:Rect;range?:number;triggerArea?:Rect};
export const SHRINE_ENEMIES:Record<string,EnemyRule>={
 root:{movement:'chase',trigger:'contact',area:{left:5.3,right:24.7,top:24.3,bottom:39.7},range:8},
 water:{movement:'chase',trigger:'contact',area:{left:55.3,right:77.7,top:2.3,bottom:22.7},range:12}
};
type Member={position:Point;home:Point;face:Point;path:Point[];repath:number;goal:Point|null;moving:boolean};
type Group={status:'idle'|'chase'|'return';notice:number;members:Member[]};
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const inside=(p:Point,r?:Rect,margin=0)=>!!r&&p.x>=r.left+margin&&p.x<=r.right-margin&&p.y>=r.top+margin&&p.y<=r.bottom-margin;
export class EnemyField{
 groups=new Map<string,Group>();grace=0;
 constructor(public rules:Record<string,EnemyRule>=SHRINE_ENEMIES){}
 reset(){this.groups.clear();this.grace=0;}
 resetGroup(id:string){this.groups.delete(id);}
 group(e:MapEnemy){let g=this.groups.get(e.id);if(!g){g={status:'idle',notice:0,members:e.positions.map(p=>({position:{...p},home:{...p},face:{x:0,y:1},path:[],repath:0,goal:null,moving:false}))};this.groups.set(e.id,g);}return g;}
 positions(e:MapEnemy){return this.rules[e.id]?.movement==='chase'?this.group(e).members.map(m=>m.position):e.positions;}
 moving(id:string,index:number){return !!this.groups.get(id)?.members[index]?.moving;}
 notice(id:string){return this.groups.get(id)?.notice??0;}
 beginGrace(s:Progress){this.grace=enemySettings(s).grace;}
 tick(s:Progress,enemies:MapEnemy[],dt:number){
  this.grace=Math.max(0,this.grace-dt);const settings=enemySettings(s);
  for(const e of enemies){const rule=this.rules[e.id];if(rule?.movement!=='chase')continue;if(!e.enabled){this.groups.delete(e.id);continue;}
   const g=this.group(e);g.notice=Math.max(0,g.notice-dt);g.members.forEach(m=>m.moving=false);
   const range=(rule.range??4)*settings.rangeScale,within=(p:Point,margin=0)=>inside(p,rule.area,margin)&&distance(p,e.center)<=range-margin;
   if(g.status==='idle'&&within(s.position,.3)&&g.members.some(m=>this.sees(m,s.position,settings))){g.status='chase';g.notice=.7;g.members.forEach(m=>m.repath=0);}
   if(g.status==='chase'&&!within(s.position)){g.status='return';g.members.forEach(m=>{m.path=[];m.repath=0;m.goal=null;});}
   if(g.status==='idle')continue;
   for(const m of g.members){
    const others=g.members.filter(n=>n!==m).map(n=>n.position);let target=g.status==='return'?m.home:s.position;if(g.status==='chase'&&others.some(p=>distance(p,target)<.7)){const angle=Math.atan2(m.position.y-target.y,m.position.x-target.x),spaced=[0,.6,-.6,1.2,-1.2,Math.PI].map(a=>({x:target.x+Math.cos(angle+a)*.95,y:target.y+Math.sin(angle+a)*.95})).find(p=>within(p)&&clear(p)&&others.every(o=>distance(o,p)>.65));if(!spaced)continue;target=spaced;}if(distance(m.position,target)<.025){m.position={...target};continue;}
    m.repath-=dt;
    if(m.repath<=0||!m.goal||distance(target,m.goal)>.35){m.goal={...target};m.repath=.3;m.path=pathTo(m.position,target,others,undefined,p=>within(p));}
    if(m.path.length<2)continue;
    const speed=g.status==='return'?2.6:Math.min(settings.speed,(s.motion?.walkSpeed??3)*.8),waypoint=m.path[1],length=distance(m.position,waypoint),fraction=length?Math.min(1,speed*dt/length):1,next={x:m.position.x+(waypoint.x-m.position.x)*fraction,y:m.position.y+(waypoint.y-m.position.y)*fraction};
    if(!within(next)||!clear(next)||others.some(p=>distance(p,next)<.62)){m.repath=0;continue;}
    const dx=next.x-m.position.x,dy=next.y-m.position.y,len=Math.hypot(dx,dy);m.moving=len>.001;if(len){m.face={x:dx/len,y:dy/len};m.position=next;m.path[0]={...next};if(distance(next,waypoint)<.001)m.path.shift();}
   }
   if(g.status==='return'&&g.members.every(m=>distance(m.position,m.home)<.025)){g.status='idle';g.members.forEach(m=>{m.position={...m.home};m.path=[];m.goal=null;m.repath=0;});}
  }
 }
 sees(m:Member,target:Point,settings:EnemySettings){const d=distance(m.position,target);if(d>settings.detection||!lineClear(m.position,target))return false;if(d<.01||settings.viewAngle>=360)return true;return (m.face.x*(target.x-m.position.x)+m.face.y*(target.y-m.position.y))/d>=Math.cos(settings.viewAngle*Math.PI/360);}
 touching(e:MapEnemy,hero:Point){return this.positions(e).some(p=>distance(p,hero)<1.35);}
 encounter(s:Progress,enemies:MapEnemy[],blocked:string|null=null){
  if(this.grace>0)return undefined;
  return enemies.filter(e=>e.enabled&&e.id!==blocked).map((e,index)=>{const positions=this.positions(e),rule=this.rules[e.id],g=rule?.movement==='chase'?this.group(e):undefined,settings=enemySettings(s);const sight=()=>positions.some((p,i)=>this.sees(g?.members[i]??{position:p,face:{x:0,y:1}} as Member,s.position,settings));
   return {e,index,d:Math.min(...positions.map(p=>distance(p,s.position))),triggered:(rule?.trigger==='sight'?sight():rule?.trigger==='area'?inside(s.position,rule.triggerArea):this.touching(e,s.position))};
  }).filter(x=>x.e.enabled&&x.e.id!==blocked&&x.triggered).sort((a,b)=>a.d-b.d||a.index-b.index)[0]?.e;
 }
 snapshot(){return {grace:this.grace,groups:[...this.groups].map(([id,g])=>({id,status:g.status,notice:g.notice,members:g.members.map(m=>({position:{...m.position},home:{...m.home},moving:m.moving}))}))};}
}
export const enemyField=new EnemyField();
