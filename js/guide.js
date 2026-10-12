/* Hướng dẫn từng bước: lần đầu chơi, từng quầy lần đầu mở, và xem lại trong Cài đặt; cùng nút Toàn màn hình */
(function () {
  'use strict';
  const G = window.Game, UI = window.UI, $ = (q) => document.querySelector(q);

  const BASIC = [
    ['🏮', 'Chào mừng đến Chợ Cổ', 'Bạn bắt đầu với một quầy trà đá. Kiếm xu từ việc tự tay phục vụ khách, rồi mở thêm quầy trà sữa, bánh mì, xôi và mỳ cay.'],
    ['🗺️', 'Bản đồ chợ', 'Ở tab <b>Chợ</b>, chạm vào biển hiệu của một quầy để vào. Quầy có khóa cần đủ xu để mở. Nút <b>Các quầy</b> giúp tìm nhanh quầy, <b>Nhập hàng</b> để mua nguyên liệu.'],
    ['📦', 'Bước 1 · Chuẩn bị', 'Trong màn chuẩn bị của quầy, kiểm tra kho nguyên liệu và bấm <b>+ mua gói</b> nếu thiếu. Có thể nâng cấp dụng cụ và thuê tiểu nhị. Sau đó bấm <b>Mở cửa đón khách</b>.'],
    ['👥', 'Bước 2 · Chọn khách', 'Khách xếp hàng ở phía trên, thanh xanh là độ kiên nhẫn. Chạm vào một khách để xem <b>phiếu đơn</b>: cỡ, đá, đường, topping… Làm đúng phiếu để được điểm hoàn hảo.'],
    ['🥣', 'Bước 3 · Làm món', 'Bấm các nút ở bàn thao tác theo thứ tự gợi ý ở dòng ▸ phía dưới phiếu: lấy dụng cụ đựng → thêm nguyên liệu → rót/nướng/đơm. Nút có chữ <b>Giữ</b> thì nhấn giữ để rót, thả ra để dừng đúng vạch.'],
    ['💡', 'Cần gợi ý?', 'Bấm <b>💡 Gợi ý</b> để nút của bước tiếp theo nhấp nháy. Bấm <b>📖 Công thức</b> để xem lại quy trình bất kỳ lúc nào.'],
    ['📦', 'Bước 4 · Giao hàng', 'Món xong thì bấm <b>Giao</b>, rồi chạm vào đúng khách. Có thể <b>Cất khay</b> để làm món khác trước, hoặc <b>Bỏ món</b> nếu làm hỏng.'],
    ['🛒', 'Hết nguyên liệu hoặc hết bát?', 'Bấm <b>Nhập hàng</b> ở thanh dưới ngay trong ca: có thể mua thêm nguyên liệu và cả bát, ly, đĩa. Bát bẩn thì dùng <b>Rửa bát</b> để dùng lại.'],
    ['🏆', 'Kết thúc ca & phát triển', 'Hết giờ, bạn nhận tổng kết ca: xu, đánh giá, sao. Dùng xu để nâng cấp quầy, thuê nhân viên, mở thêm quầy. Chơi <b>Hội làng</b> để nhận thưởng nhỏ giữa các ca.'],
    ['🎓', 'Ca hướng dẫn', 'Lần đầu vào mỗi quầy sẽ có <b>ca hướng dẫn</b>: khách chờ vô hạn, sai không bị phạt. Hãy thử thoải mái. Xem lại hướng dẫn này trong <b>Cài đặt → Hướng dẫn chi tiết</b>.']
  ];
  const SHOPS = {
    trada: ['🍵', 'Trà đá', ['Lấy bát nhỏ/lớn đúng cỡ theo phiếu.', 'Thêm đá: không / ít / nhiều theo phiếu.', 'Nhấn giữ “Giữ để rót” đến vạch xanh “Vừa đủ”, thả tay để dừng.', 'Thêm mật nếu phiếu có.', 'Bấm Giao rồi chạm đúng khách. Bát đã dùng nhớ Rửa bát.']],
    trasua: ['🧋', 'Trà sữa', ['Chọn ly M hoặc L.', 'Múc topping đúng loại và số phần.', 'Giữ vòi trà đến vạch, rồi giữ vòi sữa đến vạch kế tiếp.', 'Chọn mức đường, đá rồi bấm Bơm/Múc.', 'Khuấy → Ép nắp → Ống hút, rồi Giao.']],
    banhmi: ['🥖', 'Bánh mì', ['Lấy ổ bánh nhỏ/lớn.', 'Cho vào lò, canh thanh nhiệt: lấy ra khi nằm trong vùng xanh “Vàng giòn”.', 'Rạch bánh, phết pate, thêm xá xíu, trứng, dưa góp, rau, sốt theo phiếu.', 'Khép bánh → Gói giấy → Giao.']],
    xoi: ['🍚', 'Xôi', ['Trước ca: hấp mẻ xôi ở màn chuẩn bị.', 'Chọn lá chuối hoặc đĩa.', 'Chọn loại xôi, đơm đủ số muỗng (Gạt −1 nếu lỡ nhiều).', 'Thêm topping theo phiếu; xôi ngũ sắc phải xếp đủ 5 màu.', 'Gấp lá, buộc lạt hoặc đặt thìa, rồi Giao.']],
    mycay: ['🌶️', 'Mỳ cay', ['Lấy tô nhỏ/lớn.', 'Hạ rổ mỳ, nhấc rổ khi thanh nằm trong vùng xanh.', 'Múc nước dùng đúng loại, thêm topping.', 'Nêm ớt: bấm Dừng! đúng cấp cay phiếu yêu cầu (1–7).', 'Đặt đũa và Giao.']]
  };
  const FEST = [
    ['🪁', 'Hội làng', 'Tab <b>Hội làng</b> có nhiều trò chơi nhỏ. Mỗi ngày có 5 lượt nhận thưởng (xu + nguyên liệu); hết lượt vẫn chơi luyện tập được.'],
    ['❓', 'Hướng dẫn từng trò', 'Bấm nút <b>?</b> ở góc thẻ trò chơi, hoặc mở phần <b>Cách chơi</b> ngay đầu mỗi ván.'],
    ['🎯', 'Các trò', 'Ném còn (canh thời điểm) · Ô ăn quan (chiến thuật) · Tìm đôi (trí nhớ) · Đập niêu (phản xạ) · Bắt vịt (nhanh tay) · Kéo co (gõ nhanh).']
  ];
  const SETTINGS = [
    ['🔊', 'Âm thanh', 'Nhạc nền và hiệu ứng có thanh trượt riêng. Chạm màn hình lần đầu để bật âm thanh.'],
    ['📳', 'Rung & giọng hô', 'Chọn mức rung hoặc tắt. “Giọng hô” là lời hô khi đạt hoàn hảo.'],
    ['👆', 'Hỗ trợ thao tác', '“Chạm để rót” dành cho người khó giữ tay. “Hỗ trợ” tự dừng khi có trang bị cấp 3. “Chế độ thư giãn” cho chọn trực tiếp cấp cay.'],
    ['🖥️', 'Hiển thị', 'Bật Toàn màn hình để ẩn thanh địa chỉ. Chỉnh cỡ chữ, tương phản, hiệu ứng, thời tiết và số người đi chợ.'],
    ['⏱️', 'Độ khó & ca bán', 'Chọn độ khó và thời lượng ca; áp dụng từ ca kế tiếp. “Tự lưu” quyết định tần suất lưu tiến trình.'],
    ['💾', 'Sao lưu', '“Sao chép mã” để lưu tiến trình, “Nhập mã” để khôi phục trên thiết bị khác.']
  ];

  function show(title, steps, onClose, i) {
    i = i || 0; const s = steps[i], last = i === steps.length - 1;
    UI.modal(`<div class="gd"><small class="gd-t">${title} · ${i + 1}/${steps.length}</small><div class="gd-ic">${s[0]}</div><h3>${s[1]}</h3><div class="gd-b">${s[2]}</div>
      <div class="gd-dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="gd-nav">${i ? '<button class="btn ghost" data-gd="prev">‹ Trước</button>' : '<button class="btn ghost" data-close>Bỏ qua</button>'}${last ? '<button class="btn gold" data-close>Bắt đầu!</button>' : '<button class="btn gold" data-gd="next">Tiếp ›</button>'}</div></div>`, onClose);
    const m = $('#modal'); const prev = m.onclick;
    m.onclick = (e) => {
      const b = e.target.closest('[data-gd]');
      if (b) { window.Audio2.sfx('click'); show(title, steps, onClose, i + (b.dataset.gd === 'next' ? 1 : -1)); return; }
      prev(e);
    };
  }
  const Guide = window.Guide = {
    open(kind, onClose) {
      const map = { start: ['Hướng dẫn cơ bản', BASIC], festival: ['Hội làng', FEST], settings: ['Cài đặt', SETTINGS] };
      if (kind === 'shops') {
        const steps = Object.values(SHOPS).map(([ic, name, st]) => [ic, 'Quầy ' + name, `<ol class="gd-ol">${st.map((x) => `<li>${x}</li>`).join('')}</ol>`]);
        return show('Các quầy hàng', steps, onClose);
      }
      if (kind === 'all') return show('Cài đặt', SETTINGS, onClose);
      const m = map[kind] || map.start; show(m[0], m[1], onClose);
    },
    shop(id, onClose) { const s = SHOPS[id]; if (s) show('Quầy ' + s[1], s[2].map((x, i) => [i === 0 ? s[0] : '▸', 'Bước ' + (i + 1), x]), onClose); }
  };

  /* hướng dẫn cơ bản trong lần chơi đầu */
  const ci = UI.chapterIntro;
  UI.chapterIntro = function () {
    if (G.S && !G.S.flags.guideSeen) { G.S.flags.guideSeen = 1; G.save(); Guide.open('start', () => ci()); } else ci();
  };
  /* hướng dẫn quầy khi vào quầy lần đầu */
  if (window.WUI) {
    const open = window.WUI.open;
    window.WUI.open = function (id) {
      open.apply(this, arguments);
      if (G.S && window.WUI.shop === id && !G.S.flags['guide_' + id]) { G.S.flags['guide_' + id] = 1; G.save(); setTimeout(() => Guide.shop(id), 350); }
    };
  }
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-guide]'); if (g) { window.Audio2.sfx('click'); Guide.open(g.dataset.guide === 'tutorial' ? 'start' : g.dataset.guide); if (g.dataset.guide === 'tutorial' && G.S) { G.S.tut = {}; G.save(); UI.toast('Ca hướng dẫn sẽ chạy lại khi bạn vào quầy.', 'ok'); } return; }
    if (e.target.closest('[data-fs]')) toggleFs();
  });

  /* toàn màn hình */
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFs() {
    const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
    if (f && !isFs()) { try { const p = f.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (_) { /* iOS Safari: dùng Thêm vào Màn hình chính */ } }
  }
  function toggleFs() {
    if (isFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const el = document.documentElement;
    if (!(el.requestFullscreen || el.webkitRequestFullscreen)) { UI.toast('Trình duyệt này không hỗ trợ. Hãy dùng “Thêm vào Màn hình chính” để chơi toàn màn hình.'); return; }
    enterFs();
  }
  window.addEventListener('DOMContentLoaded', () => {
    const b = $('#splashBtn'); if (b) b.addEventListener('click', enterFs);
  });
  /* mặc định toàn màn hình: vào lại ở lần chạm kế tiếp nếu trình duyệt thoát ra (cần thao tác người dùng) */
  let desktopTried = false;
  document.addEventListener('pointerdown', () => {
    if (isFs()) return;
    if (window.matchMedia('(pointer:coarse)').matches) enterFs();
    else if (!desktopTried) { desktopTried = true; enterFs(); }
  }, true);
})();
