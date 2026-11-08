import {renderLearning} from './learning-ui';
import data from './tutorial-data.json';
import type {Progress} from './state';
import {eligible,ensureParty,type Attribute,type PersonId} from './seals';
import {attributeStyles} from './kanji-book';
export type Spell=(typeof data.spells)[number];
const order=['火','水','土','風','霊','無'];
export function registeredSpells(ids:string[]){return data.spells.filter(s=>s.initially_registered||ids.includes(s.id)).sort((a,b)=>order.indexOf(a.attribute)-order.indexOf(b.attribute));}
export function spellUnavailable(state:Progress,spell:Spell,id:PersonId='s'){
 if(!spell.initially_registered&&!state.journey?.spells.includes(spell.id))return '未登録';
 const attr=spell.attribute as Attribute;
 if(spell.attribute!=='無'&&!eligible(state,id,attr))return spell.attribute==='霊'?'霊の力が必要':'「'+spell.attribute+'」が必要';
 if(ensureParty(state)[id].sealed.includes(attr))return 'この属性は封印中';
 return '';
}
export function spellSealed(state:Progress,spell:Spell){return state.party?.s.sealed.includes(spell.attribute as Attribute)??false;}
function badge(spell:Spell,sealed:boolean){const el=document.createElement('span');el.className='attribute-symbol'+(sealed?' sealed':'');el.textContent=spell.attribute;el.setAttribute('aria-label',spell.attribute+'属性'+(sealed?' 封印中':''));return el;}
export function renderSpellList(parent:HTMLElement,state:Progress,ids:string[],choose:(id:string)=>void,options:{disabled?:(spell:Spell)=>boolean}={}){
 const wrap=document.createElement('div');wrap.className='spell-list';let attribute='',cards:HTMLDivElement;
 for(const spell of registeredSpells(ids)){
  if(attribute!==spell.attribute){attribute=spell.attribute;const section=document.createElement('section');section.className='spell-group';const title=document.createElement('h3');title.textContent=attribute+'属性';cards=document.createElement('div');cards.className='spell-cards';section.append(title,cards);wrap.append(section);}
  const sealed=spellSealed(state,spell),button=document.createElement('button');button.className='spell-card attribute-'+attributeStyles[spell.attribute]+(sealed?' spell-sealed':'');button.setAttribute('aria-label',spell.name+(sealed?'　封印中':''));
  const name=document.createElement('span');name.className='spell-name';name.textContent=spell.name;button.append(name,badge(spell,sealed));const reason=spellUnavailable(state,spell);if(reason&&!sealed){const hint=document.createElement('small');hint.className='spell-unavailable';hint.textContent=reason;button.append(hint);}button.disabled=options.disabled?.(spell)??false;button.onclick=()=>choose(spell.id);cards!.append(button);
 }
 parent.append(wrap);
}
export function renderSpellDetail(parent:HTMLElement,state:Progress,spell:Spell){
 const wrap=document.createElement('section');wrap.className='spell-detail';const title=document.createElement('h3');title.className='spell-detail-name';title.textContent=spell.name;const reading=document.createElement('p');reading.className='spell-reading';reading.textContent=spell.reading;
 const identity=document.createElement('div');identity.className='spell-identity attribute-'+attributeStyles[spell.attribute];identity.append(badge(spell,spellSealed(state,spell)));wrap.append(title,reading,identity);
 const target=/敵\d+体/.exec(spell.effect_description)?.[0]??'—';const effect=spell.effect_description.replace(/で?敵\d+体を攻撃する/,'').replace('呼び出し。','呼び出す。');
 const facts=document.createElement('dl');facts.className='spell-facts';for(const [label,text] of [['効果',effect],['対象',target],['基本威力',String(spell.base_power)],['構成する漢字',spell.recipe.join(' ＋ ')]]){const key=document.createElement('dt'),value=document.createElement('dd');key.textContent=label;value.textContent=text;facts.append(key,value);}wrap.append(facts);const learning=document.createElement('section');learning.className='spell-learning';const heading=document.createElement('h3');heading.textContent='学習状況';learning.append(heading);renderLearning(learning,state.learning?.[spell.id],spell.initial_mastery,true);parent.append(wrap,learning);
}
