(function () {
  'use strict';
  const G = window.Game, C = window.CFG, F = window.Festival = { run: null };
  const $ = q => document.querySelector(q);
  const tiles = ['trada-lime','trada-peach','trada-lotus','xoi-rice','banhmi-egg','mycay-shrimp'];
  const picture = id => `<img src="assets/sprites/${id}.png" alt="${id.split('-').slice(1).join(' ')}">`;
  function ledger() {
    const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0,10);
    const saved = G.S.flags.festival;
    if (!saved || saved.day !== day) G.S.flags.festival = { day, rounds: 0, earned: 0 };
    return G.S.flags.festival;
  }
  F.mount = host => {
    F.run = null;
    const l = ledger();
    host.innerHTML = `<section class="page festival-page"><div class="festival-hero"><small>GÓC SÂN ĐÌNH</small><h2>Hội làng vui</h2><p>Chơi khéo tay, rinh nguyên liệu.<br>Một khoảng nghỉ giữa những ca bán.</p><span>🪁</span></div><div class="festival-budget">🎁 Còn ${Math.max(0,5-l.rounds)}/5 lượt nhận thưởng hôm nay · Đã kiếm ${G.fmt(l.earned)} xu</div><div class="festival-cards"><button data-fgame="throw"><i>🎯</i><div><b>Ném còn</b><small>Canh vòng sáng · 5 lần ném</small><span>Xu + một ít nguyên liệu</span></div><em>Chơi →</em></button><button data-fgame="oanquan"><i>🪨</i><div><b>Ô ăn quan</b><small>Rải dân, ăn ô · đấu với máy</small><span>Chiến thuật trên sân đình</span></div><em>Chơi →</em></button><button data-fgame="memory"><i>🧺</i><div><b>Gánh hàng tìm đôi</b><small>Nhớ 6 cặp nguyên liệu · 18 lần thử</small><span>Trò phụ ở hội làng</span></div><em>Chơi →</em></button></div><p class="muted">Chơi miễn phí. Hết lượt thưởng vẫn có thể chơi luyện tập. Thưởng chuyển thẳng vào túi xu và kho của quầy đã mở. Lượt thưởng làm mới lúc 0 giờ Việt Nam.</p><div id="festivalGame"></div></section>`;
  };
  F.start = type => {
    if (F.extra && F.extra[type]) return F.startExtra(type);
    if (!['throw','memory','oanquan'].includes(type) || F.run && !F.run.done) return;
    const r = F.run = { type, done:false, start:performance.now() };
    const host = $('#festivalGame'); if (!host) { F.run=null; return; }
    let html='';
    if(type==='throw') {
      Object.assign(r,{shots:0,hits:0,angle:0,nextShot:0});
      html=`<h3>🎯 Ném còn qua vòng</h3><p>Nhấn Ném khi quả còn đi vào dải xanh ở giữa. Mỗi ván có 5 lần ném.</p><div class="throw-scene"><span class="throw-hoop">◯</span><div class="throw-meter"><span class="throw-zone"></span><i id="throwNeedle"></i></div><span class="throw-ball">🪁</span></div><p id="throwScore">Lần ném 1/5 · Trúng 0</p><button class="btn gold big" data-faction="throw">Ném còn</button>`;
      const frame=()=>{
        if(F.run!==r || r.done || !$('#throwNeedle') || window.UI.page!=='festival')return;
        r.angle=50+45*Math.sin((performance.now()-r.start)/850);
        $('#throwNeedle').style.left=r.angle+'%';
        r.raf=requestAnimationFrame(frame);
      };
      r.raf=requestAnimationFrame(frame);
    } else if(type==='memory') {
      const deck=tiles.concat(tiles);
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
      Object.assign(r,{deck,chosen:[],matched:[],tries:0,locked:false});
      html=`<h3>🧺 Gánh hàng tìm đôi</h3><p>Lật hai thẻ cùng nguyên liệu. Tìm đủ 6 cặp trong 18 lần thử.</p><p id="memoryScore">0/6 cặp · 0/18 lần</p><div class="memory-board">${deck.map((_,i)=>`<button data-faction="flip" data-index="${i}" aria-label="Lật thẻ ${i+1}"><span>❀</span></button>`).join('')}</div>`;
    } else {
      Object.assign(r,{pits:[10,5,5,5,5,5,10,5,5,5,5,5],banks:[0,0],turn:0,moves:0});
      html=`<h3>🪨 Ô ăn quan</h3><p>Chọn ô dân phía dưới và hướng rải. Ô kế trống thì ăn ô tiếp theo; ô kế còn dân thì rải tiếp. Không bốc ô quan.</p><div class="oanquan-score" id="quanScore"></div><div class="oanquan-board" id="quanBoard"></div><div class="seg"><button data-faction="direction" data-direction="1" class="on">Rải sang phải →</button><button data-faction="direction" data-direction="-1">← Rải sang trái</button></div><p class="muted">Biến thể hội làng: mỗi quan trị giá 10 điểm. Hết dân trên một phía: dùng 5 điểm để rải lại; thiếu điểm hoặc hết cả hai quan thì kết thúc và thu dân phía mình. Tối đa 60 lượt.</p>`;
      r.direction=1;
    }
    host.innerHTML=`<div class="folk-game">${html}<div id="folkResult" role="status"></div><button class="btn ghost sm" data-faction="leave">Rời trò chơi</button></div>`;
    if(type==='oanquan')renderQuan(r);
    host.scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth',block:'start'});
  };
  F.finish = (...a) => finish(...a);
  function finish(r, score, text) {
    if(r!==F.run || r.done)return;
    r.done=true; if(r.raf)cancelAnimationFrame(r.raf); if(r.timer)clearTimeout(r.timer);
    const l=ledger(); let reward=0,material='';
    if(l.rounds<5){
      reward=Math.round(5+Math.max(0,Math.min(30,score))); G.addCoins(reward);l.rounds++;l.earned+=reward;
      if(score>0){
        const eligible=C.shops.filter(s=>G.S.shops[s.id].unlocked);
        const shop=G.pick(eligible), items=C.items[shop.id].filter(i=>i.w>0 && !i.batch && !i.reuse);
        if(items.length){const item=G.pick(items),n=score>=15?3:1;G.give(shop.id,item.id,n);material=` +${n} ${item.name} (${shop.short})`;}
      }
      G.save();window.Audio2.sfx('coins');G.emit('festivalReward',{reward,material});
    }
    $('#folkResult').innerHTML=`<b>${text}</b><p>${reward?`🪙 +${reward} xu${material}`:'Đã hết 5 lượt thưởng hôm nay. Ván này là luyện tập.'}</p><button class="btn gold" data-faction="again">Chơi ván mới</button>`;
    const banner=$('.festival-budget');if(banner)banner.textContent=`🎁 Còn ${Math.max(0,5-l.rounds)}/5 lượt thưởng · Đã kiếm ${G.fmt(l.earned)} xu`;
    $('#festivalGame').querySelectorAll('[data-faction="throw"],[data-faction="flip"],[data-faction="pit"],[data-faction="direction"]').forEach(b=>b.disabled=true);
  }
  function renderQuan(r) {
    const board=$('#quanBoard');if(!board)return;
    const pit = (i, top) => `<button class="quan-pit ${i===0||i===6?'big-pit':''}" data-faction="pit" data-index="${i}" ${top||r.turn!==0||r.pits[i]===0?'disabled':''} aria-label="Ô ${i}, ${r.pits[i]} quân"><span>${i===0||i===6?'♜':'●'.repeat(Math.min(8,r.pits[i]))}</span><b>${r.pits[i]}</b></button>`;
    board.innerHTML=`${pit(0,true)}<div class="quan-rows"><div>${[11,10,9,8,7].map(i=>pit(i,true)).join('')}</div><div>${[1,2,3,4,5].map(i=>pit(i,false)).join('')}</div></div>${pit(6,true)}`;
    $('#quanScore').textContent=`Bạn ${r.banks[0]} · Máy ${r.banks[1]} — ${r.turn===0?'Đến lượt bạn':'Máy đang nghĩ…'} · lượt ${r.moves}/60`;
  }
  // Pure rule function, also used by browser verification.
  F.sow = (pits, start, direction) => {
    const a=pits.slice();let p=start,n=a[p],captured=0;a[p]=0;
    const next=i=>(i+direction+12)%12;
    for(let guard=0;guard<200;guard++){
      while(n>0){p=next(p);a[p]++;n--;}
      const q=next(p);
      if(q===0||q===6)break;
      if(a[q]>0){n=a[q];a[q]=0;p=q;continue;}
      let empty=q;
      while(a[empty]===0){const victim=next(empty);if(a[victim]===0)break;captured+=a[victim];a[victim]=0;empty=next(victim);}
      break;
    }
    return {pits:a,captured};
  };
  function endQuan(r) {
    const a=r.pits;let end=a[0]===0&&a[6]===0 || r.moves>=60;
    for(let side=0;side<2;side++){
      const ids=side===0?[1,2,3,4,5]:[7,8,9,10,11];
      if(ids.every(i=>a[i]===0)) { if(r.banks[side]>=5&&!end){r.banks[side]-=5;ids.forEach(i=>a[i]=1);}else end=true; }
    }
    if(!end)return false;
    [1,2,3,4,5].forEach(i=>{r.banks[0]+=a[i];a[i]=0;});[7,8,9,10,11].forEach(i=>{r.banks[1]+=a[i];a[i]=0;});
    renderQuan(r);
    const won=r.banks[0]>r.banks[1];finish(r,won?25:r.banks[0]===r.banks[1]?12:4,`${won?'Bạn thắng!':r.banks[0]===r.banks[1]?'Hòa ván!':'Máy thắng ván này.'} ${r.banks[0]} – ${r.banks[1]}`);return true;
  }
  function quanMove(r,i,direction){
    if(r.done||!r.pits[i])return;
    const result=F.sow(r.pits,i,direction);r.pits=result.pits;r.banks[r.turn]+=result.captured;r.moves++;r.turn=1-r.turn;
    if(endQuan(r))return;
    renderQuan(r);
    if(r.turn===1){r.timer=setTimeout(()=>{
      if(F.run!==r||r.done||window.UI.page!=='festival')return;
      let best=null;[7,8,9,10,11].filter(i=>r.pits[i]>0).forEach(i=>[1,-1].forEach(d=>{const result=F.sow(r.pits,i,d);if(!best||result.captured>best.score)best={i,d,score:result.captured};}));
      if(best)quanMove(r,best.i,best.d);
    },650);}
  }
  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-fgame]');if(start){F.start(start.dataset.fgame);return;}
    const b=e.target.closest('[data-faction]'),r=F.run;if(!b||!r)return;
    const action=b.dataset.faction;
    if(action==='leave'){if(r.timer)clearTimeout(r.timer);if(r.raf)cancelAnimationFrame(r.raf);F.run=null;$('#festivalGame').innerHTML='';return;}
    if(action==='again'){if(!r.done)return;F.start(r.type);return;}
    if(r.done)return;
    if(action==='throw' && r.type==='throw'){
      if(performance.now()<r.nextShot)return;
      r.nextShot=performance.now()+550;
      const hit=Math.abs(r.angle-50)<=12;r.shots++;if(hit)r.hits++;
      $('.throw-ball').style.setProperty('--throw-offset',(r.angle-50)*1.5+'px');
      $('.throw-ball').classList.remove('toss');void $('.throw-ball').offsetWidth;$('.throw-ball').classList.add('toss');
      b.setAttribute('aria-disabled','true');b.textContent='Quả còn đang bay…';
      r.timer=setTimeout(()=>{if(F.run!==r||r.done)return;b.setAttribute('aria-disabled','false');b.textContent='Ném còn';},550);
      window.Audio2.sfx(hit?'coin':'tap');$('#throwScore').textContent=`${hit?'Trúng vòng!':'Chệch rồi!'} · Đã ném ${r.shots}/5 · Trúng ${r.hits}`;
      if(r.shots>=5)finish(r,r.hits*5,`Trúng ${r.hits}/5 lần ném.`);
    } else if(action==='flip' && r.type==='memory'){
      const i=Number(b.dataset.index);if(r.locked||r.matched.includes(i)||r.chosen.includes(i))return;
      r.chosen.push(i);b.innerHTML=picture(r.deck[i]);b.classList.add('revealed');b.setAttribute('aria-label',r.deck[i]);
      if(r.chosen.length===2){r.tries++;const [a,c]=r.chosen;
        if(r.deck[a]===r.deck[c]){r.matched.push(a,c);r.chosen=[];[a,c].forEach(i=>{$(`[data-index="${i}"]`).classList.add('matched');$(`[data-index="${i}"]`).disabled=true;});}
        else{r.locked=true;r.timer=setTimeout(()=>{if(F.run!==r||r.done)return;r.chosen.forEach(i=>{const el=$(`[data-faction="flip"][data-index="${i}"]`);if(el){el.innerHTML='<span>❀</span>';el.classList.remove('revealed');el.setAttribute('aria-label','Lật thẻ '+(i+1));}});r.chosen=[];r.locked=false;},800);}
        $('#memoryScore').textContent=`${r.matched.length/2}/6 cặp · ${r.tries}/18 lần`;
        if(r.matched.length===12||r.tries>=18)finish(r,r.matched.length*2,`Tìm được ${r.matched.length/2}/6 cặp trong ${r.tries} lần thử.`);
      }
    } else if(action==='direction'&&r.type==='oanquan'){
      r.direction=Number(b.dataset.direction);b.parentElement.querySelectorAll('button').forEach(el=>el.classList.toggle('on',el===b));
    } else if(action==='pit'&&r.type==='oanquan'&&r.turn===0){const i=Number(b.dataset.index);if(i>=1&&i<=5)quanMove(r,i,r.direction);}
  });
})();
