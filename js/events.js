/* ============================================================================
   SỰ KIỆN, AN TOÀN & PHÁP LÝ — liên kết với màn bán hàng, màn chuẩn bị và tab Phát triển.
   Trong mỗi ca có thể xảy ra: ⚡ mất điện · 🌩️ mưa bão · 🕵️ đoàn kiểm tra · 🤢 ngộ độc/an toàn thực phẩm ·
   🔥 cháy bếp · 🦹 trộm cắp · 📸 food blogger ghé quầy.
   Chuẩn bị bằng 7 hạng mục an toàn (mua ở Phát triển → An toàn) + vệ sinh quầy 🧼 (chạm vào nhãn vệ sinh để dọn).
   Hiệu quả cộng dồn với nhân viên (Bảo vệ, Phụ việc), trang bị mái che và các dịch vụ.
   Có dự báo trước ca (hiện ở màn chuẩn bị) và hiệu ứng hình ảnh, âm thanh riêng cho từng sự kiện.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, WS = window.WS, WUI = window.WUI, UI = window.UI, Art = window.Art;
  const $ = (q, r) => (r || document).querySelector(q);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);
  const E = window.Events = { active: null };

  /* ======================== HẠNG MỤC AN TOÀN (dùng khung trang bị C0–C3) ======================== */
  const SAFE = [
    { id: 'gen', name: 'Máy phát điện', k: 2.2, icon: '🔌', tiers: ['Phát điện dự phòng: mất điện đỡ 40%', 'Mất điện đỡ 70%, tự khởi động nhanh', 'Mất điện gần như không ảnh hưởng (100%)'] },
    { id: 'lic', name: 'Giấy phép kinh doanh', k: 1.5, icon: '📜', tiers: ['Có giấy phép: phạt khi kiểm tra giảm 40%', 'Phạt giảm 70%, kiểm tra đạt thưởng thêm', 'Miễn phạt, thưởng thi đua cao'] },
    { id: 'attp', name: 'Chứng nhận ATTP', k: 1.8, icon: '🧪', tiers: ['Giảm 40% nguy cơ ngộ độc, +8 điểm kiểm tra', 'Giảm 65% nguy cơ, +16 điểm kiểm tra', 'Giảm 85% nguy cơ, +24 điểm kiểm tra'] },
    { id: 'fire', name: 'Bình chữa cháy & báo cháy', k: 1.2, icon: '🧯', tiers: ['Bình chữa cháy: thiệt hại cháy giảm 50%', 'Thêm báo cháy: giảm 80%', 'Hệ thống phun tự động: giảm 95%'] },
    { id: 'cam', name: 'Camera an ninh', k: 1.3, icon: '📹', tiers: ['Camera cửa: trộm mất ít hơn 40%', 'Camera 2 góc: giảm 70%', 'Camera AI báo động: giảm 90%'] },
    { id: 'ins', name: 'Bảo hiểm cơ sở', k: 2.0, icon: '🛡️', tiers: ['Bồi hoàn 30% thiệt hại sự cố', 'Bồi hoàn 55%', 'Bồi hoàn 80%'] },
    { id: 'clean', name: 'Tủ khử trùng & dụng cụ vệ sinh', k: 1, icon: '🧴', tiers: ['Vệ sinh xuống chậm hơn 30%, dọn được +10', 'Xuống chậm hơn 55%, dọn +20', 'Xuống chậm hơn 75%, dọn +30'] }
  ];
  SAFE.forEach((e) => { e.cat = 'safe'; if (!C.equip.common.some((x) => x.id === e.id)) C.equip.common.push(e); });
  const lvl = (shop, id) => G.eqLv(shop, id);
  const F = {
    gen: (l) => [0, .4, .7, 1][l], lic: (l) => [1, .6, .3, 0][l], attp: (l) => [1, .6, .35, .15][l], fire: (l) => [1, .5, .2, .05][l],
    cam: (l) => [1, .6, .3, .1][l], ins: (l) => [0, .3, .55, .8][l], clean: (l) => [1, .7, .45, .25][l]
  };
  E.F = F;

  /* ======================== VỆ SINH ======================== */
  const store = (k) => { const f = G.S.flags; if (!f[k]) f[k] = {}; return f[k]; };
  const hyg = (shop) => { const h = store('hyg'); if (h[shop] == null) h[shop] = 90; return h[shop]; };
  const setHyg = (shop, v) => { store('hyg')[shop] = Math.max(0, Math.min(100, v)); };
  E.hyg = hyg;
  const U = (shop) => Math.max(3, Math.round(G.baseOrderPrice(shop) * G.shopMult(shop) * 10)); // ≈ giá trị 10 đơn
  E.unit = U;

  function log(shop, icon, text, good) {
    const L = (G.S.flags.evlog = G.S.flags.evlog || []);
    L.unshift({ d: G.S.day, shop, icon, text, good: !!good }); if (L.length > 24) L.length = 24;
  }

  /* ======================== LỊCH SỰ KIỆN ======================== */
  const TYPES = {
    blackout: { icon: '⚡', name: 'Mất điện', warn: 'Đèn chập chờn… dường như sắp mất điện!' },
    storm: { icon: '🌩️', name: 'Mưa bão', warn: 'Sấm rền xa xa, trời kéo mây đen…' },
    inspect: { icon: '🕵️', name: 'Đoàn kiểm tra', warn: 'Có người lạ cầm sổ đứng ngoài cổng…' },
    poison: { icon: '🤢', name: 'Khách đau bụng', warn: '' },
    fire: { icon: '🔥', name: 'Cháy bếp', warn: 'Có mùi khét từ bếp…' },
    theft: { icon: '🦹', name: 'Trộm cắp', warn: 'Có bóng người lấp ló gần quầy…' },
    blogger: { icon: '📸', name: 'Food blogger', warn: 'Một người đeo máy ảnh đang dòm quầy bạn…' }
  };
  function weights(shop) {
    const h = hyg(shop);
    return { blackout: 3, storm: 1.6, inspect: 2.2, poison: h < 40 ? 4 : h < 65 ? 1.6 : .35, fire: 1.2, theft: 1.6, blogger: h >= 70 ? 1.6 : .5 };
  }
  function pickTypes(shop, n) {
    const w = weights(shop), out = [];
    for (let i = 0; i < n; i++) {
      let sum = 0; Object.keys(w).forEach((k) => { if (out.indexOf(k) < 0) sum += w[k]; });
      let r = Math.random() * sum, got = null; for (const k of Object.keys(w)) { if (out.indexOf(k) >= 0) continue; r -= w[k]; if (r <= 0) { got = k; break; } }
      if (got) out.push(got);
    }
    return out;
  }
  const eventLevel = () => { const v = G.S.settings.eventLevel; return v === undefined ? 2 : v; };
  /* dự báo cho ca kế tiếp (lưu để màn chuẩn bị hiển thị đúng như sẽ xảy ra) */
  E.forecast = function (shop) {
    const f = store('forecast');
    if (!f[shop]) { const lv = eventLevel(); const n = lv === 0 ? 0 : lv === 1 ? (Math.random() < .55 ? 1 : 0) : lv === 2 ? 1 + (Math.random() < .4 ? 1 : 0) : 2 + (Math.random() < .4 ? 1 : 0); f[shop] = pickTypes(shop, n); }
    return f[shop];
  };

  /* ======================== HIỆU ỨNG HÌNH ẢNH ======================== */
  function layer() {
    const st = $('#stall'); if (!st) return null;
    let l = $('#evfx', st); if (!l) { l = document.createElement('div'); l.id = 'evfx'; l.setAttribute('aria-hidden', 'true'); st.appendChild(l); }
    return l;
  }
  function badge(html, cls, ms) {
    const l = layer(); if (!l) return null;
    const b = document.createElement('div'); b.className = 'ev-badge ' + (cls || ''); b.innerHTML = html; l.appendChild(b);
    if (ms) setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 400); }, ms);
    return b;
  }
  function flash(cls, ms) { const l = layer(); if (!l || reduce()) return; const f = document.createElement('i'); f.className = 'ev-flash ' + cls; l.appendChild(f); setTimeout(() => f.remove(), ms || 700); }
  function stamp(ok, text) { const l = layer(); if (!l) return; const s = document.createElement('div'); s.className = 'ev-stamp ' + (ok ? 'ok' : 'bad'); s.innerHTML = `<b>${ok ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b><small>${esc(text)}</small>`; l.appendChild(s); setTimeout(() => { s.classList.add('out'); setTimeout(() => s.remove(), 500); }, 3400); }
  function money(n) { return `${Art.coin(13)} ${G.fmt(Math.round(n))}`; }

  /* ======================== XỬ LÝ TỪNG SỰ KIỆN ======================== */
  const HANDLERS = {
    blackout(s) {
      const g = F.gen(lvl(s.shop, 'gen')), dur = rnd(16, 26) * (1 - g * .6);
      s._dark = { left: dur, g }; const st = $('#stall'); if (st) { st.dataset.ev = 'blackout'; st.style.setProperty('--evg', g); }
      const b = badge(`<i>⚡</i><div><b>Mất điện!</b><small>${g > 0 ? 'Máy phát điện đang khởi động…' : 'Thao tác chậm hơn, hãy giữ bình tĩnh'}</small></div><em data-evt></em>`, 'dark', 0); s._darkBadge = b;
      flash('lightning', 500); sfx('error'); window.Game.buzz([60, 40, 60]);
      log(s.shop, '⚡', g >= .7 ? 'Mất điện, máy phát điện cứu nguy' : 'Mất điện giữa ca', g >= .7);
      if (g > 0.01) setTimeout(() => { if (s._dark) { badge(`<i>🔌</i><div><b>Máy phát điện chạy!</b><small>Mất điện đỡ ${Math.round(g * 100)}%</small></div>`, 'good', 3000); sfx('levelup'); } }, 1800);
    },
    storm(s) {
      const mai = lvl(s.shop, 'mai'), f = 1 - [0, .2, .4, .6][mai];
      s._storm = { left: rnd(20, 30), f }; const st = $('#stall'); if (st) st.dataset.ev = 'storm';
      badge(`<i>🌩️</i><div><b>Mưa bão kéo đến!</b><small>${mai ? 'Mái che giúp khách đỡ cáu' : 'Khách sốt ruột hơn, nên nâng cấp mái che'}</small></div>`, 'storm', 4200);
      sfx('gong'); flash('lightning', 600); setTimeout(() => flash('lightning', 400), 1400);
      log(s.shop, '🌩️', 'Mưa bão, khách sốt ruột', mai >= 2);
    },
    inspect(s) {
      const l = layer(), lic = lvl(s.shop, 'lic'), attp = lvl(s.shop, 'attp'), h = hyg(s.shop);
      const score = Math.round(h * .55 + (lic > 0 ? 20 : 0) + lic * 5 + attp * 8 + (staffHas(s.shop, 'tapsu') || staffHas(s.shop, 'quangia') ? 5 : 0));
      s._inspect = true; const card = badge(`<img src="assets/sprites/trasua-portrait-1.png" alt=""><div><b>🕵️ Đoàn kiểm tra</b><small>Đang kiểm tra vệ sinh & giấy tờ…</small><div class="ev-scan"><i></i></div></div>`, 'inspect', 0);
      sfx('bell');
      setTimeout(() => {
        s._inspect = false; if (card) { card.classList.add('out'); setTimeout(() => card.remove(), 400); }
        if (WS.state() !== s) return;
        const u = U(s.shop), pass = score >= 60;
        if (pass) {
          const reward = Math.round(u * (.6 + lic * .25 + (score >= 90 ? .5 : 0))); G.addCoins(reward); G.S.rep += score >= 90 ? 2 : 1;
          stamp(true, `Điểm ${score}/100 · thưởng ${G.fmt(reward)}`); UI.toast(`✅ Đoàn kiểm tra hài lòng! +${G.fmt(reward)} xu, uy tín tăng`, 'ok'); sfx('cheer'); if (UI.vfx) UI.vfx.spawnCoins(innerWidth / 2, innerHeight * .4, 10);
          log(s.shop, '🕵️', `Kiểm tra đạt ${score} điểm, thưởng ${G.fmt(reward)}`, true); store('evstat').inspectOk = (store('evstat').inspectOk || 0) + 1;
        } else {
          const fine = Math.min(G.S.coins, Math.round(u * (lic ? 1.2 : 1.8) * F.lic(lic) + (lic >= 3 ? 0 : u * .1))); G.S.coins -= fine; G.S.rep = Math.max(0, G.S.rep - 1);
          stamp(false, `Điểm ${score}/100 · phạt ${G.fmt(fine)}`); UI.toast(`❌ Bị phạt ${G.fmt(fine)} xu! Hãy giữ vệ sinh và xin giấy phép`, 'err'); sfx('fail'); flash('red', 700);
          log(s.shop, '🕵️', `Kiểm tra trượt (${score} điểm), phạt ${G.fmt(fine)}`, false); store('evstat').inspectBad = (store('evstat').inspectBad || 0) + 1;
        }
        G.save();
      }, 5200);
      void l;
    },
    poison(s) {
      const a = F.attp(lvl(s.shop, 'attp')), u = U(s.shop), loss = Math.round(u * .8 * a * rf().loss), ref = Math.round(loss * F.ins(lvl(s.shop, 'ins')));
      const st = $('#stall'); if (st) st.dataset.ev = 'poison'; setTimeout(() => { if (st && st.dataset.ev === 'poison') delete st.dataset.ev; }, 3000);
      const l = Math.min(G.S.coins, loss - ref); G.S.coins -= l; const rp = Math.max(a < .5 ? 0 : 1, Math.round(2 * a)); G.S.rep = Math.max(0, G.S.rep - rp);
      badge(`<i>🤢</i><div><b>Khách bị đau bụng!</b><small>${a < 1 ? 'Chứng nhận ATTP giúp giảm hậu quả' : 'Vệ sinh kém, chưa có chứng nhận ATTP'} · −${G.fmt(l)} xu${rp ? ', uy tín −' + rp : ''}${ref ? ' (bảo hiểm hoàn ' + G.fmt(ref) + ')' : ''}</small></div>`, 'bad', 5200);
      sfx('fail'); flash('green', 900); G.buzz([80, 40, 80]); setHyg(s.shop, hyg(s.shop) + 8); // sau sự cố tự tổng vệ sinh nhẹ
      log(s.shop, '🤢', `Khách đau bụng, mất ${G.fmt(l)} xu`, false); store('evstat').poison = (store('evstat').poison || 0) + 1;
    },
    fire(s) {
      const a = F.fire(lvl(s.shop, 'fire')), items = C.items[s.shop].filter((i) => i.w > 0 && !i.batch && !i.reuse); let lost = 0, value = 0;
      items.forEach((i) => { const have = G.stock(s.shop, i.id), n = Math.floor(have * .35 * a); if (n > 0) { G.S.stock[s.shop][i.id] -= n; lost += n; value += n * G.packCost(s.shop, i.id) / Math.max(1, G.packSize(s.shop, i.id)); } });
      const ref = Math.round(value * F.ins(lvl(s.shop, 'ins'))); if (ref) G.addCoins(ref);
      const st = $('#stall'); if (st) { st.dataset.ev = 'fire'; setTimeout(() => { if (st.dataset.ev === 'fire') delete st.dataset.ev; }, a < .5 ? 2600 : 4200); }
      badge(`<i>${a <= .5 ? '🧯' : '🔥'}</i><div><b>${a <= .5 ? 'Chữa cháy kịp thời!' : 'Cháy bếp!'}</b><small>${lost ? `Hỏng ${lost} phần nguyên liệu` : 'Không thiệt hại'}${ref ? ` · bảo hiểm hoàn ${G.fmt(ref)} xu` : ''}</small></div>`, a <= .5 ? 'good' : 'bad', 5200);
      sfx(a <= .5 ? 'levelup' : 'fire'); flash('fire', 1200); G.buzz([50, 30, 90]);
      log(s.shop, '🔥', lost ? `Cháy bếp, hỏng ${lost} phần` : 'Cháy bếp nhưng không thiệt hại', a <= .5);
    },
    theft(s) {
      const cam = F.cam(lvl(s.shop, 'cam')), guard = staffHas(s.shop, 'baove') ? .3 : 1, u = U(s.shop);
      const loss = Math.round(Math.min(G.S.coins * .06, u * 4) * cam * guard * rf().loss), ref = Math.round(loss * F.ins(lvl(s.shop, 'ins'))), real = Math.max(0, Math.min(G.S.coins, loss - ref));
      G.S.coins -= real; const l = layer(); if (l) { const t = document.createElement('div'); t.className = 'ev-thief'; t.textContent = '🦹'; l.appendChild(t); setTimeout(() => t.remove(), 3200); }
      badge(`<i>${cam < 1 || guard < 1 ? '📹' : '🦹'}</i><div><b>${cam < 1 || guard < 1 ? 'Phát hiện kẻ trộm!' : 'Bị trộm!'}</b><small>${real > 0 ? `Mất ${G.fmt(real)} xu` : 'Không mất gì'}${cam < 1 ? ' · camera ghi lại' : ''}${guard < 1 ? ' · bảo vệ ngăn chặn' : ''}</small></div>`, real > 0 ? 'bad' : 'good', 4600);
      sfx(real > 0 ? 'error' : 'cheer'); log(s.shop, '🦹', real > 0 ? `Mất trộm ${G.fmt(real)} xu` : 'Bắt quả tang kẻ trộm', real <= 0);
    },
    blogger(s) {
      const h = hyg(s.shop);
      if (h >= 70) {
        s._boost = { left: 40 }; G.S.rep += 2; badge(`<i>📸</i><div><b>Food blogger khen ngon!</b><small>Vệ sinh tốt: khách đổ về +60% trong 40 giây, uy tín +2</small></div>`, 'good', 5200); sfx('levelup'); if (UI.vfx) UI.vfx.sparkle(innerWidth / 2, innerHeight * .3, 18);
        flash('camera', 500); log(s.shop, '📸', 'Blogger khen quầy, khách đông', true);
      } else {
        G.S.rep = Math.max(0, G.S.rep - 1); badge(`<i>📸</i><div><b>Blogger chê bẩn!</b><small>Vệ sinh chỉ ${Math.round(h)}% · uy tín −1. Nhớ dọn quầy thường xuyên</small></div>`, 'bad', 5200); sfx('fail'); flash('camera', 500); log(s.shop, '📸', 'Blogger chê quầy không sạch', false);
      }
    }
  };
  const rf = () => (window.Dev && Dev.rfx ? Dev.rfx() : { hyg: 1, loss: 1 });
  const staffHas = (shop, id) => { const m = (G.S.flags.staff || {})[shop]; return !!(m && m[id] === 1); };

  /* ======================== VÒNG CHẠY TRONG CA ======================== */
  const tick = WS.tick;
  WS.tick = function (dt) {
    const s = WS.state(), oid = s && s.oid; tick.apply(this, arguments);
    if (!s || s !== WS.state() || s.paused) return;
    // khởi tạo lịch ở lần tick đầu
    if (!s._evInit) {
      s._evInit = true; s._evq = [];
      if (!s.tutorial && eventLevel() > 0) {
        const types = (G.S.flags.forecast && G.S.flags.forecast[s.shop]) || E.forecast(s.shop); delete G.S.flags.forecast[s.shop];
        const total = s.total, n = types.length, gap = total * .66 / Math.max(1, n);
        types.forEach((t, i) => { const at = total * .17 + gap * i + rnd(0, gap * .5); s._evq.push({ t: at, type: t, warned: false }); });
      }
    }
    // hạ vệ sinh theo thời gian & theo đơn
    const dec = F.clean(lvl(s.shop, 'clean')) * rf().hyg, asst = staffHas(s.shop, 'phu') ? .5 : 1;
    setHyg(s.shop, hyg(s.shop) - dt * .045 * dec * asst);
    if (s.oid !== oid && false) { /* khách mới không ảnh hưởng vệ sinh */ }
    // đếm giờ sự kiện
    s._evq.forEach((e) => {
      if (e.done) return;
      if (!e.warned && TYPES[e.type].warn && s.clock >= e.t - 4) { e.warned = true; UI.toast(`${TYPES[e.type].icon} ${TYPES[e.type].warn}`, ''); sfx('tick'); if (e.type === 'storm' || e.type === 'blackout') flash('rumble', 900); }
      if (s.clock >= e.t) { e.done = true; E.trigger(s, e.type); }
    });
    // trạng thái kéo dài
    if (s._dark) { s._dark.left -= dt; const el = $('[data-evt]'); if (el) el.textContent = Math.max(0, Math.ceil(s._dark.left)) + 's'; if (s._dark.left <= 0) { s._dark = null; const st = $('#stall'); if (st && st.dataset.ev === 'blackout') delete st.dataset.ev; if (s._darkBadge) { s._darkBadge.classList.add('out'); setTimeout(() => s._darkBadge && s._darkBadge.remove(), 400); s._darkBadge = null; } badge('<i>💡</i><div><b>Có điện trở lại!</b></div>', 'good', 2200); sfx('levelup'); } }
    if (s._storm) { s._storm.left -= dt; s.orders.forEach((o) => { if (o.status === 'wait' && !s.tutorial) o.p -= dt * .35 * s._storm.f; }); if (s._storm.left <= 0) { s._storm = null; const st = $('#stall'); if (st && st.dataset.ev === 'storm') delete st.dataset.ev; badge('<i>🌤️</i><div><b>Tạnh mưa rồi</b></div>', 'good', 2000); } }
    if (s._boost) { s._boost.left -= dt; if (s.oid !== oid) s.nextSpawn *= .625; if (s._boost.left <= 0) s._boost = null; }
  };
  E.trigger = function (s, type) { if (!s || !HANDLERS[type]) return; HANDLERS[type](s); store('evstat').total = (store('evstat').total || 0) + 1; UI.refresh && UI.refresh(); };

  /* mất điện làm thao tác chậm hơn (trừ phần được máy phát điện chống đỡ) */
  const cmd = WS.cmd;
  WS.cmd = function () {
    const old = WS.state() && WS.state().busy, r = cmd.apply(this, arguments), s = WS.state();
    if (r && r.ok && s && s.busy && s.busy !== old && s._dark) { const m = 1 + .6 * (1 - s._dark.g); s.busy.t *= m; s.busy.total *= m; }
    return r;
  };
  G.on('delivered', () => { const s = WS.state(); if (s) setHyg(s.shop, hyg(s.shop) - 1.1 * F.clean(lvl(s.shop, 'clean'))); });
  G.on('discard', () => { const s = WS.state(); if (s) setHyg(s.shop, hyg(s.shop) - 3 * F.clean(lvl(s.shop, 'clean'))); });
  G.on('shiftEnd', (sum) => {
    const shop = sum && sum.shop; if (!shop) return;
    setHyg(shop, hyg(shop) + (lvl(shop, 'clean') > 0 ? 18 : 10)); delete (G.S.flags.forecast || {})[shop];
    const st = $('#stall'); if (st) delete st.dataset.ev; const l = $('#evfx'); if (l) l.remove();
  });

  /* ======================== NHÃN VỆ SINH + DỌN DẸP ======================== */
  function pill() {
    const st = $('#stall'), s = WS.state(); if (!st || !s || !$('.st-pills', st)) return;
    let b = $('.hyg-pill', st);
    if (!b) { b = document.createElement('button'); b.className = 'pill hyg-pill'; b.dataset.ev = 'clean'; b.innerHTML = '🧼 <b></b><i class="hp-bar"><u></u></i>'; $('.st-pills', st).prepend(b); }
    const v = Math.round(hyg(s.shop)); if (b.dataset.v !== String(v) || b.dataset.cool !== String(!!E._cool)) { b.dataset.v = v; b.dataset.cool = String(!!E._cool); $('b', b).textContent = v + '%'; $('u', b).style.width = v + '%'; b.classList.toggle('low', v < 40); b.classList.toggle('mid', v >= 40 && v < 70); b.classList.toggle('cool', !!E._cool); }
  }
  setInterval(pill, 400);
  E.clean = function () {
    const s = WS.state(); if (!s || s.paused) return; if (E._cool) { UI.toast('Vừa dọn xong, chờ chút nhé', ''); return; }
    const c = lvl(s.shop, 'clean'), add = 28 + c * 10; E._cool = true; setHyg(s.shop, hyg(s.shop) + add);
    sfx('stir'); G.buzz(20); const st = $('#stall'), b = $('.hyg-pill', st); if (b) { const r = b.getBoundingClientRect(); if (window.Festival && Festival.FX) { Festival.FX.fly(r.left + r.width / 2, r.top + 4, `+${add} sạch`, 'gold'); Festival.FX.boom(r.left + r.width / 2, r.top + r.height / 2, ['🫧', '✨', '🧼'], 8); } }
    const l = layer(); if (l) { const w = document.createElement('i'); w.className = 'ev-sweep'; l.appendChild(w); setTimeout(() => w.remove(), 1200); }
    pill(); setTimeout(() => { E._cool = false; pill(); }, 14000);
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ev="clean"]')) E.clean(); });

  /* ======================== MÀN CHUẨN BỊ: BẢNG AN TOÀN + DỰ BÁO ======================== */
  function prepCard() {
    const st = $('#stall'), id = st && st.dataset.shop; if (!st || !id || $('.st-bench', st) || $('.safety-card', st)) return;
    const start = $('.pp-start', st); if (!start) return;
    const row = (icon, name, l, extra) => `<span class="sc-i ${l > 0 ? 'on' : ''}" title="${name}"><i>${icon}</i><b>${l}/3</b><small>${name}</small>${extra || ''}</span>`;
    const h = Math.round(hyg(id)), fc = E.forecast(id), warn = [];
    if (!lvl(id, 'lic')) warn.push('Chưa có giấy phép: nếu đoàn kiểm tra tới sẽ bị phạt nặng');
    if (h < 60) warn.push('Quầy hơi bẩn, hãy dọn trong ca (nhấn nhãn 🧼)');
    const el = document.createElement('div'); el.className = 'safety-card';
    el.innerHTML = `<div class="sc-head"><b>🛡️ Chuẩn bị an toàn</b><button class="sc-go" data-dev-open="safe">Nâng cấp ›</button></div>
      <div class="sc-row">${row('🔌', 'Điện', lvl(id, 'gen'))}${row('📜', 'Giấy phép', lvl(id, 'lic'))}${row('🧪', 'ATTP', lvl(id, 'attp'))}${row('🧯', 'Cháy', lvl(id, 'fire'))}${row('📹', 'Camera', lvl(id, 'cam'))}${row('🛡️', 'Bảo hiểm', lvl(id, 'ins'))}</div>
      <div class="sc-hyg"><span>🧼 Vệ sinh</span><div class="hp-bar big"><u style="width:${h}%"></u></div><b>${h}%</b></div>
      <div class="sc-fc">📡 Dự báo ca này: ${fc.length ? fc.map((t) => `<em>${TYPES[t].icon} ${TYPES[t].name}</em>`).join(' ') : '<em class="calm">☀️ Bình yên</em>'}</div>${warn.length ? `<div class="sc-warn">${warn.map((w) => '⚠️ ' + w).join('<br>')}</div>` : ''}`;
    start.after(el);
  }
  const wr = WUI.render; WUI.render = function () { wr.apply(this, arguments); prepCard(); const st = $('#stall'); if (st && st.dataset.ev) layer(); };

  /* ======================== BẢNG TRONG TAB PHÁT TRIỂN ======================== */
  E.panelHtml = function (shop) {
    const h = Math.round(hyg(shop)), stt = store('evstat'), tot = (stt.inspectOk || 0) + (stt.inspectBad || 0);
    const cond = (ok, t) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✔' : '✖'} ${t}</li>`;
    return `<div class="ev-panel"><div class="evp-hyg"><div><b>🧼 Vệ sinh quầy</b><small>Giảm theo thời gian và mỗi đơn; nhấn nhãn 🧼 trong ca để dọn</small></div><div class="hp-bar big"><u style="width:${h}%"></u></div><strong>${h}%</strong></div>
      <ul class="evp-list">${cond(lvl(shop, 'gen') > 0, 'Có máy phát điện → mất điện ít ảnh hưởng')}${cond(lvl(shop, 'lic') > 0, 'Có giấy phép → bị phạt nhẹ hơn khi kiểm tra')}${cond(lvl(shop, 'attp') > 0, 'Có chứng nhận ATTP → giảm ngộ độc, tăng điểm kiểm tra')}${cond(lvl(shop, 'cam') > 0 || (G.S.flags.staff && G.S.flags.staff[shop] && G.S.flags.staff[shop].baove === 1), 'Camera / bảo vệ → chống trộm')}</ul>
      <div class="evp-stat"><span>🕵️ Kiểm tra: <b>${stt.inspectOk || 0}/${tot}</b> đạt</span><span>🤢 Ngộ độc: <b>${stt.poison || 0}</b></span><span>⚡ Tổng sự kiện: <b>${stt.total || 0}</b></span></div>
      <p class="dv-hint">Mức sự kiện đang là <b>${['Tắt', 'Nhẹ', 'Thường', 'Khó'][eventLevel()]}</b> (đổi trong Cài đặt → Ca bán & thế giới). Nhân viên <b>Bảo vệ</b> giảm 70% thiệt hại trộm, <b>Phụ việc</b> giúp quầy bẩn chậm hơn.</p></div>`;
  };
  E.logHtml = function (shop) {
    const L = (G.S.flags.evlog || []).filter((x) => x.shop === shop).slice(0, 8);
    return `<h4 class="dv-sec">📋 Nhật ký sự cố</h4>${L.length ? `<div class="evp-log">${L.map((x) => `<div class="${x.good ? 'good' : 'bad'}"><i>${x.icon}</i><span>${esc(x.text)}</span><small>Ngày ${x.d}</small></div>`).join('')}</div>` : '<p class="dv-empty">Chưa có sự cố nào.</p>'}`;
  };
  E.TYPES = TYPES;
})();
