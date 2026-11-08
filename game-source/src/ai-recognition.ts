import {strokeOrder} from './recognizer.js';
import {probabilitiesFromLogits,rankingFromScores,selectRegisteredCandidates,registeredJudge} from './ai/registered.js';
import type {InkPoint} from './handwriting';
declare const ort:any;
export const MODEL_URL='https://huggingface.co/LT8/japanese-handwriting-onnx/resolve/7e4fa1096b1fd4dc1afb9f8ffc5b9d936adb2839/model.fp16.onnx';
const CACHE_KEY='LT8/7e4fa1096b1fd4dc1afb9f8ffc5b9d936adb2839/fp16';
let session:any=null,loading:Promise<void>|null=null,queue:Promise<unknown>=Promise.resolve();
export let aiStatus='初回の回答時にAIを準備します';
const listeners=new Set<()=>void>();
function status(text:string){aiStatus=text;for(const f of listeners)f();}
function cacheOpen():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{let expired=false;const timer=setTimeout(()=>{expired=true;reject(Error('保存領域の応答待ちを中止しました'));},3000),r=indexedDB.open('kanji-ai-test-cache',1);r.onupgradeneeded=()=>r.result.createObjectStore('models');r.onsuccess=()=>{clearTimeout(timer);if(expired){r.result.close();return;}resolve(r.result);};r.onerror=()=>{clearTimeout(timer);reject(r.error);};r.onblocked=()=>{clearTimeout(timer);expired=true;reject(Error('保存領域を開けません'));};});}
async function cached(bytes?:Uint8Array):Promise<Uint8Array|undefined>{const db=await cacheOpen();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('models',bytes?'readwrite':'readonly'),store=tx.objectStore('models');let value:Uint8Array|undefined;const r=bytes?store.put(bytes,CACHE_KEY):store.get(CACHE_KEY);r.onsuccess=()=>value=r.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
function decode(s:string){const raw=atob(s.trim()),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
async function fetchModel(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);try{status('AIモデルを取得中…（初回約15MB）');const response=await fetch(MODEL_URL,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('AIモデルを取得できません');return new Uint8Array(await response.arrayBuffer());}finally{clearTimeout(timer);}}
async function init(file?:File){let bytes:Uint8Array|undefined;if(file)bytes=new Uint8Array(await file.arrayBuffer());else{try{bytes=await cached();}catch{}if(!bytes)bytes=await fetchModel();}
 if(bytes.length!==15248091)throw Error('指定のmodel.fp16.onnxを選んでください');
 if(globalThis.crypto?.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!=='5db35edaf98b482e3e1c6e62edc6d78daf0e7d72720509ddff4aee08b707ce1d')throw Error('AIモデルの内容が一致しません');}
 if(typeof ort==='undefined')throw Error('AI実行機能を読み込めません');
 ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.initTimeout=60000;
 const module=URL.createObjectURL(new Blob([document.getElementById('wasm-module')!.textContent!],{type:'text/javascript'})),binary=URL.createObjectURL(new Blob([decode(document.getElementById('wasm-data')!.textContent!)],{type:'application/wasm'}));
 delete ort.env.wasm.wasmBinary;ort.env.wasm.wasmPaths={mjs:module,wasm:binary};status('端末内でAIを準備中…');
 try{session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});}finally{URL.revokeObjectURL(module);URL.revokeObjectURL(binary);}
 status('AI準備完了（端末内で認識）');try{await cached(bytes);}catch{status('AI準備完了（次回は再取得が必要）');}
}
export function prepareAI(file?:File):Promise<void>{if(session)return Promise.resolve();if(loading)return loading;loading=init(file).catch(e=>{status('AIを準備できません。設定から再試行・モデル選択ができます');throw e;}).finally(()=>{loading=null;});return loading;}
export function makeInput(strokes:InkPoint[][]){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#213c32';ctx.lineWidth=14;ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x*512,y*512):ctx.moveTo(x*512,y*512));if(stroke.length===1)ctx.lineTo(stroke[0][0]*512+.1,stroke[0][1]*512+.1);ctx.stroke();}const off=document.createElement('canvas');off.width=off.height=128;const c=off.getContext('2d')!;c.fillStyle='white';c.fillRect(0,0,128,128);c.drawImage(canvas,0,0,128,128);const pixels=c.getImageData(0,0,128,128).data,data=new Float32Array(128*128);for(let i=0;i<data.length;i++)data[i]=.299*pixels[i*4]+.587*pixels[i*4+1]+.114*pixels[i*4+2];return data;}
export type InkAnswer={kind:string;order:boolean;best?:{char:string};message?:string};
export function judgeInk(raw:InkPoint[][],expected:string,registered:readonly string[]):Promise<InkAnswer>{
 const strokes=structuredClone(raw),allowed=[...registered];
 const run=async():Promise<InkAnswer>=>{if(!allowed.includes(expected))throw Error('出題と登録済み漢字が一致しません');if(!strokes.length)return{kind:'unknown',order:false};await prepareAI();const tensor=new ort.Tensor('float32',makeInput(strokes),[1,1,128,128]);let result:any;try{result=await session.run({input:tensor});const ranking=rankingFromScores(probabilitiesFromLogits(result.logits.data)),selection=selectRegisteredCandidates(ranking,allowed),answer=registeredJudge(strokes,expected,selection);return{kind:answer.kind,order:answer.kind==='correct'&&strokeOrder(strokes,expected),best:selection.candidates[0],message:answer.message};}finally{tensor.dispose();if(result)for(const output of Object.values(result) as any[])output.dispose();}};
 const pending=queue.then(run,run);queue=pending.catch(()=>{});return pending;
}
export function mountAI(parent:HTMLElement){const box=document.createElement('div');box.className='ai-settings';const p=document.createElement('p');p.setAttribute('role','status');const refresh=()=>{if(!box.isConnected){listeners.delete(refresh);return;}p.textContent=aiStatus;};p.textContent=aiStatus;box.append(p);const retry=document.createElement('button');retry.textContent='AIを準備・再試行';retry.onclick=()=>{retry.disabled=true;void prepareAI().catch(()=>{}).finally(()=>{retry.disabled=false;refresh();});};const label=document.createElement('label');label.textContent='取得できない場合：モデルを選択';const file=document.createElement('input');file.type='file';file.accept='.onnx';file.onchange=()=>{if(file.files?.[0]){file.disabled=true;void prepareAI(file.files[0]).catch(()=>{}).finally(()=>{file.disabled=false;refresh();});}};label.append(file);box.append(retry,label);parent.append(box);listeners.add(refresh);}
