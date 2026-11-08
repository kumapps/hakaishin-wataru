import {pathTo} from './pathfinding';
import {clear,type Point} from './map';import type {Progress} from './state';
export class Movement {
 direction:Point={x:0,y:0};trail:Point[]=[];walking=false;followerWalking=false;running=false;travelTime=0;currentSpeed=0;face:Point={x:0,y:-1};
 constructor(public state:Progress){this.reset();}
 reset(){this.direction={x:0,y:0};this.walking=false;this.followerWalking=false;this.trail=[{...this.state.follower}];const route=pathTo(this.state.follower,this.state.position);if(route.length>=2){for(let j=1;j<route.length;j++){const a=route[j-1],b=route[j],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.06);for(let i=1;i<=n;i++)this.trail.push({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n});}}else{this.state.follower={...this.state.position};this.trail=[{...this.state.position}];}}
 segmentClear(a:Point,b:Point){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*20);for(let i=1;i<=n;i++)if(!clear({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
 stop(){this.direction={x:0,y:0};this.walking=false;this.followerWalking=false;this.running=false;this.travelTime=0;this.currentSpeed=0;}
 tick(dt:number,active:boolean){if(!active){this.stop();return;}const p=this.state.position,old={...p},d=this.direction,len=Math.hypot(d.x,d.y);if(len){this.face={x:d.x/len,y:d.y/len};const settings=this.state.motion;const progress=Math.max(0,Math.min(1,(this.travelTime-settings.runDelay)/settings.acceleration));this.currentSpeed=settings.walkSpeed+(settings.runSpeed-settings.walkSpeed)*progress;const distance=this.currentSpeed*dt,n=Math.max(1,Math.ceil(distance/.05));for(let i=0;i<n;i++){const dx=d.x/len*distance/n,dy=d.y/len*distance/n;if(clear({x:p.x+dx,y:p.y}))p.x+=dx;if(clear({x:p.x,y:p.y+dy}))p.y+=dy;const last=this.trail.at(-1)!;if(Math.hypot(last.x-p.x,last.y-p.y)>.035)this.trail.push({...p});}}
 this.walking=Math.hypot(old.x-p.x,old.y-p.y)>.001;
 if(this.walking)this.travelTime+=dt;else{this.travelTime=0;this.currentSpeed=0;}
 this.running=this.walking&&this.travelTime>this.state.motion.runDelay;
 // Sample follower on the actual travelled polyline, never cutting corners.
 let remain=2.6,target={...p},index=this.trail.length-1;
 for(let i=this.trail.length-1;i>0;i--){const b=this.trail[i],a=this.trail[i-1],dist=Math.hypot(b.x-a.x,b.y-a.y);if(dist>=remain){const t=remain/dist;target={x:b.x+(a.x-b.x)*t,y:b.y+(a.y-b.y)*t};index=i-1;break;}remain-=dist;target={...a};index=i-1;}
 this.followerWalking=Math.hypot(target.x-this.state.follower.x,target.y-this.state.follower.y)>.001;
 if(clear(target))this.state.follower=target;if(index>1)this.trail.splice(0,index-1);
 }
}
