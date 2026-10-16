# Phân tích và nâng cấp chợ làng

> Tài liệu này ghi lại bản map ngang trước đây. Bản hiện tại đã dùng ảnh dọc và có kiểm tra vùng đường, hội thoại: xem [Chợ làng dọc và hội thoại](CHO-LANG-DOC-VA-HOI-THOAI.md).

## Mục tiêu

Giữ bố cục năm quầy và tiến trình hiện có, làm rõ điểm tương tác, cho người đi chợ di chuyển trên đường lát đá và giữ camera ổn định khi kéo, thu phóng, đổi trang hoặc thay kích thước màn hình.

## Các vấn đề đã xử lý

| Thành phần | Trước | Sau |
| --- | --- | --- |
| Ảnh nền | Có nhiều người vẽ sẵn, đứng bất động giữa dòng người di chuyển | Dọn khách trên đường, giữ người bán trong quầy; hình học map vẫn là 1672 × 941 |
| Nhân vật | Dùng lại một nhóm sprite khách; chuyển hướng bằng cách ép chiều ngang qua 0 | Atlas riêng gồm 16 người theo ảnh tham khảo; giữ độ dày khi đổi hướng |
| Đường đi | Các tuyến tách rời, nhiễu ngẫu nhiên ở từng điểm đích | Sáu tuyến nối thành mạng đường; rẽ tại nút giao, hai làn hẹp ngược chiều |
| Nhịp bước | Dao động theo thời gian kể cả khi đi rất chậm | Nhịp bước theo quãng đường thực; tăng/giảm tốc bằng nội suy mũ |
| Đám đông | So từng người với toàn bộ nhóm; dựng lại người khi một số cài đặt đổi | Chia ô 48 px để xét người gần; giữ đối tượng đang đi khi số lượng không đổi |
| Camera | Mỗi lần lấy nét tạo một chuỗi requestAnimationFrame riêng | Một trạng thái camera trong vòng lặp chung; thao tác mới hủy chuyển động cũ |
| Hai ngón tay | Tâm phóng không được lưu trong tọa độ thế giới; chuyển sang một ngón có thể giật | Giữ điểm thế giới dưới trung điểm; đặt lại mốc kéo khi số ngón thay đổi |
| Kéo và chạm | Dựa vào khoảng chờ ngắn để phân biệt kéo với chọn quầy | Chặn click sinh ra từ thao tác kéo; thao tác chạm mới và bàn phím vẫn chọn được |
| Điều hướng | Khó xem toàn bộ chợ trên màn hình dọc | Bản đồ nhỏ, nút toàn cảnh, tìm quầy, về quầy đang chọn, phím mũi tên và +/− |
| Điểm tương tác | Biển ghim lớn, một số điểm ở mái nhà hoặc tán cây | Biển nhỏ hơn; vị trí quầy ở phía lối vào, NPC ở lối đi; ẩn NPC khi xem toàn cảnh |
| Vòng đời | Gắn thêm listener resize mỗi lần vào lại chợ | AbortController dọn listener toàn cục; ResizeObserver cũ được ngắt khi dựng lại map |

## Thiết kế chuyển động

`LivingMarket.routes` chứa các đường tâm trong hệ tọa độ ảnh. Các tọa độ chung là nút giao. Mỗi người có nút xuất phát, nút đích, vận tốc, thời gian dừng và bộ số ngẫu nhiên riêng.

- Đến nút giao: chọn nhánh tiếp theo, ưu tiên không quay lại ngay.
- Đến đầu đường hoặc một số điểm trên hành trình: nghỉ ngắn, sau đó đi tiếp.
- Có người cùng chiều ở phía trước: giảm tốc theo khoảng cách; vẫn giữ tốc độ tối thiểu nhỏ để tránh kẹt vĩnh viễn.
- Hai chiều lệch đường tâm khoảng 4 px để có thể tránh nhau.
- Nhân vật gần người chơi lớn hơn; thứ tự trong lớp người dựa vào tọa độ bàn chân. Tán đa có lớp che khuất bằng chính ảnh nền và CSS clip-path, giúp người đi sau tán không nổi đè lên lá; ảnh dùng lại cùng URL nên không phát sinh một file nền thứ hai.
- Nhân vật ngoài vùng nhìn vẫn được mô phỏng, nhưng không cập nhật transform cho tới khi trở lại vùng nhìn.

