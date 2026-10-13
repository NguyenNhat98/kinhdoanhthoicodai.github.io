# Kịch bản triển khai — bản dọc

Theo `KICH-BAN-CHO-CO-PHA-CHE-CHI-TIET.md`: bản đồ chợ thay danh sách làng; 5 quầy (trà đá, trà sữa, bánh mì, xôi, mỳ cay)
thao tác từng bước bằng tay; đơn hàng, ca làm 4 phút, chấm chất lượng theo thành phần (hoàn hảo ≥ 0,95, từ chối < 0,5),
nâng cấp thiết bị bậc 0–3 (mở theo cấp quầy 1/3/5), chương truyện + NPC, lưu ca giữa chừng.
Chi tiết kỹ thuật và phần chưa làm: xem README.md.

---

# Kịch bản nâng cấp: Mở cửa đón khách · Nền gian hàng nét · Hội làng nhiều trò

## 1. Cảnh "Mở cửa đón khách" (cả 5 quầy)
Khi bấm **Mở cửa đón khách** ở màn chuẩn bị, ca bán tạm dừng ~2,5 giây để chiếu cảnh khai trương (chạm để bỏ qua):

| Mốc thời gian | Diễn biến |
|---|---|
| 0,0 s | Hai cánh cửa gỗ (màu theo quầy) khép kín, đèn lồng lắc lư, tia sáng xoay. Huy hiệu quầy bật ra có sóng lan. |
| 0,25 s | Tiếng chiêng, 14 hạt biểu tượng theo quầy nổ ra (lá trà / bong bóng / bột mì / hơi xôi / ớt lửa). |
| 0,55 s | Dòng chữ **"Mở cửa đón khách!"** hiện từng chữ, kèm câu giới thiệu riêng từng quầy. |
| 0,7 s | Chuông cửa + pháo giấy màu theo quầy. |
| 1,25 s | Hai cánh cửa kéo mở, lộ gian hàng; mưa biểu tượng bay lên, tiếng reo hò. |
| 2,35 s | Cảnh kết thúc, ca chạy; khách bước vào lần lượt (trượt vào + nảy + chuông cửa). |

Câu giới thiệu: Trà đá "Ấm trà xanh mát, đón khách đầu ngõ!" · Trà sữa "Trân châu dẻo thơm…" · Bánh mì "Lò than đỏ lửa…" · Xôi "Xôi nóng hổi, gói lá chuối…" · Mỳ cay "Nước dùng sôi sục, cay xé lưỡi…".
Chế độ *Giảm chuyển động* / *Tiết kiệm pin*: chỉ hiện thẻ chào ngắn 0,9 giây.

Trong ca: hạt không khí riêng từng quầy (lá trà rơi, bong bóng, hơi nóng, tàn lửa), ánh đèn lồng nhấp nháy, chùm sáng quét; khách thở/nảy khi được chọn; giao xong thì khách nhảy mừng + tim bay, bỏ đi thì rung đỏ; nút "Ngưng đón" có chớp sáng và chuông.
Màn chuẩn bị: banner lớn nét, ánh sáng quét ngang, nút mở cửa nhấp nháy có vệt sáng, các mục xuất hiện lần lượt.

## 2. Nền gian hàng rõ nét
- Nguyên nhân mờ: ảnh cảnh chỉ ~790 px bị kéo `cover` lên toàn màn hình dọc (phóng ~2 lần) + phủ lớp trắng + làm mờ mọi khung.
- Cách sửa: tạo bản 2x (`assets/scenes/hd/*.jpg`, Lanczos + sắc nét), hiển thị vừa chiều ngang màn hình ở phần trên, mờ dần xuống lớp nền gỗ làm mờ cùng tông màu; giảm blur các khung điều khiển (4–5 px → 1,5 px); màn thấp (≤700 px) không còn ẩn ảnh nền.

## 3. Hội làng: 14 trò chia 4 nhóm
Trò mới (5): **Thả diều** (giữ/thả để lái diều theo luồng gió, ăn sao, né chim) · **Rồng rắn lên mây** (dẫn đoàn trẻ, ăn kẹo, thầy thuốc đuổi) · **Múa lân** (game nhịp điệu 3 trống) · **Chơi chuyền** (nhặt đủ que rồi hứng quả đúng lúc) · **Nặn tò he** (rê tay theo nét chấm).
Trò có sẵn: Đập niêu, Bắt vịt, Kéo co, Nhảy bao bố, Nhảy dây, Hứng lồng đèn, Ném còn, Ô ăn quan, Tìm đôi.
Hiệu ứng chung: đếm ngược 3-2-1 có hướng dẫn nhanh, thanh thời gian (đỏ + tích tắc 5 giây cuối), hạt trang trí theo trò, sao + **kỷ lục từng trò** (lưu trong save), mưa xu khi nhận thưởng, hero trang Hội làng có hoa rơi + đếm tổng sao.
Thưởng vẫn theo điểm 0–30 qua `Festival.finish`, giới hạn 5 lượt thưởng/ngày như cũ.

## 4. Tệp
`js/stall-fx.js`, `css/stall-fx.css` (khai trương, không khí quầy, nền nét) · `js/festival-games.js`, `css/festival-games.css` (trò mới + hiệu ứng Hội làng) · `assets/scenes/hd/`.

---

# Kịch bản sửa lỗi theo phản hồi (đợt 3)

