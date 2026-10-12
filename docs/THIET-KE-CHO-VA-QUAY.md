# Thiết kế Chợ Cổ và năm quầy bán hàng

## Phân tích game hiện tại

Game chạy bằng HTML/CSS/JavaScript thuần, không cần build. `config.js` chứa nền kinh tế và vật tư; `core.js` quản lý tiến trình, kho, nhân viên, nâng cấp và localStorage. `workshop-engine.js` điều phối ca bán; `workshop-recipes.js` định nghĩa riêng thao tác và tiêu chí chấm món của năm quầy. `market-map.js` quản lý camera và vị trí gian hàng. Đây là nền tốt để phát triển: nước rót tăng liên tục, nhiệt lò và thời gian trụng có vùng đạt chuẩn, nguyên liệu trừ thật, giao món được chấm và trả tiền một lần.

Điểm yếu chính của giao diện trước là người đi chợ bằng emoji chạy tuyến thẳng, quầy chỉ có banner nhỏ và bàn thao tác, các tùy chỉnh chủ yếu là âm thanh. Người chơi thiếu một bảng điều hành ca và một hoạt động kiếm nguyên liệu ngoài bán hàng. Các bảng ảnh chứa nhiều hàng có kích thước khác nhau; cắt toàn bộ theo một lưới đều sẽ lấy nhầm icon cạnh bên.

## Hướng mỹ thuật và kịch bản chợ

Giữ phong cách chibi cổ phong Việt Nam, kiến trúc gỗ, mái ngói, bảng hiệu, hoa đào và đèn lồng. Chợ có ba thời điểm: nắng trong, hoàng hôn ấm và đêm hoa đăng. Chế độ tự động luân phiên theo ngày game; người chơi có thể cố định thời điểm trong Cài đặt.

Khi vào chợ, góc trên giới thiệu phố chợ và ngày; thẻ chương ghi mục tiêu hiện tại. Ba nút phía dưới dẫn tới các quầy, hội làng và nhập hàng. Người chơi kéo camera, cuộn bánh xe hoặc dùng hai ngón để phóng to. Nhấn biểu tượng một quầy để xem trạng thái, mở khóa hoặc vào bán. Quầy đang có ca sẽ hiển thị số đơn chờ và lối tiếp tục ca.

Nhân vật mới sử dụng mười sprite đi đường lấy từ bộ Trà Đá. Năm tuyến được đặt ở đường trước quầy, quảng trường và lối ven sông. Mỗi người có tốc độ, độ trễ khởi hành và thời gian dừng riêng. Họ đổi hướng khi đi về, lắc nhẹ thân người khi bước, có bóng dưới chân và thay đổi tỉ lệ theo chiều sâu. Người cùng tuyến và cùng hướng giữ khoảng cách để giảm việc chồng hình. Chọn mật độ 0/6/10/16 người. Khi mở quầy, rời màn chợ hoặc ẩn tab, việc cập nhật người đi chợ dừng.

Hơi nóng bay lên trước quầy; hoa đào hoặc mưa nhẹ có thể bật riêng. Đêm tăng bóng tối và ánh đèn ấm. Giảm chuyển động dừng người đi đường và hiệu ứng trang trí. Tiết kiệm pin tắt lớp hạt và hiệu ứng trang trí nhưng giữ các thao tác làm món.

Ảnh chợ gốc có sẵn người được vẽ vào nền. Những người này vẫn là chi tiết của ảnh; chỉ nhóm sprite mới có chuyển động. Các ảnh cung cấp không có chuỗi khung bước chân, nên bản này dùng chuyển vị trí, đổi hướng và nhịp thân người, chưa phải hoạt ảnh khớp tay/chân.

## Luồng điều hành chung cho năm quầy

