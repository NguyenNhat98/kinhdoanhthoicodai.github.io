/* ============================================================================
   CÀI ĐẶT NÂNG CAO: âm thanh nền hiện trường, phong cách nhạc nền, bộ âm nút bấm, chuông cửa,
   hiệu ứng hạt nền (loại + mật độ), ánh đèn, nền chuyển động, pháo giấy; có nút nghe thử / xem thử.
   Lưu trong G.S.settings (ambience, ambVol, bgm, uiPack, shopBell, bgfx, fxDensity, glow, heroMove, confetti).
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, L = window.LivingMarket, UI = window.UI;
  const $ = (q) => document.querySelector(q);
  const DEF = { ambience: 1, ambVol: .5, bgm: 'auto', uiPack: 'default', shopBell: true, bgfx: 'auto', fxDensity: 2, glow: true, heroMove: true, confetti: true };
  const val = (k) => (G.S.settings[k] === undefined ? DEF[k] : G.S.settings[k]);
  const BGM = [['auto', 'Tự động (đàn tranh + sáo, trống khi đông khách)'], ['sao', 'Sáo trúc nhẹ nhàng'], ['hoi', 'Hội làng (trống trận + đàn nhị)'], ['chill', 'Thư giãn (hòa âm + chuông)'], ['dem', 'Đêm đèn lồng (trầm, vang xa)']];
  const FXK = [['auto', 'Theo quầy / chủ đề'], ['petal', '🌸 Hoa đào rơi'], ['leaf', '🍃 Lá rơi'], ['firefly', '✨ Đom đóm'], ['snow', '❄️ Tuyết hoa mai'], ['lantern', '🏮 Đèn trời bay lên'], ['rain', '💧 Mưa nhẹ']];
  const seg = (k, items) => `<div class="seg sp-seg">${items.map(([v, l]) => `<button class="${val(k) === v ? 'on' : ''}" data-sp="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sel = (k, items) => `<select data-spsel="${k}" aria-label="${k}">${items.map(([v, l]) => `<option value="${v}" ${val(k) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const onoff = (k) => seg(k, [[false, 'Tắt'], [true, 'Bật']]);

  function html() {
    return `<div id="spBlock" style="display:contents"><h3>🎧 Âm thanh nâng cao</h3>
      <div class="set-row col"><label>🌿 Âm thanh nền hiện trường</label><small>Tiếng người đi chợ, nước sôi, lò than, hơi xôi… thay đổi theo nơi bạn đang đứng. Có dế đêm khi trời tối, tiếng mưa khi có mưa.</small>
        ${seg('ambience', [[0, 'Tắt'], [1, 'Theo nơi'], [2, 'Chợ đông']])}
        <div class="sp-line"><span>Âm lượng</span><input type="range" min="0" max="100" value="${Math.round(val('ambVol') * 100)}" data-sprange="ambVol"><button class="btn ghost sm" data-spact="amb">▶ Nghe thử</button></div></div>
      <div class="set-row col"><label>🎶 Phong cách nhạc nền</label>${sel('bgm', BGM)}<div class="row2"><button class="btn ghost sm" data-spact="bgm">▶ Nghe thử nhạc</button></div></div>
      <div class="set-row col"><label>🔔 Âm nút bấm</label>${seg('uiPack', [['default', 'Mặc định'], ['wood', 'Mõ gỗ'], ['bell', 'Chuông nhỏ'], ['bamboo', 'Ống tre']])}<div class="row2"><button class="btn ghost sm" data-spact="ui">▶ Nghe thử</button></div></div>
      <div class="set-row tg"><div class="tg-txt"><label>🛎️ Chuông cửa khi khách đến quầy</label></div>${onoff('shopBell')}</div>
      <h3>✨ Hiệu ứng nền</h3>
      <div class="set-row col"><label>Loại hạt bay ở quầy & bản đồ</label>${sel('bgfx', FXK)}</div>
      <div class="set-row col"><label>Mật độ hạt</label>${seg('fxDensity', [[1, 'Ít'], [2, 'Vừa'], [3, 'Nhiều']])}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🏮 Ánh đèn lồng & tia sáng</label><small>Quầng sáng, chùm sáng, đèn lồng đung đưa.</small></div>${onoff('glow')}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🌊 Nền chuyển động</label><small>Hình nền quầy “thở” nhẹ, vệt sáng quét qua biển hiệu.</small></div>${onoff('heroMove')}</div>
      <div class="set-row tg"><div class="tg-txt"><label>🎊 Pháo giấy khi thắng</label></div>${onoff('confetti')}</div>
      <div class="set-row col"><div class="row2"><button class="btn gold sm" data-spact="fx">✨ Xem thử hiệu ứng</button></div></div>
      <h3>🎓 Hướng dẫn</h3>
      <div class="set-row col"><label>Tham quan giao diện quầy</label><small>Xem lại tour có đèn chiếu giải thích từng khu vực khi vào ca hướng dẫn kế tiếp.</small><div class="row2"><button class="btn ghost sm" data-spact="tour">🔦 Tham quan lại giao diện quầy</button></div></div>
      <p class="muted">Giảm chuyển động và Hiệu ứng “Tiết kiệm pin” vẫn được ưu tiên.</p></div>`;
  }
  const sh = L.settingsHtml; L.settingsHtml = () => sh() + html();
  const ap = L.applySettings; L.applySettings = function () { ap.apply(this, arguments); apply(); };

  /* đưa khối cài đặt nâng cao lên ngay dưới nhóm âm thanh cơ bản để dễ thấy */
  const showPage = UI.showPage;
  UI.showPage = function (p) {
    showPage.apply(this, arguments);
    if (p === 'settings') { const blk = $('#spBlock'), rows = document.querySelectorAll('#view .set-row'); if (blk && rows[3]) rows[3].after(blk); }
  };

  function apply() {
    if (!G.S) return; const b = document.body;
    b.dataset.bgfx = val('bgfx'); b.dataset.fxDensity = val('fxDensity'); b.dataset.glow = String(val('glow')); b.dataset.heroMove = String(val('heroMove')); b.dataset.confetti = String(val('confetti'));
    if (window.Audio2 && window.Audio2.applyVolumes) window.Audio2.applyVolumes();
  }
  const boot = setInterval(() => { if (G.S) { clearInterval(boot); apply(); } }, 200);

  function rerender() { const v = $('#view'), y = v ? v.scrollTop : 0; UI.showPage('settings'); if (v) v.scrollTop = y; }
  function set(k, raw) {
    const v = raw === 'true' ? true : raw === 'false' ? false : (/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw);
    G.S.settings[k] = v; apply(); G.save(); return v;
  }
  function preview(k) {
    const A = window.Audio2;
    if (k === 'uiPack') { A.sfx('click'); setTimeout(() => A.sfx('tap'), 220); setTimeout(() => A.sfx('click'), 440); }
    if (k === 'ambience' && A.amb) A.amb.preview('market');
  }
  function fxTest() {
    const F = window.Festival && window.Festival.FX, set = { auto: ['🌸', '🏮', '✨'], petal: ['🌸', '🌺'], leaf: ['🍃', '🍂'], firefly: ['✨', '💛'], snow: ['❄️', '✨'], lantern: ['🏮', '✨'], rain: ['💧', '🌧️'] }[val('bgfx')];
    if (F) { const x = window.innerWidth / 2, y = window.innerHeight * .5; F.boom(x, y, set, 14); setTimeout(() => F.boom(x - 70, y - 40, set, 10), 160); setTimeout(() => F.boom(x + 70, y + 20, set, 10), 320); if (val('confetti')) F.confetti(34); }
    window.Audio2.sfx('levelup');
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sp]'); if (b) { e.preventDefault(); e.stopPropagation(); const k = b.dataset.sp; set(k, b.dataset.v); window.Audio2.unlock(); preview(k); rerender(); return; }
    const t = e.target.closest('[data-spact]'); if (!t) return; e.preventDefault(); e.stopPropagation(); window.Audio2.unlock();
    const a = t.dataset.spact;
    if (a === 'amb') { if (window.Audio2.amb) { window.Audio2.amb.start(); window.Audio2.amb.preview('market'); } UI.toast('Đang phát âm thanh chợ… (6 giây)', 'ok'); }
    else if (a === 'bgm') { UI.toast('Nhạc nền đổi phong cách ngay khi chọn.', 'ok'); }
    else if (a === 'ui') preview('uiPack');
    else if (a === 'fx') fxTest();
    else if (a === 'tour') { if (window.Coach) window.Coach.reset(); if (G.S) { G.S.tut = {}; G.save(); } UI.toast('Đã bật lại: vào quầy bất kỳ để xem tham quan + ca hướng dẫn.', 'ok'); }
  }, true);
  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-spsel]'); if (!s) return; set(s.dataset.spsel, s.value); window.Audio2.unlock(); window.Audio2.sfx('click'); if (s.dataset.spsel === 'bgfx') fxTest(); rerender();
  });
  document.addEventListener('input', (e) => {
    const r = e.target.closest('[data-sprange]'); if (!r) return; G.S.settings[r.dataset.sprange] = r.value / 100; apply();
  });
  document.addEventListener('change', (e) => { if (e.target.closest('[data-sprange]')) { G.save(); window.Audio2.sfx('tap'); } });
})();
