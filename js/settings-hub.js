/* ============================================================================
   TRUNG TÂM CÀI ĐẶT: gộp Giao diện + Âm thanh + Hiệu ứng + Điều khiển + Ca bán + Hướng dẫn + Dữ liệu vào MỘT trang,
   chia mục thu gọn được, có mẫu cài nhanh, nút xem thử và khôi phục mặc định từng mục.
   Thêm tùy chọn giao diện: chủ đề màu, tự đổi theo giờ, màu nhấn, phông chữ, bo góc, mật độ, cỡ nút, nền trang,
   thanh điều hướng, chuyển trang, độ sáng, lọc ánh sáng ấm, hiệu ứng bản đồ, mức sự kiện ngẫu nhiên.
   Mọi giá trị lưu trong G.S.settings và áp dụng qua thuộc tính data-* trên <body>.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, UI = window.UI, L = window.LivingMarket;
  const $ = (q, r) => (r || document).querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const H = window.SettingsHub = { open: { ui: true }, search: '' };

  /* ---------- giá trị mặc định cho các khóa mới ---------- */
  const DEF = {
    ambience: 1, ambVol: .5, bgm: 'auto', uiPack: 'default', shopBell: true, bgfx: 'auto', fxDensity: 2, glow: true, heroMove: true, confetti: true,
    autoTheme: false, accent: 'default', font: 'serif', radius: 'normal', density: 'normal', btnSize: 'normal', texture: 'plain', navStyle: 'full', pageAnim: 'fade',
    brightness: 100, warm: 0, eventLevel: 2,
    mfxCloud: true, mfxBird: true, mfxButterfly: true, mfxFirefly: true, mfxLantern: true, mfxFirework: true, mfxRipple: true, mfxSun: true, mfxSmoke: true, mfxShoot: true
  };
  const val = (k) => (G.S.settings[k] === undefined ? (DEF[k] !== undefined ? DEF[k] : G.S.settings[k]) : G.S.settings[k]);
  H.val = val; H.DEF = DEF;

  const PRESETS = {
    min: { name: 'Tối giản', icon: '🍃', desc: 'Ít hạt, ít chuyển động, tiết kiệm pin', set: { quality: 0, fxDensity: 1, glow: false, heroMove: false, confetti: false, mfxCloud: false, mfxBird: false, mfxButterfly: false, mfxFirefly: false, mfxLantern: false, mfxFirework: false, mfxRipple: false, mfxSun: false, mfxSmoke: false, mfxShoot: false, pageAnim: 'none' } },
    bal: { name: 'Cân bằng', icon: '🌸', desc: 'Đủ đẹp, chạy mượt trên mọi máy', set: { quality: 1, fxDensity: 2, glow: true, heroMove: true, confetti: true, mfxCloud: true, mfxBird: true, mfxButterfly: false, mfxFirefly: true, mfxLantern: true, mfxFirework: false, mfxRipple: true, mfxSun: true, mfxSmoke: true, mfxShoot: false, pageAnim: 'fade' } },
    full: { name: 'Lung linh', icon: '🎆', desc: 'Mọi hiệu ứng: pháo hoa, bướm, đèn trời…', set: { quality: 2, fxDensity: 3, glow: true, heroMove: true, confetti: true, mfxCloud: true, mfxBird: true, mfxButterfly: true, mfxFirefly: true, mfxLantern: true, mfxFirework: true, mfxRipple: true, mfxSun: true, mfxSmoke: true, mfxShoot: true, pageAnim: 'slide' } }
  };
  const SECTIONS = {
    ui: ['🎨', 'Giao diện', ['autoTheme', 'accent', 'font', 'radius', 'density', 'btnSize', 'texture', 'navStyle', 'pageAnim', 'brightness', 'warm', 'textSize', 'contrast']],
    sound: ['🔊', 'Âm thanh', ['music', 'sfx', 'ambience', 'ambVol', 'bgm', 'uiPack', 'shopBell', 'haptic', 'speech']],
    fx: ['✨', 'Hiệu ứng', ['quality', 'bgfx', 'fxDensity', 'glow', 'heroMove', 'confetti', 'weather', 'daylight', 'reduce', 'mfxCloud', 'mfxBird', 'mfxButterfly', 'mfxFirefly', 'mfxLantern', 'mfxFirework', 'mfxRipple', 'mfxSun', 'mfxSmoke', 'mfxShoot']],
    ctl: ['🎮', 'Điều khiển & hỗ trợ', ['tapPour', 'assist', 'relaxed', 'hints', 'autoSelect']],
    shift: ['🏮', 'Ca bán & thế giới', ['crowd', 'difficulty', 'shiftLength', 'eventLevel', 'autosave']]
  };
  const CORE_DEF = { music: .5, sfx: .8, haptic: 2, speech: true, tapPour: false, assist: false, relaxed: false, reduce: false, crowd: 10, daylight: 0, weather: 0, quality: 2, textSize: 1, contrast: false, hints: true, autoSelect: false, difficulty: 1, shiftLength: 240, autosave: 10 };

  /* ---------- dựng giao diện ---------- */
  const seg = (k, items, cls) => `<div class="seg sh-seg ${cls || ''}">${items.map(([v, l]) => `<button class="${String(val(k)) === String(v) ? 'on' : ''}" data-hub="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const onoff = (k) => seg(k, [[false, 'Tắt'], [true, 'Bật']]);
  const sel = (k, items) => `<select data-hubsel="${k}" aria-label="${k}">${items.map(([v, l]) => `<option value="${v}" ${String(val(k)) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const range = (k, min, max, step, fmt) => `<div class="sh-range"><input type="range" data-hubrange="${k}" min="${min}" max="${max}" step="${step}" value="${val(k)}"><output>${fmt(val(k))}</output></div>`;
  const row = (key, label, desc, ctl, tg) => `<div class="set-row ${tg ? 'tg' : 'col'} sh-row" data-key="${key}"><div class="${tg ? 'tg-txt' : 'sh-lab'}"><label>${label}</label>${desc ? `<small>${desc}</small>` : ''}</div>${ctl}</div>`;
  const sub = (t) => `<h4 class="sh-sub">${t}</h4>`;

  function themeGrid() {
    return `<div class="theme-grid sh-themes">${C.themes.map((t) => `<button class="theme-card ${G.S.theme === t.id ? 'on' : ''}" data-theme="${t.id}" style="background:${t.sw[0]};color:${t.nightly ? '#fff4e0' : '#2a1a1a'}"><div class="sw">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</div><b>${esc(t.name)}</b><small>${esc(t.sub)}</small></button>`).join('')}</div>`;
  }
  const ACC = [['default', '#e9b84c', 'Gốc'], ['son', '#d8392b', 'Đỏ son'], ['ngoc', '#2fa07a', 'Ngọc'], ['tim', '#8a5ad8', 'Tím'], ['hong', '#e0508a', 'Hồng'], ['lam', '#2a7ad8', 'Lam']];
  const accents = () => `<div class="sh-acc">${ACC.map(([v, c, l]) => `<button class="${val('accent') === v ? 'on' : ''}" data-hub="accent" data-v="${v}" style="--c:${c}" title="${l}"><i></i><small>${l}</small></button>`).join('')}</div>`;

  function section(id) {
    const [ic, name] = SECTIONS[id] || [];
    let body = '';
    if (id === 'ui') {
      body = sub('Chủ đề màu') + themeGrid()
        + row('autoTheme', '🌗 Tự đổi theo giờ', 'Từ 18 giờ đến 5 giờ sáng giao diện chuyển sang “Dạ Hội Hoa Đăng”.', onoff('autoTheme'), true)
        + row('accent', '🎯 Màu nhấn', 'Màu của nút chính, viền vàng và điểm nhấn.', accents())
        + sub('Hình dáng & chữ')
        + row('font', '🔤 Phông chữ tiêu đề', 'Áp dụng cho tên quầy, tiêu đề, số xu.', seg('font', [['serif', 'Cổ điển'], ['sans', 'Hiện đại'], ['round', 'Bo tròn'], ['hand', 'Viết tay']]))
        + row('textSize', '🔎 Cỡ chữ', '', seg('textSize', [[1, 'Chuẩn'], [1.12, 'Lớn'], [1.24, 'Rất lớn']]))
        + row('radius', '⬜ Bo góc', 'Độ tròn của thẻ, nút và khung.', seg('radius', [['sharp', 'Vuông'], ['normal', 'Vừa'], ['round', 'Tròn']]))
        + row('density', '📐 Mật độ', 'Khoảng cách giữa các thẻ và dòng.', seg('density', [['roomy', 'Thoáng'], ['normal', 'Chuẩn'], ['compact', 'Gọn']]))
        + row('btnSize', '👆 Cỡ nút bấm', 'Nút lớn dễ chạm hơn trên màn hình nhỏ.', seg('btnSize', [['normal', 'Chuẩn'], ['big', 'Lớn'], ['huge', 'Rất lớn']]))
        + sub('Nền & bố cục')
        + row('texture', '🧻 Họa tiết nền', 'Lớp hoa văn mờ phía sau các trang.', seg('texture', [['plain', 'Trơn'], ['paper', 'Giấy dó'], ['cloud', 'Mây cổ'], ['bamboo', 'Trúc']]))
        + row('navStyle', '🧭 Thanh điều hướng', '', seg('navStyle', [['full', 'Icon + chữ'], ['icon', 'Chỉ icon'], ['text', 'Chỉ chữ']]))
        + row('pageAnim', '🎞️ Chuyển trang', '', seg('pageAnim', [['none', 'Tắt'], ['fade', 'Mờ dần'], ['slide', 'Trượt'], ['zoom', 'Phóng']]))
        + sub('Màn hình')
        + row('brightness', '🔆 Độ sáng giao diện', 'Giảm nhẹ để dễ chịu khi chơi ban đêm.', range('brightness', 60, 100, 5, (v) => v + '%'))
        + row('warm', '🧡 Lọc ánh sáng ấm', 'Giảm ánh sáng xanh, giúp mắt đỡ mỏi.', seg('warm', [[0, 'Tắt'], [1, 'Nhẹ'], [2, 'Vừa'], [3, 'Đậm']]))
        + row('contrast', '◐ Tương phản cao', 'Chữ đậm và viền rõ hơn.', onoff('contrast'), true);
    } else if (id === 'sound') {
      body = row('music', '🎵 Nhạc nền', '', `<div class="sh-range"><input type="range" min="0" max="100" value="${Math.round(G.S.settings.music * 100)}" data-range="music"></div>`)
        + row('sfx', '🔔 Hiệu ứng âm thanh', '', `<div class="sh-range"><input type="range" min="0" max="100" value="${Math.round(G.S.settings.sfx * 100)}" data-range="sfx"></div>`)
        + row('bgm', '🎶 Phong cách nhạc', '', `<select data-hubsel="bgm">${[['auto', 'Tự động (đàn tranh + sáo, trống khi đông khách)'], ['sao', 'Sáo trúc nhẹ nhàng'], ['hoi', 'Hội làng (trống trận + đàn nhị)'], ['chill', 'Thư giãn (hòa âm + chuông)'], ['dem', 'Đêm đèn lồng (trầm, vang xa)']].map(([v, l]) => `<option value="${v}" ${val('bgm') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)
        + row('ambience', '🌿 Âm nền hiện trường', 'Tiếng chợ, nước sôi, lò than… theo nơi bạn đứng.', seg('ambience', [[0, 'Tắt'], [1, 'Theo nơi'], [2, 'Chợ đông']]) + `<div class="sh-range"><span>Âm lượng</span><input type="range" min="0" max="100" value="${Math.round(val('ambVol') * 100)}" data-hubrange="ambVol" data-scale="100"><button class="btn ghost sm" data-hubact="amb">▶ Nghe thử</button></div>`)
        + row('uiPack', '🔔 Âm nút bấm', '', seg('uiPack', [['default', 'Mặc định'], ['wood', 'Mõ gỗ'], ['bell', 'Chuông'], ['bamboo', 'Ống tre']]))
        + row('shopBell', '🛎️ Chuông cửa khi khách đến', '', onoff('shopBell'), true)
        + row('haptic', '📳 Rung', '', seg('haptic', [[0, 'Tắt'], [1, 'Nhẹ'], [2, 'Vừa'], [3, 'Mạnh']]))
        + row('speech', '🗣️ Giọng hô “Hảo hán!”', '', onoff('speech'), true);
    } else if (id === 'fx') {
      body = `<div class="sh-presets">${Object.entries(PRESETS).map(([k, p]) => `<button data-hubact="preset" data-id="${k}"><i>${p.icon}</i><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}</div>`
        + sub('Hiệu ứng chung')
        + row('quality', '⚙️ Chất lượng hiệu ứng', '', seg('quality', [[0, 'Tiết kiệm'], [1, 'Vừa'], [2, 'Đầy đủ']]))
        + row('bgfx', '🌸 Loại hạt bay', 'Hạt ở quầy và bản đồ.', sel('bgfx', [['auto', 'Theo quầy / chủ đề'], ['petal', '🌸 Hoa đào rơi'], ['leaf', '🍃 Lá rơi'], ['firefly', '✨ Đom đóm'], ['snow', '❄️ Tuyết hoa mai'], ['lantern', '🏮 Đèn trời bay lên'], ['rain', '💧 Mưa nhẹ']]))
        + row('fxDensity', '🎚️ Mật độ hạt', '', seg('fxDensity', [[1, 'Ít'], [2, 'Vừa'], [3, 'Nhiều']]))
        + row('glow', '🏮 Ánh đèn lồng & tia sáng', '', onoff('glow'), true)
        + row('heroMove', '🌊 Nền quầy chuyển động', '', onoff('heroMove'), true)
        + row('confetti', '🎊 Pháo giấy khi thắng', '', onoff('confetti'), true)
        + row('reduce', '🐢 Giảm chuyển động', 'Tắt hầu hết hiệu ứng động, tốt cho máy yếu hoặc dễ chóng mặt.', onoff('reduce'), true)
        + sub('Thời tiết & ánh sáng bản đồ')
        + row('weather', '🌦️ Thời tiết', '', seg('weather', [[0, 'Trong'], [1, 'Hoa đào'], [2, 'Mưa nhẹ']]))
        + row('daylight', '🌅 Ánh sáng', '', seg('daylight', [[0, 'Theo ngày'], [1, 'Ban ngày'], [2, 'Hoàng hôn'], [3, 'Đêm']]))
        + sub('Hiệu ứng màn hình chính (bản đồ chợ)')
        + [['mfxCloud', '☁️ Mây trôi & bóng mây'], ['mfxSun', '🌤️ Tia nắng lung linh'], ['mfxBird', '🕊️ Đàn chim bay'], ['mfxButterfly', '🦋 Bướm và chuồn chuồn'], ['mfxSmoke', '♨️ Khói bếp & hơi nóng'], ['mfxFirefly', '✨ Đom đóm ban đêm'], ['mfxLantern', '🏮 Đèn trời bay lên'], ['mfxFirework', '🎆 Pháo hoa thỉnh thoảng'], ['mfxShoot', '🌠 Sao băng ban đêm'], ['mfxRipple', '💫 Gợn sáng khi chạm']].map(([k, l]) => row(k, l, '', onoff(k), true)).join('')
        + `<div class="set-row col"><div class="row2"><button class="btn gold sm" data-hubact="fx">✨ Xem thử hiệu ứng</button><button class="btn ghost sm" data-hubact="mapfx">🗺️ Xem thử ở bản đồ</button></div></div>`;
    } else if (id === 'ctl') {
      body = row('tapPour', '👆 Rót: chạm để rót, chạm lại để dừng', 'Dành cho người khó giữ tay. Mặc định là giữ để rót.', onoff('tapPour'), true)
        + row('assist', '🧭 Hỗ trợ tự dừng / chọn cấp cay', 'Cần trang bị cấp 3 tương ứng.', onoff('assist'), true)
        + row('relaxed', '🌶️ Chế độ thư giãn (mỳ cay chọn trực tiếp)', '', onoff('relaxed'), true)
        + row('hints', '💡 Gợi ý thao tác trên phiếu', '', onoff('hints'), true)
        + row('autoSelect', '🎯 Tự chọn đơn khi bàn trống', '', onoff('autoSelect'), true);
    } else if (id === 'shift') {
      body = row('crowd', '🚶 Người đi chợ', '', seg('crowd', [[0, 'Vắng'], [6, 'Vừa'], [10, 'Đông'], [16, 'Hội']]))
        + row('difficulty', '🎚️ Độ khó ca mới', '', seg('difficulty', [[0, 'Thong thả'], [1, 'Chuẩn'], [2, 'Thử thách']]))
        + row('shiftLength', '⏱️ Thời lượng ca', '', seg('shiftLength', [[120, '2 phút'], [240, '4 phút'], [360, '6 phút']]))
        + row('eventLevel', '⚡ Sự kiện ngẫu nhiên', 'Mất điện, đoàn kiểm tra, cháy bếp, trộm cắp… Mức Khó xảy ra nhiều hơn.', seg('eventLevel', [[0, 'Tắt'], [1, 'Nhẹ'], [2, 'Thường'], [3, 'Khó']]))
        + row('autosave', '💾 Tự lưu mỗi', '', seg('autosave', [[5, '5 giây'], [10, '10 giây'], [30, '30 giây']]));
    }
    const resettable = id !== 'ui' || true;
    return `<details class="sh-sec" data-sec="${id}" ${H.open[id] ? 'open' : ''}><summary><i>${ic}</i><span>${name}</span><em>▾</em></summary><div class="sh-body">${body}${resettable ? `<button class="sh-reset" data-hubact="reset" data-id="${id}">↺ Khôi phục mặc định mục này</button>` : ''}</div></details>`;
  }
  function guideSec() {
    return `<details class="sh-sec" data-sec="guide" ${H.open.guide ? 'open' : ''}><summary><i>📖</i><span>Hướng dẫn</span><em>▾</em></summary><div class="sh-body"><div class="set-row col"><div class="row2"><button class="btn gold sm" data-guide="start">Hướng dẫn cơ bản</button><button class="btn ghost sm" data-guide="shops">Các quầy hàng</button><button class="btn ghost sm" data-guide="festival">Hội làng</button><button class="btn ghost sm" data-guide="settings">Về cài đặt</button><button class="btn ghost sm" data-guide="tutorial">Chơi lại ca hướng dẫn</button><button class="btn ghost sm" data-spact="tour">🔦 Tham quan lại quầy</button></div></div></div></details>`;
  }
  function dataSec() {
    return `<details class="sh-sec" data-sec="data" ${H.open.data ? 'open' : ''}><summary><i>💾</i><span>Dữ liệu</span><em>▾</em></summary><div class="sh-body"><div class="set-row col"><label>Sao lưu / khôi phục</label><div class="row2"><button class="btn gold sm" data-export>Sao chép mã</button><button class="btn ghost sm" data-import>Nhập mã</button></div></div><div class="set-row col"><button class="btn danger sm" data-reset>↩️ Chơi lại từ đầu</button></div></div></details>`;
  }
  H.html = function () {
    const chips = Object.entries(SECTIONS).map(([k, v]) => `<button data-hubact="jump" data-id="${k}"><i>${v[0]}</i>${v[1]}</button>`).join('') + '<button data-hubact="jump" data-id="guide"><i>📖</i>Hướng dẫn</button><button data-hubact="jump" data-id="data"><i>💾</i>Dữ liệu</button>';
    return `<section class="page sh-page"><div class="sh-head"><h2>⚙️ Cài Đặt</h2><small>Giao diện · âm thanh · hiệu ứng · điều khiển — tất cả ở một nơi</small></div>
      <div class="sh-jump">${chips}</div>
      ${Object.keys(SECTIONS).map(section).join('')}${guideSec()}${dataSec()}
      <p class="muted center">Xuyên Không Cổ Đại · Chợ Cổ · v${C.version}</p></section>`;
  };

  /* ---------- áp dụng ---------- */
  const ACCENT = { son: ['#d8392b', '#ff7a5a'], ngoc: ['#2fa07a', '#6fd0a8'], tim: ['#8a5ad8', '#b890ff'], hong: ['#e0508a', '#ff90b8'], lam: ['#2a7ad8', '#6ab0ff'] };
  H.apply = function () {
    if (!G.S) return; const b = document.body, st = b.style;
    ['font', 'radius', 'density', 'texture', 'navStyle', 'pageAnim', 'accent'].forEach((k) => { b.dataset[k === 'navStyle' ? 'nav' : k] = val(k); });
    b.dataset.btn = val('btnSize'); b.dataset.warm = String(val('warm'));
    b.dataset.bgfx = val('bgfx'); b.dataset.fxDensity = val('fxDensity'); b.dataset.glow = String(val('glow')); b.dataset.heroMove = String(val('heroMove')); b.dataset.confetti = String(val('confetti'));
    ['Cloud', 'Bird', 'Butterfly', 'Firefly', 'Lantern', 'Firework', 'Ripple', 'Sun', 'Smoke', 'Shoot'].forEach((n) => { b.dataset['mfx' + n] = String(val('mfx' + n)); });
    st.setProperty('--dim', ((100 - val('brightness')) / 100 * .7).toFixed(3));
    const a = ACCENT[val('accent')];
    if (a) { st.setProperty('--gold', a[0]); st.setProperty('--primary', a[0]); st.setProperty('--primary2', a[1]); } else { st.removeProperty('--gold'); st.removeProperty('--primary'); st.removeProperty('--primary2'); }
    autoTheme();
    if (window.Audio2 && window.Audio2.applyVolumes) window.Audio2.applyVolumes();
  };
  let tempTheme = null;
  function autoTheme() {
    if (!G.S || !UI.vfx) return; const h = new Date().getHours(), night = h >= 18 || h < 5, want = val('autoTheme') && night ? 'dahoi' : G.S.theme;
    if (document.documentElement.dataset.theme === want) return;
    document.documentElement.dataset.theme = want; tempTheme = want; UI.vfx.setTheme(want); window.Audio2.setTheme(want);
    const th = C.themes.find((t) => t.id === want), meta = $('meta[name="theme-color"]'); if (meta && th) meta.setAttribute('content', th.sw[0]);
  }
  setInterval(autoTheme, 60000);
  const al = L.applySettings; L.applySettings = function () { al.apply(this, arguments); H.apply(); };
  const bootT = setInterval(() => { if (G.S && UI.vfx) { clearInterval(bootT); H.apply(); } }, 200);

  /* ---------- tương tác ---------- */
  function rerender() { const v = $('#view'), y = v ? v.scrollTop : 0; if (UI.page === 'settings' && v) { v.innerHTML = H.html(); v.scrollTop = y; } }
  H.rerender = rerender;
  function parse(raw) { return raw === 'true' ? true : raw === 'false' ? false : (/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw); }
  function setKey(k, v) {
    G.S.settings[k] = v;
    if (k === 'reduce') document.body.classList.toggle('reduce-motion', !!v);
    if (k === 'haptic' && v) G.buzz([40, 60, 40]);
    if (k === 'speech' && v) window.Audio2.speak('Hảo hán!');
    if (CORE_DEF[k] !== undefined) L.applySettings(); else H.apply();
    G.save();
  }
  function preview(k) {
    const A = window.Audio2; A.unlock();
    if (k === 'uiPack') { A.sfx('click'); setTimeout(() => A.sfx('tap'), 220); setTimeout(() => A.sfx('click'), 440); }
    else if (k === 'ambience' && A.amb) { A.amb.start(); A.amb.preview('market'); }
    else if (k === 'accent' || k === 'radius' || k === 'font') A.sfx('buy');
    else A.sfx('click');
  }
  function fxTest() {
    const FX = window.Festival && window.Festival.FX, set = { auto: ['🌸', '🏮', '✨'], petal: ['🌸', '🌺'], leaf: ['🍃', '🍂'], firefly: ['✨', '💛'], snow: ['❄️', '✨'], lantern: ['🏮', '✨'], rain: ['💧', '🌧️'] }[val('bgfx')] || ['✨'];
    if (FX) { const x = innerWidth / 2, y = innerHeight * .5; FX.boom(x, y, set, 14); setTimeout(() => FX.boom(x - 70, y - 40, set, 10), 160); setTimeout(() => FX.boom(x + 70, y + 20, set, 10), 320); if (val('confetti')) FX.confetti(34); }
    window.Audio2.sfx('levelup');
  }
  document.addEventListener('click', (e) => {
    if (UI.page !== 'settings') return;
    const b = e.target.closest('[data-hub]');
    if (b) { e.preventDefault(); e.stopPropagation(); const k = b.dataset.hub; setKey(k, parse(b.dataset.v)); preview(k); rerender(); return; }
    const a = e.target.closest('[data-hubact]'); if (!a) return; e.preventDefault(); e.stopPropagation();
    const act = a.dataset.hubact, id = a.dataset.id;
    if (act === 'preset') { Object.entries(PRESETS[id].set).forEach(([k, v]) => { G.S.settings[k] = v; }); G.S.settings.reduce = false; document.body.classList.remove('reduce-motion'); L.applySettings(); G.save(); window.Audio2.unlock(); window.Audio2.sfx('levelup'); UI.toast(`Đã áp dụng mẫu “${PRESETS[id].name}”`, 'ok'); rerender(); fxTest(); }
    else if (act === 'reset') { const keys = SECTIONS[id] ? SECTIONS[id][2] : []; keys.forEach((k) => { if (CORE_DEF[k] !== undefined) G.S.settings[k] = CORE_DEF[k]; else if (DEF[k] !== undefined) G.S.settings[k] = DEF[k]; }); if (id === 'ui') UI.applyTheme('thanhphong'); document.body.classList.toggle('reduce-motion', !!G.S.settings.reduce); L.applySettings(); G.save(); UI.toast('Đã khôi phục mặc định', 'ok'); window.Audio2.sfx('click'); rerender(); }
    else if (act === 'jump') { H.open[id] = true; rerender(); const d = $(`[data-sec="${id}"]`); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    else if (act === 'fx') fxTest();
    else if (act === 'amb') { window.Audio2.unlock(); if (window.Audio2.amb) { window.Audio2.amb.start(); window.Audio2.amb.preview('market'); } UI.toast('Đang phát âm thanh chợ… (6 giây)', 'ok'); }
    else if (act === 'mapfx') { UI.showPage('market'); setTimeout(() => window.MapFX && window.MapFX.demo && window.MapFX.demo(), 500); }
  }, true);
  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-hubsel]'); if (!s || UI.page !== 'settings') return; const k = s.dataset.hubsel;
    setKey(k, parse(s.value)); preview(k); if (k === 'bgfx') fxTest(); rerender();
  });
  document.addEventListener('input', (e) => {
    const r = e.target.closest('[data-hubrange]'); if (!r) return; const k = r.dataset.hubrange, v = r.dataset.scale ? r.value / r.dataset.scale : Number(r.value);
    G.S.settings[k] = v; H.apply(); const o = r.parentElement.querySelector('output'); if (o) o.textContent = k === 'brightness' ? v + '%' : v;
  });
  document.addEventListener('change', (e) => { if (e.target.closest('[data-hubrange]')) { G.save(); window.Audio2.sfx('tap'); } });
  document.addEventListener('toggle', (e) => { const d = e.target; if (d.classList && d.classList.contains('sh-sec')) H.open[d.dataset.sec] = d.open; }, true);

  /* ---------- gộp tab Giao diện vào Cài đặt ---------- */
  const showPage = UI.showPage;
  UI.showPage = function (p) {
    if (p === 'theme') { H.open.ui = true; p = 'settings'; }
    const was = UI.page === 'settings', v0 = $('#view'), y0 = v0 ? v0.scrollTop : 0, r = showPage.call(this, p);
    if (p === 'settings') { const v = $('#view'); v.innerHTML = H.html(); v.scrollTop = was ? y0 : 0; if (!was) animatePage(v); }
    else if (p !== 'market') animatePage($('#view'));
    return r;
  };
  function animatePage(v) { if (!v) return; v.classList.remove('pg-in'); void v.offsetWidth; v.classList.add('pg-in'); }
  /* chọn chủ đề: ui.js gọi showPage('theme') -> chuyển về cài đặt; giữ vị trí cuộn */
})();
