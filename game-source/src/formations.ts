import {tiles,tileKey,clear,type Point} from './map';
import {pathTo} from './pathfinding';
export type Formation={kind:string;homes:Point[];camera:Point;ignored:Set<number>};
let previous='';
const templates=[
 {id:'front',enemy:{x:0,y:-.6},hero:{x:-2.2,y:2.9},sister:{x:2.2,y:3.2}},
 {id:'diagonal-left',enemy:{x:-2.1,y:-.8},hero:{x:2,y:.3},sister:{x:2.8,y:3.2}},
 {id:'diagonal-right',enemy:{x:2.1,y:-.8},hero:{x:-2,y:.3},sister:{x:-2.8,y:3.2}},
 {id:'side',enemy:{x:-2.8,y:.3},hero:{x:1.4,y:.7},sister:{x:3.1,y:3.2}}
];
export function formationProjection(p:Point,camera:Point){const d=p.y-camera.y,s=1/Math.max(.15,1-d*.045);return {x:512+(p.x-camera.x)*90*s,y:540+d*55.8*s,s};}
export function makeFormation(kind:string,homes:Point[]):Formation{
 const xs=homes.map(p=>p.x),ys=homes.map(p=>p.y),left=Math.min(...xs)-1,right=Math.max(...xs)+1,top=Math.min(...ys)-1,bottom=Math.max(...ys)+1,ignored=new Set<number>();
 for(let y=Math.floor(top);y<=Math.ceil(bottom);y++)for(let x=Math.floor(left);x<=Math.ceil(right);x++)if(x+.5>=left&&x+.5<=right&&y+.5>=top&&y+.5<=bottom&&[3,4].includes(tiles[y]?.[x]))ignored.add(tileKey(x,y));
 return {kind,homes,camera:{x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2},ignored};
}
export function validFormation(f:Formation,starts:Point[]){
 if(f.homes.some((p,i)=>!clear(p,.3,i<2?undefined:f.ignored)))return false;
 const projected=f.homes.map(p=>formationProjection(p,f.camera));
 // Reject near-collinear diagonals in screen space, including every enemy.
 if(f.kind.startsWith('diagonal-'))for(const enemy of projected.slice(2)){const [hero,sister]=projected,dx=sister.x-enemy.x,dy=sister.y-enemy.y;const altitude=Math.abs(dx*(hero.y-enemy.y)-dy*(hero.x-enemy.x))/Math.hypot(dx,dy);if(altitude<95)return false;}
 for(const [i,p]of projected.entries()){
  const half=(i<2?88:128)*p.s,top=p.y-(i===0?146:i===1?180:190)*p.s;
  if(p.x-half<28||p.x+half>996||top<190||p.y+25*p.s>798)return false;
  for(let j=0;j<i;j++){const q=projected[j];if(Math.abs(p.x-q.x)<(i<2&&j<2?130:180)&&Math.abs(p.y-q.y)<110)return false;}
 }
 for(const [i,home]of f.homes.entries())if(pathTo(starts[i],home,[],f.ignored).length<2)return false;
 // Every physical attacker must be able to approach and return without crossing another actor.
 for(let i=0;i<f.homes.length;i++)for(let j=0;j<f.homes.length;j++)if((i<2)!==(j<2)){
  const a=f.homes[i],b=f.homes[j],len=Math.hypot(a.x-b.x,a.y-b.y),others=f.homes.filter((_,k)=>k!==i&&k!==j);
  if(len<2.1)return false;
  for(const reach of [1.1,1.3]){const end={x:b.x+(a.x-b.x)/len*reach,y:b.y+(a.y-b.y)/len*reach};if(pathTo(a,end,others,f.ignored).length<2||pathTo(end,a,others,f.ignored).length<2)return false;}
 }
 return true;
}
export function chooseFormation(center:Point,starts:Point[],fallback:Point[],kind?:string,random=Math.random){
 const preferred=kind==='boss'?'diagonal-left':kind==='reaper'?'diagonal-right':Math.abs(starts[0].x-center.x)>Math.abs(starts[0].y-center.y)?(starts[0].x<center.x?'diagonal-right':'diagonal-left'):'front';
 const order=templates.map(t=>({t,n:random()})).sort((a,b)=>((a.t.id===previous?5:0)+(a.t.id===preferred?(kind==='boss'||kind==='reaper'?-2:-.35):0)+a.n)-((b.t.id===previous?5:0)+(b.t.id===preferred?(kind==='boss'||kind==='reaper'?-2:-.35):0)+b.n));
 const count=starts.length-2;
 const shapes=count===1?[[{x:0,y:0}]]:count===2?[[{x:-1.7,y:0},{x:1.7,y:0}],[{x:-1.3,y:-1},{x:1.3,y:.9}]]:[[{x:-3.2,y:0},{x:0,y:0},{x:3.2,y:0}],[{x:0,y:.6},{x:-2.7,y:-2.4},{x:2.7,y:-2.4}],[{x:-2.5,y:-1.4},{x:0,y:0},{x:2.5,y:1.4}]];
 const shapeOrder=shapes.map(s=>({s,n:random()})).sort((a,b)=>a.n-b.n);
 for(const {t}of order)for(const {s}of shapeOrder)for(const offset of [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}]){
  const at=(p:Point)=>({x:center.x+p.x+offset.x,y:center.y+p.y+offset.y});
  const homes=[at(t.hero),at(t.sister),...s.map(p=>at({x:t.enemy.x+p.x,y:t.enemy.y+p.y}))],candidate=makeFormation(t.id+'-'+shapes.indexOf(s),homes);
  if(validFormation(candidate,starts)){previous=t.id;return candidate;}
 }
 const original=makeFormation('front-fallback',fallback);if(validFormation(original,starts)){previous='front';return original;}
 throw Error('安全な戦闘配置が見つかりません');
}
