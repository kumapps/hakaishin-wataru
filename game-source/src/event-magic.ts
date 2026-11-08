import type {Progress} from './state';
import {journey} from './journey';
import {hasCleared} from './respawn';
import {spellUnavailable} from './spell-ui';
import data from './tutorial-data.json';

export type MagicPuzzle={
 id:string;title:string;description:string;expectedSpell:string;
 completed:'rocksCleared'|'waterGateOpened';success:string;
 requires:{spells?:readonly string[];read?:readonly string[];victories?:readonly string[]};
};
export const MAGIC_PUZZLES:readonly MagicPuzzle[]=[
 {id:'powder-rock',title:'崩れた岩',description:'岩が奥への道をふさいでいる。',expectedSpell:'gunpowder',completed:'rocksCleared',success:'岩が砕けた！　奥への道が開いた',requires:{spells:['gunpowder']}},
 {id:'water-gate',title:'古い水門',description:'強い流れが、帰り道をふさいでいる。',expectedSpell:'ice_flow',completed:'waterGateOpened',success:'流れが鎮まり、根の広間への近道が開いた！',requires:{spells:['ice_flow']}},
];
export function magicPuzzleReady(state:Progress,puzzle:MagicPuzzle){
 const j=journey(state),r=puzzle.requires;
 return (r.spells??[]).every(id=>data.spells.some(s=>s.id===id&&(s.initially_registered||j.spells.includes(id))))
  &&(r.read??[]).every(id=>state.read.includes(id))
  &&(r.victories??[]).every(id=>hasCleared(state,id));
}
export function resolvePuzzleSpell(state:Progress,puzzle:MagicPuzzle,spellId:string){
 const j=journey(state);if(j[puzzle.completed])return 'completed';
 const spell=data.spells.find(s=>s.id===spellId);
 if(!magicPuzzleReady(state,puzzle)||!spell||spellUnavailable(state,spell))return 'unavailable';
 if(spellId!==puzzle.expectedSpell)return 'no-effect';
 j[puzzle.completed]=true;if(!state.read.includes(puzzle.id))state.read.push(puzzle.id);
 return 'success';
}
