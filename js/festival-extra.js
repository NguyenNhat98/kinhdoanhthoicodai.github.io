/* Hội làng: thêm trò Đập niêu, Bắt vịt, Kéo co + hướng dẫn chơi cho mọi trò + hiệu ứng mượt */
(function () {
  'use strict';
  const F = window.Festival, $ = (q) => document.querySelector(q), rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = () => document.body.classList.contains('reduce-motion');
  const GUIDES = {
    throw: ['🎯 Ném còn', ['Kim chạy qua lại trên thanh; vùng xanh ở giữa là điểm trúng.', 'Nhấn “Ném còn” đúng lúc kim nằm trong vùng xanh.', 'Mỗi ván có 5 lần ném, trúng càng nhiều thưởng càng lớn.']],
    memory: ['🧺 Gánh hàng tìm đôi', ['Chạm để lật hai thẻ, cố nhớ vị trí từng nguyên liệu.', 'Hai thẻ giống nhau sẽ được giữ lại; khác nhau sẽ úp xuống.', 'Tìm đủ 6 cặp trong 18 lần thử. Ít lần thử hơn thì thưởng cao hơn.']],
    oanquan: ['🪨 Ô ăn quan', ['Chọn một ô dân phía dưới (ô có quân), rồi chọn hướng rải trái/phải.', 'Quân được rải lần lượt vào các ô kế tiếp. Ô kế còn dân thì bốc rải tiếp; ô kế trống thì ăn ô sau nó.', 'Hết lượt bạn đến lượt máy. Ai nhiều điểm hơn khi kết thúc thì thắng (mỗi quan = 10 điểm).']],
    dapnieu: ['🏺 Đập niêu', ['Các chiếc niêu nhô lên từ 9 lỗ trong chốc lát.', 'Chạm vào niêu để đập vỡ trước khi nó chìm xuống. Niêu vàng 🏆 được 3 điểm.', 'Đừng chạm vào lửa 🔥, sẽ bị trừ điểm. Thời gian 25 giây, đập liên tiếp để có combo.']],
    batvit: ['🦆 Bắt vịt', ['Vịt bơi ngang ao với nhiều tốc độ khác nhau.', 'Chạm vào vịt để bắt. Vịt vàng nhanh hơn nhưng được 3 điểm. Chạm hụt không bị trừ.', 'Bạn có 20 giây, bắt càng nhiều thưởng càng lớn.']],
    keoco: ['🪢 Kéo co', ['Gõ liên tục nút “Kéo!” để kéo lá cờ về phía bạn.', 'Máy kéo ngược lại và mạnh dần theo thời gian.', 'Kéo cờ sát mép bên bạn để thắng; hết 20 giây ai hơn cờ thì thắng.']]
  };
  const EXTRA = {
    dapnieu: ['🏺', 'Đập niêu', 'Chạm niêu đang nhô lên · 25 giây', 'Xu + nguyên liệu'],
    batvit: ['🦆', 'Bắt vịt', 'Vịt bơi ao, chạm để bắt · 20 giây', 'Xu + nguyên liệu'],
    keoco: ['🪢', 'Kéo co', 'Gõ thật nhanh đấu với máy', 'Xu + nguyên liệu']
  };
  F.extra = { dapnieu: 1, batvit: 1, keoco: 1 }; F.GUIDES = GUIDES; F.EXTRA = EXTRA; F.custom = {};
  const guideHtml = (t) => `<details class="game-guide" open><summary>📖 Cách chơi ${GUIDES[t][0]}</summary><ol>${GUIDES[t][1].map((x) => `<li>${x}</li>`).join('')}</ol></details>`;

  const mount = F.mount;
  F.mount = function (host) {
    mount(host);
    const cards = host.querySelector('.festival-cards'); if (!cards) return;
    cards.insertAdjacentHTML('beforeend', Object.entries(EXTRA).map(([k, v]) => `<button data-fgame="${k}"><i>${v[0]}</i><div><b>${v[1]}</b><small>${v[2]}</small><span>${v[3]}</span></div><em>Chơi →</em></button>`).join(''));
    cards.querySelectorAll('[data-fgame]').forEach((b) => { b.insertAdjacentHTML('beforeend', `<span class="g-help" data-gguide="${b.dataset.fgame}" role="button" aria-label="Cách chơi">?</span>`); });
  };
  document.addEventListener('click', (e) => {
    const h = e.target.closest('[data-gguide]'); if (!h) return;
    e.stopPropagation(); e.preventDefault(); const t = h.dataset.gguide;
    window.UI.modal(`<h3>${GUIDES[t][0]}</h3><ol class="g-steps">${GUIDES[t][1].map((x) => `<li>${x}</li>`).join('')}</ol><button class="btn gold" data-close>Đã hiểu</button>`);
  }, true);

  const start = F.start;
  F.start = function (type) {
    if (F.run && !F.run.done) return;
    if (F.extra[type]) startExtra(type); else start(type);
    const g = $('#festivalGame .folk-game'); if (g && GUIDES[type] && !g.querySelector('.game-guide')) g.insertAdjacentHTML('afterbegin', guideHtml(type));
  };
  F.startExtra = (t) => startExtra(t);

  function startExtra(type) {
    if (F.custom[type]) { F.run = { type, done: false, start: performance.now() }; return F.custom[type](F.run, $('#festivalGame')); }
    const r = F.run = { type, done: false, start: performance.now() }, host = $('#festivalGame'); if (!host) { F.run = null; return; }
    let body = '';
    if (type === 'dapnieu') {
      Object.assign(r, { score: 0, combo: 0, best: 0, left: 25, holes: Array(9).fill(0), nextSpawn: 0.4 });
      body = `<h3>🏺 Đập niêu</h3><div class="x-hud"><span id="xTime">⏱ 25</span><span id="xScore">Điểm 0</span><span id="xCombo" class="combo-pill"></span></div><div class="pot-board">${Array.from({ length: 9 }, (_, i) => `<button class="pot-hole" data-xhole="${i}" aria-label="Lỗ ${i + 1}"><span class="pot"></span></button>`).join('')}</div>`;
    } else if (type === 'batvit') {
      Object.assign(r, { score: 0, left: 20, ducks: [], nextSpawn: 0.2 });
      body = `<h3>🦆 Bắt vịt</h3><div class="x-hud"><span id="xTime">⏱ 20</span><span id="xScore">Bắt 0</span></div><div class="pond" id="pond"><i class="wave w1"></i><i class="wave w2"></i></div>`;
    } else {
      Object.assign(r, { pos: 50, left: 20, power: 1 });
      body = `<h3>🪢 Kéo co</h3><div class="x-hud"><span id="xTime">⏱ 20</span><span id="xScore">Ngang sức</span></div><div class="rope"><span class="rope-goal l">BẠN</span><span class="rope-goal r">MÁY</span><div class="rope-line"><b id="ropeMark">🚩</b></div></div><button class="btn gold big pull-btn" data-xpull>Kéo! 💪</button>`;
    }
    host.innerHTML = `<div class="folk-game game-${type}">${body}<div id="folkResult" role="status"></div><button class="btn ghost sm" data-faction="leave">Rời trò chơi</button></div>`;
    host.scrollIntoView({ behavior: reduce() ? 'instant' : 'smooth', block: 'start' });
    let last = performance.now();
    const frame = (t) => {
      if (F.run !== r || r.done || window.UI.page !== 'festival' || !$('#xTime')) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t; r.left -= dt; tick(r, dt);
      const tm = $('#xTime'); if (tm) tm.textContent = '⏱ ' + Math.max(0, Math.ceil(r.left));
      if (r.left <= 0) return end(r);
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  }

  function tick(r, dt) {
    if (r.type === 'dapnieu') {
      r.nextSpawn -= dt;
      if (r.nextSpawn <= 0) {
        const free = r.holes.map((h, i) => h ? -1 : i).filter((i) => i >= 0);
        if (free.length) {
          const i = free[Math.floor(Math.random() * free.length)], k = Math.random(), kind = k < 0.12 ? 'bomb' : k < 0.3 ? 'gold' : 'pot';
          r.holes[i] = { kind, t: rnd(0.8, 1.3) - Math.min(0.35, (25 - r.left) * 0.014) };
          const el = $(`[data-xhole="${i}"] .pot`); if (el) el.className = 'pot up ' + kind;
        }
        r.nextSpawn = rnd(0.28, 0.6);
      }
      r.holes.forEach((h, i) => {
        if (!h) return; h.t -= dt;
        if (h.t <= 0) { r.holes[i] = 0; const el = $(`[data-xhole="${i}"] .pot`); if (el) el.className = 'pot'; if (h.kind !== 'bomb') { r.combo = 0; hud(r); } }
      });
    } else if (r.type === 'batvit') {
      const pond = $('#pond'); if (!pond) return;
      r.nextSpawn -= dt;
      if (r.nextSpawn <= 0 && r.ducks.length < 7) {
        const gold = Math.random() < 0.2, dir = Math.random() < 0.5 ? 1 : -1, el = document.createElement('button');
        el.className = 'duck' + (gold ? ' gold' : ''); el.textContent = '🦆'; el.dataset.xduck = '1'; el.style.top = rnd(6, 78) + '%'; el.style.left = '0';
        el.style.scale = `${-dir} 1`; pond.appendChild(el);
        r.ducks.push({ el, x: dir > 0 ? -12 : 112, dir, v: rnd(14, 24) * (gold ? 1.7 : 1), gold, bob: rnd(0, 6) });
        r.nextSpawn = rnd(0.35, 0.8);
      }
      r.ducks = r.ducks.filter((d) => {
        if (d.caught) return false;
        d.x += d.dir * d.v * dt; d.bob += dt * 6; const out = d.x < -15 || d.x > 115;
        if (out) d.el.remove(); else d.el.style.translate = (d.x / 100 * (r.pw || (r.pw = pond.clientWidth || 300))) + 'px ' + (Math.sin(d.bob) * 3) + 'px';
        return !out;
      });
    } else {
      r.power += dt * 0.06; r.pos -= (0.95 + r.power * 1.55) * dt * 6;
      r.pos = Math.max(0, Math.min(100, r.pos)); drawRope(r);
      if (r.pos <= 3 || r.pos >= 97) r.left = 0;
    }
  }
  function drawRope(r) {
    const m = $('#ropeMark'); if (m) m.style.left = r.pos + '%';
    const s = $('#xScore'); if (s) s.textContent = r.pos > 58 ? 'Bạn đang thắng thế!' : r.pos < 42 ? 'Máy đang áp đảo!' : 'Ngang sức';
  }
  function hud(r) {
    const s = $('#xScore'), c = $('#xCombo'); if (s) s.textContent = 'Điểm ' + r.score;
    if (c) { c.textContent = r.combo > 1 ? `🔥 x${r.combo}` : ''; c.classList.remove('up'); void c.offsetWidth; c.classList.add('up'); }
  }
  function end(r) {
    if (r.type === 'dapnieu') F.finish(r, Math.min(30, Math.round(r.score * 0.8)), `Đập niêu được ${r.score} điểm (combo cao nhất ${r.best}).`);
    else if (r.type === 'batvit') F.finish(r, Math.min(30, r.score), `Bắt được ${r.score} điểm vịt.`);
    else { const w = r.pos > 52; F.finish(r, w ? 24 : r.pos > 45 ? 10 : 3, w ? 'Bạn thắng cuộc kéo co!' : 'Máy kéo thắng ván này.'); }
    const btn = $('.pull-btn'); if (btn) btn.disabled = true;
  }
  function burst(el, txt) {
    if (reduce()) return; const b = el.getBoundingClientRect(), f = document.createElement('span');
    f.className = 'tap-float'; f.textContent = txt; f.style.left = (b.left + b.width / 2) + 'px'; f.style.top = (b.top + b.height / 3) + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 800);
  }
  document.addEventListener('pointerdown', (e) => {
    const r = F.run; if (!r || r.done) return;
    const hole = e.target.closest('[data-xhole]');
    if (hole && r.type === 'dapnieu') {
      const i = Number(hole.dataset.xhole), h = r.holes[i], pot = hole.querySelector('.pot');
      if (!h) { r.combo = 0; hud(r); return; }
      r.holes[i] = 0; pot.className = 'pot smash ' + h.kind;
      if (h.kind === 'bomb') { r.score = Math.max(0, r.score - 3); r.combo = 0; burst(hole, '−3 💥'); window.Audio2.sfx('error'); window.Game.buzz(40); }
      else { r.combo++; r.best = Math.max(r.best, r.combo); const pts = (h.kind === 'gold' ? 3 : 1) + (r.combo >= 5 ? 1 : 0); r.score += pts; burst(hole, '+' + pts); window.Audio2.sfx('tap'); window.Game.buzz(10); }
      setTimeout(() => { if (pot.classList.contains('smash')) pot.className = 'pot'; }, 320); hud(r); return;
    }
    const duck = e.target.closest('[data-xduck]');
    if (duck && r.type === 'batvit') {
      const d = r.ducks.find((x) => x.el === duck); if (!d || d.caught) return; d.caught = true; r.score += d.gold ? 3 : 1;
      duck.classList.add('caught'); burst(duck, d.gold ? '+3 ⭐' : '+1'); window.Audio2.sfx('coin'); setTimeout(() => duck.remove(), 350);
      const s = $('#xScore'); if (s) s.textContent = 'Bắt ' + r.score; return;
    }
    const pull = e.target.closest('[data-xpull]');
    if (pull && r.type === 'keoco') { r.pos = Math.min(100, r.pos + 3.2); drawRope(r); window.Game.buzz(6); pull.classList.remove('pop'); void pull.offsetWidth; pull.classList.add('pop'); }
  });
})();