1. **Chuẩn bị:** xem quy trình, kiểm tra kho, hấp xôi nếu cần, nâng dụng cụ hoặc thuê tiểu nhị. “Bổ sung kho” lập danh sách vật tư dưới mức một gói; hiển thị số phần và tổng giá trước khi mua. Nếu thiếu xu thì nút mua bị vô hiệu hóa. Một lần xác nhận chỉ xử lý một báo giá.
2. **Mở cửa đón khách:** ca hướng dẫn vẫn có ba đơn và khách không hết kiên nhẫn. Ca thường dùng thời lượng 2/4/6 phút và độ khó đã chọn. Các lựa chọn này được ghi vào ca lúc bắt đầu, không đổi luật giữa ca.
3. **Nhận đơn:** chạm khách để ghim phiếu; hoặc bật tự chọn đơn khi chưa có đơn được chọn. Phiếu thể hiện cỡ, nguyên liệu, lượng và yêu cầu đóng gói. Tối đa ba khách chờ.
4. **Làm món:** thao tác trực tiếp trên bàn. Vật tư trừ vào kho; điều kiện thứ tự được kiểm tra trước khi thực hiện. Các nâng cấp giữ tác dụng cũ như rót tự dừng, lò giữ ấm, dụng cụ định lượng và khay cất món.
5. **Giao món:** chọn đúng người nhận, chấm độ khớp, trả xu, boa, uy tín và chuỗi hoàn hảo theo cơ chế gốc. Giao lại một đơn đã trả tiền không được nhận tiền lần nữa.
6. **Điều hành giữa ca:** bảng trạng thái cho biết doanh thu, số đơn, đơn hoàn hảo và số vật tư còn dưới ba phần. “Sổ ca” đọc doanh thu, giá vốn món, hao phí và danh sách thiếu hàng. Xem công thức hoặc sổ tạm dừng ca, đóng hộp thoại sẽ tiếp tục.
7. **Ngưng đón khách:** nút cửa chỉ chặn khách mới; đồng hồ và kiên nhẫn của khách hiện tại vẫn chạy. Có thể mở nhận khách trở lại trước khi hết giờ. “Tạm dừng” đóng băng toàn bộ ca, khác với ngưng nhận khách.
8. **Chốt ca:** hết giờ nhận khách thì hoàn thành đơn trong thời gian gia hạn. Tổng kết giữ doanh thu, chi phí món, hao phí, chất lượng và nhận xét. Ra chợ giữa ca sẽ tạm dừng để có thể quay lại; khôi phục save cũng vào trạng thái tạm dừng.

“Giá vốn món” là giá trị nguyên liệu đã dùng để phân tích ca. Xu mua gói đã bị trừ khi nhập kho; sổ ca không trừ giá vốn lần nữa vào số dư. Tiểu nhị hiện vẫn là thu nhập quản lý theo giây cho quầy không có ca thủ công, chưa có phân vai người rót/người gói.

## Thiết kế từng quầy

### Trà đá — tiết tấu nhẹ, thao tác rót và dọn

Nền góc cây đa lấy từ bảng ảnh Trà Đá. Thao tác gồm chọn bát nhỏ/lớn, thêm số muỗng đá, giữ ấm để rót đến vạch, thêm mật khi phiếu yêu cầu, giao đúng khách và rửa bát. Bát là vật tư tái sử dụng; bát bẩn nhiều có thể cản việc phục vụ. Người mới được học việc rót trước khi phải quản lý nhiều khách. Cài đặt rót bằng chạm hỗ trợ người khó giữ tay.

### Trà sữa — bàn pha chế theo thứ tự

Nền cửa hàng lấy trực tiếp từ bảng Cổ Phương. Bàn chia nhóm ly, topping, vòi trà, vòi sữa, đường, đá và đóng gói. Chọn ly M/L → topping theo số phần → trà đúng nền → sữa đúng loại và lượng → đường/đá → khuấy → đóng nắp → ống hút → giao. Lượng nước vẫn dùng SVG để thể hiện liên tục; topping và vật tư có sprite gốc. Giao đúng năm đơn hoàn hảo liên tiếp vẫn nhận thưởng chuỗi theo engine cũ.

