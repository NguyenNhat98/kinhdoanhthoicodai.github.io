# Xuyên Không Cổ Đại — bản dọc (GameNew1)

Chạy: mở `index.html` (không cần máy chủ). Màn hình dọc, tối ưu 360×640 → 430×932.

## Cấu trúc
- `js/workshop-engine.js` — luật ca làm: đơn, đồng hồ ca, rót giữ vòi, chấm điểm, thanh toán, khay, sự kiện giờ cao điểm, lưu/khôi phục ca.
- `js/workshop-recipes.js` — lệnh từng quầy (trà đá, trà sữa, bánh mì, xôi, mỳ cay).
- `js/workshop-ui.js`, `css/workshop.css` — giao diện quầy thao tác tay.
- `js/market.js`, `css/market.css` — bản đồ chợ (kéo, thu phóng, điểm chạm).
- Lưu game: localStorage `xuyenkhong_codai_v2` (tự nâng từ v1).

## Đã kiểm thử (Chrome headless, 390×844, thao tác thật)
Trà đá, trà sữa (giữ vòi, đúng vạch mục tiêu → hoàn hảo); bánh mì, xôi, mỳ cay chạy qua engine và render UI;
thanh toán một lần mỗi đơn; lưu giữa ca có dữ liệu ca.

## Chưa kiểm thử / giản lược
- Âm thanh, rung, APK trên máy thật.
- Chưa có hạn sử dụng nguyên liệu theo lô.
- Chưa có phân vai nhân viên; vẫn dùng chế độ quản lý CPS cũ.
- Chưa có thiết bị: kho mát, bàn thứ hai, bàn ghế, biển hiệu.
- Mỳ cay: chọn trực tiếp mức cay cần bật "Hỗ trợ" hoặc nâng Muỗng ớt cấp 3; mặc định dùng kim cay.
- Chưa thử UI cho: khay, sự kiện cao điểm, 360×640, hiệu ứng chủ đề lên bản đồ.
