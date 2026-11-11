// Pure puzzle engine: no DOM, so it can be tested in Node.
/* ---------- puzzle engine ---------- */
export function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export function shuffle(arr,r){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export const words = t => t.trim().split(/\s+/).filter(Boolean);
export const clean = w => w.normalize('NFD').replace(/[^A-Za-z]/g,'').toUpperCase();

// Verse scramble: easy = 3-word phrases, medium = 2-word pieces, hard = single words
export const CHUNK={easy:3,medium:2,hard:1};
export function verseScramble(vs,lv,r){
  const k=CHUNK[lv];
  const items=vs.map(v=>{
    const o=words(v.t),ch=[];
    for(let i=0;i<o.length;i+=k)ch.push(o.slice(i,i+k).join(' '));
    let s=shuffle(ch,r);
    for(let i=0;i<10&&ch.length>1&&s.join('|')===ch.join('|');i++)s=shuffle(ch,r);
    return{ref:v.r,words:s,answer:o.join(' '),lines:Math.min(3,Math.max(1,Math.ceil(o.length/10)))};
  });
  return{type:'scramble',items};
}
// Fill in the blanks: easy = few blanks + first-letter hint, medium = more blanks, hard = most blanks + extra words in the bank
export const RATIO={easy:.15,medium:.25,hard:.35},MINLEN={easy:5,medium:4,hard:4};
export function cloze(vs,lv,r){
  let n=0;const verses=[],ans=[],all=[];
  vs.forEach(v=>{
    const tk=words(v.t).map(raw=>{const m=raw.match(/^([^\p{L}]*)(.*?)([^\p{L}]*)$/u);return{pre:m[1],core:m[2],suf:m[3]}});
    tk.forEach(t=>all.push(t.core));
    const cand=tk.map((t,i)=>t.core.length>=MINLEN[lv]?i:-1).filter(i=>i>=0);
    const want=Math.min(cand.length,Math.max(2,Math.round(cand.length*RATIO[lv])));
    const pick=[];
    for(const i of shuffle(cand,r)){if(pick.length>=want)break;if(!pick.some(j=>Math.abs(j-i)<2))pick.push(i)}
    for(const i of shuffle(cand,r)){if(pick.length>=want)break;if(!pick.includes(i))pick.push(i)}
    const set=new Set(pick),parts=[];
    tk.forEach((t,i)=>{if(set.has(i)){n++;ans.push(t.core);parts.push({n,answer:t.core,pre:t.pre,suf:t.suf,hint:lv==='easy'})}else parts.push({text:t.pre+t.core+t.suf})});
    verses.push({ref:v.r,parts});
  });
  const bank=[...ans],low=b=>b.toLowerCase();
  if(lv==='hard')for(const d of shuffle(all.filter(c=>c.length>=4),r)){if(bank.length>=ans.length+3)break;if(!bank.some(b=>low(b)===low(d)))bank.push(d)}
  return{type:'cloze',verses,bank:shuffle(bank,r),extra:bank.length-ans.length};
}
export const SIZE={easy:10,medium:12,hard:15},COUNT={easy:6,medium:9,hard:13},MAXL={easy:8,medium:10,hard:15};
export const D1=[[0,1],[1,0]],D2=[...D1,[1,1]],D3=[...D2,[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]],DIRS={easy:D1,medium:D2,hard:D3};
export function vocabPool(list,lv,maxLen,min){
  const all=[...new Set(list.map(clean))].filter(w=>w.length>=3&&w.length<=maxLen.hard);
  const pool=all.filter(w=>w.length<=maxLen[lv]);
  return pool.length>=min?pool:all;
}
export function wordsearch(list,lv,r){
  const size=SIZE[lv];
  const pool=vocabPool(list,lv,{easy:Math.min(8,size),medium:Math.min(10,size),hard:size},6);
  const picked=shuffle(pool,r).slice(0,COUNT[lv]).sort((a,b)=>b.length-a.length);
  const grid=Array.from({length:size},()=>Array(size).fill('')),sol=new Set(),placed=[];
  for(const w of picked){
    for(let k=0;k<300;k++){
      const[dr,dc]=DIRS[lv][Math.floor(r()*DIRS[lv].length)],r0=Math.floor(r()*size),c0=Math.floor(r()*size);
      const re=r0+dr*(w.length-1),ce=c0+dc*(w.length-1);
      if(re<0||re>=size||ce<0||ce>=size)continue;
      let ok=true;for(let i=0;i<w.length;i++){const ch=grid[r0+dr*i][c0+dc*i];if(ch&&ch!==w[i]){ok=false;break}}
      if(!ok)continue;
      for(let i=0;i<w.length;i++){grid[r0+dr*i][c0+dc*i]=w[i];sol.add((r0+dr*i)+','+(c0+dc*i))}
      placed.push(w);break;
    }
  }
  for(let i=0;i<size;i++)for(let j=0;j<size;j++)if(!grid[i][j])grid[i][j]='ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(r()*26)];
  return{type:'wordsearch',size,grid,sol,words:placed.sort()};
}
// Letter scramble: easy = short words with first letter given, medium = 8 words, hard = 10 longer words
export function letters(list,lv,r){
  const n={easy:6,medium:8,hard:10}[lv];
  const pool=vocabPool(list,lv,{easy:7,medium:10,hard:12},n);
  const items=shuffle(pool,r).slice(0,n).map(a=>{
    let s;for(let i=0;i<10;i++){s=lv==='easy'?[a[0],...shuffle([...a.slice(1)],r)]:shuffle([...a],r);if(s.join('')!==a)break}
    return{s:s.join(' '),a};
  });
  return{type:'letters',items,first:lv==='easy'};
}

/* ---------- passages ---------- */
export const TARGET={scramble:{easy:18,medium:30,hard:50},cloze:{easy:45,medium:75,hard:120}};
export const pr=r=>{const m=r.match(/^(.+) (\d+):(\d+)$/);return[m[1],+m[2],+m[3]]};
export function adjacent(a,b){const[x,c1,v1]=pr(a),[y,c2,v2]=pr(b);return x===y&&((c1===c2&&v2===v1+1)||(c2===c1+1&&v2===1))}
export function refLabel(vs){
  const a=vs[0].r,b=vs[vs.length-1].r;if(a===b)return a;
  const[x,c1]=pr(a),[y,c2,v2]=pr(b);
  return c1===c2&&x===y?`${a}–${v2}`:x===y?`${a}–${c2}:${v2}`:`${a} – ${b}`;
}
export function passage(th,start,len,target){
  const V=th.verses;let end=start,wc=words(V[start].t).length;
  const more=()=>end+1<V.length&&adjacent(V[end].r,V[end+1].r);
  if(len==='auto'){while(more()&&wc<target){end++;wc+=words(V[end].t).length}}
  else{for(let k=1;k<Number(len)&&more();k++)end++}
  const vs=V.slice(start,end+1);
  return{text:vs.map(v=>v.t).join(' '),ref:refLabel(vs),vs};
}


export const STOP=new Set('a about after all also am an and any are as at be because been before being but by can could did do does for from had has have he her him his how i if in into is it its me my no not of on or our out she so some than that the their them then there these they this those to up us was we were what when which who whom will with would you your thee thou thy thine unto shall hath said say saith came come let one even upon yet them very shall made make already through only should whoever without within among between those every each many much more most such same both while where whose thereof also them shall'.split(' '));
export function extractWords(text){
  const freq={},proper={},rx=/[A-Za-z][A-Za-z'’]*/g;let m;
  while((m=rx.exec(text))){
    const w=m[0].replace(/['’]s$/i,'');if(/['’]/.test(w))continue;const lw=w.toLowerCase();
    if(w.length<3||w.length>12||STOP.has(lw))continue;
    const before=text.slice(0,m.index).trimEnd().slice(-1);
    if(/^[A-Z]/.test(w)&&before&&!'.?!:;“"‘('.includes(before))proper[lw]=1;
    freq[lw]=(freq[lw]||0)+1;
  }
  const stem=w=>w.replace(/(ing|ed|es|s)$/,''),best={};
  for(const w of Object.keys(freq)){const s=(proper[w]?3:0)+freq[w]+Math.min(w.length,9)/9,k=stem(w);if(!best[k]||s>best[k].s)best[k]={w,s}}
  return Object.values(best).sort((a,b)=>b.s-a.s).slice(0,13).map(x=>x.w.toUpperCase());
}
export const KW={lion:/\blions?\b/i,lamb:/\b(lambs?|sheep|flock)\b/i,dove:/\bdoves?\b/i,ark:/\b(ark|flood)\b/i,whale:/\b(whale|great fish)\b/i,fish2:/\bfish(es)?\b/i,boat:/\b(boat|ship|storm)\b/i,loaves:/\b(bread|loaves)\b/i,chalice:/\b(cup|wine)\b/i,grapes:/\b(grapes?|vine|vineyard)\b/i,staff:/\b(staff|rod|shepherds?)\b/i,tablets:/\b(commandments?|tablets)\b/i,bush:/\b(bush|flame|fire)\b/i,tomb:/\b(tomb|grave|risen)\b/i,palm:/\bpalms?\b/i,lily:/\b(lil(y|ies)|flowers?)\b/i,angel:/\bangels?\b/i,nativity:/\b(manger|born)\b/i,star:/\bstars?\b/i,town:/\b(city|town|Jerusalem|Bethlehem|Babel)\b/i,camel:/\bcamels?\b/i,gift:/\b(gifts?|gave|give)\b/i,trumpet:/\btrumpets?\b/i,treasure:/\b(treasure|gold|silver|riches)\b/i,thorns:/\bthorns?\b/i,moses:/\bMoses\b/,throne:/\bthrone\b/i,david:/\bDavid\b/,donkey:/\b(donkey|ass)\b/i,wisemen:/\b(magi|wise men)\b/i,scroll:/\b(scroll|scripture|written|law)\b/i,church:/\b(church|temple|synagogue)\b/i,boy:/\b(child|children|boy|pray|prayed|prayer)\b/i,harp:/\b(harp|psalm|sing|song)\b/i,robe:/\b(robe|coat|garment)\b/i,well:/\bwell\b/i,jesus:/\b(Jesus|Christ)\b/,cross:/\bcross\b/i,crown:/\b(crown|king|kingdom)\b/i,bible:/\b(word|truth|faith)\b/i};
export function pickStickers(text){
  const hits=Object.keys(KW).map(k=>[k,(text.match(new RegExp(KW[k].source,KW[k].flags+'g'))||[]).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  for(const d of['bible','dove','star','lamb','crown','lily'])if(!hits.includes(d))hits.push(d);
  return hits.slice(0,5);
}

// ---------- Crossword ----------
// Clues are the verse text with the answer blanked out, so nothing is invented.
export function makeClues(list,verses,lv,fallback={}){
  const half={easy:3,medium:4,hard:6}[lv],entries=[],skipped=[],seen=new Set();
  const core=t=>clean(t.replace(/['’]s$/i,''));
  for(const raw of list){
    const word=clean(raw);
    if(word.length<3||word.length>12){skipped.push(raw);continue}
    if(seen.has(word))continue;
    seen.add(word);
    let hit=null;
    for(const v of verses){
      const tk=words(v.t),idx=tk.findIndex(t=>core(t)===word);
      if(idx>=0&&(!hit||tk.length<hit.tk.length))hit={v,tk,idx};
    }
    if(!hit){if(fallback[word])entries.push({word,clue:fallback[word]});else skipped.push(raw);continue}
    const {v,tk,idx}=hit,a=Math.max(0,idx-half),b=Math.min(tk.length,idx+half+1);
    const text=tk.slice(a,b).map(t=>{
      if(core(t)!==word)return t;
      const m=t.match(/^([^\p{L}]*)(.*?)([^\p{L}]*)$/u);return m[1]+'_____'+m[3];
    }).join(' ');
    let ref=v.r||'';
    if(ref.toUpperCase().split(/[^A-Z]+/).includes(word))ref=ref.replace(/^.*?(\d+:\d+)$/,'$1'); // don't give the answer away in the reference
    entries.push({word,clue:(a>0?'… ':'')+text+(b<tk.length?' …':'')+(ref?` (${ref})`:'')});
  }
  return{entries,skipped};
}
function cwLayout(order,max,rand,lim){
  const cells=new Map(),placed=[],get=(r,c)=>cells.get(r+','+c),B={r0:0,r1:0,c0:0,c1:0};
  const fit=(w,r,c,down)=>{
    const dr=down?1:0,dc=down?0:1;
    if(get(r-dr,c-dc)||get(r+dr*w.length,c+dc*w.length))return -1;
    let cross=0;
    for(let i=0;i<w.length;i++){
      const rr=r+dr*i,cc=c+dc*i,cell=get(rr,cc);
      if(cell){if(cell.ch!==w[i]||(down?cell.v:cell.h))return -1;cross++}
      else if(get(rr+dc,cc+dr)||get(rr-dc,cc-dr))return -1;
    }
    return cross;
  };
  const gapFree=(w,r,c,down)=>{
    // No empty square may sit between two letters (it would look like a missing letter).
    const dr=down?1:0,dc=down?0:1,L=w.length;
    if(get(r-2*dr,c-2*dc)||get(r+dr*(L+1),c+dc*(L+1)))return false;
    for(let i=0;i<L;i++){const rr=r+dr*i,cc=c+dc*i;if(get(rr,cc))continue;if(get(rr+2*dc,cc+2*dr)||get(rr-2*dc,cc-2*dr))return false}
    return true;
  };
  const put=(e,r,c,down)=>{
    const w=e.word,dr=down?1:0,dc=down?0:1;
    for(let i=0;i<w.length;i++){
      const k=(r+dr*i)+','+(c+dc*i),cell=cells.get(k)||{ch:w[i],h:false,v:false};
      if(down)cell.v=true;else cell.h=true;cells.set(k,cell);
    }
    placed.push({e,r,c,down});
    B.r0=Math.min(B.r0,r);B.c0=Math.min(B.c0,c);B.r1=Math.max(B.r1,r+dr*(w.length-1));B.c1=Math.max(B.c1,c+dc*(w.length-1));
  };
  put(order[0],0,0,false);
  B.r1=0;B.c1=order[0].word.length-1;
  for(const e of order.slice(1)){
    if(placed.length>=max)break;
    let best=null;
    for(const [k,cell] of cells){
      const [r0,c0]=k.split(',').map(Number);
      for(let i=0;i<e.word.length;i++){
        if(e.word[i]!==cell.ch)continue;
        for(const down of [false,true]){
          const r=r0-(down?i:0),c=c0-(down?0:i),s=fit(e.word,r,c,down);
          if(s<=0||!gapFree(e.word,r,c,down))continue;
          const L=e.word.length,nr0=Math.min(B.r0,r),nr1=Math.max(B.r1,r+(down?L-1:0)),nc0=Math.min(B.c0,c),nc1=Math.max(B.c1,c+(down?0:L-1));
          if(nr1-nr0+1>lim||nc1-nc0+1>lim)continue;
          const growth=(nr1-nr0+1)*(nc1-nc0+1)-(B.r1-B.r0+1)*(B.c1-B.c0+1),sc=s+rand()*0.5-growth*0.03;
          if(!best||sc>best.sc)best={sc,r,c,down};
        }
      }
    }
    if(best)put(e,best.r,best.c,best.down);
  }
  let r0=1e9,r1=-1e9,c0=1e9,c1=-1e9;
  for(const k of cells.keys()){const [r,c]=k.split(',').map(Number);r0=Math.min(r0,r);r1=Math.max(r1,r);c0=Math.min(c0,c);c1=Math.max(c1,c)}
  return{placed,cells,r0,c0,rows:r1-r0+1,cols:c1-c0+1,area:(r1-r0+1)*(c1-c0+1),dens:cells.size/((r1-r0+1)*(c1-c0+1))};
}
export function crossword(entries,lv,rand){
  const max={easy:8,medium:10,hard:13}[lv];
  const E=entries.filter(e=>e.word.length>=3&&e.word.length<=12);
  let best=null;
  for(let a=0;a<400&&E.length;a++){
    const order=E.map(e=>({e,k:e.word.length+rand()*4})).sort((x,y)=>y.k-x.k).slice(0,max+4).map(x=>x.e);
    const L=cwLayout(order,max,rand,{easy:12,medium:14,hard:16}[lv]);
    if(!best||L.placed.length>best.placed.length||(L.placed.length===best.placed.length&&L.dens>best.dens))best=L;
  }
  if(!best)return{type:'crossword',grid:[],across:[],down:[],words:[],counts:false,bank:null};
  const grid=Array.from({length:best.rows},()=>Array(best.cols).fill(null));
  for(const [k,cell] of best.cells){const [r,c]=k.split(',').map(Number);grid[r-best.r0][c-best.c0]={ch:cell.ch,n:0}}
  const starts=best.placed.map(p=>({...p,r:p.r-best.r0,c:p.c-best.c0})).sort((x,y)=>x.r-y.r||x.c-y.c);
  let n=0;const across=[],down=[];
  for(const p of starts){
    const cell=grid[p.r][p.c];if(!cell.n)cell.n=++n;
    (p.down?down:across).push({n:cell.n,word:p.e.word,clue:p.e.clue,len:p.e.word.length});
  }
  const byN=(a,b)=>a.n-b.n;across.sort(byN);down.sort(byN);
  const ws=starts.map(p=>p.e.word);
  return{type:'crossword',grid,across,down,words:ws,counts:lv!=='hard',bank:lv==='easy'?[...ws].sort():null};
}
