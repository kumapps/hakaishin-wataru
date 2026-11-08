export type Point=[number,number];
// Normalized input-box units; intentionally adjustable, not handwriting grading.
export const STROKE_GUIDE_PARAMETERS={samples:24,startTolerance:.27,endTolerance:.30,meanTolerance:.15,orderedTolerance:.23,minLengthRatio:.28,maxLengthRatio:2.8,modelPeakTolerance:.30,reverseMargin:.025,retrySeconds:.55};
const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function pathLength(points:Point[]){return points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);}
export function sampleStroke(points:Point[],count=STROKE_GUIDE_PARAMETERS.samples):Point[]{
 if(!points.length)return [];const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative[i-1]+distance(points[i-1],points[i]));
 const total=cumulative.at(-1)!;if(total<1e-8)return Array.from({length:count},()=>[...points[0]] as Point);
 let j=1;return Array.from({length:count},(_,i)=>{const length=total*i/(count-1);while(j<cumulative.length-1&&cumulative[j]<length)j++;const t=(length-cumulative[j-1])/Math.max(1e-8,cumulative[j]-cumulative[j-1]);return [points[j-1][0]+(points[j][0]-points[j-1][0])*t,points[j-1][1]+(points[j][1]-points[j-1][1])*t] as Point;});
}
export function acceptsGuidedStroke(raw:Point[],model:Point[]){
 if(raw.length<2||model.length<2||raw.flat().some(n=>!Number.isFinite(n)))return false;
 const a=sampleStroke(raw),b=sampleStroke(model),length=pathLength(raw),expected=pathLength(model);if(expected<.005||length<.008)return false;
 const ratio=length/expected;if(ratio<STROKE_GUIDE_PARAMETERS.minLengthRatio||ratio>STROKE_GUIDE_PARAMETERS.maxLengthRatio)return false;
 if(distance(a[0],b[0])>STROKE_GUIDE_PARAMETERS.startTolerance||distance(a.at(-1)!,b.at(-1)!)>STROKE_GUIDE_PARAMETERS.endTolerance)return false;
 const mean=(x:Point[],y:Point[])=>x.reduce((n,p)=>n+Math.min(...y.map(q=>distance(p,q))),0)/x.length;
 if((mean(a,b)+mean(b,a))/2>STROKE_GUIDE_PARAMETERS.meanTolerance)return false;
 // Keep clear missing bends detectable while relaxing the average fit.
 if(b.some(p=>Math.min(...a.map(q=>distance(p,q)))>STROKE_GUIDE_PARAMETERS.modelPeakTolerance))return false;
 const ordered=a.reduce((n,p,i)=>n+distance(p,b[i]),0)/a.length,reverse=a.reduce((n,p,i)=>n+distance(p,b[b.length-1-i]),0)/a.length;
 return ordered<=STROKE_GUIDE_PARAMETERS.orderedTolerance&&!(expected>.07&&reverse+STROKE_GUIDE_PARAMETERS.reverseMargin<ordered);
}
