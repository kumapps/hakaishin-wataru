import questionData from './questions-data.json';import {DATA} from './recognizer.js';import type {Progress,LearningKind} from './state';import {journey} from './journey';import type {Attribute} from './seals';
export type Question={id:string;type:string;prompt:string;answer:string;options?:string[];character?:string;characters?:string[];spellId?:string;power?:number;fixedKana?:boolean};
export const shuffle=<T>(a:T[])=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(a=>a.v);
export function fiveQuestions(state:Progress,weak=false,attribute?:Attribute):Question[]{const used=new Set<string>();return shuffle(['write','write','reading','meaning','english'].map(type=>{const candidates=questionData.items.filter(i=>journey(state).registered.includes(i.character)&&(!attribute||i.attribute===attribute)&&(type!=='write'||i.character in DATA));let pool=candidates.filter(i=>!used.has(i.questions.find(q=>q.type===type)!.id));if(!pool.length)pool=candidates;if(!pool.length)throw Error('出題候補がありません');const weight=(character:string)=>{const l=state.learning?.[character];if(!weak||!l?.total)return 1;const recent=l.recent.length?1-l.recent.filter(Boolean).length/l.recent.length:0;return 1+2*(recent*.7+(1-l.correct/l.total)*.3);};let n=Math.random()*pool.reduce((sum,i)=>sum+weight(i.character),0),picked=pool.at(-1)!;for(const item of pool){n-=weight(item.character);if(n<=0){picked=item;break;}}const q=picked.questions.find(q=>q.type===type)!;used.add(q.id);return {...q,character:picked.character};}));}
export function recordLearning(state:Progress,question:Question,correct:boolean,componentResults?:readonly boolean[]){
 state.learning??={};const key=question.spellId??question.character??question.answer;
 const l=state.learning[key]??={mastery:question.type==='magic'||!questionData.items.slice(0,150).some(i=>i.character===key)?1:3,streak:0,total:0,correct:0,recent:[]};
 l.total++;if(correct){l.correct++;if(++l.streak>=5){l.mastery=Math.min(5,l.mastery+1);l.streak=0;}}else{l.mastery=Math.max(1,l.mastery-1);l.streak=0;}
 l.recent.push(correct);l.recent=l.recent.slice(-10);
 const kind=question.type==='magic'?'write':question.type;
 if(['write','reading','meaning','english'].includes(kind)){
  l.byType??={};const h=l.byType[kind as LearningKind]??={total:0,correct:0,recent:[]};
  h.total++;if(correct)h.correct++;h.recent.push(correct);h.recent=h.recent.slice(-10);
 }
 // Submitted magic retains each character's recognition result. Timeout / unknown
 // supplies no results and applies the whole-answer failure to every character.
 if(question.type==='magic')for(const [i,char] of (question.characters??[]).entries())recordLearning(state,{id:'component-'+char,type:'write',prompt:question.prompt,answer:char,character:char},componentResults?.[i]??correct);
}
