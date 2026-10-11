/* ============================================================================
   BẢN ĐỒ CHỢ CỔ: ảnh nền 1672×941, camera kéo + hai ngón phóng to, điểm chạm quầy/NPC/nhập hàng,
   thẻ thông tin gian, chợ đổi theo tiến trình (quầy khóa tối, NPC đông dần).
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG;
  const MM = { x: 0, y: 0, s: 0.8, min: 0.45, max: 1.7, W: 1672, H: 941, drag: null, pts: new Map(), sel: null };
  window.MM = MM;
  const $ = (q, r) => (r || document).querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = (t) => window.Audio2.sfx(t);

  MM.mount = function (host) {
    host.innerHTML = `<div class="map" id="map">
      <div class="map-stage" id="mapStage" style="width:${MM.W}px;height:${MM.H}px">
        <img class="map-img" src="assets/market.jpg" alt="Chợ làng cổ" draggable="false">
        <div class="map-glow"></div><div class="map-walkers" id="walkers"></div><div class="map-hs" id="hs"></div>
      </div>
      <div class="map-vig"></div>
      <div class="map-chap" id="mapChap"></div>
      <div class="map-ctl"><button data-m="zi" aria-label="Phóng to">＋</button><button data-m="zo" aria-label="Thu nhỏ">－</button><button data-m="home" aria-label="Về quán đang chọn">⌖</button><button data-m="find" aria-label="Tìm quầy">🔎</button></div>
      <div class="map-card" id="mapCard" hidden></div></div>`;
    MM.stage = $('#mapStage'); MM.el = $('#map');
    buildHotspots(); buildWalkers(); bind(); MM.fit(true); MM.refresh();
  };

  /* ---------- camera ---------- */
  MM.view = () => ({ w: MM.el.clientWidth, h: MM.el.clientHeight });
  MM.clampCam = function () {
    const v = MM.view(), W = MM.W * MM.s, H = MM.H * MM.s;
    MM.x = W <= v.w ? (v.w - W) / 2 : Math.max(v.w - W, Math.min(0, MM.x));
    MM.y = H <= v.h ? (v.h - H) / 2 : Math.max(v.h - H, Math.min(0, MM.y));
  };
  MM.apply = function () {
    MM.clampCam();
    MM.stage.style.transform = `translate(${MM.x}px,${MM.y}px) scale(${MM.s})`;
    MM.stage.style.setProperty('--inv', (1 / Math.max(0.6, MM.s)).toFixed(3));
  };
  MM.fit = function (initial) {
    const v = MM.view(); MM.min = Math.max(0.3, v.h / MM.H);
    if (initial) { MM.s = Math.max(MM.min, 0.85); MM.focus(...G.shopDef(MM.sel && MM.sel.id || 'trada').map, false); } else { MM.s = Math.max(MM.min, MM.s); MM.apply(); }
  };
  MM.focus = function (px, py, anim) {
    const v = MM.view(), tx = v.w / 2 - px * MM.s, ty = v.h * 0.42 - py * MM.s;
    if (!anim) { MM.x = tx; MM.y = ty; MM.apply(); return; }
    const x0 = MM.x, y0 = MM.y, t0 = performance.now();
    const f = (n) => { const k = Math.min(1, (n - t0) / 500), e = 1 - Math.pow(1 - k, 3); MM.x = x0 + (tx - x0) * e; MM.y = y0 + (ty - y0) * e; MM.apply(); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  MM.zoom = function (f, cx, cy) {
    const v = MM.view(); cx = cx == null ? v.w / 2 : cx; cy = cy == null ? v.h / 2 : cy;
    const ns = Math.max(MM.min, Math.min(MM.max, MM.s * f)), k = ns / MM.s;
    MM.x = cx - (cx - MM.x) * k; MM.y = cy - (cy - MM.y) * k; MM.s = ns; MM.apply();
  };

  /* ---------- điểm chạm ---------- */
  function buildHotspots() {
    let h = '';
    C.shops.forEach((s) => { h += `<button class="hs shop" data-hs="shop" data-id="${s.id}" style="left:${s.map[0]}px;top:${s.map[1]}px"><span class="hs-pin"><i>${s.icon}</i></span><span class="hs-name">${esc(s.short)}</span><b class="hs-q" hidden></b></button>`; });
    C.npcs.forEach((n) => { h += `<button class="hs npc ${n.kind}" data-hs="npc" data-id="${n.id}" style="left:${n.at[0]}px;top:${n.at[1]}px"><span class="hs-pin"><i>${n.avatar}</i></span><span class="hs-name">${esc(n.kind === 'supply' ? 'Nhập hàng' : n.name)}</span></button>`; });
    $('#hs').innerHTML = h;
  }
  function buildWalkers() {
    const un = C.shops.filter((s) => G.S.shops[s.id].unlocked).length, n = G.S.settings.reduce ? 2 : Math.min(12, 3 + un * 2);
    const av = ['🚶', '🚶‍♀️', '🧑‍🌾', '👧', '🧓', '🛒'], paths = [[[520, 330], [1100, 350]], [[200, 600], [700, 560]], [[900, 560], [1400, 600]], [[300, 330], [800, 300]], [[600, 800], [1300, 780]], [[1000, 330], [1450, 420]]];
    let h = '';
    for (let i = 0; i < n; i++) { const p = paths[i % paths.length], dur = 26 + (i * 7) % 18; h += `<span class="wk" style="--x0:${p[0][0]}px;--y0:${p[0][1]}px;--dx:${p[1][0] - p[0][0]}px;--dy:${p[1][1] - p[0][1]}px;--d:${dur}s;--dl:-${(i * 5) % dur}s">${av[i % av.length]}</span>`; }
    $('#walkers').innerHTML = h;
  }
  MM.refresh = function () {
    $$('.hs.shop').forEach((b) => {
      const id = b.dataset.id, st = G.S.shops[id], ws = window.WS && window.WS.state();
      b.classList.toggle('locked', !st.unlocked); b.classList.toggle('live', !!(ws && ws.shop === id));
      const q = $('.hs-q', b); const n = ws && ws.shop === id ? ws.orders.filter((o) => o.status === 'wait').length : 0; q.hidden = !n; q.textContent = n;
      b.querySelector('.hs-pin i').textContent = st.unlocked ? G.shopDef(id).icon : '🔒';
    });
    const un = C.shops.filter((s) => G.S.shops[s.id].unlocked).length;
    if (MM.lastUn !== un) { MM.lastUn = un; buildWalkers(); }
    const ch = G.chapterDef(), el = $('#mapChap'); const ws0 = window.WS && window.WS.state();
    let html = ch ? `<b>📜 Chương ${ch.id}</b> <span>${esc(ch.title)}</span><small>${esc(ch.goal)} · ${esc(ch.prog(G.S))}</small>` : '<b>🏮 Chợ lên đèn</b><small>Bạn đã hoàn thành mọi chương. Tiếp tục kinh doanh dài hạn!</small>';
    if (ws0) html += `<button class="resume" data-m="resume">▶ Tiếp tục ca ở ${esc(G.shopDef(ws0.shop).short)}</button>`;
    if (el && el._h !== html) { el._h = html; el.innerHTML = html; }
  };
  const $$ = (q, r) => Array.from((r || document).querySelectorAll(q));

  /* ---------- thẻ thông tin ---------- */
  MM.showCard = function (kind, id) {
    const card = $('#mapCard'); card.hidden = false;
    if (kind === 'shop') {
      const d = G.shopDef(id), st = G.S.shops[id], ws = window.WS.state(); MM.sel = { id };
      if (!st.unlocked) {
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🔒</span><div><b>${esc(d.name)}</b><small>Chưa khai trương · ${esc(d.short)}</small></div></div><p>${esc(d.desc)}</p>
          <div class="mc-b"><button class="btn gold" data-m="buy" data-id="${id}" ${G.S.coins >= d.unlock ? '' : 'disabled'}>Mở quầy ${G.fmt(d.unlock)} ${window.Art.coin(14)}</button></div><small class="mc-need">${G.S.coins >= d.unlock ? 'Mua xong, thợ dựng biển, đèn bật sáng.' : `Cần thêm ${G.fmt(d.unlock - G.S.coins)} xu`}</small>`;
      } else {
        const q = ws && ws.shop === id ? ws.orders.filter((o) => o.status === 'wait').length : 0;
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">${d.icon}</span><div><b>${esc(d.name)}</b><small>Cấp ${st.level} · ${st.staff ? 'Tiểu nhị ' + st.staff : 'Chưa thuê tiểu nhị'}${q ? ' · ' + q + ' khách chờ' : ''}</small></div></div><p>${esc(d.desc)}</p>
          <div class="mc-b"><button class="btn gold" data-m="enter" data-id="${id}">${ws && ws.shop === id ? '▶ Tiếp tục ca' : 'Vào quầy'}</button><button class="btn ghost" data-m="up" data-id="${id}">Nâng cấp ${G.fmt(G.upgradeCost(id))}</button></div>`;
      }
    } else {
      const n = C.npcs.find((x) => x.id === id);
      if (n.kind === 'supply') {
        const open = C.shops.filter((s) => G.S.shops[s.id].unlocked);
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🧺</span><div><b>Nhập hàng</b><small>${esc(n.role)}</small></div></div><p>Chọn quầy để nhập nguyên liệu và vật tư.</p><div class="mc-b wrap">${open.map((s) => `<button class="btn ghost" data-m="stock" data-id="${s.id}">${s.icon} ${esc(s.short)}</button>`).join('')}</div>`;
      } else if (n.kind === 'gate') {
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🏮</span><div><b>Cổng Chợ Làng Cổ</b><small>Bảng sự kiện</small></div></div><p>Mỗi ca bán có thể gặp <b>giờ đông khách</b>. Quầy có trang bị mới đủ năng lực phục vụ. Hoàn thành các chương để chợ lên đèn.</p>`;
      } else card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">${n.avatar}</span><div><b>${esc(n.name)}</b><small>${esc(n.role)}</small></div></div><p>${esc(MM.npcLine(n))}</p><small class="mc-need">Quan hệ: ${'❤'.repeat(G.S.rel[n.id] || 0)}${'♡'.repeat(5 - (G.S.rel[n.id] || 0))}</small>`;
    }
    sfx('click'); window.Game.buzz(8);
  };
  MM.npcLine = function (n) {
    const ch = G.chapterDef(), id = ch ? ch.id : 7;
    const L = {
      batu: ['“Có tay nghề thì chẳng lo đói. Thử rót cho lão bá một bát xem nào.”', '“Trà sữa à? Món lạ của người phương xa. Ta nếm thử nhé.”', '“Bánh mì nóng thì phải kẹp lúc còn giòn.”', '“Hội làng sắp tới, giúp ta mẻ xôi ngũ sắc nhé.”', '“Mỳ cay bảy tầng? Ta già rồi, cấp 1 thôi.”', '“Cây đa phủ đèn thế này, ta vui lắm.”', '“Chợ này nhờ cháu mà sống lại.”'],
      tholo: ['“Ta làm khung ép nắp bằng gỗ và đồng. Có xu thì nâng cấp nhé.”', '“Máy ép càng nâng, cần hạ càng nhanh.”', '“Lò than cần chỉnh lại cho giữ ấm.”', '“Xửng hấp lớn hơn thì mẻ xôi nhiều hơn.”', '“Bếp mỳ cay cần chuông báo, ta làm cho cháu.”', '“Cầu đá sửa xong rồi đấy.”', '“Đồ nghề của cháu giờ ngang thợ cả.”'],
      hanmac: ['“Ta chưa dùng bữa sáng. Ít đường, đừng cay nhé.”', '“Trà hôm qua hơi ngọt. Hôm nay cho ta ít đường nhé.”', '“Bánh mì này vỏ giòn, ta sẽ viết thư pháp tặng quán.”', '“Xôi gấc đẹp lắm, ta vẽ lại.”', '“Cay cấp 3 là vừa với thư sinh.”', '“Đêm hoa đăng, ta viết câu đối nhé.”', '“Chọn chữ nào cho biển quán, tùy chưởng quầy.”'],
      duocsu: ['“Gian thảo mộc chưa khai trương. Hãy đợi nhé.”', '“Trà thảo mộc sẽ có sau.”', '“Khi năm quầy đủ đầy, ta mở gian.”', '“Hương thảo mộc cần mùa mưa.”', '“Ta chờ cháu ở cuối chương.”', '“Sắp rồi.”', '“Cảm ơn cháu đã tin ta.”'],
    };
    return (L[n.id] || ['…'])[Math.min(id, 7) - 1] || L[n.id][0];
  };

  /* ---------- sự kiện ---------- */
  function bind() {
    const el = MM.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.map-card,.map-ctl,.map-chap')) return;
      MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      MM.drag = { x: MM.x, y: MM.y, sx: e.clientX, sy: e.clientY, moved: false, pinch: null };
      if (MM.pts.size === 2) { const [a, b] = Array.from(MM.pts.values()); MM.drag.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: MM.s }; }
    });
    el.addEventListener('pointermove', (e) => {
      if (!MM.pts.has(e.pointerId) || !MM.drag) return;
      MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (MM.pts.size === 2 && MM.drag.pinch) {
        const [a, b] = Array.from(MM.pts.values()), d = Math.hypot(a.x - b.x, a.y - b.y), r = el.getBoundingClientRect();
        const ns = Math.max(MM.min, Math.min(MM.max, MM.drag.pinch.s * (d / MM.drag.pinch.d)));
        MM.zoom(ns / MM.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); MM.drag.moved = true; return;
      }
      const dx = e.clientX - MM.drag.sx, dy = e.clientY - MM.drag.sy;
      if (!MM.drag.moved && Math.abs(dx) + Math.abs(dy) > 8) { MM.drag.moved = true; try { el.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ } }
      if (MM.drag.moved) { MM.x = MM.drag.x + dx; MM.y = MM.drag.y + dy; MM.apply(); }
    });
    const end = (e) => { MM.pts.delete(e.pointerId); if (MM.pts.size < 2 && MM.drag) MM.drag.pinch = null; if (MM.pts.size === 0) setTimeout(() => { MM.drag = null; }, 30); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); MM.zoom(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    el.addEventListener('click', (e) => {
      window.Audio2.unlock();
      const hs = e.target.closest('.hs'), m = e.target.closest('[data-m]');
      if (hs) { if (MM.drag && MM.drag.moved) return; MM.showCard(hs.dataset.hs, hs.dataset.id); return; }
      if (!m) return;
      const a = m.dataset.m, id = m.dataset.id;
      if (a === 'zi') MM.zoom(1.25); else if (a === 'zo') MM.zoom(0.8);
      else if (a === 'home') { const sid = (MM.sel && MM.sel.id) || 'trada'; MM.focus(...G.shopDef(sid).map, true); }
      else if (a === 'find') MM.findMenu();
      else if (a === 'close') $('#mapCard').hidden = true;
      else if (a === 'buy') { if (G.buyShop(id)) { sfx('levelup'); G.buzz([30, 40, 60]); MM.showCard('shop', id); } else sfx('error'); }
      else if (a === 'enter') { $('#mapCard').hidden = true; window.WUI.open(id); }
      else if (a === 'up') { if (G.upgrade(id)) MM.showCard('shop', id); else { sfx('error'); window.UI.toast('Chưa đủ xu để nâng cấp.', 'err'); } }
      else if (a === 'stock') { $('#mapCard').hidden = true; window.WUI.restock(id); }
      else if (a === 'resume') { const ws = window.WS.state(); if (ws) window.WUI.open(ws.shop); }
      else if (a === 'go') { $('#mapCard').hidden = true; MM.focus(...G.shopDef(id).map, true); MM.showCard('shop', id); }
    });
    window.addEventListener('resize', () => { MM.fit(false); });
  }
  MM.findMenu = function () {
    const card = $('#mapCard'); card.hidden = false;
    card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🔎</span><div><b>Tìm quầy</b><small>Chạm để di chuyển camera</small></div></div><div class="mc-b wrap">${C.shops.map((s) => `<button class="btn ghost" data-m="go" data-id="${s.id}">${G.S.shops[s.id].unlocked ? s.icon : '🔒'} ${esc(s.short)}</button>`).join('')}</div>`;
  };
})();
