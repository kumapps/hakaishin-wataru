// Adopted v0.4 candidate logic, unchanged.
import LABELS from "./labels.json";
import {acceptanceJudge} from "./acceptance.js";
// Candidate scope is learned/registered kanji, never the expected answer alone.
// Thresholds are experimental guards, not calibrated handwriting probabilities.
const REGISTERED_CONFIG=Object.freeze({version:'0.4.0',minimumRawScore:.10,minimumScopedScore:.70,minimumScopedMargin:.20,unregisteredKanjiVetoScore:.70});
function isModelKanji(char){return /^[\u3400-\u4dbf\u4e00-\u9fff]$/u.test(char)&&LABELS.some(l=>l.char===char);}
function parseRegistered(text){
 const chars=Array.from(text.replace(/[\s,、，;；]/gu,'')),unique=[...new Set(chars)];
 const invalid=unique.filter(c=>!isModelKanji(c));
 if(invalid.length)throw Error('候補にできない文字：'+invalid.join('・')+'（モデル対応の漢字だけを指定してください）');
 if(!unique.length)throw Error('登録済み漢字を1字以上指定してください。');
 return unique;
}
function probabilitiesFromLogits(logits){
 if(logits.length!==LABELS.length||Array.from(logits).some(x=>!Number.isFinite(x)))throw Error('AIの出力を確認できません。');
 const max=Math.max(...logits),weights=Array.from(logits,x=>Math.exp(x-max)),total=weights.reduce((a,b)=>a+b,0);return weights.map(x=>x/total);
}
function rankingFromScores(scores){return scores.map((score,i)=>({char:LABELS[i].char,score})).sort((a,b)=>b.score-a.score);}
function selectRegisteredCandidates(ranking,registered,complete=true){
 const allowed=new Set(registered),inside=ranking.filter(c=>allowed.has(c.char)),mass=inside.reduce((s,c)=>s+c.score,0);
 const candidates=inside.map(c=>({char:c.char,rawScore:c.score,score:mass>0?c.score/mass:0})).slice(0,5),best=candidates[0],globalBest=ranking[0];
 let reason=null;
 if(!complete)reason='旧記録は全候補のスコアがないため、候補限定の確定判定には実AIの再認識が必要です。';
 else if(!best||best.rawScore<REGISTERED_CONFIG.minimumRawScore)reason='登録済み漢字に十分な認識の根拠がありません。';
 else if(best.score<REGISTERED_CONFIG.minimumScopedScore||best.score-(candidates[1]?.score??0)<REGISTERED_CONFIG.minimumScopedMargin)reason='登録済み漢字の候補が競合しています。';
 else if(globalBest&&!allowed.has(globalBest.char)&&isModelKanji(globalBest.char)&&globalBest.score>=REGISTERED_CONFIG.unregisteredKanjiVetoScore)reason='未登録の漢字「'+globalBest.char+'」を強く認識しています。登録済みの字へ無理に置き換えません。';
 return{registered:[...registered],candidates,registeredMass:mass,globalBest,complete,reason,config:REGISTERED_CONFIG};
}
function registeredJudge(raw,expected,selection){
 if(!selection.registered.includes(expected))return{kind:'unregistered',message:'出題字が登録済み一覧にありません。',candidateScope:selection};
 if(selection.reason)return{kind:'uncertain',message:selection.reason,candidateScope:selection};
 return{...acceptanceJudge(raw,expected,selection.candidates),candidateScope:selection};
}

export {REGISTERED_CONFIG,probabilitiesFromLogits,rankingFromScores,selectRegisteredCandidates,registeredJudge};
