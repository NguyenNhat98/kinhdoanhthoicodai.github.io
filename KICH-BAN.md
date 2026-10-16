
---

# Kịch bản sửa lỗi theo phản hồi (đợt 5)

| # | Yêu cầu | Cách làm |
|---|---|---|
| 1 | Thêm nhiều cài đặt giao diện, gộp vào Cài đặt, không tách tab riêng | `js/settings-hub.js` + `css/ui-custom.css`: bỏ tab "Giao diện"; Cài đặt chia 7 mục thu gọn (Giao diện · Âm thanh · Hiệu ứng · Điều khiển · Ca bán · Hướng dẫn · Dữ liệu) có thanh nhảy nhanh, nút khôi phục mặc định từng mục, 3 mẫu cài nhanh (Tối giản / Cân bằng / Lung linh). Thêm: tự đổi chủ đề theo giờ, màu nhấn, phông chữ, bo góc, mật độ, cỡ nút, họa tiết nền, kiểu thanh điều hướng, hiệu ứng chuyển trang, độ sáng, lọc ánh sáng ấm, mức sự kiện, 10 công tắc hiệu ứng màn hình chính |
| 2 | Màn Phát triển: mất điện, an toàn thực phẩm, đoàn kiểm tra… liên kết với màn bán hàng | `js/events.js` + `css/events.css`: 7 sự kiện trong ca (mất điện, mưa bão, đoàn kiểm tra, ngộ độc, cháy bếp, trộm, food blogger) có dự báo ở màn chuẩn bị, hiệu ứng riêng và nhật ký; 7 hạng mục an toàn (máy phát điện, giấy phép, ATTP, chữa cháy, camera, bảo hiểm, khử trùng); vệ sinh quầy (nhãn 🧼 trong ca để dọn); tab **An toàn** và **Nghiên cứu** (8 đề tài chạy theo ca, giảm giá nhập/tăng khách/giảm thiệt hại…). Liên kết: nhân viên Bảo vệ/Phụ việc, mái che, bảo hiểm, nghiên cứu đều tác động lên sự kiện |
| 3 | Thêm trò, hiệu ứng mượt, nhân vật đúng nghĩa | `js/festival-folk2.js`: 6 trò mới (Đánh đáo, Đánh quay, Câu cá, Giã bánh dày, Thả đỉa ba ba, Rước đèn ông sao) → 26 trò; `js/game-art.js`: ~50 SVG nhân vật/vật phẩm thay emoji (trẻ em áo dài, thầy thuốc, dê, lân, trống, niêu đất…); vật thể chuyển động dùng transform/translate + tách lớp để mượt |
| 4 | Mở cửa đón khách đẹp, chuyển động mượt | `js/stall-fx.js`: bầu trời + mặt trời mọc, 5 đèn lồng sáng lần lượt, **4 mục kiểm tra an toàn** (điện, giấy phép, ATTP, vệ sinh) đóng dấu từng cái, kéo kéo cắt băng khánh thành, biển ĐÓNG CỬA lật thành MỞ CỬA, khách kéo đến xếp hàng, pháo hoa |
| 5 | Màn hình chính nhiều hiệu ứng, cài đặt dễ dùng | `js/map-fx.js`: bóng mây, tia nắng, đàn chim, bướm, khói bếp, đom đóm, đèn trời, pháo hoa, sao băng, gợn sáng khi chạm; mỗi hiệu ứng có công tắc riêng + nút xem thử trong Cài đặt |
