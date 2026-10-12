# Kịch bản mở rộng màn hình phục vụ Chợ Cổ

## 1. Mục tiêu và bố cục đã triển khai

Năm quầy dùng cùng một cấu trúc để người chơi chuyển quầy mà không phải học lại cách điều khiển. Màn hình cố định theo chiều cao thiết bị; các công đoạn được chia thành thẻ, không phải kéo xuống để tìm nguyên liệu. Kho và trang bị được phân trang. Trên điện thoại thấp, phiếu được rút gọn; nút **Xem phiếu** mở yêu cầu đầy đủ và tạm dừng thời gian.

Từ trên xuống: tên quầy và xu → cảnh nền riêng → công thức, sổ ca, gợi ý, đóng/mở đón khách, tạm dừng, trang bị → doanh thu/chất lượng → ba vị trí khách và thanh kiên nhẫn → phiếu món → thẻ công đoạn → món đang làm và dụng cụ → bỏ món, khay, nhập hàng, giao món.

Khách được chọn có viền nổi bật. Nhân vật được giữ nguyên trong DOM qua từng khung hình; chỉ tên, thanh chờ và trạng thái thay đổi. Không phóng to/thu nhỏ chân dung liên tục. Hiệu ứng hơi nóng, rót, tia sáng và thưởng nằm tại vị trí thao tác; lớp cảnh nền không nhấp nháy toàn màn hình. Giảm chuyển động vẫn sử dụng được qua phần cài đặt hiện có.

## 2. Kịch bản trước, trong và sau ca

**Chuẩn bị:** kiểm tra tồn kho, nhập nguyên liệu, hấp mẻ xôi nếu cần, nâng cấp dụng cụ và chọn cách chơi. Ba thẻ Mở cửa / Kho hàng / Nâng cấp giúp giữ màn hình ngắn. Người mới vào ca hướng dẫn; sai thao tác trong học việc được giải thích theo cơ chế có sẵn.

**Đón khách:** chọn người cần phục vụ, đọc cỡ món, nền, nhân, lượng đường/đá hoặc cấp cay. Có thể ngưng đón để giải quyết hàng chờ; khách hiện tại vẫn cần phục vụ. Mở công thức hoặc trang bị sẽ tạm dừng ca, đóng hộp thoại sẽ tiếp tục đúng trạng thái trước đó.

**Làm món:** chuyển công đoạn bằng các thẻ ngang. Nguyên liệu giữ nguyên khi chuyển thẻ. Nếu đang giữ vòi, đổi thẻ sẽ ngừng rót để tránh rót ngoài ý muốn. Món sai có thể bỏ; nguyên liệu đã dùng được tính theo cơ chế hiện tại. Món hoàn tất có thể đưa vào khay nếu đã nâng cấp khay, rồi chọn lại từ hộp thoại khay để giao.

**Cứu hàng chờ:** trang bị Góc mời khách cho số lượt mời giới hạn trong ca; tăng thời gian chờ của mọi khách đang chờ nhưng không vượt mức ban đầu. Nút hiển thị số lượt còn lại. Không thể mời khi ca tạm dừng hoặc chưa có khách.

**Kết ca:** sổ ca và kết quả giữ số đơn, doanh thu, chất lượng, khách bỏ đi theo hệ thống hiện tại. Thưởng Chuỗi chuẩn vị được cộng cả vào xu và doanh thu ca; mỗi ca chỉ nhận một lần. Chọn chế độ khác chỉ ảnh hưởng ca kế tiếp.

## 3. Quy trình riêng từng quầy

| Quầy | Các thẻ thao tác | Điểm kỹ năng và tình huống |
|---|---|---|
| Trà sữa | Ly & topping → Đường & đá → Trà & sữa → Hoàn thiện | Chọn M/L, múc đúng số phần, chọn đường và đá trước khi rót để dung tích mục tiêu được tính đúng. Giữ vòi trà đúng nền; giữ vòi sữa đúng loại và vạch. Khuấy, ép nắp, lấy ống hút, giao đúng khách. Rót quá tay hoặc nhầm trà ảnh hưởng chất lượng. |
| Bánh mì | Lò & bánh → Thêm nhân → Gói bánh | Chọn ổ, bật lò, theo dõi vùng vàng và lấy bánh trước cháy. Rạch bánh, thêm pate/xá xíu/trứng/dưa/rau/ớt đúng phiếu. Khép và gói giấy. Có thể chuẩn bị món vào khay để xử lý nhiều đơn. |
| Xôi | Chọn xôi → Đơm xôi → Màu & nhân → Gói xôi | Hấp mẻ trước hoặc trong ca khi cần. Chọn lá/đĩa, nền xôi, đơm đúng muỗng; dùng gạt để sửa lượng. Xôi ngũ sắc hiện thêm năm ô màu. Thêm nhân rồi gấp lá và buộc lạt hoặc đặt thìa khi dùng đĩa. |
| Mỳ cay | Trụng mì → Nước & nhân → Nêm & giao | Chọn tô, hạ rổ và vớt đúng vùng chín. Múc đúng nước dùng và số vá theo cỡ, thêm thịt/nấm/rau/trứng. Canh kim và dừng ở cấp cay khách yêu cầu, thêm đũa rồi giao. |
| Trà đá | Bát & đá → Rót & rửa | Chọn bát nhỏ/lớn, thêm đá, giữ để rót đến mục tiêu. Thêm mật khi phiếu yêu cầu. Giao và rửa bát bẩn để tái sử dụng, tránh thiếu bát khi đông khách. |

