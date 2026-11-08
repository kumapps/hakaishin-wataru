import {volumeSlider} from './volume-drag';
// Original procedural pentatonic music / effects. No downloaded recordings.
type Track='explore'|'battle'|'boss'|'silent';
type Cue='select'|'correct'|'wrong'|'slash'|'hit'|'magic'|'seal'|'release'|'heal'|'victory';
const KEY='kanji-dungeon.audio.v1';
const defaults={music:.32,effects:.5,muted:false};
export class AudioDirector{
 settings={...defaults};ctx:AudioContext|null=null;music:GainNode|null=null;effects:GainNode|null=null;
 track:Track='silent';paused=true;step=0;next=0;timer:number|undefined;notes=0;failed=false;
 constructor(){try{const d=JSON.parse(localStorage.getItem(KEY)??'null');if(d){this.settings={music:this.clamp(d.music,defaults.music),effects:this.clamp(d.effects,defaults.effects),muted:d.muted===true};}}catch{}}
 clamp(n:unknown,f:number){return typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(1,n)):f;}
 recoveryAt=0;
 async unlock(){try{if(!this.ctx||this.ctx.state==='closed'){const C=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!C)return;this.ctx=new C();this.music=this.ctx.createGain();this.effects=this.ctx.createGain();const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-15;compressor.ratio.value=5;compressor.connect(this.ctx.destination);this.music.connect(compressor);this.effects.connect(compressor);this.ctx.onstatechange=()=>{if(this.ctx?.state==='running'){this.failed=false;this.next=this.ctx.currentTime+.05;this.updateVolume();this.schedule();}};this.updateVolume();if(this.timer===undefined)this.timer=window.setInterval(()=>this.schedule(),40);}
  // Start the silent buffer inside the gesture, before any async boundary.
  const c=this.ctx;if(document.hidden)return;
  if(c.state!=='running'){const source=c.createBufferSource();source.buffer=c.createBuffer(1,1,c.sampleRate);source.connect(c.destination);source.onended=()=>source.disconnect();source.start();}
  await this.recover(true);
 }catch{this.failed=true;}}
 async recover(gesture=false){const c=this.ctx;if(!c||document.hidden||c.state==='closed')return;if(c.state==='running'){this.failed=false;return;}if(!gesture&&performance.now()<this.recoveryAt)return;this.recoveryAt=performance.now()+1000;
  try{await c.resume();if(c!==this.ctx)return;this.failed=String(c.state)!=='running';if(!this.failed){this.next=c.currentTime+.05;this.updateVolume();this.schedule();}}catch{this.failed=true;}
 }
 updateVolume(){const c=this.ctx;if(!c)return;const t=c.currentTime;this.music!.gain.setTargetAtTime(this.settings.muted||this.paused?0:this.settings.music*.22,t,.08);this.effects!.gain.setTargetAtTime(this.settings.muted||this.paused?0:this.settings.effects*.24,t,.03);}
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.settings));}catch{}this.updateVolume();}
 sync(track:Track,paused:boolean){if(track!==this.track){this.track=track;this.step=0;this.next=(this.ctx?.currentTime??0)+.15;}if(paused!==this.paused){this.paused=paused;this.next=(this.ctx?.currentTime??0)+.1;this.updateVolume();if(paused&&this.ctx?.state==='running'){const c=this.ctx;void c.suspend().then(()=>{if(!this.paused&&!document.hidden)void this.recover(true);}).catch(()=>{});}}
  if(!paused&&!document.hidden&&this.ctx&&this.ctx.state!=='running')void this.recover();
 }
 tone(midi:number,when:number,duration:number,volume:number,bus:GainNode,type:OscillatorType='sine'){
  const c=this.ctx!;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),when+.008);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g);g.connect(bus);o.start(when);o.stop(when+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};this.notes++;
 }
 schedule(){const c=this.ctx;if(!c||c.state!=='running'||this.paused||this.settings.muted||this.track==='silent')return;
  const beat=this.track==='explore'?.46:this.track==='battle'?.255:.225;
  const melody=this.track==='explore'?[74,0,77,81,0,79,77,0,72,0,74,77,0,69,72,0,74,77,0,81,84,0,81,79,77,0,74,0,72,69,0,0]:
   this.track==='battle'?[62,69,72,74,77,74,72,69,65,72,74,77,81,77,74,72,62,69,74,77,79,77,74,72,65,69,72,74,72,69,65,60]:
   [50,62,65,69,74,69,65,62,53,65,69,72,77,72,69,65,55,67,70,74,79,74,70,67,57,69,72,76,81,76,72,69];
  if(this.next<c.currentTime-.1)this.next=c.currentTime+.05;
  while(this.next<c.currentTime+.13){const i=this.step%melody.length,n=melody[i],t=this.next;if(n){this.tone(n,t,this.track==='explore'?1.1:.55,.48,this.music!,'triangle');this.tone(n+12,t,.22,.09,this.music!);}
   if(i%4===0){this.tone((this.track==='explore'?50:this.track==='battle'?38:26)+(i>=16?5:0),t,beat*3,.55,this.music!);if(this.track!=='explore')this.tone(35,t,.12,.7,this.music!);}
   if(this.track!=='explore'&&i%2===1)this.tone(86,t,.04,.13,this.music!,'triangle');
   this.step++;this.next+=beat;}
 }
 cue(kind:Cue){const c=this.ctx;if(!c||c.state!=='running'||this.paused||this.settings.muted||document.hidden)return;const t=c.currentTime;
  const patterns:Record<Cue,number[]>={select:[81],correct:[77,84],wrong:[65,62],slash:[86,72],hit:[43,38],magic:[74,77,81,86],seal:[67,62,55,48],release:[72,77,81,89],heal:[69,74,81],victory:[62,65,69,74,77,81,86]};
  patterns[kind].forEach((n,i)=>this.tone(n,t+i*(kind==='victory'?.12:.055),kind==='select'?.055:kind==='wrong'?.1:.3,kind==='wrong'?.2:kind==='hit'?.55:.4,this.effects!,kind==='hit'?'triangle':'sine'));
 }
 snapshot(){return {settings:{...this.settings},track:this.track,paused:this.paused,context:this.ctx?.state??'locked',notes:this.notes,failed:this.failed};}
 mount(parent:HTMLElement){const group=document.createElement('section');group.className='audio-settings';const mute=document.createElement('button');const refresh=()=>mute.textContent=this.settings.muted?'音：なし':'音：あり';refresh();mute.onclick=()=>{void this.unlock();this.settings.muted=!this.settings.muted;this.save();refresh();};group.append(mute);
  for(const [key,label]of [['music','音楽'],['effects','効果音']] as const){const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('output');row.className='audio-volume-row';name.textContent=label;value.textContent=String(Math.round(this.settings[key]*100));const slider=volumeSlider(label,this.settings[key]*100,n=>{this.settings[key]=n/100;value.textContent=String(n);this.save();},()=>{if(key==='effects')this.cue('correct');});row.append(name,slider,value);group.append(row);}parent.append(group);}
}
export const sound=new AudioDirector();
