import './style.css';
import D from './data/themes.json';
import CLUES from './data/clues.json';
import { rng, shuffle, words, clean, verseScramble, cloze, wordsearch, letters, TARGET, refLabel, passage, makeClues, crossword } from './engine.js';
import { LANDING_URL } from './config.js';

// Sticker images are real files, so the browser can cache them.
const urls = import.meta.glob('./stickers/*.webp', { eager: true, query: '?url', import: 'default' });
const STK = Object.fromEntries(Object.entries(urls).map(([p, u]) => [p.split('/').pop().replace('.webp', ''), u]));
const img = id => STK[id] ? `<img src="${STK[id]}" alt="">` : '';
const CP = {old_testament_stories:['#E8913A','#A5560F'],new_testament_stories:['#3B82C4','#1F5A93'],christian_character_and_values:['#43A66B','#23703F'],faith_and_spiritual_growth:['#9B5DC9','#6A2F97']};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- worksheet ---------- */
const NAMES={crossword:'Crossword',wordsearch:'Word Search',letters:'Word Scramble',scramble:'Verse Scramble',cloze:'Fill in the Blanks'};
function how(p){
  if(p.type==='crossword')return'Read each clue and write the answer in the grid. The numbers match the clues.'+(p.bank?' Use the word bank to help you.':'');
  if(p.type==='wordsearch')return'Find the hidden words. They can go across, down, and diagonally.';
  if(p.type==='letters')return p.first?'Unscramble the letters to spell a word from the story. The first letter is already in place.':'Unscramble the letters to spell a word from the story.';
  if(p.type==='scramble')return'Put the pieces in the right order to write the verse.';
  return'Use the word bank to fill in the missing words.'+(p.extra?' Some words in the bank are not needed.':'');
}
const NOTES={
  crossword:{easy:'Up to 8 words, short clues, letter counts and a word bank.',medium:'Up to 10 words, letter counts, no word bank.',hard:'Up to 13 words, longer clues, no letter counts, no word bank.'},
  wordsearch:{easy:'10×10 grid, 6 short words, across and down only.',medium:'12×12 grid, 9 words, diagonals added.',hard:'15×15 grid, up to 13 words, forwards, backwards and diagonal.'},
  letters:{easy:'6 short words with the first letter in place.',medium:'8 words, all letters scrambled.',hard:'10 words, longer ones included.'},
  scramble:{easy:'2 verses, each on its own, in 3-word phrases.',medium:'Up to 3 verses, each on its own, in 2-word pieces.',hard:'Up to 4 verses, each on its own, one word at a time.'},
  cloze:{easy:'2 verses, each on its own, few blanks, first letter given.',medium:'Up to 3 verses, each on its own, more blanks.',hard:'Up to 4 verses, each on its own, many blanks, extra words in the bank.'}
};
function body(p,key){
  if(p.type==='scramble')return p.items.map((x,i)=>key?`<p class="verse vk"><b>${esc(x.ref)}</b> ${esc(x.answer)}</p>`:`<div class="vb"><div class="vref">${i+1}.${x.ref?' '+esc(x.ref):''}</div><div class="tiles">${x.words.map(w=>`<span class="tile">${esc(w)}</span>`).join('')}</div><div class="lines">${'<i></i>'.repeat(x.lines)}</div></div>`).join('');
  if(p.type==='cloze'){
    const vh=p.verses.map((v,i)=>{
      const tx=v.parts.map(x=>x.text!==undefined?esc(x.text):esc(x.pre)+(key?`<u class="filled">${esc(x.answer)}</u>`:`<span class="blank" style="min-width:${x.answer.length+2}ch"><sup>${x.n}</sup>${x.hint?`<b>${esc(x.answer[0])}</b>`:''}</span>`)+esc(x.suf)).join(' ');
      return key?`<p class="verse vk"><b>${esc(v.ref)}</b> ${tx}</p>`:`<div class="vb"><div class="vref">${i+1}.${v.ref?' '+esc(v.ref):''}</div><p class="verse">${tx}</p></div>`;
    }).join('');
    return vh+(key?'':`<ul class="bank">${p.bank.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`);
  }
  if(p.type==='crossword'){
    const g=p.grid.map(row=>`<tr>${row.map(c=>c?`<td class="cw">${c.n?`<sup>${c.n}</sup>`:''}${key?esc(c.ch):''}</td>`:'<td class="cx"></td>').join('')}</tr>`).join('');
    const li=e=>`<li value="${e.n}">${esc(e.clue)}${p.counts?` — ${e.len} letters`:''}</li>`;
    const bank=!key&&p.bank?`<ul class="bank">${p.bank.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:'';
    const clues=key?'':`<div class="clues"><div><h3>Across</h3><ol>${p.across.map(li).join('')}</ol></div><div><h3>Down</h3><ol>${p.down.map(li).join('')}</ol></div></div>`;
    return`<table class="cwg">${g}</table>`+bank+clues;
  }
  if(p.type==='letters')return`<div class="ls">${p.items.map((x,i)=>`<div><span>${i+1}.</span><span>${key?esc(x.a):esc(x.s)}</span>${key?'':'<i></i>'}</div>`).join('')}</div>`;
  const rows=p.grid.map((row,r)=>`<tr>${row.map((ch,c)=>`<td class="${key&&p.sol.has(r+','+c)?'hit':''}">${ch}</td>`).join('')}</tr>`).join('');
  return`<table class="grid">${rows}</table>`+(key?'':`<ul class="wordlist">${p.words.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`);
}
function sheet(th,p,key,ref,lv){
  const mode=$('#stk').value,c=CP[th.cat]||CP.old_testament_stories,on=mode!=='none';
  return`<article class="sheet lv-${lv}${mode==='bw'?' bw':''}" style="--acc:${c[0]};--accd:${c[1]}"><div class="name-line"><span>Name</span><i></i><span>Date</span><i></i></div>
  <div class="band">${on?img(th.stk[0]):''}<h2>${esc(th.title)}</h2>${on?img(th.stk[1]):''}</div><p class="sub">${esc(NAMES[p.type])}${key?' – Answer Key':''}${ref?' · '+esc(ref):''}</p>
  ${key?'<div style="height:.3in"></div>':`<p class="how">${how(p)}</p>`}${body(p,key)}
  <div class="strip">${on?th.stk.slice(2).map(img).join(''):''}</div>
  <footer>Made with Bible Puzzle Maker${p.type==='scramble'||p.type==='cloze'?' · World English Bible':''}</footer></article>`;
}

/* ---------- controls ---------- */
let seed=Date.now();
const cats=D.cats;
$('#theme').innerHTML=Object.keys(cats).map(c=>`<optgroup label="${esc(cats[c])}">${D.themes.map((t,i)=>t.cat===c?`<option value="${i}">${esc(t.title)}</option>`:'').join('')}</optgroup>`).join('');
function fillVerses(){
  const th=D.themes[$('#theme').value];
  $('#verse').innerHTML=th.verses.map((v,i)=>`<option value="${i}">${esc(v.r)} — ${esc(words(v.t).slice(0,6).join(' '))}…</option>`).join('');
  $('#verse').value='0';
}
/* ---------- render ---------- */
const emptyMsg=m=>{$('#preview').innerHTML=`<p class="empty">${m}</p>`};
function render(){
  const th=D.themes[$('#theme').value],type=$('#type').value,lv=$('#level').value,paper=$('#paper').value;
  const needV=type==='scramble'||type==='cloze';
  $('#verseWrap').hidden=$('#lenWrap').hidden=!needV;
  $('#levelNote').textContent=NOTES[type][lv];
  $('#pv').innerHTML=th.stk.map(img).join('');
  document.documentElement.style.setProperty('--sheet-w',paper==='A4'?'210mm':'8.5in');
  document.documentElement.style.setProperty('--sheet-h',paper==='A4'?'297mm':'11in');
  let st=$('#pageStyle');if(!st){st=document.createElement('style');st.id='pageStyle';document.head.append(st)}
  st.textContent=`@page{size:${paper==='A4'?'A4':'letter'};margin:0}`;
  const r=rng(seed);let p,ref='';
  if(needV){
    let len=$('#len').value;const auto=len==='auto';
    if(auto)len=String({easy:2,medium:3,hard:4}[lv]);
    const ps=passage(th,Number($('#verse').value),len,TARGET[type][lv]);
    if(auto){ // keep each page to a sensible size
      const cap=({scramble:{easy:30,medium:45,hard:60},cloze:{easy:45,medium:75,hard:120}})[type][lv];let tot=0;const keep=[];
      for(const v of ps.vs){const w=words(v.t).length;if(keep.length&&tot+w>cap)break;keep.push(v);tot+=w}
      ps.vs=keep;ps.ref=refLabel(keep);
    }
    ref=ps.ref;
    p=type==='scramble'?verseScramble(ps.vs,lv,r):cloze(ps.vs,lv,r);
  }else if(type==='crossword'){
    p=crossword(makeClues(th.vocab,th.verses,lv,CLUES).entries,lv,r);
    if(p.words.length<4)return emptyMsg('Not enough words for a crossword in this theme. Try another theme or age group.');
  }else{
    p=type==='wordsearch'?wordsearch(th.vocab,lv,r):letters(th.vocab,lv,r);
    if(!(p.words||p.items).length)return emptyMsg('Not enough words for this puzzle. Try another theme.');
  }
  $('#preview').innerHTML=sheet(th,p,false,ref,lv)+($('#key').checked?sheet(th,p,true,ref,lv):'');
}
$('#theme').addEventListener('input',()=>{fillVerses();render()});
['type','verse','len','level','paper','key','stk'].forEach(id=>$('#'+id).addEventListener('input',render));
$('#again').addEventListener('click',()=>{seed=Date.now();render()});
$('#print').addEventListener('click',()=>window.print());
$('#hdrStk').innerHTML=['lamb','dove','star'].map(img).join('');
// Optional "more puzzles coming" link: set LANDING_URL in src/config.js
if(/^https?:\/\//.test(LANDING_URL)&&!LANDING_URL.includes('YOUR-')){$('#more a').href=LANDING_URL;$('#more').hidden=false}
fillVerses();render();

// ----- install -----
let deferred;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#install').hidden = false; });
$('#install').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#install').hidden = true; });
if (/iphone|ipad/i.test(navigator.userAgent) && !(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone)) $('#iosHint').hidden = false;