Không thêm được topping sau khi đóng nắp; đổi nền trà khi đã rót bị chặn. Vật tư thiếu báo rõ tên thay vì âm thầm làm tiếp. Cài đặt Hỗ trợ vẫn cần nâng cấp tương ứng, giữ giá trị của việc nâng dụng cụ.

### Bánh mì — canh nhiệt và lắp nhân

Nền bảng Bánh Mì Cổ Phong. Chọn cỡ ổ → cho vào lò → lấy ra trong vùng vàng → rạch → pate → thịt/trứng → dưa góp, rau, sốt → khép bánh → gói giấy → giao. Lò giữ nhiệt và dao/bàn gói nâng cấp vẫn theo cơ chế gốc. Nướng quá lâu cháy bánh và không giao được; bỏ món ghi hao phí. Pate phải đi trước thịt/trứng, tạo thao tác có trình tự.

### Xôi — chuẩn bị mẻ và đóng gói

Nền Xôi Ngũ Sắc. Trước ca nhập nếp và hấp mẻ; tối đa hai mẻ hấp cùng lúc. Chọn lá hoặc đĩa → chọn loại xôi đã hấp → đơm hai/ba muỗng theo phần → topping → gấp và buộc lạt, hoặc đặt thìa → giao. Ngũ sắc mở theo cấp quầy và dùng năm màu; khuôn nâng cấp giúp giữ thứ tự. Nguyên liệu nếp và phần xôi đã hấp là hai trạng thái khác nhau, không cho chọn xôi khi chưa có mẻ chín.

### Mỳ cay — thời gian trụng và cấp cay

Nền Thất Cấp Hỏa Ma Đường. Chọn tô → hạ rổ mì → đợi vùng chín → nhấc rổ → múc nước dùng → topping → canh kim cay 1–7 → đặt đũa → giao. Mì non/nhão và sai cấp cay làm giảm chất lượng. Nâng bếp giúp vùng chín hoặc tự nhấc rổ; muỗng ớt nâng cấp hỗ trợ canh kim. Thư giãn cho chọn cấp trực tiếp. Đây vẫn là luật nấu gốc; bản mới cải thiện quản lý, quy trình và hình ảnh.

## Cài đặt mở rộng đã lập trình

| Nhóm | Các lựa chọn |
|---|---|
| Âm thanh và phản hồi cũ | Nhạc, SFX, giọng hô, bốn mức rung |
| Chợ | Mật độ người, ba thời điểm/cycle ngày, trời trong/hoa đào/mưa |
| Hiển thị | Ba mức hiệu ứng, chữ 100/112/124%, tăng tương phản, giảm chuyển động |
| Thao tác | Rót bằng chạm, hỗ trợ, thư giãn, hiện/ẩn gợi ý, tự chọn đơn |
| Ca mới | Thong thả/tiêu chuẩn/thử thách; 2/4/6 phút |
| Dữ liệu | Tự lưu 5/10/30 giây, xuất/nhập mã, chơi lại có xác nhận |

Thong thả tăng kiên nhẫn ×1,5 và khoảng sinh khách ×1,3. Thử thách giảm kiên nhẫn ×0,8 và khoảng sinh khách ×0,85. Ca hướng dẫn giữ quy tắc dễ học. Save cũ được bổ sung giá trị mặc định; giá trị mới ngoài danh sách được chuẩn hóa về mặc định khi tải. localStorage giữ dữ liệu trên trình duyệt/thiết bị này; không có đồng bộ tài khoản.

## Hội làng và kinh tế thưởng

