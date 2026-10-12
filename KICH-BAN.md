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
