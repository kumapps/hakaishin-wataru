import {clear,W,H,type Point} from './map';
export function pathTo(start:Point,end:Point,obstacles:Point[]=[],ignored:ReadonlySet<number>=new Set(),within:(p:Point)=>boolean=()=>true):Point[]{
 const safe=(p:Point)=>within(p)&&clear(p,.23,ignored)&&obstacles.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>.55);
 const segment=(a:Point,b:Point)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.05));for(let i=1;i<=n;i++)if(!safe({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;};
 if(segment(start,end))return [{...start},{...end}];
 const key=(x:number,y:number)=>y*W+x,first={x:Math.floor(start.x),y:Math.floor(start.y)},last={x:Math.floor(end.x),y:Math.floor(end.y)},queue=[first],prev=new Map<number,number|null>([[key(first.x,first.y),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===last.x&&p.y===last.y){let k:number|null=key(p.x,p.y);const route:Point[]=[];while(k!==null){route.push({x:k%W+.5,y:Math.floor(k/W)+.5});k=prev.get(k)!;}route.reverse();route[0]={...start};route[route.length-1]={...end};if(route.every((p,i)=>i===0||segment(route[i-1],p)))return route;return [];}
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(x>=0&&x<W&&y>=0&&y<H&&!prev.has(k)&&safe({x:x+.5,y:y+.5})){prev.set(k,key(p.x,p.y));queue.push({x,y});}}}return [];
}
export function pathLength(path:Point[]){return path.reduce((n,p,i)=>n+(i?Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y):0),0);}
export function along(path:Point[],distance:number):Point{for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(distance<=length){const t=length?distance/length:0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}distance-=length;}return {...path.at(-1)!};}