## 4. Ba cách chơi đã nối vào ca phục vụ

1. **Bán thường:** quản lý công thức, thời gian, kho và chất lượng. Phù hợp học thao tác và tích lũy xu.
2. **Chuỗi chuẩn vị:** đạt năm đơn hoàn hảo liên tiếp nhận thêm giá trị một đơn cơ bản theo cấp quầy. Đơn chưa hoàn hảo làm chuỗi trở về 0. Giới hạn một phần thưởng trong ca tránh nhận lặp.
3. **Ca nhộn nhịp:** khoảng chờ sau lần sinh khách giảm còn 80%, giá trị món tăng 15%. Người chơi cần khay, kho và thao tác nhanh hơn. Không thay đổi số vị trí khách.

Ca hướng dẫn luôn dùng Bán thường. Chế độ và tiến độ được lưu cùng trạng thái ca qua cơ chế lưu hiện tại.

## 5. Nâng cấp mở rộng có tác dụng thật

Mỗi nhóm mới có ba bậc, cần cấp quầy 1 / 3 / 5. Giá dùng công thức chung: `ceil(giá nâng cấp cơ sở của quầy × hệ số nhóm × 2.2^(bậc - 1))`. Có thể mua trước ca hoặc qua **Trang bị** khi đang phục vụ; thay đổi có hiệu lực ngay cho thao tác tiếp theo.

| Nhóm mới | Hệ số giá | Bậc 1 | Bậc 2 | Bậc 3 |
|---|---:|---|---|---|
| Bộ dụng cụ chuẩn vị | 1.8 | Rót chuẩn ±6%; cửa sổ nướng/trụng +0.4 giây | ±7%; +0.8 giây | ±8%; +1.2 giây |
| Bàn phục vụ chuyên nghiệp | 2.1 | Thao tác có thời gian chờ giảm 12% | Giảm 24% | Giảm 36% |
| Góc mời khách | 1.6 | 1 lượt/ca, thêm 6 giây chờ | 2 lượt/ca, thêm 10 giây | 3 lượt/ca, thêm 14 giây |

Bàn phục vụ chỉ giảm thao tác chờ; không tăng tốc kim cay, đồng hồ ca hoặc thời gian nướng để người chơi vẫn canh được nhịp. Chuẩn vị mở rộng vùng hoàn hảo, không biến món sai nguyên liệu thành đúng. Các nâng cấp cũ như khay, kho, mái che, giá bán, tiền tip và dụng cụ chuyên quầy được giữ nguyên và truy cập trong cùng danh sách.

## 6. Xử lý hình ảnh và nhấp nháy

Đã thêm 26 chân dung và 24 nhân vật hàng chờ từ bốn bảng mới. Mỗi ảnh dùng tọa độ riêng được ghi trong manifest, giữ màu pixel gốc, làm trong suốt phần nền nối với biên và thêm đệm trong suốt 2 pixel. Vùng cắt nhân vật được kiểm tra không giao nhau. Không cố cắt người đang bị che khuất trong cảnh cửa hàng thành một nhân vật đầy đủ.

Trà sữa, bánh mì, xôi chọn chân dung đúng quầy; trà đá và mỳ cay dùng bộ nhân vật đã có. Trang `assets-review.html` cho đối chiếu tọa độ với ảnh nguồn; `assets/sprites/portraits-review.png` cho kiểm tra chân dung cùng lúc.

Nguyên nhân nhấp nháy là cập nhật giá trị nướng, trụng và rót khiến HTML chứa ảnh bị dựng lại liên tục. Bản sửa cập nhật các nút và ảnh tại chỗ, bỏ giá trị thay đổi từng khung hình khỏi điều kiện dựng cấu trúc. Thanh lượng rót và đồng hồ vẫn cập nhật. Các lớp trang trí có sẵn được giữ khi cập nhật.

## 7. Hướng phát triển tiếp theo (chưa triển khai)

- Đơn theo nhóm khách và khay đánh số bàn: cần thêm hệ thống bàn/định tuyến khách thay vì tăng hàng chờ tùy ý.
- Ngày mưa hoặc phiên chợ đêm có mục tiêu riêng: cần cân bằng nhu cầu từng quầy và tác động kho.
- Thực đơn tự phối và đánh giá khẩu vị: cần lưu công thức tùy chỉnh và mô tả rõ vì sao khách thích.
- Trò chơi dân gian cấp nguyên liệu theo mùa: các trò dân gian hiện có được giữ; mở rộng phần thưởng cần ngân sách ngày và bảng nguyên liệu riêng để không phá kinh tế.

## 8. Kiểm tra và tái tạo

Chạy PowerShell với `-ExecutionPolicy Bypass -File scripts/check-browser.ps1 -Width 320 -Height 568` để kiểm tra thao tác thực tế năm quầy, bố cục từng công đoạn, chuẩn bị, ảnh giữ nguyên qua nhiều khung hình, thanh toán và trò dân gian. Chạy thêm 360×640 và 390×844 cho thiết bị lớn hơn.

`scripts/check-assets.ps1` kiểm tra alpha, đệm, kích thước, pixel giữ nguyên và vùng cắt nhân vật không chồng nhau. `scripts/register-portraits.ps1` tái tạo riêng 50 ảnh từ thư mục ảnh người dùng; `scripts/extract-assets.ps1` cũng gọi bước này nếu bộ nguồn mới còn tồn tại. Ảnh nguồn đã được sao chép vào `assets/source` để đối chiếu.
