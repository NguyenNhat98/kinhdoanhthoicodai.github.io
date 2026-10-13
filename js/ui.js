/* ============================================================================
   UI KHUNG: HUD, thanh điều hướng, các trang (chợ, nhiệm vụ, phúc đức, giao diện, cài đặt),
   hộp thoại, thông báo, chủ đề, phản hồi sự kiện game
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, Art = window.Art;
  const UI = { page: 'market', vfx: null };
  window.UI = UI;
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => Array.from((r || document).querySelectorAll(q));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = (t) => window.Audio2.sfx(t);
  const buzz = (p) => G.buzz(p);
  const S = () => G.S;

  /* ---------------- thông báo ---------------- */
  UI.toast = function (msg, type) {
    const root = $('#toasts');
    for (const el of root.children) if (el.dataset.m === msg) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); clearTimeout(el._t); el._t = setTimeout(() => el.remove(), 2400); return; }
    const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.dataset.m = msg; t.innerHTML = esc(msg);
    root.appendChild(t); while (root.children.length > 2) root.firstElementChild.remove();
    t._t = setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 2400);
  };
  UI.banner = function (msg, cls) {
    const b = $('#banner'); b.className = 'banner show ' + (cls || ''); b.textContent = msg;
    clearTimeout(UI._bt); UI._bt = setTimeout(() => { b.className = 'banner'; }, 3400);
  };
  UI.float = function (x, y, text, cls) {
    const el = document.createElement('div'); el.className = 'float ' + (cls || ''); el.style.left = x + 'px'; el.style.top = y + 'px'; el.textContent = text;
    $('#fxlayer').appendChild(el); setTimeout(() => el.remove(), 1000);
  };
  UI.modal = function (inner, onClose) {
    const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="modal-card">${inner}</div>`;
    UI._onClose = onClose || null;
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) { sfx('click'); UI.closeModal(); } };
    return UI.closeModal;
  };
  UI.closeModal = function () { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; m.onclick = null; const f = UI._onClose; UI._onClose = null; if (f) f(); };

  /* ---------------- chủ đề ---------------- */
  UI.applyTheme = function (id) {
    S().theme = id; document.documentElement.dataset.theme = id;
    if (UI.vfx) UI.vfx.setTheme(id);
    window.Audio2.setTheme(id);
    const th = C.themes.find((t) => t.id === id), meta = $('meta[name="theme-color"]'); if (meta && th) meta.setAttribute('content', th.sw[0]);
  };

  /* ---------------- HUD ---------------- */
  function buildHud() {
    $('#hud').innerHTML = `<div class="hud-l"><div class="rank" data-rank>Bình Dân</div><div class="rep" title="Uy tín">${Art.rep(16)}<b data-rep>0</b><small data-day></small></div></div>
      <div class="hud-c"><div class="coins">${Art.coin(26)}<b data-coins>0</b></div><small data-cps>0 xu/giây</small></div>
      <div class="hud-r"><div class="gold">${Art.gold(22)}<b data-gold>0</b></div><div class="buffs" data-buffs></div></div>`;
  }
  UI.updateHud = function () {
    const s = S();
    $('[data-coins]').textContent = G.fmt(s.coins);
    const c = G.totalCPS(); $('[data-cps]').textContent = c > 0 ? '+' + G.fmt(c) + ' xu/giây (quản lý)' : 'Chưa có thu nhập quản lý';
    $('[data-gold]').textContent = G.fmt(s.gold); $('[data-rep]').textContent = Math.floor(s.rep);
    $('[data-rank]').textContent = G.rankName(); $('[data-day]').textContent = 'Ngày ' + s.day;
    $('[data-buffs]').innerHTML = (window.WS.rushOn() ? '<span class="bf rush">🥁 Đông khách</span>' : '') + (G.isBoost() ? '<span class="bf boost">🧧 ×2</span>' : '');
    document.body.classList.toggle('rush', window.WS.rushOn());
  };

  /* ---------------- điều hướng ---------------- */
  function buildNav() {
    $('#nav').innerHTML = [['market', '🏮', 'Chợ'], ['festival', '🪁', 'Hội làng'], ['quest', '📜', 'Nhiệm vụ'], ['dev', '🏗️', 'Phát triển'], ['perks', '🧧', 'Phúc đức'], ['theme', '🎨', 'Giao diện'], ['settings', '⚙️', 'Cài đặt']]
      .map(([p, i, l]) => `<button data-page="${p}" class="${p === 'market' ? 'on' : ''}"><i>${p === 'festival' ? i : `<img class="nav-sprite" src="assets/sprites/trasua2-ui-${({market:'shop',quest:'quest',dev:'upgrade',perks:'bag',theme:'decor',settings:'settings'})[p]}.png" alt="">`}</i><span>${l}</span></button>`).join('');
  }

  function pageQuest() {
    const s = S(), cur = G.chapterDef();
    const ch = C.chapters.map((c) => {
      const done = s.chapter > c.id, now = s.chapter === c.id;
      return `<div class="chap ${done ? 'done' : now ? 'now' : 'locked'}"><span class="cp-n">${done ? '✔' : c.id}</span><div><b>${esc(c.title)}</b><small>${esc(c.goal)}</small>${now ? `<em>${esc(c.prog(s))}</em>` : ''}<small class="rw">Thưởng: ${esc(c.rewardText)}</small></div></div>`;
    }).join('');
    const rg = C.regulars.map((r) => `<div class="reg"><span>${r.avatar}</span><div><b>${esc(r.name)}</b><small>${esc(G.shopDef(r.shop).short)} · ${esc(r.likes)}</small></div><em>${'❤'.repeat(s.rel[r.id] || 0)}${'♡'.repeat(5 - (s.rel[r.id] || 0))}</em></div>`).join('');
    return `<section class="page"><h2>📜 Nhiệm Vụ & Chương</h2>${cur ? `<div class="story"><b>Chương ${cur.id}: ${esc(cur.title)}</b><p>${esc(cur.story)}</p></div>` : ''}${ch}
      <h3>🤝 Khách quen</h3><p class="muted">Phiếu luôn ghi rõ yêu cầu hiện tại; khẩu vị chỉ để tạo tính cách. Phục vụ tốt (≥ 0,8) +1 tim mỗi ca.</p>${rg}
      <h3>🏅 Thành tựu</h3>${C.achievements.map((a) => `<div class="ach ${s.ach[a.id] ? 'done' : ''}"><span class="a-ic">${s.ach[a.id] ? '🏅' : '🔒'}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div><span class="a-r">${Art.gold(16)} ${a.gold}</span></div>`).join('')}</section>`;
  }
  function pagePerks() {
    const s = S();
    return `<section class="page"><h2>🧧 Cửa Hàng Phúc Đức</h2><p class="muted">Kim nguyên bảo kiếm từ chương, thành tựu, mốc cấp quầy 10/20/30… và quà mỗi ngày. Bạn đang có <b>${Art.gold(16)} ${s.gold}</b></p>
      ${C.perks.map((p) => `<div class="perk"><span class="p-ic">${p.icon}</span><div><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></div><button class="btn gold sm" data-perk="${p.id}" ${s.gold >= p.cost ? '' : 'disabled'}>${Art.gold(14)} ${p.cost}</button></div>`).join('')}</section>`;
  }
  function pageTheme() {
    return `<section class="page"><h2>🎨 Chủ Đề Giao Diện</h2><p class="muted">Đổi màu giao diện, hiệu ứng hạt, ánh sáng của bản đồ chợ và âm sắc nhạc nền.</p>
      <div class="theme-grid">${C.themes.map((t) => `<button class="theme-card ${S().theme === t.id ? 'on' : ''}" data-theme="${t.id}" style="background:${t.sw[0]};color:${t.nightly ? '#fff4e0' : '#2a1a1a'}"><div class="sw">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</div><b>${esc(t.name)}</b><small>${esc(t.sub)}</small><span>${esc(t.desc)}</span></button>`).join('')}</div></section>`;
  }
  function pageSettings() {
    const s = S().settings;
    const seg = (k, vals) => `<div class="seg">${vals.map(([v, l]) => `<button class="${s[k] === v ? 'on' : ''}" data-set="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const onoff = (k) => seg(k, [[false, 'Tắt'], [true, 'Bật']]);
    return `<section class="page"><h2>⚙️ Cài Đặt</h2>
      <div class="set-row"><label>🎵 Nhạc nền</label><input type="range" min="0" max="100" value="${Math.round(s.music * 100)}" data-range="music"></div>
      <div class="set-row"><label>🔔 Hiệu ứng âm thanh</label><input type="range" min="0" max="100" value="${Math.round(s.sfx * 100)}" data-range="sfx"></div>
      <div class="set-row"><label>📳 Rung</label>${seg('haptic', [[0, 'Tắt'], [1, 'Nhẹ'], [2, 'Vừa'], [3, 'Mạnh']])}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🗣️ Giọng hô “Hảo hán!”</label></div>${onoff('speech')}</div>
      <div class="set-row col"><label>📖 Hướng dẫn chi tiết</label><small>Xem lại cách chơi từng bước.</small><div class="row2"><button class="btn gold sm" data-guide="start">Hướng dẫn cơ bản</button><button class="btn ghost sm" data-guide="shops">Các quầy hàng</button><button class="btn ghost sm" data-guide="festival">Hội làng</button><button class="btn ghost sm" data-guide="settings">Về cài đặt</button><button class="btn ghost sm" data-guide="tutorial">Chơi lại hướng dẫn quầy</button></div></div>
      <div class="set-row tg"><div class="tg-txt"><label>👆 Rót: chạm để rót, chạm lại để dừng</label><small>Dành cho người khó giữ tay. Mặc định là giữ để rót.</small></div>${onoff('tapPour')}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🧭 Hỗ trợ (tự dừng, chọn cấp cay)</label><small>Cần trang bị cấp 3 tương ứng: vòi rót, ấm đồng, muỗng ớt.</small></div>${onoff('assist')}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🌶️ Chế độ thư giãn (mỳ cay chọn trực tiếp)</label></div>${onoff('relaxed')}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🐢 Giảm chuyển động</label><small>Giảm hạt bay, NPC nền và rung camera; giữ nước dâng, tiến độ và đổi biểu cảm.</small></div>${onoff('reduce')}</div>
      ${window.LivingMarket.settingsHtml()}
      <div class="set-row col"><label>💾 Sao lưu / khôi phục</label><div class="row2"><button class="btn gold sm" data-export>Sao chép mã</button><button class="btn ghost sm" data-import>Nhập mã</button></div></div>
      <div class="set-row col"><button class="btn danger sm" data-reset>↩️ Chơi lại từ đầu</button></div>
      <p class="muted center">Xuyên Không Cổ Đại · Chợ Cổ · v${C.version}</p></section>`;
  }
  UI.showPage = function (p) {
    UI.page = p;
    $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.page === p));
    const v = $('#view');
    if (p === 'market') { window.MM.mount(v); v.classList.add('is-map'); return; }
    v.classList.remove('is-map');
    if (p === 'festival') { window.Festival.mount(v); return; }
    v.innerHTML = ({ quest: pageQuest, perks: pagePerks, theme: pageTheme, settings: pageSettings }[p])(); v.scrollTop = 0;
  };

  /* ---------------- click toàn cục (ngoài quầy/bản đồ) ---------------- */
  function bindClicks() {
    document.addEventListener('click', (e) => {
      window.Audio2.unlock();
      const t = e.target; let el;
      if ((el = t.closest('#nav button'))) { sfx('click'); buzz(8); if (window.WUI.isOpen()) window.WUI.close(); UI.showPage(el.dataset.page); return; }
      if ((el = t.closest('[data-perk]'))) { const r = G.buyPerk(el.dataset.perk); if (r === true) { sfx('buy'); UI.showPage('perks'); UI.toast('Đã dùng phúc đức!', 'ok'); } else { sfx('error'); UI.toast(r === 'noshift' ? 'Chỉ dùng được khi đang có ca bán.' : 'Chưa đủ kim nguyên bảo.', 'err'); } return; }
      if ((el = t.closest('.theme-card'))) { UI.applyTheme(el.dataset.theme); sfx('buy'); buzz(20); G.save(); UI.showPage('theme'); return; }
      if ((el = t.closest('[data-set]'))) {
        const k = el.dataset.set; let v = el.dataset.v; v = v === 'true' ? true : v === 'false' ? false : Number(v);
        S().settings[k] = v; sfx('click'); if (k === 'haptic') buzz([40, 60, 40]); if (k === 'speech' && v) window.Audio2.speak('Hảo hán!');
        if (k === 'reduce') document.body.classList.toggle('reduce-motion', v);
        window.LivingMarket.applySettings();
        G.save(); UI.showPage('settings'); return;
      }
      if (t.closest('[data-export]')) { const code = G.exportCode(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => UI.toast('Đã sao chép mã sao lưu', 'ok'), () => UI.modal(`<h3>Mã sao lưu</h3><textarea readonly rows="5">${code}</textarea><p class="muted">Nhấn giữ để sao chép.</p><button class="btn gold" data-close>Đóng</button>`)); return; }
      if (t.closest('[data-import]')) { UI.modal(`<h3>Nhập mã sao lưu</h3><textarea id="impBox" rows="5" placeholder="Dán mã vào đây"></textarea><div class="row2"><button class="btn gold" data-doimp>Khôi phục</button><button class="btn ghost" data-close>Hủy</button></div>`); return; }
      if (t.closest('[data-doimp]')) { if (G.importCode($('#impBox').value)) location.reload(); else UI.toast('Mã không hợp lệ', 'err'); return; }
      if (t.closest('[data-reset]')) { UI.modal(`<h3>Chơi lại từ đầu?</h3><p>Toàn bộ tiến trình sẽ bị xóa vĩnh viễn.</p><div class="row2"><button class="btn danger" data-doreset>Xóa & chơi lại</button><button class="btn ghost" data-close>Hủy</button></div>`); return; }
      if (t.closest('[data-doreset]')) { G.reset(); location.reload(); return; }
    });
    $('#view').addEventListener('input', (e) => { const r = e.target.closest('[data-range]'); if (!r) return; S().settings[r.dataset.range] = r.value / 100; window.Audio2.applyVolumes(); });
    $('#view').addEventListener('change', (e) => { if (e.target.closest('[data-range]')) { sfx('tap'); G.save(); } });
  }

  /* ---------------- phản ứng sự kiện ---------------- */
  function bindGameEvents() {
    G.on('levelup', ({ id, level, milestone }) => { sfx('levelup'); buzz([20, 40, 20, 40, 60]); UI.vfx.burst(window.innerWidth / 2, window.innerHeight * 0.4); UI.toast(`⬆️ ${G.shopDef(id).short} lên cấp ${level}${milestone ? ' — +1 nguyên bảo!' : ''}`, 'ok'); if (window.WUI.isOpen()) window.WUI.render(); if (UI.page === 'market') window.MM.refresh(); });
    G.on('unlock', ({ id }) => { UI.toast(`🏮 Khai trương ${G.shopDef(id).name}!`, 'ok'); UI.vfx.burst(window.innerWidth / 2, window.innerHeight * 0.4); sfx('levelup'); window.MM.refresh(); });
    G.on('hire', ({ id }) => { sfx('buy'); buzz([20, 30, 40]); UI.toast(`🧑‍🍳 Đã thuê tiểu nhị cho ${G.shopDef(id).short}`, 'ok'); });
    G.on('equip', ({ id, eq, lv }) => { UI.toast(`🛠️ ${G.eqList(id).find((e) => e.id === eq).name} lên cấp ${lv}`, 'ok'); });
    G.on('achievement', (a) => { UI.toast(`🏅 Thành tựu: ${a.name} (+${a.gold} nguyên bảo)`, 'ok'); sfx('levelup'); buzz([30, 40, 30]); });
    G.on('gold', ({ n, why }) => { if (why === 'daily') UI.toast(`🎁 Quà mỗi ngày: +${n} kim nguyên bảo`, 'ok'); });
    G.on('saveError', () => UI.toast('Không lưu được tiến trình! Hãy sao lưu bằng mã trong Cài đặt.', 'err'));
    G.on('chapterDone', (ch) => {
      sfx('levelup'); UI.vfx.burst(window.innerWidth / 2, window.innerHeight * 0.35);
      const next = G.chapterDef();
      UI.modal(`<h3>🏮 Hoàn thành chương ${ch.id}</h3><p><b>${esc(ch.title)}</b></p><p class="muted">Thưởng: ${esc(ch.rewardText)}</p>${next ? `<div class="story"><b>Chương ${next.id}: ${esc(next.title)}</b><p>${esc(next.story)}</p><small>Mục tiêu: ${esc(next.goal)}</small></div>` : '<p>Chợ đã lên đèn! Bạn là Đại Phú Hào Làng Cổ.</p>'}<button class="btn gold" data-close>Tiếp tục</button>`);
      if (UI.page === 'market') window.MM.refresh();
    });
  }
  UI.chapterIntro = function () {
    const s = S(), ch = G.chapterDef();
    if (ch && s.chapterSeen < ch.id) { s.chapterSeen = ch.id; UI.modal(`<h3>📜 Chương ${ch.id}: ${esc(ch.title)}</h3><p>${esc(ch.story)}</p><p class="muted">Mục tiêu: ${esc(ch.goal)}</p><button class="btn gold" data-close>Bắt đầu</button>`); }
  };

  UI.init = function (vfx) {
    UI.vfx = vfx; buildHud(); buildNav(); bindClicks(); bindGameEvents(); window.WUI.init();
    UI.applyTheme(S().theme); document.body.classList.toggle('reduce-motion', !!S().settings.reduce);
    UI.showPage('market'); UI.updateHud();
  };
  let n = 0;
  UI.refresh = function () {
    n++; UI.updateHud();
    if (n % 5 === 0 && UI.page === 'market') window.MM.refresh();
  };
})();
