/* ============================================================================
   HIỆU ỨNG QUẦY: màn "Mở cửa đón khách" (rèm kéo, đèn lồng, pháo giấy, hạt theo từng quầy),
   không khí động theo quầy (hơi nước, bong bóng, lá trà, tàn lửa…), khách bước vào có chuông cửa,
   hiệu ứng khi giao xong / khách bỏ đi, và vài âm thanh nhẹ bổ sung.
   Không đụng vào luật ca làm: chỉ quan sát giao diện và tạm dừng ca bằng WS.setPause('intro').
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, WS = window.WS, WUI = window.WUI;
  const $ = (q, r) => (r || document).querySelector(q);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = () => document.body.classList.contains('reduce-motion');
  const quality = () => { const q = parseInt(document.body.dataset.quality, 10); return isNaN(q) ? 2 : q; };

  const THEME = {
    trada:  { icon: '🍵', name: 'Trà Đá', line: 'Ấm trà xanh mát, đón khách đầu ngõ!', c1: '#2f7d4a', c2: '#d9f2c4', burst: ['🍃', '🌿', '💧', '✨', '🍵'], amb: ['🍃', '🌿', '💧', '🍃'] },
    trasua: { icon: '🧋', name: 'Trà Sữa', line: 'Trân châu dẻo thơm, ly nào cũng ngọt ngào!', c1: '#d9578a', c2: '#ffe0ec', burst: ['🫧', '🧋', '🌸', '✨', '💖'], amb: ['🫧', '🫧', '🌸', '✨'] },
    banhmi: { icon: '🥖', name: 'Bánh Mì', line: 'Lò than đỏ lửa, vỏ bánh giòn rụm thơm lừng!', c1: '#c27a1f', c2: '#ffe6b0', burst: ['🥖', '🌾', '✨', '♨️', '🔥'], amb: ['♨️', '🌾', '✨', '♨️'] },
    xoi:    { icon: '🍚', name: 'Xôi', line: 'Xôi nóng hổi, gói lá chuối xanh mướt!', c1: '#3c9559', c2: '#fff0b8', burst: ['🍚', '🌿', '♨️', '✨', '🌽'], amb: ['♨️', '🌿', '♨️', '✨'] },
    mycay:  { icon: '🌶️', name: 'Mỳ Cay', line: 'Nước dùng sôi sục, cay xé lưỡi, đã mới thôi!', c1: '#c4281a', c2: '#ffc07a', burst: ['🌶️', '🔥', '♨️', '✨', '🍜'], amb: ['🔥', '♨️', '🌶️', '✨'] }
  };
  const TH = (id) => THEME[id] || THEME.trada;

  /* ---------- âm thanh bổ sung (tự tổng hợp, tôn trọng cài đặt âm lượng hiệu ứng) ---------- */
  (function patchAudio() {
    const A = window.Audio2; if (!A || A._fx2) return; A._fx2 = true;
    const base = A.sfx;
    const tone = (type, f, t0, dur, vol, f2) => {
      const ctx = A.ctx, bus = A.sfxBus || ctx.destination, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + dur + 0.05);
    };
    A.sfx = function (type) {
      const custom = { bell: 1, drum: 1, whoosh: 1, tick: 1, pop: 1, win: 1 };
      if (!custom[type]) return base.apply(this, arguments);
      if (!A.ctx || A.ctx.state !== 'running' || (G.S && G.S.sfx <= 0)) return;
      const t = A.ctx.currentTime;
      try {
        if (type === 'bell') { tone('sine', 1568, t, 0.7, 0.2); tone('sine', 2093, t + 0.02, 0.6, 0.12); tone('triangle', 3136, t + 0.04, 0.4, 0.06); }
        else if (type === 'drum') { tone('sine', 150, t, 0.22, 0.5, 60); tone('triangle', 300, t, 0.08, 0.14, 150); }
        else if (type === 'whoosh') tone('sawtooth', 220, t, 0.35, 0.05, 1400);
        else if (type === 'tick') tone('square', 880, t, 0.06, 0.1);
        else if (type === 'pop') tone('sine', 420, t, 0.1, 0.22, 900);
        else if (type === 'win') [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, t + i * 0.1, 0.35, 0.22));
      } catch (_) { /* âm thanh là phần phụ */ }
    };
  })();
  const sfx = (t) => window.Audio2.sfx(t);

  /* ---------- hạt DOM dùng chung ---------- */
  function particle(host, txt, x, y, dx, dy, cls, life, size) {
    const e = document.createElement('span');
    e.className = 'oi-p ' + (cls || ''); e.textContent = txt;
    e.style.cssText = `left:${x}px;top:${y}px;--dx:${dx}px;--dy:${dy}px;font-size:${size || rnd(16, 28)}px;animation-duration:${life || 1.1}s`;
    host.appendChild(e); setTimeout(() => e.remove(), (life || 1.1) * 1000 + 60);
  }
  function confetti(host, w, colors, n) {
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i');
      e.className = 'oi-conf'; e.style.cssText = `left:${rnd(2, 98)}%;background:${colors[i % colors.length]};--sx:${rnd(-70, 70)}px;--r:${rnd(300, 900)}deg;animation-delay:${rnd(0, .5)}s;animation-duration:${rnd(1.3, 2.1)}s`;
      host.appendChild(e); setTimeout(() => e.remove(), 2800);
    }
  }

  /* ======================== MỞ CỬA ĐÓN KHÁCH ======================== */
  let introEl = null, introTimers = [];
  function endIntro(skipped) {
    if (!introEl) return;
    introTimers.forEach(clearTimeout); introTimers = [];
    const el = introEl; introEl = null;
    el.classList.add('gone'); setTimeout(() => el.remove(), 350);
    const ws = WS.state(); if (ws) WS.setPause('intro', false);
    arriveAll();
    if (window.Coach && !skipped) window.Coach.maybeTour(); else if (window.Coach) window.Coach.maybeTour();
    void skipped;
  }
  function intro(id) {
    if (introEl) endIntro(true);
    const host = $('#app'); if (!host) return;
    const T = TH(id), ws = WS.state();
    const min = ws ? Math.round(ws.total / 60) : 4;
    const lite = reduce() || quality() === 0;
    const o = introEl = document.createElement('div');
    o.className = 'oi' + (lite ? ' lite' : ''); o.dataset.shop = id;
    o.style.setProperty('--c1', T.c1); o.style.setProperty('--c2', T.c2);
    const title = 'Mở cửa đón khách!'.split('').map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    const lv = (k) => G.eqLv(id, k), hy = window.Events ? Math.round(window.Events.hyg(id)) : 90;
    const checks = [['🔌', 'Điện', lv('gen') > 0], ['📜', 'Giấy phép', lv('lic') > 0], ['🧪', 'ATTP', lv('attp') > 0], ['🧼', 'Vệ sinh ' + hy + '%', hy >= 60]];
    const hired = (G.S.flags.staff && G.S.flags.staff[id]) || {}, staffN = Object.keys(hired).filter((k) => hired[k] === 1).length;
    const walkers = Array.from({ length: 6 }, (_, i) => `<span class="oi-walk ${i % 2 ? 'r' : 'l'}" style="--k:${Math.floor(i / 2)};--w:${(i * 7 + 3) % 10}">${window.LivingMarket && window.LivingMarket.customer ? window.LivingMarket.customer(i * 3 + 1, id) : ''}</span>`).join('');
    const light = Number(document.body.dataset.light) || 1; o.dataset.light = light;
    o.innerHTML = `<div class="oi-sky"><i class="oi-sun"></i><i class="oi-cloud c1"></i><i class="oi-cloud c2"></i></div>
      <div class="oi-door l"><i class="oi-slat"></i><i class="oi-ring-h"></i></div><div class="oi-door r"><i class="oi-slat"></i><i class="oi-ring-h"></i></div>
      <div class="oi-rays"></div>
      <div class="oi-lamps"><i style="--k:0">🏮</i><i style="--k:1">🏮</i><i style="--k:2">🏮</i><i style="--k:3">🏮</i><i style="--k:4">🏮</i></div>
      <div class="oi-center"><div class="oi-emblem"><i class="oi-ring a"></i><i class="oi-ring b"></i><span>${T.icon}</span></div>
      <h2 class="oi-title">${title}</h2><p class="oi-sub">${T.line}</p>
      <div class="oi-checks">${checks.map((c, i) => `<span class="${c[2] ? 'ok' : 'no'}" style="--i:${i}"><i>${c[0]}</i><b>${c[1]}</b><em>${c[2] ? '✔' : '!'}</em></span>`).join('')}</div>
      <small class="oi-tip">Ca ${ws && ws.tutorial ? 'hướng dẫn' : min + ' phút'}${staffN ? ' · ' + staffN + ' nhân viên chào khách' : ''} · chạm để bỏ qua</small></div>
      <div class="oi-sign"><div class="oi-sign-in"><b class="f">ĐÓNG CỬA</b><b class="b">MỞ CỬA</b></div></div>
      <div class="oi-ribbon"><i class="rl"></i><i class="rr"></i><u class="bow">🎀</u><u class="scis">✂️</u></div>
      <div class="oi-walkers">${walkers}</div>
      <div class="oi-fx"></div>`;
    host.appendChild(o);
    if (ws) WS.setPause('intro', true);
    o.addEventListener('pointerdown', () => endIntro(true));
    const fx = $('.oi-fx', o), r = host.getBoundingClientRect(), cx = r.width / 2, cy = r.height * 0.4;
    const at = (ms, fn) => introTimers.push(setTimeout(fn, ms));
    if (lite) { at(900, () => endIntro()); return; }
    const vf = window.UI && window.UI.vfx;
    at(60, () => sfx('whoosh'));
    at(250, () => { sfx('gong'); for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283, m = rnd(70, 150); particle(fx, T.burst[i % T.burst.length], cx, cy, Math.cos(a) * m, Math.sin(a) * m, 'burst', 1.1); } });
    at(650, () => { o.classList.add('checking'); sfx('tick'); });
    checks.forEach((c, i) => at(750 + i * 260, () => { sfx(c[2] ? 'coin' : 'tap'); const e = $(`.oi-checks span:nth-child(${i + 1})`, o); if (e) { const b = e.getBoundingClientRect(); particle(fx, c[2] ? '✨' : '⚠️', b.left - host.getBoundingClientRect().left + b.width / 2, b.top - host.getBoundingClientRect().top, 0, -30, 'rise', .9, 16); } }));
    at(1000, () => { sfx('tick'); sfx('bell'); G.buzz && G.buzz([20, 30, 50]); confetti(fx, r.width, [T.c1, T.c2, '#ffd54a', '#ff6b6b', '#ffffff'], 30); });
    at(1850, () => { o.classList.add('cut'); sfx('snip' in {} ? 'snip' : 'tick'); sfx('pop'); });
    at(2000, () => { o.classList.add('flip'); sfx('whoosh'); if (vf && vf.fireworks) vf.fireworks(cx, r.height * .28); });
    at(2150, () => { o.classList.add('open'); sfx('gong'); if (vf && vf.sparkle) vf.sparkle(cx, r.height * .5, 24); });
    at(2300, () => { for (let i = 0; i < 16; i++) particle(fx, T.burst[i % T.burst.length], rnd(20, r.width - 20), r.height * 0.85, rnd(-30, 30), -rnd(260, 520), 'rise', rnd(1.2, 1.9), rnd(18, 30)); sfx('cheer'); if (vf && vf.spawnCoins) vf.spawnCoins(cx, r.height * .6, 8); });
    at(3300, () => endIntro());
  }

  /* ======================== KHÁCH VÀO QUẦY ======================== */
  const seen = {};           // id đơn -> trạng thái đã hiệu ứng
  let seenShift = null;
  function arriveAll() {
    document.querySelectorAll('#stall .cust[data-id]').forEach((c, i) => { c.style.setProperty('--ai', i); c.classList.remove('arrive'); void c.offsetWidth; c.classList.add('arrive'); });
  }
  function onQueue(q) {
    const ws = WS.state(); if (!ws) return;
    if (seenShift !== ws) { seenShift = ws; Object.keys(seen).forEach((k) => delete seen[k]); }
    let newCount = 0;
    q.querySelectorAll('.cust[data-id]').forEach((c) => {
      const id = c.dataset.id, st = c.classList.contains('done') ? 'done' : c.classList.contains('left') ? 'left' : 'wait';
      if (seen[id] === undefined) {
        seen[id] = st; if (!introEl) { c.style.setProperty('--ai', newCount++); c.classList.add('arrive'); }
      } else if (seen[id] !== st) {
        seen[id] = st; const face = c.querySelector('.c-face');
        if (st === 'done') { c.classList.add('happy'); if (face) heart(face); }
        else if (st === 'left') c.classList.add('angry');
      }
    });
    if (newCount && !introEl && !(G.S && G.S.settings.shopBell === false)) sfx('bell');
  }
  function heart(face) {
    if (reduce()) return; const b = face.getBoundingClientRect(), host = document.body;
    for (let i = 0; i < 4; i++) { const h = document.createElement('span'); h.className = 'oi-p rise tiny'; h.textContent = ['💖', '✨', '😊', '⭐'][i]; h.style.cssText = `left:${b.left + b.width / 2}px;top:${b.top}px;--dx:${rnd(-26, 26)}px;--dy:${-rnd(30, 60)}px;font-size:14px;animation-duration:.9s;position:fixed;z-index:95`; host.appendChild(h); setTimeout(() => h.remove(), 1000); }
  }
  new MutationObserver((list) => {
    for (const m of list) {
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (!t) continue;
      const q = t.closest && t.closest('[data-w-queue]'); if (q) { onQueue(q); return; }
      if (m.addedNodes && m.addedNodes.length) { const fq = $('[data-w-queue]'); if (fq) { onQueue(fq); return; } }
    }
  }).observe(document.body, { childList: true, subtree: true });

  /* ======================== KHÔNG KHÍ QUẦY ======================== */
  const BGFX = {
    petal:   { amb: ['🌸', '🌸', '🌺', '✨'], mode: 'fall' }, leaf: { amb: ['🍃', '🍂', '🌿', '🍃'], mode: 'fall' },
    firefly: { amb: ['✨', '💛', '✨', '🌟'], mode: 'ember' }, snow: { amb: ['❄️', '✨', '❄️', '🌨️'], mode: 'fall' },
    lantern: { amb: ['🏮', '✨', '🏮', '🎐'], mode: 'rise' }, rain: { amb: ['💧', '💧', '🌧️', '💧'], mode: 'fall' }
  };
  function ambient() {
    const st = $('#stall'); if (!st || !st.dataset.shop || reduce()) return;
    const q = quality(); if (q === 0) return;
    const cfg = (G.S && G.S.settings) || {}, kind = BGFX[cfg.bgfx], T = TH(st.dataset.shop);
    const dens = [0.5, 1, 1.7][(cfg.fxDensity || 2) - 1] || 1, n = Math.max(3, Math.round((q === 1 ? 7 : 13) * dens));
    const set = kind ? kind.amb : T.amb;
    st.dataset.ambMode = kind ? kind.mode : (st.dataset.shop === 'trada' ? 'fall' : st.dataset.shop === 'mycay' ? 'ember' : 'rise');
    let h = '<div class="st-amb" aria-hidden="true"><i class="st-glow a"></i><i class="st-glow b"></i><i class="st-shaft"></i>';
    for (let i = 0; i < n; i++) h += `<span style="--x:${rnd(2, 96).toFixed(1)}%;--s:${rnd(14, 28).toFixed(0)}px;--d:${rnd(5, 10).toFixed(1)}s;--dl:${(-rnd(0, 10)).toFixed(1)}s;--w:${rnd(-30, 30).toFixed(0)}px">${set[i % set.length]}</span>`;
    st.insertAdjacentHTML('beforeend', h + '</div>');
  }

  /* thẻ "Hôm nay" ở màn chuẩn bị: ngày, ánh sáng, danh hiệu, mục tiêu chương, mẹo quầy */
  const TIPS = {
    trada: ['Rửa bát sớm để không thiếu bát khi đông khách.', 'Giữ vòi đến sát vạch rồi nhả: rót tràn sẽ mất điểm.', 'Thêm mật đúng theo phiếu, đừng thêm dư.'],
    trasua: ['Chọn đường và đá trước khi rót để dung tích mục tiêu tính đúng.', 'Giữ vòi trà đúng nền rồi mới rót sữa.', 'Khuấy, ép nắp rồi mới giao để đạt hoàn hảo.'],
    banhmi: ['Lấy bánh ra khi thanh lò vào vùng vàng, đừng chờ đến sẫm.', 'Rạch bánh trước khi phết pate và thêm nhân.', 'Có khay thì chuẩn bị sẵn một ổ cho giờ cao điểm.'],
    xoi: ['Hấp mẻ xôi trước ca: nếp là thứ tốn thời gian nhất.', 'Dùng gạt để sửa lượng muỗng xôi cho đúng phiếu.', 'Xôi ngũ sắc cần đủ năm màu, đừng bỏ sót.'],
    mycay: ['Hạ rổ rồi vớt mì khi thanh chạm vùng xanh.', 'Chốt đúng cấp cay khách yêu cầu, hơn hay kém đều bị trừ.', 'Múc nước dùng đúng số vá theo cỡ tô.']
  };
  const LIGHT = ['Trời trong', 'Ban ngày', 'Hoàng hôn', 'Đêm đèn lồng'];
  function brief() {
    const st = $('#stall'); if (!st || !st.dataset.shop || st.querySelector('.st-bench') || st.querySelector('.desk-brief')) return;
    const start = st.querySelector('.pp-start'); if (!start) return;
    const id = st.dataset.shop, T = TH(id), ch = G.chapterDef && G.chapterDef(), tips = TIPS[id] || [];
    const light = LIGHT[parseInt(document.body.dataset.light, 10) || 0] || LIGHT[0];
    const el = document.createElement('div'); el.className = 'pp-info desk-brief';
    el.innerHTML = `<div class="db-head"><span>${T.icon}</span><b>Hôm nay ở ${T.name}</b></div>
      <div class="db-chips"><span>📅 Ngày ${G.S.day}</span><span>🌤 ${light}</span><span>🏅 ${G.rankName()}</span></div>
      ${tips.length ? `<div class="db-tip">💡 ${tips[(G.S.day + id.length) % tips.length]}</div>` : ''}`;
    start.after(el);
  }
  if (WUI) {
    const render = WUI.render;
    WUI.render = function () { render.apply(this, arguments); ambient(); brief(); };
  }
  let startedAt = -1e9;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#stall [data-w="start"]'); if (!b) return;
    // handler gốc đã chạy ở pha nổi bọt trước (đăng ký sớm hơn); chỉ chạy cảnh mở cửa khi ca thật sự bắt đầu
    setTimeout(() => { const ws = WS.state(); if (ws && performance.now() - startedAt > 600) { startedAt = performance.now(); intro(ws.shop); } }, 0);
  });
  document.addEventListener('click', (e) => { if (e.target.closest('#stall [data-w="back"]')) endIntro(true); }, true);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#stall [data-live="door"]'); if (!b) return;
    const st = $('#stall'); if (st) { st.classList.remove('door-flash'); void st.offsetWidth; st.classList.add('door-flash'); }
    sfx('bell');
  });
})();
