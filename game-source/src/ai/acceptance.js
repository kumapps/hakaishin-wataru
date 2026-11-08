// Adopted v0.4 acceptance, unchanged.
import * as Legacy from "../recognizer.js";
// v0.3: AI transcription first. Targeted topology checks, never template coverage.
const APP_VERSION='0.4.0',PREPROCESS_VERSION='v0.2-512px-14px-128gray';
const ACCEPTANCE_CONFIG=Object.freeze({version:'0.3.0',aiMinimum:.70,lineSlope:.45,lineMinWidth:.16,lineMergeY:.075,woodRatio:1.20,dotMinPixels:2});
function structuralLines(raw,api=Legacy){
 const shape=api.toShape(raw),n=api.GRID,has=(x,y)=>x>=0&&x<n&&y>=0&&y<n&&shape.mask[Math.round(y)*n+Math.round(x)];
 const runs=[];
 for(let y=4;y<n-4;y++)for(const slope of [-.45,-.3,-.15,0,.15,.3,.45]){
  let start=-1,last=-1,gaps=0,hits=0;
  const save=()=>{if(last-start>=n*ACCEPTANCE_CONFIG.lineMinWidth&&hits/(last-start+1)>.72)runs.push({x0:start/n,x1:last/n,y:y/n,slope,width:(last-start)/n});};
  for(let x=3;x<n-3;x++){
   const hit=[-.7,0,.7].some(d=>has(x,y+slope*(x-n/2)+d));
   if(hit){if(start<0)start=x;last=x;gaps=0;hits++;}
   else if(start>=0&&++gaps>1){save();start=last=-1;gaps=hits=0;}
  }if(start>=0)save();
 }
 // Keep strongest evidence per band. All ink is rasterized across pen-up boundaries.
 runs.sort((a,b)=>b.width-a.width||Math.abs(a.slope)-Math.abs(b.slope));
 const bars=[];for(const r of runs)if(bars.every(b=>Math.abs(b.y-r.y)>ACCEPTANCE_CONFIG.lineMergeY))bars.push(r);
 bars.sort((a,b)=>a.y-b.y);return{shape,bars};
}
function acceptanceJudge(raw,expected,candidates,api=Legacy){
 const best=candidates?.[0],checks=[];
 const finish=(kind,message,metrics={})=>({kind,message,checks,metrics,config:ACCEPTANCE_CONFIG});
 if(!expected)return finish('unset','試す漢字を選んでください。');
 if(!Array.isArray(raw)||!raw.length||raw.some(s=>!Array.isArray(s)||!s.length||s.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))))return finish('invalid','入力データを確認できません。');
 if(!best||!Number.isFinite(best.score)||best.score<ACCEPTANCE_CONFIG.aiMinimum)return finish('uncertain','AIの確信が低いため、確認が必要です。');
 if(best.char!==expected)return finish('different','AIは「'+best.char+'」と読みました。');
 if(!'玉本末未'.includes(expected))return finish('correct','AI認識が一致しました。この字の欠落チェックは未対応です。');
 const {shape,bars}=structuralLines(raw,api),metrics={bars};
 const cross=bars.filter(b=>b.x0<.46&&b.x1>.54);
 if(expected==='玉'){
  // Dot evidence between middle and bottom bars on the right. No pen-up/count rule.
  const wide=cross.filter(b=>b.width>.32);
  if(wide.length!==3)return finish('review','玉の横線と点の位置を確認しきれません。人の判断と比較してください。',metrics);
  const middle=wide[1],bottom=wide[2],n=api.GRID;let dotPixels=0;
  for(const i of shape.indices){const x=(i%n)/n,y=Math.floor(i/n)/n;
   const ym=middle.y+middle.slope*(x-.5),yb=bottom.y+bottom.slope*(x-.5);
   if(x>.60&&y>ym+.06&&y<yb-.045)dotPixels++;
  }
  metrics.dotPixels=dotPixels;checks.push({name:'玉の点',status:dotPixels>=ACCEPTANCE_CONFIG.dotMinPixels?'present':'missing'});
  if(dotPixels<ACCEPTANCE_CONFIG.dotMinPixels)return finish('structure','右側の点が見つかりません（玉の点抜けの疑い）。',metrics);
 }else if(expected==='本'){
  const lower=cross.filter(b=>b.y>.57&&b.y<.86&&b.width>.16);
  checks.push({name:'本の下の横線',status:lower.length?'present':'missing'});
  if(!lower.length)return finish('structure','下の横線が見つかりません（本の横線抜けの疑い）。',metrics);
 }else{
  const upper=cross.filter(b=>b.y<.55&&b.width>.23);
  if(upper.length!==2)return finish('review','末・未の2本の横線を確認しきれません。人の判断と比較してください。',metrics);
  const ratio=upper[0].width/upper[1].width;metrics.upperWidthRatio=ratio;
  const observed=ratio>ACCEPTANCE_CONFIG.woodRatio?'末':ratio<1/ACCEPTANCE_CONFIG.woodRatio?'未':null;
  checks.push({name:'末・未の横線の関係',status:observed??'ambiguous'});
  if(!observed)return finish('review','2本の横線の長さが近く、末・未の区別が曖昧です。',metrics);
  if(observed!==expected)return finish('structure','横線の関係は「'+observed+'」に見えます。',metrics);
 }
 return finish('correct','AI認識が一致し、対象の重要な線も確認できました。',metrics);
}

export {ACCEPTANCE_CONFIG,acceptanceJudge};
