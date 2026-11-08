import type {Progress} from './state';
import {journey} from './journey';

// All records in this demo belong to the same dungeon, not the current room.
export const CURRENT_DUNGEON='six-shrine';
const tasks:Record<string,{title:string;done:(s:Progress)=>boolean}>={
 'work-scroll':{title:'火薬の秘伝',done:s=>journey(s).spells.includes('gunpowder')},
 'ice-scroll':{title:'氷流の秘伝',done:s=>journey(s).spells.includes('ice_flow')},
 'reaper-scroll':{title:'死神の秘伝',done:s=>journey(s).spells.includes('reaper')},
 'powder-rock':{title:'岩の仕掛け',done:s=>!!journey(s).rocksCleared},
 'exit-stone':{title:'奥へ続く道',done:s=>!!journey(s).rocksCleared},
 'guardian-record':{title:'守り神の記録',done:s=>journey(s).defeated.includes('boss')},
 'water-gate':{title:'水路の近道',done:s=>!!journey(s).waterGateOpened},
 'shortcut-lever':{title:'入口への近道',done:s=>!!journey(s).shortcutOpened},
 'library-lever':{title:'書庫の近道',done:s=>!!journey(s).libraryShortcutOpened}
};
const recordTitles:Record<string,string>={
 'entry-marker':'古い道標','entrance-stone':'札の小部屋の石碑',
 'root-stone':'根に包まれた石碑','powder-stone':'火薬庫の石碑',
 'wind-stone':'風の札の石碑','wind-marker':'風の回廊の石板',
 'water-stone':'水の札の石碑','water-exit':'封印の間への門',
 'spirit-stone':'霊の札の石碑','library-marker':'書庫の石板',
 'altar-stone':'祭壇の石碑'
};
export function journalEntries(state:Progress,records:Record<string,string>,dungeon?:string){
 if(dungeon&&dungeon!==CURRENT_DUNGEON)return [];
 return [...new Set(state.read)].reverse().filter(id=>Object.hasOwn(records,id)).map(id=>({id,dungeon:CURRENT_DUNGEON,text:records[id],task:!!tasks[id],title:tasks[id]?.title??recordTitles[id]??'記録',done:tasks[id]?.done(state)??false}));
}
export function renderNotebook(parent:HTMLElement,state:Progress,records:Record<string,string>){
 const entries=journalEntries(state,records,CURRENT_DUNGEON);
 const upper=document.createElement('div'),preview=document.createElement('section');
 upper.className='notebook-records';upper.setAttribute('role','region');upper.setAttribute('aria-label','記録一覧');
 preview.className='notebook-preview';preview.setAttribute('aria-label','選択した記録');preview.setAttribute('aria-live','polite');
 parent.append(upper,preview);
 if(!entries.length){const p=document.createElement('p');p.textContent='まだ、記録はない';upper.append(p);return;}
 const list=document.createElement('ul');list.className='notebook-list';upper.append(list);
 const buttons=new Map<string,HTMLButtonElement>();
 function select(entry:typeof entries[number]){
  for(const [id,b]of buttons){b.classList.toggle('selected',id===entry.id);b.setAttribute('aria-pressed',String(id===entry.id));}
  preview.replaceChildren();const heading=document.createElement('h3');heading.textContent=entry.title;
  if(entry.done){const badge=document.createElement('span');badge.className='task-done';badge.textContent='済';heading.append('　',badge);}
  const text=document.createElement('p');text.className='notebook-detail';text.textContent=entry.text;preview.append(heading,text);preview.scrollTop=0;
 }
 for(const entry of entries){const row=document.createElement('li'),open=document.createElement('button'),title=document.createElement('span');open.type='button';open.dataset.recordId=entry.id;open.onclick=()=>select(entry);title.textContent=entry.title;open.append(title);if(entry.done){const badge=document.createElement('span');badge.className='task-done';badge.textContent='済';open.append(badge);}buttons.set(entry.id,open);row.append(open);list.append(row);}
 select(entries[0]);
}
