// Keep long four-choice answers inside their cells without shrinking all answers.
export function fitChoices(parent:HTMLElement){
 for(const button of parent.querySelectorAll('button')){
  if(!button.getClientRects().length)continue;
  button.style.fontSize='';let size=parseFloat(getComputedStyle(button).fontSize);
  while(size>28&&(button.scrollHeight>button.clientHeight+1||button.scrollWidth>button.clientWidth+1)){
   size=Math.max(28,size-2);button.style.fontSize=size+'px';
  }
 }
}
export function scheduleChoiceFit(parent:HTMLElement){requestAnimationFrame(()=>fitChoices(parent));}
