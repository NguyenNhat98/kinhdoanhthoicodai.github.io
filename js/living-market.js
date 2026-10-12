(function () {
  'use strict';
  const G = window.Game, C = window.CFG, L = window.LivingMarket = { walkers: [], time: 0 };
  const $ = (s) => document.querySelector(s);
  const img = (id, cls = '') => `<img class="sprite ${cls}" src="assets/sprites/${id}.png" alt="" draggable="false">`;
  L.customer = (id) => img('trada-walker-' + (id % 10), 'customer-sprite');
  const steps = {
    trada: ['Chọn khách và cỡ bát', 'Thêm đá theo đơn', 'Giữ ấm, rót đến vạch', 'Thêm mật nếu có', 'Giao đúng khách', 'Rửa bát để tái sử dụng'],
    trasua: ['Chọn ly M hoặc L', 'Múc topping đúng số phần', 'Chọn đường và đá trước khi rót để tính đúng dung tích', 'Rót đúng nền trà', 'Rót sữa đến vạch', 'Khuấy, ép nắp, thêm ống hút', 'Giao ly đúng khách'],
    banhmi: ['Chọn cỡ ổ bánh', 'Nướng đến vùng vàng', 'Lấy ra trước khi cháy', 'Rạch bánh, phết pate', 'Thêm nhân và rau theo đơn', 'Rưới sốt, đóng bánh', 'Gói giấy rồi giao'],
    xoi: ['Nhập nếp và hấp mẻ trước ca', 'Chọn đĩa hoặc lá chuối', 'Đơm đúng loại và số muỗng', 'Xếp đủ năm màu nếu được yêu cầu', 'Thêm topping theo phiếu', 'Gấp lá, buộc lạt hoặc thêm thìa', 'Giao và chuẩn bị mẻ kế tiếp'],
    mycay: ['Chọn cỡ tô', 'Trụng mì, vớt đúng lúc', 'Múc nước dùng đúng loại', 'Thêm thịt, rau và topping', 'Canh kim, chốt đúng cấp cay', 'Giao đúng khách; theo dõi thời gian chờ']
  };
  L.prepGuide = (id) => `<details class="recipe-guide" open><summary>📖 Quy trình ${G.shopDef(id).short}</summary><ol>${steps[id].map(s => `<li>${s}</li>`).join('')}</ol><p>Phiếu đơn là yêu cầu chính xác. Thao tác sai tiêu hao nguyên liệu; xem chất lượng và tiền thưởng sau khi giao.</p></details>`;
  L.stallTools = (id, ws) => `<div class="stall-tools"><button data-live="guide">📖 Công thức</button><button data-live="report">📊 Sổ ca</button>${ws ? '<button data-fx="hint">💡 Gợi ý</button><button data-live="door">🚪 Ngưng đón</button><button data-live="pause">⏸ Tạm dừng</button>' : '<button data-live="stock-all">🧺 Bổ sung kho</button><button data-live="settings">⚙ Cài đặt ca</button>'}</div><div class="shift-dashboard" ${ws ? '' : 'hidden'}><span data-live-revenue></span><span data-live-quality></span><span data-live-stock></span></div>`;
  function consult(html) {
    const ws = window.WS.state(); if (ws) window.WS.setPause('consult', true);
    window.UI.modal(html, () => { if (window.WS.state() === ws) window.WS.setPause('consult', false); });
  }
  L.updateStall = (ws) => {
    if (!ws) return;
    const stall = $('#stall');
    if (stall) { stall.dataset.cooking = !!(ws.product && (ws.product.inOven || ws.product.noodle === 'cooking')); stall.dataset.paused = ws.paused; }
    const texts = { '[data-live-revenue]': `🪙 ${G.fmt(ws.stats.revenue)} · ${ws.stats.served} đơn`, '[data-live-quality]': `✦ ${ws.stats.perfect} hoàn hảo`, '[data-live-stock]': `🧺 ${C.items[ws.shop].filter(i => i.w > 0 && G.stock(ws.shop, i.id) < 3).length} vật tư sắp hết` };
    Object.entries(texts).forEach(([q, t]) => { const e = $(q); if (e && e.textContent !== t) e.textContent = t; });
    const door = $('[data-live="door"]'), pause = $('[data-live="pause"]');
    if (door) { door.textContent = !ws.accepting ? '🚪 Hết giờ' : ws.doorOpen === false ? '🚪 Đón khách' : '🚪 Ngưng đón'; door.disabled = !ws.accepting; }
    if (pause) pause.textContent = ws.pauseWhy.manual ? '▶ Tiếp tục' : '⏸ Tạm dừng';
  };
  const options = {
    crowd: ['Người đi chợ', [[0, 'Vắng'], [6, 'Vừa'], [10, 'Nhộn nhịp'], [16, 'Hội đông']]],
    daylight: ['Ánh sáng', [[0, 'Theo ngày game'], [1, 'Ban ngày'], [2, 'Hoàng hôn'], [3, 'Đêm đèn lồng']]],
    weather: ['Thời tiết', [[0, 'Trời trong'], [1, 'Hoa đào rơi'], [2, 'Mưa nhẹ']]],
    quality: ['Hiệu ứng', [[0, 'Tiết kiệm pin'], [1, 'Vừa'], [2, 'Đầy đủ']]],
    textSize: ['Cỡ chữ', [[1, 'Tiêu chuẩn'], [1.12, 'Lớn'], [1.24, 'Rất lớn']]],
    contrast: ['Tăng tương phản', [[false, 'Tắt'], [true, 'Bật']]],
    hints: ['Gợi ý thao tác trên phiếu', [[true, 'Bật'], [false, 'Tắt']]],
    autoSelect: ['Tự chọn đơn khi bàn trống', [[false, 'Tắt'], [true, 'Bật']]],
    difficulty: ['Độ khó ca mới', [[0, 'Thong thả'], [1, 'Tiêu chuẩn'], [2, 'Thử thách']]],
    shiftLength: ['Thời lượng ca mới', [[120, '2 phút'], [240, '4 phút'], [360, '6 phút']]],
    autosave: ['Tự lưu mỗi', [[5, '5 giây'], [10, '10 giây'], [30, '30 giây']]]
  };
  L.settingsHtml = () => `<h3>🏮 Chợ & hiển thị</h3>${Object.entries(options).map(([key, [label, vals]], i) => `${i === 6 ? '<h3>🍵 Điều hành ca bán</h3>' : ''}<div class="set-row col"><label for="pref-${key}">${label}</label><select id="pref-${key}" data-pref="${key}">${vals.map(([v, text]) => `<option value="${v}" ${G.S.settings[key] === v ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`).join('')}<p class="muted">Độ khó và thời lượng áp dụng từ ca kế tiếp. Giảm chuyển động sẽ dừng người đi chợ và hiệu ứng trang trí. Tiến trình lưu trên thiết bị này.</p>`;
  L.applySettings = () => {
    if (!G.S) return;
    const s = G.S.settings, b = document.body;
    b.dataset.quality = s.quality; b.dataset.hints = s.hints; b.dataset.contrast = s.contrast;
    b.style.setProperty('--text-scale', s.textSize);
    b.classList.toggle('reduce-motion', s.reduce || matchMedia('(prefers-reduced-motion: reduce)').matches);
    b.dataset.light = s.daylight || [1, 2, 3][(G.S.day - 1) % 3]; b.dataset.weather = s.weather;
    if ($('#walkers')) L.buildWalkers();
  };
  const routes = [
    [[320, 280], [540, 260], [730, 275], [860, 260]],
    [[1070, 315], [1235, 350], [1370, 350], [1520, 290]],
    [[290, 550], [510, 565], [640, 600], [905, 635]],
    [[1080, 570], [1235, 600], [1320, 575], [1380, 520]],
    [[610, 827], [805, 863], [1010, 845], [1150, 810]]
  ];
  L.buildWalkers = () => {
    const host = $('#walkers'); if (!host) return;
    const n = G.S.settings.crowd;
    L.walkers = []; host.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const path = routes[i % routes.length], start = i % path.length;
      const e = document.createElement('span'); e.className = 'pedestrian';
      e.innerHTML = `<span class="walker-shadow"></span><span class="walker-body">${L.customer(i)}</span>`; host.appendChild(e);
      L.walkers.push({ el: e, path, index: start, x: path[start][0] + (i % 3) * 12, y: path[start][1], dir: 1, speed: 17 + i % 5 * 3, wait: i * 0.65, phase: i * 2 });
    }
    L.walkers.forEach(w => position(w, false));
  };
  function position(w, moving) {
    const depth = 0.65 + w.y / 1700, bounce = moving ? Math.sin(L.time * 10 + w.phase) * 1.5 : 0;
    w.el.style.transform = `translate(${w.x}px,${w.y}px) scale(${depth})`;
    w.el.style.zIndex = Math.round(w.y);
    w.el.querySelector('.walker-body').style.transform = `translateY(${bounce}px) scaleX(${w.face || 1}) rotate(${moving ? Math.sin(L.time * 5 + w.phase) * 1.2 : 0}deg)`;
  }
  L.tick = (dt) => {
    if (!G.S || document.hidden) return;
    L.time += dt;
    if (window.WUI.isOpen() || window.UI.page !== 'market' || document.body.classList.contains('reduce-motion')) return;
    L.walkers.forEach(w => {
      if (!w.el.isConnected) return;
      if (w.wait > 0) { w.wait -= dt; position(w, false); return; }
      let next = w.index + w.dir;
      if (next < 0 || next >= w.path.length) { w.dir *= -1; next = w.index + w.dir; }
      const [x, y] = w.path[next], dx = x - w.x, dy = y - w.y, distance = Math.hypot(dx, dy);
      const blocked = L.walkers.some(other => other !== w && other.path === w.path && other.dir === w.dir && Math.hypot(other.x - w.x, other.y - w.y) < 28 && (other.x - w.x) * dx + (other.y - w.y) * dy > 0);
      if (!blocked) {
        const step = Math.min(distance, w.speed * dt);
        if (distance > 0) { w.x += dx / distance * step; w.y += dy / distance * step; w.face = dx < 0 ? -1 : 1; }
        if (distance < 2) { w.index = next; w.wait = next === 0 || next === w.path.length - 1 ? 2 + (w.phase % 3) : 0.15; }
      }
      position(w, !blocked);
    });
  };
  const mount = window.MM.mount;
  window.MM.mount = function (host) {
    mount(host);
    const stage = $('#mapStage');
    stage.insertAdjacentHTML('beforeend', `<div class="market-atmosphere" aria-hidden="true">${[150,455,735,975,1205].map((x,i) => `<span class="stall-steam" style="left:${x}px;top:${210 + i % 2 * 12}px"></span>`).join('')}${Array.from({length:18},(_,i)=>`<i class="weather-particle" style="left:${i * 5.7}%;--delay:-${i * .7}s;--speed:${3 + i % 4}s"></i>`).join('')}</div>`);
    $('#map').insertAdjacentHTML('beforeend', `<div class="market-heading"><small>PHỐ CHỢ • LÀNG CỔ</small><b>Một ngày ở chợ</b><span data-market-day></span></div><div class="market-dock"><button data-live="stalls">🏪 Các quầy</button><button data-live="festival">🪁 Hội làng</button><button data-live="stock-market">🧺 Nhập hàng</button></div>`);
    L.applySettings();
    window.MM.refresh();
  };
  const refresh = window.MM.refresh;
  window.MM.refresh = function () {
    refresh();
    if ($('#walkers') && ($('#walkers .wk') || !$('#walkers .pedestrian') && G.S.settings.crowd > 0)) L.buildWalkers();
    const day = $('[data-market-day]'); if (day) day.textContent = `Ngày ${G.S.day} · ${['','Nắng trong','Hoàng hôn','Đêm hoa đăng'][Number(document.body.dataset.light) || 1]}`;
  };
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-pref]'); if (!el) return;
    const key = el.dataset.pref, v = el.value === 'true' ? true : el.value === 'false' ? false : Number(el.value);
    if (!options[key] || !options[key][1].some(([n]) => n === v)) return;
    G.S.settings[key] = v; L.applySettings(); G.save(); window.UI.toast('Đã lưu cài đặt', 'ok');
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-live]'); if (!b) return;
    const action = b.dataset.live, ws = window.WS.state(), id = window.WUI.shop;
    if (action === 'festival') window.UI.showPage('festival');
    else if (action === 'stalls') window.MM.findMenu();
    else if (action === 'stock-market') { window.MM.showCard('npc', 'nl4'); }
    else if (action === 'settings') { window.WUI.close(); window.UI.showPage('settings'); }
    else if (action === 'guide') consult(`<h3>📖 ${G.shopDef(id).short}</h3>${L.prepGuide(id)}<button class="btn gold" data-close>Tiếp tục</button>`);
    else if (action === 'pause' && ws) { window.WS.setPause('manual', !ws.pauseWhy.manual); L.updateStall(ws); G.save(); }
    else if (action === 'door' && ws && ws.accepting) { ws.doorOpen = ws.doorOpen === false; L.updateStall(ws); G.save(); window.UI.toast(ws.doorOpen ? 'Đang đón khách mới' : 'Tạm ngưng đón khách; đồng hồ và đơn hiện tại vẫn tiếp tục.'); }
    else if (action === 'report') {
      const st = G.S.shops[id];
      consult(`<h3>📊 Sổ quầy ${G.shopDef(id).short}</h3><p>Tổng đã giao: <b>${st.served}</b> đơn · cấp ${st.level} · ${st.staff} tiểu nhị</p>${ws ? `<p>Ca này: ${ws.stats.served} đơn · ${ws.stats.perfect} hoàn hảo</p><p>Doanh thu ${G.fmt(ws.stats.revenue)} · Giá vốn món ${G.fmt(ws.stats.cost)} · Hao phí ${G.fmt(ws.stats.waste)} xu</p>` : '<p>Chưa mở ca mới.</p>'}<h4>Vật tư sắp hết (&lt; 3 phần)</h4><p>${C.items[id].filter(i => (i.w > 0 || i.reuse) && G.stock(id,i.id) < 3).map(i => `${i.name}: ${G.stock(id,i.id)}`).join(' · ') || 'Kho còn đủ.'}</p><button class="btn gold" data-close>Đóng sổ</button>`);
    } else if (action === 'stock-all' && id && !ws) {
      const needs = C.items[id].filter(i => (i.w > 0 || i.reuse) && G.stock(id,i.id) < Math.max(3, G.packSize(id,i.id)));
      const cost = needs.reduce((n,i) => n + G.packCost(id,i.id),0);
      window.UI.modal(`<h3>🧺 Bổ sung kho</h3><p>Mua một gói cho mỗi vật tư còn dưới mức một gói:</p><p>${needs.map(i => `${i.name} +${G.packSize(id,i.id)}`).join(' · ') || 'Kho đang đủ, chưa cần bổ sung.'}</p><p>Tổng: <b>${G.fmt(cost)} xu</b></p><button class="btn gold" data-live="confirm-stock" data-shop="${id}" ${!needs.length || G.S.coins < cost ? 'disabled' : ''}>Mua các gói trên</button> <button class="btn ghost" data-close>Đóng</button>`);
      L.restockQuote = { id, items: needs.map(i=>i.id), cost };
    } else if (action === 'confirm-stock') {
      const q = L.restockQuote; L.restockQuote = null;
      if (!q || q.id !== b.dataset.shop || G.S.coins < q.cost || window.WS.state()) return;
      q.items.forEach(item => G.buyPack(q.id,item)); window.UI.closeModal(); window.WUI.render();
    }
  });
  // Upgrade the actual ingredient controls; leave product SVGs for continuous fill/cook states.
  L.decorate = () => {
    const id = window.WUI.shop; if (!id) return;
    const byItem = {
      trada: { da: 'trasua-ice-cubes' },
      trasua: { tc_den:'trasua-pearl-black', quylinh:'trasua-grass-jelly', pudding:'trasua-pudding', hatsen:'trasua-lotus', da:'trasua-ice-cubes', sua_tuoi:'trasua-milk', sua_dac:'trasua-condensed', kem:'trasua-cream', duong_den:'trasua-brown-sugar' },
      banhmi: { pate:'banhmi-pate', xaxiu:'banhmi-char-siu', trung:'banhmi-egg', dua:'banhmi-pickle', rau:'banhmi-coriander', ot:'banhmi-chili-sauce' },
      xoi: { ga:'xoi-chicken', dau:'xoi-mung-bean', hanh:'xoi-fried-onion', dua:'xoi-coconut' },
      mycay: { thit:'mycay-beef', nam:'mycay-shiitake', rau:'mycay-mustard', trung:'mycay-egg' }
    };
    document.querySelectorAll('#stall .tr[data-arg],#stall .pp-item').forEach(el => {
      let item; if (el.dataset.arg) { const a=JSON.parse(el.dataset.arg); item=a.id; }
      else item=el.querySelector('[data-item]')?.dataset.item;
      const sprite = byItem[id]?.[item], target = el.querySelector('i,.pi-i');
      if (sprite && target && !target.querySelector('img')) target.innerHTML = img(sprite);
    });
  };
  const render = window.WUI.render, renderAll = window.WUI.renderAll;
  window.WUI.render = function () { render(); L.decorate(); };
  window.WUI.renderAll = function () { renderAll(); L.decorate(); };
  document.addEventListener('DOMContentLoaded', L.applySettings);
})();
