export type Support='full'|'partial'|'none';
export type PracticeSettings={support:Support;guide:boolean};
export const PRACTICE_KEY='kanji-dungeon-practice-v1';
export const defaultPracticeSettings=():PracticeSettings=>({support:'full',guide:true});
export function loadPracticeSettings():PracticeSettings{
 try{const value=JSON.parse(localStorage.getItem(PRACTICE_KEY)??'null');if(value&&['full','partial','none'].includes(value.support)&&typeof value.guide==='boolean')return {support:value.support,guide:value.guide};}catch{}
 return defaultPracticeSettings();
}
export function savePracticeSettings(value:PracticeSettings){try{localStorage.setItem(PRACTICE_KEY,JSON.stringify(value));}catch{}}
export function guideEnabled(value:PracticeSettings){return value.support!=='none'&&value.guide;}
export function hiddenStrokes(count:number,support:Support,random= Math.random):number[]{
 if(support==='none'||(support==='partial'&&count===1))return Array.from({length:count},(_,i)=>i);
 if(support!=='partial'||count<2)return [];
 const indices=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
 return indices.slice(0,Math.max(1,Math.min(count-1,Math.round(count/2))));
}
