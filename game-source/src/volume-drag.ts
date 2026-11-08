// The padded DOM slider owns the entire gesture, including both end caps.
export function volumeSlider(label:string,value:number,oninput:(value:number)=>void,onchange:()=>void){
 const slider=document.createElement('div'),track=document.createElement('span'),fill=document.createElement('span'),thumb=document.createElement('span');
 slider.className='volume-slider';slider.tabIndex=0;slider.setAttribute('role','slider');slider.setAttribute('aria-label',label+'の音量');slider.setAttribute('aria-valuemin','0');slider.setAttribute('aria-valuemax','100');slider.setAttribute('aria-orientation','horizontal');
 track.className='volume-track';fill.className='volume-fill';thumb.className='volume-thumb';track.append(fill,thumb);slider.append(track);
 let current=Math.round(value),initial=current,pointer:number|null=null,touch:number|null=null;
 const set=(v:number,notify=true)=>{const next=Math.max(0,Math.min(100,Math.round(v))),changed=next!==current;current=next;slider.setAttribute('aria-valuenow',String(current));slider.setAttribute('aria-valuetext',current+'％');slider.style.setProperty('--volume',current+'%');if(changed&&notify)oninput(current);};
 const update=(x:number)=>{const box=track.getBoundingClientRect();if(box.width)set((x-box.left)/box.width*100);};
 const finish=(commit:boolean)=>{if(commit&&current!==initial)onchange();};
 slider.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;pointer=null;e.preventDefault();const t=e.changedTouches[0];touch=t.identifier;initial=current;update(t.clientX);},{passive:false});
 slider.addEventListener('touchmove',e=>{if(touch===null)return;e.preventDefault();const t=Array.from(e.changedTouches).find(t=>t.identifier===touch);if(t)update(t.clientX);},{passive:false});
 const touchEnd=(e:TouchEvent)=>{if(touch===null)return;const t=Array.from(e.changedTouches).find(t=>t.identifier===touch);if(!t)return;e.preventDefault();if(e.type==='touchend')update(t.clientX);touch=null;finish(e.type==='touchend');};
 slider.addEventListener('touchend',touchEnd,{passive:false});slider.addEventListener('touchcancel',touchEnd,{passive:false});
 slider.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||!e.isPrimary||e.button!==0||touch!==null)return;e.preventDefault();pointer=e.pointerId;initial=current;slider.focus({preventScroll:true});slider.setPointerCapture(pointer);update(e.clientX);});
 slider.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();update(e.clientX);}});
 const end=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;if(e.type==='pointerup')update(e.clientX);pointer=null;if(slider.hasPointerCapture(e.pointerId))slider.releasePointerCapture(e.pointerId);finish(e.type==='pointerup');};
 slider.addEventListener('pointerup',end);slider.addEventListener('pointercancel',end);slider.addEventListener('lostpointercapture',e=>{if(e.pointerId===pointer)pointer=null;});
 slider.addEventListener('keydown',e=>{const delta:Record<string,number>={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1,PageDown:-10,PageUp:10};if(!(e.key in delta)&&e.key!=='Home'&&e.key!=='End')return;e.preventDefault();initial=current;set(e.key==='Home'?0:e.key==='End'?100:current+delta[e.key]);finish(true);});
 set(current,false);return slider;
}
