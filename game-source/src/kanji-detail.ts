import {renderLearning} from './learning-ui';
import type {Progress} from './state';
export function renderKanjiDetail(parent:HTMLElement,item:{character:string;reading:string;grade:number;attribute:string;meaning:string;english:string},state:Progress,initial:number){
 const overview=document.createElement('section');overview.className='kanji-overview';overview.setAttribute('aria-label','漢字の基本情報');
 const glyph=document.createElement('h3');glyph.className='detail-glyph';glyph.textContent=item.character;
 const reading=document.createElement('p');reading.className='detail-reading';reading.textContent=item.reading;
 const meaning=document.createElement('p');meaning.className='detail-meaning';meaning.textContent=item.meaning+' ／ '+item.english;
 const meta=document.createElement('p');meta.className='detail-meta';meta.textContent=item.grade+'年生　'+item.attribute+'属性';overview.append(glyph,reading,meaning,meta);
 const learning=document.createElement('section');learning.className='kanji-learning';const label=document.createElement('h3');label.textContent='学習状況';learning.append(label);renderLearning(learning,state.learning?.[item.character],initial);parent.append(overview,learning);
}
