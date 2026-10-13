/* Hướng dẫn từng bước: lần đầu chơi, từng quầy lần đầu mở, và xem lại trong Cài đặt; cùng nút Toàn màn hình */
(function () {
  'use strict';
  const G = window.Game, UI = window.UI, $ = (q) => document.querySelector(q);

  const BASIC = [
    ['🏮', 'Chào mừng đến Chợ Cổ', 'Bạn vừa “xuyên không” về một khu chợ làng cổ với một ấm trà đất nung. Mục tiêu: <b>tự tay phục vụ khách</b>, kiếm xu, nâng cấp quầy, mở thêm 4 quầy nữa (trà sữa, bánh mì, xôi, mỳ cay) để thành <b>Đại Phú Hào</b>.<br><br>Hướng dẫn này gồm 18 bước ngắn. Bạn có thể bấm <b>Bỏ qua</b> bất cứ lúc nào và xem lại ở <b>Cài đặt → Hướng dẫn chi tiết</b>.'],
    ['📊', 'Thanh trên cùng', 'Góc trái là <b>danh hiệu</b> và <b>ngày</b> trong game. Giữa là số <b>xu 🪙</b> (tiền dùng để nhập hàng, nâng cấp, thuê người). Góc phải là <b>kim nguyên bảo</b> (tiền hiếm, kiếm từ nhiệm vụ & thành tựu, dùng mua Phúc đức).'],
    ['🧭', 'Thanh điều hướng phía dưới', 'Có 6 tab: <b>Chợ</b> (bản đồ các quầy) · <b>Hội làng</b> (trò chơi dân gian nhận thưởng) · <b>Nhiệm vụ</b> (chương truyện, khách quen, thành tựu) · <b>Phúc đức</b> (mua bùa lợi) · <b>Giao diện</b> (đổi chủ đề màu) · <b>Cài đặt</b> (âm thanh, hiệu ứng, độ khó).'],
    ['🗺️', 'Bản đồ chợ', 'Ở tab <b>Chợ</b>, kéo để di chuyển, chụm hai ngón để thu phóng. Chạm vào <b>biển hiệu</b> của một quầy để bước vào. Quầy còn khóa cần đủ xu để mở. Thanh nút ở đáy: <b>Các quầy</b> (danh sách nhanh), <b>Hội làng</b>, <b>Nhập hàng</b>, <b>Giao hàng</b>.'],
    ['📦', 'Bước 1 · Màn chuẩn bị', 'Vào quầy, bạn thấy màn <b>chuẩn bị</b> với 3 thẻ: <b>Mở cửa</b> (bắt đầu ca, chọn cách chơi), <b>Kho hàng</b> (mua nguyên liệu) và <b>Nâng cấp</b> (dụng cụ tốt hơn). Biển <b>ĐÓNG CỬA</b> treo ở góc, sẽ khai trương khi bạn bắt đầu.'],
    ['🧺', 'Kiểm tra kho trước ca', 'Mỗi nguyên liệu có <b>số tồn kho</b>. Hết nguyên liệu thì không làm được món. Ở thẻ <b>Kho hàng</b> bấm <b>+10 · giá</b> để mua gói. Trong lúc bán vẫn có nút <b>Nhập hàng</b> ở thanh dưới để mua gấp (kể cả bát, ly, đĩa).'],
    ['🚪', 'Bước 2 · Mở cửa đón khách', 'Bấm <b>Mở cửa đón khách</b>: cửa gỗ kéo mở, chuông reo, ca bán bắt đầu (mặc định 4 phút, chỉnh trong Cài đặt). Chạm vào màn hình khai trương để bỏ qua hiệu ứng. Khách sẽ lần lượt bước vào quầy.'],
    ['🖥️', 'Đọc màn hình làm việc', 'Từ trên xuống: <b>tên quầy & xu</b> → <b>ảnh quầy</b> (đồng hồ ca ⏱ ở góc) → <b>thanh công cụ</b> (công thức, sổ ca, gợi ý, đóng/mở cửa, tạm dừng, trang bị) → <b>3 khách đang chờ</b> → <b>phiếu đơn</b> → <b>bàn làm món</b> (toàn bộ công đoạn hiện cùng lúc, không phải chuyển tab) → <b>Bỏ món · Khay · Nhập hàng · Giao</b>.'],
    ['👥', 'Bước 3 · Chọn khách', 'Thanh dưới mỗi khách là <b>độ kiên nhẫn</b>: xanh → vàng → đỏ. Hết thanh khách sẽ bỏ đi. Chạm vào một khách để <b>ghim đơn</b> của họ. Nhãn <b>VIP</b> trả nhiều hơn, ❤ là khách quen (phục vụ tốt sẽ tăng độ thân thiết).'],
    ['🎫', 'Đọc phiếu đơn', 'Phiếu liệt kê yêu cầu <b>chính xác</b>: cỡ, đá, đường, topping, độ cay… Làm đúng từng mục để được điểm cao. Dòng <b>▸</b> bên dưới phiếu luôn nói rõ <b>việc kế tiếp</b> cần làm.'],
    ['👆', 'Bước 4 · Làm món: các loại nút', '• <b>Nút thường</b>: chạm một lần (lấy ly, thêm topping, cho vào lò…).<br>• <b>Nút “Giữ”</b> (rót trà, sữa): <b>nhấn giữ</b> để rót, <b>thả</b> để dừng.<br>• <b>Thanh nhiệt/lò/trụng</b>: canh kim, lấy ra khi nằm trong <b>vùng xanh</b>.<br>• <b>Nêm cay</b>: bấm đúng cấp 1–7 theo phiếu.'],
    ['🎯', 'Mẹo rót: vạch “Vừa đủ”', 'Khi rót, nhìn vạch xanh đứt nét <b>“Vừa đủ”</b> trên ly/bát. Thả tay đúng lúc mực nước nằm trong vạch (sai số khoảng ±5%) thì được điểm tối đa. Rót tràn hay thiếu đều bị trừ điểm. Khó giữ tay? Bật <b>Chạm để rót</b> trong Cài đặt.'],
    ['💡', 'Bí quá? Dùng Gợi ý', 'Bấm <b>💡 Gợi ý</b>: nút của bước kế tiếp sẽ <b>nhấp nháy vàng</b>. Bấm <b>📖 Công thức</b> để xem lại quy trình đầy đủ của quầy, và <b>📜 Xem phiếu</b> (cạnh ô món) để đọc lại yêu cầu của khách.'],
    ['📦', 'Bước 5 · Giao món', 'Món xong bấm <b>Giao</b> (nút xanh), rồi <b>chạm đúng khách</b> đã đặt. Có thể <b>Cất khay</b> (cần trang bị khay) để làm món khác trước, hoặc <b>Bỏ món</b> nếu lỡ làm hỏng (mất nguyên liệu đã dùng).'],
    ['⭐', 'Điểm và thưởng', 'Mỗi món được chấm theo từng thành phần: <b>hoàn hảo</b> (≥ 95%) nhận tiền cao + tiền boa + hiệu ứng ✦; <b>tạm được</b> nhận ít hơn; dưới 50% khách <b>từ chối</b>. Giao 5 đơn chuẩn liên tiếp được <b>thưởng gấp đôi</b>.'],
    ['🔥', 'Giờ cao điểm & điều khiển ca', 'Có lúc xuất hiện <b>“Giờ đông khách”</b>: khách đến nhanh và trả nhiều hơn. Dùng <b>🚪 Ngưng đón</b> để tạm dừng nhận khách mới, <b>⏸ Tạm dừng</b> để nghỉ, <b>🤝 Mời khách</b> (khi có trang bị) để kéo dài thời gian chờ của khách.'],
    ['🏆', 'Kết thúc ca & phát triển', 'Hết giờ, bạn thấy <b>tổng kết ca</b>: doanh thu, chi phí, lãi ròng, số sao, nhận xét khách. Dùng xu để <b>nâng cấp quầy</b>, <b>thuê tiểu nhị</b> (tự kiếm xu khi bạn vắng mặt), <b>mua trang bị</b> và mở quầy mới.'],
    ['🎓', 'Ca hướng dẫn & mọi thứ còn lại', 'Lần đầu vào mỗi quầy là <b>ca hướng dẫn</b>: khách chờ vô hạn, sai không bị phạt, kèm <b>tham quan giao diện</b> có đèn chiếu. Giữa các ca hãy ghé <b>Hội làng</b> (20 trò dân gian), làm <b>Nhiệm vụ</b>, chỉnh <b>Cài đặt</b> (nhiều hiệu ứng nền & âm thanh). Chúc bạn thành Đại Phú Hào!']
  ];
  const SHOPS = {
    trada: ['🍵', 'Trà đá', ['<b>Chọn khách</b> đầu hàng, đọc phiếu: cỡ bát (nhỏ/lớn), đá, có mật hay không.', 'Ở mục <b>Bát</b> chạm <b>Nhỏ</b> hoặc <b>Lớn</b> đúng cỡ để lấy bát (số trên nút là bát còn lại).', 'Mục <b>Thêm</b>: chạm <b>Đá</b> đúng số viên theo phiếu (chạm nhiều lần = thêm nhiều).', 'Mục <b>Rót trà</b>: <b>nhấn giữ</b> “Giữ để rót”, nhìn vạch xanh “Vừa đủ”, <b>thả tay</b> khi nước chạm vạch.', 'Nếu phiếu có mật, chạm <b>Mật</b> để thêm đúng lượng.', 'Bấm <b>Giao</b> rồi chạm đúng khách. Bát bẩn: chạm <b>Rửa bát</b> ở mục Dọn dẹp để dùng lại khi đông khách.', 'Mẹo: rửa bát sớm, đừng để hết bát giữa giờ cao điểm.']],
    trasua: ['🧋', 'Trà sữa', ['Mục <b>Ly</b>: chọn <b>M</b> hoặc <b>L</b> đúng phiếu (cỡ quyết định lượng nước cần rót).', '<b>Topping</b>: chạm đúng loại, đủ số phần phiếu yêu cầu (trân châu, quy linh, pudding, hạt sen).', 'Chọn <b>Đường</b> (0–100%, hoặc đường đen) và <b>Đá</b> trước khi rót để dung tích mục tiêu tính đúng; chạm <b>Bơm</b> / <b>Múc</b> để thêm.', '<b>Trà</b>: giữ vòi đúng loại (hồng trà, lục trà, ô long, matcha) đến vạch xanh thứ nhất rồi thả.', '<b>Sữa</b>: giữ vòi sữa (tươi, đặc, kem cheese) đến vạch tổng kế tiếp.', 'Mục <b>Xong</b>: <b>Khuấy → Ép nắp → Ống hút</b> theo thứ tự.', 'Bấm Giao và chạm đúng khách. Mẹo: nhầm loại trà là lỗi nặng, đọc phiếu kỹ trước khi giữ vòi.']],
    banhmi: ['🥖', 'Bánh mì', ['Mục <b>Ổ bánh</b>: lấy ổ <b>nhỏ</b> hoặc <b>lớn</b> theo phiếu.', 'Mục <b>Lò than</b>: chạm <b>Cho vào lò</b>, canh thanh nhiệt Sống → <b>Vàng giòn</b> → Cháy.', 'Chạm <b>lấy ra</b> khi kim nằm trong vùng xanh. Quá lâu là cháy, bỏ món rất tốn.', 'Chạm <b>Rạch bánh</b>, sau đó <b>Phết & nhân</b>: pate, xá xíu, trứng, dưa góp, rau mùi, sốt ớt đúng số phần.', '<b>Khép bánh</b> rồi <b>Gói giấy</b>.', 'Bấm Giao, chạm đúng khách.', 'Mẹo: có khay thì nướng sẵn một ổ trong lúc chờ khách để kịp giờ cao điểm.']],
    xoi: ['🍚', 'Xôi', ['<b>Trước ca</b>: ở thẻ Mở cửa bấm <b>♨ Hấp mẻ xôi</b> (cần nếp trong kho), mất ít thời gian để chín.', 'Mục <b>Đựng</b>: chọn <b>lá chuối</b> hoặc <b>đĩa</b> theo phiếu.', 'Mục <b>Xửng xôi</b>: chọn loại xôi (gấc, nướng, dừa, ngũ sắc).', 'Mục <b>Đơm xôi</b>: chạm đủ số muỗng; lỡ nhiều thì chạm <b>Gạt</b> để bớt.', 'Thêm <b>topping</b> theo phiếu (hành phi, ruốc, đậu phộng…). Xôi ngũ sắc phải xếp đủ 5 màu.', 'Mục <b>Gói</b>: gấp lá, buộc lạt hoặc đặt thìa nếu dùng đĩa.', 'Bấm Giao và chạm đúng khách.']],
    mycay: ['🌶️', 'Mỳ cay', ['Mục <b>Tô</b>: chọn tô nhỏ hoặc lớn.', '<b>Trụng mỳ</b>: chạm <b>Hạ rổ mỳ</b>, nhìn thanh chín, chạm <b>Nhấc rổ</b> khi kim nằm trong vùng xanh.', '<b>Nước dùng</b>: chọn đúng loại (nấm, thịt…) và số vá theo cỡ tô.', '<b>Topping</b>: thịt, nấm, rau, trứng đúng số phần.', '<b>Nêm cay</b>: bấm cấp 1–7 đúng yêu cầu phiếu (hơn hay kém đều bị trừ). Trang bị muỗng ớt cấp 3 cho phép chọn trực tiếp.', 'Chạm <b>Đặt đũa</b> rồi <b>Giao</b>.', 'Mẹo: mỳ chín quá bị nhão, đừng để rổ dưới nước quá lâu.']]
  };
  const FEST = [
    ['🪁', 'Hội làng là gì?', 'Tab <b>Hội làng</b> có <b>20 trò chơi dân gian</b> chia 4 nhóm: Vận động & phản xạ · Nhịp điệu & khéo tay · Phiêu lưu bầu trời · Trí tuệ dân gian. Chạm vào ô trò chơi để vào ván <b>toàn màn hình</b>.'],
    ['🎁', 'Thưởng mỗi ngày', 'Mỗi ngày có <b>5 lượt nhận thưởng</b> (xu + nguyên liệu cho quầy đã mở). Điểm càng cao thưởng càng nhiều. Hết lượt vẫn chơi luyện tập được. Lượt làm mới lúc 0 giờ Việt Nam.'],
    ['🔢', 'Đếm ngược & điểm', 'Trò có đồng hồ sẽ <b>đếm ngược 3-2-1</b> kèm tóm tắt cách chơi. Thanh thời gian đỏ nhấp nháy ở 5 giây cuối. Kết thúc nhận tối đa <b>3 sao</b> và ghi <b>kỷ lục</b> riêng từng trò.'],
    ['❓', 'Xem hướng dẫn từng trò', 'Bấm nút <b>?</b> ở góc ô trò chơi, hoặc mở mục <b>Cách chơi</b> ở đầu mỗi ván. Muốn thoát giữa chừng bấm <b>Rời trò chơi</b> ở góc trái.'],
    ['🎯', 'Các trò', 'Đập niêu · Bắt vịt · Kéo co · Nhảy bao bố · Nhảy dây · Hứng lồng đèn · Đi cà kheo · Đua thuyền rồng · Múa lân · Chơi chuyền · Nặn tò he · Ném còn · Thổi cơm thi · Bắn bi · Thả diều · Rồng rắn lên mây · Bịt mắt bắt dê · Ô ăn quan · Tìm đôi · Gói bánh chưng.']
  ];
  const SETTINGS = [
    ['🔊', 'Âm thanh cơ bản', 'Nhạc nền và hiệu ứng có thanh trượt riêng. Chạm màn hình lần đầu để trình duyệt cho phép bật âm thanh.'],
    ['🌿', 'Âm nền hiện trường', 'Trong <b>Âm thanh nâng cao</b> bạn bật tiếng nền theo nơi: chợ đông, nước sôi ở quầy trà, lò than ở quầy bánh mì, hơi xôi, nồi mỳ sôi, trống Hội làng… có dế đêm và tiếng mưa. Có nút <b>Nghe thử</b>.'],
    ['🎶', 'Phong cách nhạc & âm nút', 'Chọn nhạc nền: Tự động, Sáo trúc, Hội làng, Thư giãn, Đêm đèn lồng. Chọn bộ âm nút bấm: Mặc định, Mõ gỗ, Chuông nhỏ, Ống tre; bật/tắt chuông cửa khi khách đến.'],
    ['✨', 'Hiệu ứng nền', 'Chọn loại hạt bay (hoa đào, lá, đom đóm, tuyết hoa mai, đèn trời, mưa), mật độ, bật/tắt ánh đèn, nền chuyển động và pháo giấy. Bấm <b>Xem thử hiệu ứng</b> để thấy ngay.'],
    ['📳', 'Rung & giọng hô', 'Chọn mức rung hoặc tắt. “Giọng hô” là lời hô khi đạt hoàn hảo.'],
    ['👆', 'Hỗ trợ thao tác', '“Chạm để rót” dành cho người khó giữ tay. “Hỗ trợ” tự dừng khi có trang bị cấp 3. “Chế độ thư giãn” cho chọn trực tiếp cấp cay.'],
    ['🖥️', 'Hiển thị & độ khó', 'Chỉnh cỡ chữ, tương phản, chất lượng hiệu ứng, thời tiết, số người đi chợ. Chọn độ khó và thời lượng ca (áp dụng từ ca kế tiếp).'],
    ['💾', 'Sao lưu & tham quan lại', '“Sao chép mã” để lưu tiến trình, “Nhập mã” để khôi phục trên thiết bị khác. “Tham quan lại giao diện quầy” ở mục hướng dẫn để xem lại tour có đèn chiếu.']
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