| # | Lỗi người chơi gặp | Cách sửa |
|---|---|---|
| 1a | Màn **Mở cửa đón khách** hằng ngày: nền xấu, ít hiệu ứng | `css/stall-v3.css`: hero ảnh quầy nét (đã xóa ô caro nền trong suốt khỏi 5 ảnh `assets/scenes/hd`), vệt sáng quét, biển **ĐÓNG CỬA** đung đưa, nút mở cửa nhấp nháy, thẻ **"Hôm nay"** (ngày, ánh sáng, danh hiệu, mẹo quầy), hạt không khí theo quầy, nền toàn màn mờ cùng tông màu quầy |
| 1b | Phải chọn từng thẻ 1-Trụng mì / 2-Nước & nhân / 3-Nêm & giao | `js/service-desk.js`: bỏ thẻ công đoạn, **mọi công đoạn hiện cùng lúc**, tự dàn nút theo chiều cao màn (quầy ít nút thì nút to), lấp đầy toàn màn hình; đã kiểm tra không cuộn ở 320×568, 360×640, 390×844 |
| 2 | **Hội làng**: thiết kế lại cách chơi, bố cục, hiệu ứng, thêm trò | `js/festival-arcade.js` + `css/festival-arcade.css`: sảnh ô lớn 2 cột, mỗi ván chạy **toàn màn hình** có nền riêng, bảng kết quả trượt lên; thêm 6 trò (Bịt mắt bắt dê, Bắn bi, Đi cà kheo, Thổi cơm thi, Đua thuyền rồng, Gói bánh chưng) → **20 trò** |
| 3a | Cài đặt: thêm hiệu ứng nền và âm thanh | `js/audio-plus.js`, `js/settings-plus.js`: âm nền hiện trường theo nơi (+dế đêm, mưa), 5 phong cách nhạc, 4 bộ âm nút, chuông cửa, 6 loại hạt nền + mật độ, công tắc ánh đèn / nền chuyển động / pháo giấy, có nút nghe thử và xem thử |
| 3b | Hướng dẫn lần đầu chi tiết hơn | `js/guide.js`: hướng dẫn cơ bản 18 bước, từng quầy 7 bước, Hội làng 5 bước, Cài đặt 8 bước; `js/coach.js`: **tham quan giao diện có đèn chiếu** (7 bước) + nút bước kế tiếp tự nhấp nháy trong ca hướng dẫn; xem lại ở Cài đặt → Tham quan lại |

Lưu ý kỹ thuật: ảnh nền gốc có ô caro "trong suốt giả" in sẵn vào pixel; đã tự lấp bằng thuật toán khuếch tán rồi phóng 2×. Trò mới nằm trong `F.GROUPS` nên tự lên sảnh theo nhóm.

---

# Kịch bản nâng cấp kinh tế (đợt 4): tiêu tiền đa dạng · nhân viên · icon trò chơi

## 1. Tab "Phát triển" (mới, trên thanh điều hướng + nút ở bản đồ chợ + tab ở màn chuẩn bị)
Logic nằm ở `js/dev.js`, giao diện `css/dev.css`. Mọi khoản chi đều có **tác dụng thật** qua bộ cộng dồn `Dev.fx(shop)`:
giá món, tiền thưởng, kiên nhẫn khách, lượng khách, tốc độ thao tác, uy tín/ca, tự nhập hàng.

| Mục | Nội dung |
|---|---|
| Trang bị | Danh sách thẻ theo quầy: icon, bậc C0–C3, mô tả bậc hiện tại/kế tiếp, thanh 3 đoạn, nút "Lên Cx · giá". Thêm 5 hạng mục mới: Bàn ghế khách ngồi, Biển LED, Mascot, Quảng cáo MXH, Bộ nhận diện thương hiệu |
| Trang trí | 6 món cho mỗi quầy + 9 món cho Chợ làng (6 mua bằng xu, 3 cao cấp bằng nguyên bảo). Hiện trực tiếp trên ảnh quầy |
| Nhân viên | 9 vị trí có tên/chân dung, trạng thái Đang làm/Chưa tuyển, lương/ngày, "Xem chi tiết", Thuê / Cho nghỉ / Thuê lại, điều kiện mở (cấp quầy, ngày, trang bị, xung đột Quản lý tập sự ↔ Quản gia) |
| Dịch vụ | Tờ rơi, gánh hát, mời trà, đại tiệc (tính theo ca) + Quyên góp xây đình (uy tín vĩnh viễn, giá tăng dần) |

Nhân viên: lương trừ sau mỗi ca (1 ca = 1 ngày); thiếu tiền thì nghỉ việc và có thể thuê lại. *Nhân viên đi chợ* tự mua gói nguyên liệu khi hết giữa ca (phí chạy +15%).

## 2. Icon trò chơi
`js/game-icons.js`: 20 SVG riêng cho từng trò (niêu đất, vịt, dây kéo cờ, bao bố, dây nhảy, lồng đèn, còn, thẻ bài, bàn ô ăn quan, diều, rồng rắn, đầu lân, chuyền, tò he, dê bịt mắt, bi, cà kheo, nồi cơm, thuyền rồng, bánh chưng). Dùng ở thẻ sảnh, tiêu đề ván, màn đếm ngược, mục hướng dẫn.

## 3. Lỗi tìm thấy khi làm
`Game.fmt` rút gọn sai số tròn trăm (100 K hiện "1 K", 140 K hiện "14 K"); đã sửa trong `js/core.js`.
