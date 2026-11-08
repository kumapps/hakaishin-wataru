export type Point={x:number;y:number};
export const W=128,H=68;
export const tiles=Array.from({length:H},()=>Array(W).fill(1));
function floor(x:number,y:number,w:number,h:number){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)tiles[j][i]=0;}
floor(3,45,18,21);floor(9,39,5,7);floor(5,24,20,16);floor(15,17,5,8);floor(3,2,22,16);
// The new wings connect to the powder store without moving the old map.
floor(24,3,9,3);floor(30,2,22,21);floor(51,7,6,4);floor(55,2,23,21);
floor(77,7,9,4);floor(84,2,19,22);floor(102,7,7,4);floor(107,2,19,22);
floor(91,23,4,7);floor(84,28,20,20);
// Hidden southwest entrance, two dead ends, then a bent route to the lower book room.
floor(80,20,5,2);floor(80,20,2,16);
floor(76,25,6,2);floor(72,24,5,4);
floor(75,30,7,2);floor(71,29,5,5);
floor(78,34,4,2);floor(78,34,2,10);floor(78,42,8,2);
for(const [x,y] of [[72,24],[73,24],[74,24],[71,29],[72,29],[73,29]])tiles[y][x]=6;
tiles[32][74]=3;
for(let y=7;y<=13;y++)for(let x=91;x<=95;x++)tiles[y][x]=1;
for(const [x,y] of [[86,6],[100,18],[109,5],[123,5],[110,19],[122,19],[86,32],[101,44]])tiles[y][x]=3;
floor(29,12,6,5); // optional quiet alcove
for(let y=8;y<=12;y++)for(let x=35;x<=41;x++)tiles[y][x]=1;
for(let y=4;y<=20;y++)for(let x=62;x<=64;x++)tiles[y][x]=2;
for(const y of [8,9,10,16,17,18])for(let x=62;x<=64;x++)tiles[y][x]=0;
// A physical return corridor reaches the root hall only through the watergate.
floor(56,22,3,7);floor(24,27,35,3);
for(const [x,y] of [[32,8],[33,18],[47,6],[49,20],[58,14],[66,4],[76,19]])tiles[y][x]=3;
// Branching entry, a side alcove, and an eastern return corridor.
floor(1,55,5,4);floor(20,43,7,5);floor(25,25,2,19);
for(let x=8;x<=16;x++)tiles[58][x]=1;
// Ruined walls split the root hall into a long route and two crossings.
for(let x=9;x<=16;x++)tiles[32][x]=1;
for(let y=25;y<=28;y++)tiles[y][18]=1;
// Shelves in the powder store leave wide paths on either side.
for(let x=17;x<=22;x++)tiles[12][x]=1;
// Water channel with two crossing stone bridges.
for(let y=47;y<64;y++)tiles[y][6]=2;
for(const y of [53,54,60,61])tiles[y][6]=0;
for(let x=6;x<24;x++)tiles[29][x]=2;
for(let x=14;x<=17;x++)tiles[29][x]=0;
for(const [x,y] of [[10,50],[17,57],[8,34],[21,33],[9,10],[20,7],[6,15]])tiles[y][x]=3;
export const objects=[
 {id:'entrance-stone',name:'札の小部屋の石碑',x:2.5,y:56.5,text:'寄り道の先に、漢字の札が残っていた。'},
 {id:'root-stone',name:'根に包まれた石碑',x:10.5,y:27.5,text:'石碑は、木の根に包まれている。'},
 {id:'powder-stone',name:'火薬庫の石碑',x:10.5,y:15.5,text:'石碑に、消えかけた文字が浮かんでいる。'},
 {id:'exit-stone',name:'奥への門',x:16.5,y:3.5,text:'この先へ、社の道は続いている。'},
 {id:'work-scroll',name:'古い巻物',x:13.5,y:14.5,text:'赤く燃える力と、病をいやすもの。二つを結べば、岩をも砕く力となる。'},
 {id:'shortcut-lever',name:'近道の仕掛け',x:24.5,y:26.5,text:'門の裏側に、仕掛けがある。'},
 {id:'shortcut-gate',name:'近道の門',x:25.5,y:40.5,text:'こちら側からは開かない。'},
 {id:'powder-rock',name:'崩れた岩',x:16.5,y:6.5,text:'岩が奥への道をふさいでいる。'},
 {id:'wind-stone',name:'風の札の石碑',x:45.5,y:5.5,text:'風の弱まる場所に、漢字の札が残っている。'},
 {id:'wind-marker',name:'風の回廊の石板',x:30.5,y:14.5,text:'風が静まる道は、ふたたびひとつになる。'},
 {id:'water-stone',name:'水の札の石碑',x:58.5,y:5.5,text:'水辺の石碑に、漢字の札が浮かんでいる。'},
 {id:'ice-scroll',name:'水辺の巻物',x:68.5,y:5.5,text:'水がこごえて姿を変え、川のように進んでゆく。二つを結べば、冷たい道が敵へ走る。'},
 {id:'water-gate',name:'古い水門',x:57.5,y:20.5,text:'強い流れが、帰り道をふさいでいる。'},
 {id:'water-exit',name:'封印の間への門',x:74.5,y:3.5,text:'奥の祭壇へ続く門。'},
 {id:'spirit-stone',name:'霊の札の石碑',x:87.5,y:5.5,text:'守る力にも、壊す力にも、文字は宿る。'},
 {id:'guardian-record',name:'守り神の記録',x:99.5,y:5.5,text:'守り神は社を守っていた。だが、文字を喰らう黒い影が、その力を歪めた。'},
 {id:'library-marker',name:'書庫の石板',x:77.5,y:40.5,text:'奥に眠る力は、社の守り神よりも強い。'},
 {id:'library-gate',name:'書庫の崩れた壁',x:92.5,y:24.5,text:'石が積み重なり、こちら側からは動かせない。'},
 {id:'library-lever',name:'書庫の近道の仕掛け',x:92.5,y:28.5,text:'壁の裏に、仕掛けが残っている。'},
 {id:'reaper-scroll',name:'書庫の巻物',x:94.5,y:30.5,text:'命の終わりをあらわす字と、人をこえた力を持つもの。二つを結べば、影の力が宿る。'},
 {id:'altar-stone',name:'祭壇の石碑',x:117.5,y:3.5,text:'炎が消え、社に光が戻った。'},
 {id:'entry-marker',name:'古い道標',x:13.5,y:44.5,text:'西の小部屋に、札をおさめる。'},
];
for(const o of objects)tiles[Math.floor(o.y)][Math.floor(o.x)]=4;
export const enemies=[{kind:'stone',x:11.5,y:47.5},{kind:'root',x:19.5,y:34.5},{kind:'root',x:19.5,y:12.5},{kind:'root',x:21.5,y:12.5}];
export function area(p:Point){return p.x>=107?'ボス祭壇':p.x>=84&&p.y>=28?'隠し書庫':p.x>=70&&p.x<84&&(p.y>=23||p.x>=78&&p.y>=19)?'遺跡の裏通路':p.x>=79?'封印の間':p.x>=55?'水路の間':p.x>=29&&p.y<24?'風の回廊':p.x>=29?'水路の帰り道':p.y>=42?'入口':p.y>=21?'根の広間':'火薬庫';}
export function tileKey(x:number,y:number){return y*W+x;}
export function clear(p:Point,r=.23,ignored:ReadonlySet<number>=new Set()){if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;for(let y=Math.floor(p.y-r);y<=Math.floor(p.y+r);y++)for(let x=Math.floor(p.x-r);x<=Math.floor(p.x+r);x++){const t=tiles[y]?.[x];if(t===0||((t===3||t===4)&&ignored.has(tileKey(x,y))))continue;const cx=Math.max(x,Math.min(p.x,x+1)),cy=Math.max(y,Math.min(p.y,y+1));if(Math.hypot(p.x-cx,p.y-cy)<r)return false;}return true;}
export function lineClear(a:Point,b:Point){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*12);for(let i=1;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;const t=tiles[Math.floor(y)]?.[Math.floor(x)];if(t===undefined||[1,2,3].includes(t))return false;}return true;}
export function near(p:Point,o:typeof objects[number]){return Math.hypot(p.x-o.x,p.y-o.y)<1.75&&lineClear(p,o);}
