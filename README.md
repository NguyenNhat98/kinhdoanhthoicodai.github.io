# Xuyên Không Cổ Đại — Chợ Cổ sống động

Mở `index.html` để chơi. Bản mới thêm người đi chợ bằng sprite, ánh sáng/ngày/đêm và thời tiết, cảnh riêng cho năm quầy, bảng điều hành ca, cài đặt mở rộng và Hội làng (ném còn, ô ăn quan, tìm đôi nguyên liệu). Tiến trình cũ được giữ và bổ sung các tùy chọn mặc định.

- [Phân tích và kịch bản thiết kế chi tiết](docs/THIET-KE-CHO-VA-QUAY.md)
- [Đối chiếu sprite với vùng ảnh gốc](assets-review.html)
- `scripts/extract-assets.ps1`: tách lại tài sản từ sáu bảng trong thư mục `../Anh`.
- `scripts/check-assets.ps1`: kiểm tra PNG, alpha và pixel còn lại khớp ảnh gốc.
- `scripts/check-browser.ps1`: kiểm tra luồng game bằng Chrome/Edge headless với profile riêng. Dùng `-Width 360 -Height 640` để kiểm tra điện thoại nhỏ.
- Xem trước: `scripts/check-browser.ps1 -Page tests/preview.html -Mode stall -Name stall`; các chế độ khác gồm `market`, `prep`, `festival`, `settings`.

Chạy các script bằng PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-browser.ps1`. Kết quả kiểm tra/screenshot ở `.qa/` và không đưa vào Git.

---

Thông tin nền của engine ban đầu:

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
