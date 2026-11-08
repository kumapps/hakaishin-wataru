import type {Point} from './map';
export function spriteSize(enemy:boolean,sister:boolean,size:number,scale:number){return {width:(enemy?320:220)*size*scale,height:(enemy?260:sister?246:200)*size*scale};}
type Target={id:string;hp:number;pos:Point};
export function battleSpriteBounds(actor:Target,project:(p:Point)=>Point&{s:number}){
 const p=project(actor.pos),{width,height}=spriteSize(actor.id.startsWith('e'),actor.id==='s',.8,p.s),padding=12*p.s;
 return {left:p.x-width/2-padding,top:p.y-height*.91-padding,width:width+padding*2,height:height+padding*2};
}
export function pickBattleSprite<T extends Target>(actors:T[],point:Point,project:(p:Point)=>Point&{s:number},targeting:boolean):T|undefined{
 // The frontmost eligible sprite wins in overlapping areas, matching draw order.
 return actors.map((actor,index)=>({actor,index})).filter(({actor})=>{
  const enemy=actor.id.startsWith('e');if(actor.hp<=0||(targeting&&!enemy))return false;
  const r=battleSpriteBounds(actor,project);
  return point.x>=r.left&&point.x<=r.left+r.width&&point.y>=r.top&&point.y<=r.top+r.height;
 }).sort((a,b)=>b.actor.pos.y-a.actor.pos.y||b.index-a.index)[0]?.actor;
}