- **Ném còn:** canh kim vào dải xanh; một ván có năm lần ném, có thời gian quả còn bay để chặn nhấn liên tục. Mỗi lần trúng tăng điểm; chuyển động quả còn lệch theo vị trí ném.
- **Ô ăn quan:** mười ô dân, mỗi ô năm quân, hai quan mỗi quan mười điểm. Chọn ô phía mình và hướng rải. Rải tiếp khi ô kế còn dân; ô kế trống thì ăn ô sau. Máy thử hai hướng cho các ô phía mình và chọn nước ăn được nhiều nhất. Đây là biến thể hội làng ghi luật ngay trong màn chơi: tái rải bằng năm điểm, hết điểm/hết quan hoặc 60 lượt thì kết thúc.
- **Gánh hàng tìm đôi:** trò phụ dùng sáu cặp nguyên liệu thật. Lật hai thẻ, tìm đủ trong 18 lần thử; có thời gian nhìn thẻ sai trước khi úp lại.

Không cần đặt cược hoặc trả phí. Mỗi ngày Việt Nam được năm ván nhận thưởng; sau đó chơi luyện tập. Ba trò hiện tại thưởng 5–30 xu mỗi ván hoàn thành; có điểm thì nhận một loại vật tư từ quầy đã mở, một hoặc ba phần tùy điểm. Không thưởng vật tư dạng mẻ hoặc đồ tái sử dụng. Bỏ dở không nhận thưởng. Trạng thái kết thúc chặn nhận tiền lại; hạn mức lưu cùng save. Ngày thưởng dựa ngày thật UTC+7, không dựa ngày ca bán nên không thể làm mới bằng chốt ca. Vì là game trình duyệt lưu cục bộ, người sửa save/đồng hồ thiết bị vẫn có thể can thiệp; chưa có kiểm chứng máy chủ.

## Tài sản và quy trình tách ảnh

`scripts/extract-assets.ps1` đọc sáu bảng ảnh. Mỗi hàng dùng danh sách ranh giới riêng, không cắt lưới toàn ảnh. Nó xóa nền sáng nối với biên, giữ vùng hình chính và loại phần rời của icon lân cận. Những pixel giữ lại không đổi màu. Nhãn gắn liền với hình có thể được giữ trong file. Năm cảnh cửa hàng được crop riêng và giữ nguyên nền, không áp dụng thuật toán xóa nền của icon.

Kết quả là 189 sprite PNG dùng/chuẩn bị cho game, gồm người đi đường, đồ uống, nguyên liệu, topping và 14 icon giao diện; năm cảnh cửa hàng. `manifest.json` ghi tên bảng gốc, tọa độ, kích thước và đường dẫn từng sprite. `assets-review.html` cho chọn ảnh, xem icon trên nền caro kiểm tra alpha và tô vùng crop lên ảnh gốc. Bản gốc của sáu bảng được giữ trong `assets/source/` để đối chiếu. Không ghi đè các file người dùng trong thư mục Anh.

Phạm vi tách là các tài sản riêng được lập tọa độ trong manifest. Các VFX vẽ chồng nhau, nhân vật dính vào cảnh cửa hàng và khung trang trí lớn chưa được xuất thành các lớp độc lập. Không thể khôi phục lớp bị che của ảnh raster chỉ bằng cắt; cần ảnh nguồn có layer hoặc vẽ bổ sung để làm phần đó chính xác.

## Kiểm chứng và phần tiếp theo

Kiểm tra Chrome dùng trang `tests/browser.html`: mở năm quầy, sinh/chọn khách, tạm dừng/cửa, xem công thức, thực hiện chuỗi lệnh làm món thật cho cả năm và giao đạt hoàn hảo, phục hồi snapshot, kiểm tra thanh toán một lần, chơi/nhận thưởng/hạn mức/lưu, và kiểm tra bảo toàn quân ô ăn quan. Ảnh xem trước có các chế độ chợ, chuẩn bị, bàn làm việc và hội làng. Không dùng dữ liệu save của trình duyệt thường; script kiểm tra mở profile riêng.

Phần phát triển sau: khung bước chân thực cho từng hướng, đường tìm lối có tránh mọi chướng ngại, nhân viên có phân vai, hạn dùng nguyên liệu theo lô, trang trí đặt tự do và multiplayer. Những phần này chưa được lập trình trong bản hiện tại.
