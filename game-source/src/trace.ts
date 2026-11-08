import {journey} from './journey';
import {InkCell} from './handwriting';
import {DATA} from './recognizer.js';
import {sound} from './audio';
import {recordLearning,type Question} from './question-bank';
import type {Progress} from './state';
import {guideEnabled,hiddenStrokes,loadPracticeSettings,savePracticeSettings,type PracticeSettings,type Support} from './practice-settings';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
export class TraceLesson {
 cells:InkCell[]=[];disposed=false;generation=0;processing=false;finished=false;paused=false;autoRemaining=0;settingsOpen=false;
 practiceOverview:HTMLDivElement|null=null;practiceAnswer:HTMLDivElement|null=null;
 settings:PracticeSettings;masks:number[][]=[];settingsButton:HTMLButtonElement|null=null;overlay:HTMLDivElement|null=null;
 get configurable(){return this.label==='漢字の練習'||this.label==='まほうの練習';}
 constructor(private state:Progress,public question:Question,private hooks:{active:()=>boolean;save:()=>void;commit:()=>void;success:()=>void;back:()=>void},public label:string,private guide:'full'|'partial'|'none'='full',private autoFinish=false){
  this.settings=this.configurable?loadPracticeSettings():{support:guide,guide:guide!=='none'};this.show(true);
 }
 show(newMask=false){
  this.generation++;this.clear();this.processing=false;this.finished=false;this.autoRemaining=0;this.settingsOpen=false;this.overlay?.remove();this.overlay=null;
  $('#controls').hidden=true;$('#panel').hidden=true;$('#battle-ui').hidden=false;$('#battle-commands').hidden=true;$('#quiz-panel').hidden=false;$('#quiz-panel').classList.add('trace-lesson');$('#quiz-panel').dataset.type=this.question.type;
  $('#battle-label').textContent=this.label;$('#quiz-progress').textContent=this.settings.support==='none'?'書く練習':this.settings.support==='partial'?'一部なぞり':'なぞり練習';$('#quiz-time').textContent=this.configurable?'':'時間制限なし';
  $('#quiz-prompt').textContent=this.question.prompt;$('#quiz-feedback').textContent='';
  $('#battle-ui').classList.toggle('practice-page',this.configurable);
  if(this.configurable){if(!this.practiceOverview){this.practiceOverview=document.createElement('div');this.practiceOverview.className='practice-overview';this.practiceAnswer=document.createElement('div');this.practiceAnswer.className='practice-answer';this.practiceAnswer.setAttribute('aria-live','polite');const prompt=$('#quiz-prompt');prompt.before(this.practiceOverview);this.practiceOverview.append(this.practiceAnswer,prompt);}this.practiceAnswer!.textContent='';}
  $('#answer-options').hidden=true;$('#answer-options').replaceChildren();$('#answer-cells').hidden=false;$('#ink-actions').hidden=false;$('#quiz-end-actions').replaceChildren();$('#recovery-end-actions')?.remove();
  const characters=this.question.characters??[this.question.answer];
  if(newMask||this.masks.length!==characters.length)this.masks=characters.map(char=>hiddenStrokes((DATA as Record<string,{paths:string[]}>)[char]?.paths.length??0,this.settings.support));
  characters.forEach((char,i)=>{if(i===1&&this.question.fixedKana){const fixed=document.createElement('span');fixed.className='fixed-kana';fixed.textContent='の';$('#answer-cells').append(fixed);}const check=guideEnabled(this.settings)&&!(((DATA as Record<string,{paths:string[]}>)[char]?.paths.length??0)===1);
   const cell=new InkCell(char,this.settings.support,{checkSteps:check,showGuide:check,hidden:this.masks[i],feedback:message=>{if(this.disposed||this.settingsOpen||this.finished)return;$('#quiz-feedback').textContent=message;this.updateReady();}});this.cells.push(cell);$('#answer-cells').append(cell.element);
  });
  $('#answer-cells').dataset.count=String(this.cells.length);
  const erase=$<HTMLButtonElement>('#ink-erase'),submit=$<HTMLButtonElement>('#ink-submit');erase.disabled=false;submit.disabled=false;submit.textContent='回答';submit.classList.remove('guide-ready');
  erase.onclick=()=>{if(this.active())this.cells.forEach(c=>c.clear());};submit.onclick=()=>void this.submit();
  const cancel=document.createElement('button');cancel.id='quiz-unknown';cancel.textContent=this.configurable?'詳細に戻る':this.label==='漢字の札'?'スキップ':this.autoFinish?'まほうを選び直す':'やめる';cancel.onclick=()=>{if(this.label==='漢字の札'?!this.disposed&&!this.paused&&!this.finished&&this.hooks.active():this.active())this.hooks.back();};$('#quiz-end-actions').append(cancel);
  this.settingsButton?.remove();this.settingsButton=null;if(this.configurable){const b=document.createElement('button');b.className='practice-settings-button';b.textContent='練習設定';b.onclick=()=>this.openSettings();$('#quiz-panel').append(b);this.settingsButton=b;}
 }
 updateReady(){const guided=this.cells.some(c=>c.options?.checkSteps),complete=guided&&this.cells.every(c=>!c.options?.checkSteps||c.complete);$('#ink-submit').classList.toggle('guide-ready',complete);}
 active(){return !this.disposed&&!this.finished&&!this.processing&&!this.paused&&!this.settingsOpen&&this.hooks.active();}
 pause(v:boolean){this.paused=v;$('#battle-ui').inert=v;}
 clear(){for(const c of this.cells)c.dispose();this.cells=[];$('#answer-cells').replaceChildren();}
 openSettings(){
  if(!this.configurable||!this.active()||this.cells.some(c=>c.current))return;this.settingsOpen=true;this.cells.forEach(c=>c.locked=true);
  for(const b of $('#quiz-panel').querySelectorAll('button'))b.disabled=true;
  const draft={...this.settings},box=document.createElement('div');box.className='practice-settings-dialog';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','練習設定');this.overlay=box;
  const title=document.createElement('h3');title.textContent='練習設定';box.append(title);
  const buttons:HTMLButtonElement[]=[];const row=(label:string)=>{const wrap=document.createElement('div'),h=document.createElement('p');h.textContent=label;wrap.className='practice-settings-row';wrap.append(h);box.append(wrap);return wrap;};
  const support=row('下書き'),guides=row('書き順ガイド');
  const sync=()=>{for(const b of buttons){const value=b.dataset.support;if(value)b.setAttribute('aria-pressed',String(draft.support===value));else{b.disabled=draft.support==='none';b.setAttribute('aria-pressed',String(b.dataset.guide===String(draft.guide)));}}};
  for(const [value,label] of [['full','全部'],['partial','一部'],['none','なし']] as [Support,string][]){const b=document.createElement('button');b.textContent=label;b.dataset.support=value;b.onclick=()=>{draft.support=value;sync();};buttons.push(b);support.append(b);}
  for(const [value,label] of [[true,'あり'],[false,'なし']] as [boolean,string][]){const b=document.createElement('button');b.textContent=label;b.dataset.guide=String(value);b.onclick=()=>{draft.guide=value;sync();};buttons.push(b);guides.append(b);}
  const actions=document.createElement('div');actions.className='practice-settings-actions';box.append(actions);
  const close=(apply:boolean)=>{if(this.disposed||this.paused||!this.hooks.active())return;const changed=apply&&(draft.support!==this.settings.support||draft.guide!==this.settings.guide);box.remove();this.overlay=null;this.settingsOpen=false;if(changed){this.settings=draft;savePracticeSettings(this.settings);this.show(true);}else{this.cells.forEach(c=>c.locked=false);for(const b of $('#quiz-panel').querySelectorAll('button'))b.disabled=false;}this.settingsButton?.focus();};
  const cancel=document.createElement('button');cancel.textContent='戻る';cancel.onclick=()=>close(false);
  const apply=document.createElement('button');apply.textContent='適用';apply.className='primary';apply.onclick=()=>close(true);actions.append(cancel,apply);sync();$('#quiz-panel').append(box);apply.focus();
 }
 async submit(){
  if(!this.active()||this.cells.some(c=>c.current||c.retryRemaining>0))return;this.processing=true;const gen=this.generation;this.cells.forEach(c=>c.locked=true);for(const b of $('#quiz-panel').querySelectorAll('button'))b.disabled=true;if(this.label==='漢字の札')$<HTMLButtonElement>('#quiz-unknown').disabled=false;$('#quiz-feedback').textContent='判定中…';
  await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  while(this.paused||!this.hooks.active()){if(this.disposed||gen!==this.generation)return;await new Promise<void>(r=>requestAnimationFrame(()=>r()));}
  if(this.disposed||gen!==this.generation)return;let results;try{const candidates=[...journey(this.state).registered];if(this.label==='漢字の札'&&!candidates.includes(this.question.answer))candidates.push(this.question.answer);results=await Promise.all(this.cells.map(c=>c.judge(candidates)));}catch{if(this.disposed||gen!==this.generation)return;while(this.paused||!this.hooks.active()){if(this.disposed||gen!==this.generation)return;await new Promise<void>(r=>requestAnimationFrame(()=>r()));}this.processing=false;this.cells.forEach(c=>c.locked=false);for(const b of $('#quiz-panel').querySelectorAll('button'))b.disabled=false;$('#quiz-feedback').textContent='判定できなかった。もう一度';return;}
  while(this.paused||!this.hooks.active()){if(this.disposed||gen!==this.generation)return;await new Promise<void>(r=>requestAnimationFrame(()=>r()));}if(this.disposed||gen!==this.generation)return;const correct=results.every(r=>r.kind==='correct');
  if(this.label!=='漢字の札')recordLearning(this.state,this.question,correct,results.map(r=>r.kind==='correct'));sound.cue(correct?'correct':'wrong');this.processing=false;this.finished=true;if(correct)this.hooks.commit();this.hooks.save();
  if(this.configurable)this.practiceAnswer!.textContent=this.question.answer;
  $('#quiz-feedback').textContent=correct?'正解！'+(results.every(r=>r.order)?'　書き順○':''):'もう一度';
  const submit=$<HTMLButtonElement>('#ink-submit'),cancel=$<HTMLButtonElement>('#quiz-unknown');submit.classList.remove('guide-ready');
  const guarded=(run:()=>void)=>()=>{if(!this.disposed&&!this.paused&&this.hooks.active())run();};
  if(correct&&(this.label==='漢字の札'||this.autoFinish)){this.autoRemaining=.8;return;}
  submit.disabled=false;
  if(correct){$('#quiz-feedback').textContent=this.label==='字力結び'?this.question.answer+'を結んだ！':$('#quiz-feedback').textContent!;submit.textContent=this.configurable?'もう一度':'完了';submit.onclick=guarded(this.configurable?()=>this.show(true):this.hooks.success);if(this.configurable){cancel.disabled=false;cancel.textContent='詳細に戻る';cancel.onclick=guarded(this.hooks.back);}}
  else{submit.textContent='もう一度';submit.onclick=guarded(()=>this.show(false));cancel.disabled=false;cancel.onclick=guarded(this.hooks.back);}
 }
 tick(dt:number){if(this.disposed||this.paused||!this.hooks.active()||this.settingsOpen)return;for(const c of this.cells)c.tick(dt);if(this.autoRemaining>0){this.autoRemaining=Math.max(0,this.autoRemaining-dt);if(this.autoRemaining===0)this.hooks.success();}}
 dispose(){this.disposed=true;this.generation++;this.clear();this.overlay?.remove();this.settingsButton?.remove();this.overlay=null;this.settingsButton=null;if(this.practiceOverview){this.practiceOverview.before($('#quiz-prompt'));this.practiceOverview.remove();this.practiceOverview=null;this.practiceAnswer=null;}$('#battle-ui').classList.remove('practice-page');$('#quiz-panel').classList.remove('trace-lesson');$('#ink-submit').classList.remove('guide-ready');$('#ink-submit').textContent='回答';$('#recovery-end-actions')?.remove();$('#battle-ui').hidden=true;$('#battle-ui').inert=false;}
 snapshot(){return {question:this.question,processing:this.processing,finished:this.finished,settings:this.settings,masks:this.masks};}
}
