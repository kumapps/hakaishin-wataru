import {renderBook,newBookView,type BookView} from './kanji-book';
import type {Progress} from './state';

// A draft belongs to this visit to a secret; handwriting can return to it.
// It is independent of the Kanji Book and is never written into the save.
export type BindingDraft={selected:string[];view:BookView};
export const newBindingDraft=():BindingDraft=>({selected:[],view:newBookView()});

export function renderBinding(parent:HTMLElement,state:Progress,registered:string[],draft:BindingDraft,
 spec:{reading:string;recipe:readonly string[]},secretText:string,completed:boolean,onMatch:()=>void,notice=''){
 const secret=document.createElement('div');secret.className='binding-secret';
 secret.textContent='秘伝「'+spec.reading+'」'+(completed?'　結び済み':'')+'\n'+secretText;
 const head=document.createElement('div');head.className='binding-head';
 const slots=document.createElement('div');slots.className='binding-slots';slots.setAttribute('aria-label','選んだ漢字');
 const action=document.createElement('button');action.className='bind-action';action.textContent=completed?'結び済み':'結ぶ';
 const feedback=document.createElement('p');feedback.className='binding-feedback';feedback.setAttribute('role','status');feedback.textContent=notice;
 let dragged=-1;
 const renderSlots=()=>{
  slots.replaceChildren();
  for(let i=0;i<4;i++){
   const value=draft.selected[i],b=document.createElement('button');b.textContent=value??'漢字を\n選ぶ';b.classList.toggle('empty-slot',!value);
   b.setAttribute('aria-label','選択枠'+(i+1)+(value?' '+value:''));b.disabled=completed||!value;
   b.onclick=()=>{if(completed)return;draft.selected.splice(i,1);feedback.textContent='';renderSlots();};
   b.draggable=!completed&&!!value;b.ondragstart=()=>{dragged=i;};b.ondragend=()=>{dragged=-1;};
   b.ondragover=e=>{if(!completed)e.preventDefault();};
   b.ondrop=e=>{e.preventDefault();if(!completed&&dragged>=0&&i<draft.selected.length){const [char]=draft.selected.splice(dragged,1);draft.selected.splice(i,0,char);feedback.textContent='';renderSlots();}dragged=-1;};slots.append(b);
  }
  action.disabled=completed||draft.selected.length===0;action.classList.toggle('ready-to-bind',!action.disabled);
 };
 action.onclick=()=>{
  if(completed||draft.selected.length===0)return;
  if(draft.selected.join('')!==spec.recipe.join('')){feedback.textContent='まだ、力が結ばれない';return;}
  onMatch();
 };
 head.append(slots,action);parent.append(secret,head,feedback);
 renderBook(parent,state,registered,draft.view,char=>{if(completed||draft.selected.length>=4)return;draft.selected.push(char);feedback.textContent='';renderSlots();});
 renderSlots();
}