Các tuyến được đặt thủ công theo đường trên ảnh, không phải hệ tìm đường tự động trên mọi pixel. Khi thay vị trí quầy, cầu hoặc cây, phải sửa tuyến tương ứng và kiểm tra lại ảnh chồng tuyến.

## Thiết kế camera

Camera dùng duy nhất `MM.x`, `MM.y`, `MM.s`. Kéo, phóng, lấy nét và quán tính đều cập nhật ba giá trị này. Mọi thay đổi đều giới hạn trong kích thước map. Tỷ lệ nhỏ nhất cho phép nhìn toàn bộ ảnh; chế độ thường mở tại quầy đã chọn hoặc quầy trà đá.

Thu phóng giữ điểm thế giới dưới con trỏ hoặc trung điểm hai ngón. Kéo mới dừng lấy nét cũ. Thả tay tạo quán tính giảm theo hàm mũ; mất focus, ẩn tab hoặc chọn giảm chuyển động sẽ dừng quán tính. Đổi kích thước giữ tâm thế giới thay vì giật về quầy đầu tiên.

Ảnh mờ phía sau chỉ lấp vùng ngoài ảnh khi xem toàn cảnh; không phải một khu vực có thể đi vào.

## Chức năng gameplay giữ lại

- Chọn quầy, xem điều kiện mở khóa, mở quầy, nâng cấp và vào màn làm món.
- Hiển thị số khách chờ và tiếp tục ca đang dở.
- Tương tác NPC, cổng chợ và các điểm nhập hàng.
- Thanh truy cập các quầy, hội làng, phát triển, nhập hàng và giao hàng.
- Chương/nhiệm vụ, ngày game, ngày/đêm, thời tiết, số người và chế độ tiết kiệm hiệu ứng.
- Không thay khóa lưu game, kinh tế, công thức hay dữ liệu đơn hàng.

## Tài sản hình ảnh

- `assets/market.jpg`: nền chợ đã dọn người trên đường, JPEG chất lượng 90, 1672 × 941; khoảng 720 KiB.
- `assets/market/people-atlas.png`: 16 nhân vật, lưới 4 × 4, PNG alpha 1254 × 1254; khoảng 1,65 MiB. Tải chung một ảnh, CSS chọn từng ô, không tạo 16 bản ảnh trùng nhau.
- Tạo bằng công cụ imagegen tích hợp. Prompt và vai trò của ảnh tham khảo được lưu trong `assets/market/prompts.json`.

Atlas là một tư thế đi cho mỗi nhân vật, kết hợp nhịp bước và nghiêng người bằng transform. Đây chưa phải bộ hoạt ảnh nhiều khung cho bốn hoặc tám hướng. Cảnh nền vẫn là một ảnh phẳng với một lớp che tán cây; chưa tách riêng mọi mái nhà, lan can và cầu thành các lớp độc lập. Các tuyến hiện tại tránh mái nhà và quầy hàng.

## Kiểm chứng

Chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-browser.ps1 -Page tests/market.html
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-browser.ps1 -Page tests/market.html -Width 320 -Height 568
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-browser.ps1
```

`tests/market.html` có 34 kiểm tra camera, thu phóng có điểm neo, hai ngón sang một ngón, chặn click sau kéo, đổi kích thước, vào quầy, dọn listener, giảm chuyển động, tạm dừng ngoài trang chợ, tải ảnh và mô phỏng ba phút với 16 người. Đã chạy đạt ở 390 × 844 và 320 × 568. Trong lần kiểm tra 320 × 568, sai lệch lớn nhất khỏi đường tâm khoảng 4,25 px; bước dịch chuyển lớn nhất dưới 3 px cho mỗi 0,1 giây. Đây là kiểm tra mô phỏng trong trình duyệt headless, không phải phép đo FPS trên điện thoại thật.

`tests/market-preview.html` hỗ trợ `mode=overview`, `shop=trada`, `crowd=16`, `light=3`, `weather=1`, `routes=1`. Ví dụ mở `tests/market-preview.html?mode=overview&routes=1` để xem các tuyến chồng lên ảnh. Kết quả kiểm tra và ảnh xem trước nằm trong `.qa/`, không đưa vào Git.
