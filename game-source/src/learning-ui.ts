import type {AnswerHistory,LearningRecord,LearningKind} from './state';

const kinds:readonly [LearningKind,string][]=[['write','書き'],['reading','読み'],['meaning','意味'],['english','英語']];
function rate(correct:number,total:number){return total?Math.round(correct/total*100)+'%　'+correct+'/'+total+'問':'記録なし';}
export function renderLearning(parent:HTMLElement,record:LearningRecord|undefined,initialMastery:number,magic=false){
 const summary=document.createElement('p');summary.className='learning-level';
 const mastery=record?.mastery??initialMastery;
 summary.textContent=(mastery===5?'マスター':'定着度 '+mastery+' / 5')+'　　連続正解 '+(record?.streak??0)+' / 5';parent.append(summary);
 const table=document.createElement('table');table.className='learning-table';
 const head=table.createTHead().insertRow();for(const text of ['種類','累計','最近10問']){const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);}
 const body=table.createTBody();
 for(const [kind,name] of magic?kinds.slice(0,1):kinds){
  const row=body.insertRow(),label=document.createElement('th');label.scope='row';label.textContent=name;row.append(label);
  const h:AnswerHistory|undefined=record?.byType?.[kind];row.insertCell().textContent=rate(h?.correct??0,h?.total??0);
  const recent=h?.recent??[];row.insertCell().textContent=rate(recent.filter(Boolean).length,recent.length);
 }
 parent.append(table);
 const known=Object.values(record?.byType??{}).reduce((n,h)=>n+(h?.total??0),0);
 if(record&&record.total>known){const legacy=document.createElement('p');legacy.className='learning-legacy';legacy.textContent='以前の記録を含む合計　'+rate(record.correct,record.total)+'\n種類別の記録は、この版から残ります。';parent.append(legacy);}
}
