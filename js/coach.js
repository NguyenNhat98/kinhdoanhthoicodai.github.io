/* ============================================================================
   HƯỚNG DẪN TRÊN MÀN HÌNH QUẦY (lần đầu mỗi quầy, trong ca hướng dẫn):
   1) Tour có đèn chiếu: sáng lên từng khu vực (khách, phiếu, món, bàn nguyên liệu, giao…) kèm lời giải thích.
   2) Huấn luyện viên sống: nút cần bấm ở bước kế tiếp tự nhấp nháy, dòng ▸ gợi ý nổi bật.
   Có thể xem lại tour ở Cài đặt → “Tham quan lại giao diện quầy”.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, WS = window.WS, WUI = window.WUI;
  const $ = (q, r) => (r || document).querySelector(q);
  const Coach = window.Coach = { active: null };

  const STEPS = [
    ['.st-queue', '👥 Khách đang chờ', 'Tối đa 3 khách xếp hàng. Thanh dưới mỗi khách là <b>độ kiên nhẫn</b>: hết thanh là khách bỏ đi. <b>Chạm vào một khách</b> để nhận đơn của họ.'],
    ['.st-ticket', '🎫 Phiếu đơn', 'Đây là <b>yêu cầu chính xác</b> của khách. Dòng <b>▸</b> bên dưới luôn cho biết việc kế tiếp cần làm.'],
    ['.b-left .prod, .prod', '🥣 Món đang làm', 'Món của bạn hiện ở đây theo thời gian thực. Thanh vạch xanh <b>“Vừa đủ”</b> là mục tiêu khi rót.'],
    ['.b-right', '🧰 Bàn nguyên liệu', '<b>Tất cả công đoạn hiện cùng lúc</b>, không phải chuyển tab. Chạm theo thứ tự từ trên xuống. Số nhỏ ở góc nút là nguyên liệu còn trong kho.'],
    ['.st-actions', '📦 Thanh thao tác', '<b>Bỏ món</b> khi lỡ hỏng, <b>Khay</b> để cất món làm trước, <b>Nhập hàng</b> khi thiếu nguyên liệu và nút xanh <b>Giao</b>: bấm Giao rồi chạm đúng khách.'],
    ['.stall-tools', '🛠️ Công cụ', '<b>💡 Gợi ý</b> làm nút kế tiếp nhấp nháy · <b>📖 Công thức</b> xem quy trình · <b>🚪 Ngưng đón</b> dừng nhận khách mới · <b>⏸ Tạm dừng</b> nghỉ giữa ca.'],
    ['.st-queue .cust:not(.empty)', '👆 Thử ngay!', 'Hãy <b>chạm vào khách đầu tiên</b> rồi làm theo dòng ▸ gợi ý. Nút cần bấm sẽ tự nhấp nháy. Ca hướng dẫn không bị phạt, cứ thoải mái thử nhé!']
  ];

  let layer = null, step = 0, tourShop = null;
  function visible(el) { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4; }
  function target(i) { const sels = STEPS[i][0].split(','); for (const q of sels) { const el = $('#stall ' + q.trim()); if (visible(el)) return el; } return null; }
  function end(done) {
    if (!layer) return; layer.remove(); layer = null;
    const ws = WS.state(); if (ws) WS.setPause('coach', false);
    if (done && G.S) { G.S.flags['tour_' + tourShop] = 1; G.save(); }
    document.querySelectorAll('#stall .coach-lit').forEach((e) => e.classList.remove('coach-lit'));
  }
  function render() {
    const app = $('#app'); if (!app || !layer) return;
    while (step < STEPS.length && !target(step)) step++;
    if (step >= STEPS.length) { end(true); return; }
    const el = target(step), r = el.getBoundingClientRect(), a = app.getBoundingClientRect(), pad = 5;
    document.querySelectorAll('#stall .coach-lit').forEach((e) => e.classList.remove('coach-lit')); el.classList.add('coach-lit');
    const top = r.top - a.top - pad, left = r.left - a.left - pad, w = r.width + pad * 2, h = r.height + pad * 2, below = top + h + 150 < a.height;
    layer.innerHTML = `<div class="co-hole" style="top:${top}px;left:${left}px;width:${w}px;height:${h}px"></div>
      <div class="co-card ${below ? 'below' : 'above'}" style="${below ? `top:${top + h + 10}px` : `bottom:${a.height - top + 10}px`}">
        <small>Tham quan quầy · ${step + 1}/${STEPS.length}</small><h4>${STEPS[step][1]}</h4><p>${STEPS[step][2]}</p>
        <div class="co-nav"><button class="btn ghost sm" data-co="skip">Bỏ qua</button>${step ? '<button class="btn ghost sm" data-co="prev">‹ Trước</button>' : ''}<button class="btn gold sm" data-co="next">${step === STEPS.length - 1 ? 'Bắt đầu!' : 'Tiếp ›'}</button></div></div>`;
    window.Audio2.sfx('tap');
  }
  Coach.start = function (force) {
    const ws = WS.state(), id = WUI && WUI.shop; if (!ws || !id || layer) return;
    if (!force && (!ws.tutorial || (G.S.flags['tour_' + id]))) return;
    if (!$('#stall .st-bench')) return;
    tourShop = id; step = 0; layer = document.createElement('div'); layer.className = 'coach-layer'; $('#app').appendChild(layer);
    WS.setPause('coach', true); render();
    layer.addEventListener('click', (e) => {
      const b = e.target.closest('[data-co]'); if (!b) return; const k = b.dataset.co;
      if (k === 'skip') end(true); else if (k === 'prev') { step = Math.max(0, step - 1); render(); } else { step++; if (step >= STEPS.length) end(true); else render(); }
    });
  };
  Coach.maybeTour = function () { setTimeout(() => Coach.start(false), 300); };
  Coach.reset = function () { if (!G.S) return; Object.keys(G.S.flags).forEach((k) => { if (k.indexOf('tour_') === 0) delete G.S.flags[k]; }); G.save(); };
  document.addEventListener('click', (e) => { if (e.target.closest('#stall [data-w="back"]')) end(false); }, true);

  /* ---------- huấn luyện viên sống: làm nổi nút của bước kế tiếp ---------- */
  const norm = (t) => (t || '').toLowerCase().replace(/[0-9\/·+−]/g, '').trim();
  let lastHint = '';
  function live() {
    const ws = WS.state(); if (!ws || !ws.tutorial || ws.paused || !WUI || !WUI.shop || document.body.dataset.hints === 'false') return;
    const hint = ($('[data-w-hint]') || {}).textContent || ''; if (!hint || hint === lastHint) return; lastHint = hint;
    const h = hint.toLowerCase(); let best = null, len = 0;
    document.querySelectorAll('#stall .tr, #stall .ac').forEach((b) => { b.classList.remove('coach-next'); const t = norm((b.querySelector('span') || b).textContent); if (t.length > 1 && h.indexOf(t) >= 0 && t.length > len) { best = b; len = t.length; } });
    if (!best && h.indexOf('giao') >= 0) best = $('#stall .ac.go');
    if (best) best.classList.add('coach-next');
    const tk = $('#stall .tk-hint'); if (tk) tk.classList.add('coach-hint');
  }
  setInterval(live, 500);
  document.addEventListener('click', () => { lastHint = ''; }, true);
  window.addEventListener('resize', () => { if (layer) render(); });
})();
