# Chợ làng dọc: giới hạn đường đi và hội thoại

## Những gì đã sửa

- Dùng trực tiếp ảnh người dùng cung cấp `Chợ Làng Cổ Bên Kênh Nước.png`, giữ bố cục dọc 1024 × 1536. `assets/market.jpg` chỉ đổi định dạng sang JPEG chất lượng 90 để giảm dung lượng; không vẽ lại hoặc xoay ảnh.
- Đồng bộ kích thước thế giới, bản đồ nhỏ, ảnh chồng tuyến và tọa độ của cả năm quầy/NPC/điểm nhập hàng. Bản đồ nhỏ giữ đúng tỷ lệ 2:3.
- Xóa lớp che cây và mạng đường dành cho ảnh ngang cũ. Camera toàn cảnh luôn giữ nguyên tỷ lệ của ảnh dọc, không kéo giãn chiều ngang.

## Chỉ đi trên đường

`js/market-world.js` chứa hai loại dữ liệu riêng:

1. `ground`: các đa giác lối lát đá được đặt theo ảnh. Nhà, mái, quầy, cây giữa quảng trường và kênh nước nằm ngoài vùng này.
2. `routes`: mạng đường tâm nối cổng, phố chính, đường vòng bên trái cây đa, quảng trường trước đình và lối xuống cầu.

Mỗi bước di chuyển đều gọi `isWalkable(x, y)`. Nếu bước tiếp theo vượt vùng đường, nhân vật dừng và quay lại phía đường an toàn. Vì vậy một điểm đích sai cũng không cho phép đi xuyên nhà. Đây là kiểm tra vị trí bàn chân; các nhân vật vẫn có thể đứng trước mặt tiền quầy như trong cảnh phối cảnh thông thường.

Các tuyến không nối thẳng xuyên qua gốc đa/đình. Đường vòng chạy trên lối lát đá bên trái khu này. Ảnh kiểm tra `routes` hiển thị vùng đường màu xanh và tuyến tâm để đối chiếu trực tiếp với ảnh nền.

## Di chuyển

Vận tốc tăng/giảm bằng nội suy mũ và quãng đường dùng vận tốc trung bình hai đầu bước, giúp ít phụ thuộc tốc độ khung hình. Người đi theo độ dài cung trên đoạn cong đã lấy mẫu, thay vì đuổi theo một điểm lệch ở nút giao. Tiếp tuyến vào/ra nối liên tục; hai hướng dùng hai làn lệch đường tâm 8 px và nhân vật xuất hiện ngay trong làn của mình. Đường cong được kiểm tra với vùng đường trước khi sử dụng, từng bước chân vẫn được kiểm tra thêm khi chạy.

Không bỏ khung hình 16 ms để chờ đủ 1/60 giây: mô phỏng chạy mỗi khung. Chế độ tiết kiệm chỉ giảm tần suất vẽ, không làm tốc độ mô phỏng giật theo. Nhịp bước nhẹ hơn, theo quãng đường thực; không rung người khi đứng nói chuyện. Người cùng chiều giảm tốc khi ở gần nhau. Người ngoài màn hình vẫn được mô phỏng nhưng bỏ cập nhật hình ảnh.

## Khung chương và kéo dọc

Tiêu đề chợ, nội dung chương và nút tiếp tục ca dùng chữ nhỏ, nằm ở góc trên trái, nền alpha thấp. Phần chữ không nhận sự kiện con trỏ để có thể kéo xuyên qua; riêng nút tiếp tục ca vẫn bấm được. Mức thu nhỏ nhất giữ chiều cao map lớn hơn vùng nhìn ít nhất 120 px, nên vẫn có khoảng kéo lên và xuống thay vì khóa map giữa màn hình.

## Hội thoại tự động

- Chọn hai người đang ở gần nhau trên đường, không kéo hoặc dịch chuyển họ tới vị trí khác.
- Hai người dừng lại, quay về phía nhau, hiện tên và câu mở đầu; sau đó người còn lại đáp.
- Có tám cặp thoại về trà sữa, bánh mì, xôi, mì cay, hội làng và ngắm sen. Nội dung nằm trong `LivingMarket.dialogues`.
- Chỉ một cuộc trò chuyện diễn ra cùng lúc; có thời gian nghỉ giữa các cuộc và thời gian chờ riêng cho từng người.
- Bóng thoại nằm trong lớp giao diện riêng, giữ cỡ chữ khi thu phóng và đi theo vị trí người nói. Thoại ngoài vùng nhìn hoặc sau thẻ thông tin quầy được ẩn.
- Kết thúc thoại sẽ thả cả hai người đi tiếp. Đổi số lượng người, dựng lại map hoặc bật giảm chuyển động sẽ dọn thoại cũ.
- Đây là thoại chữ; không tự phát âm thanh ngoài cài đặt âm thanh hiện có.

## Kiểm tra

Chạy `scripts/check-browser.ps1 -Page tests/market.html` và thêm `-Width 320 -Height 568` để kiểm tra màn hình nhỏ. Bộ kiểm tra kiểm tra hình học dọc, mẫu mái nhà/kênh/cây bị cấm, mọi đoạn tuyến, từng bước chân trong mô phỏng nhiều phút, điểm đích sai, tốc độ khung hình, hội thoại hai chiều, tự bắt chuyện, hết thoại và giảm chuyển động. Các kiểm tra camera và vào quầy được giữ lại.

Xem `tests/market-preview.html?mode=routes` để kiểm tra tuyến; `?mode=chat` để xem thoại; `?mode=overview` để xem toàn cảnh. Kết quả headless và ảnh xem trước nằm trong `.qa/`. Kiểm tra này không thay thế đo FPS trên thiết bị thật.
