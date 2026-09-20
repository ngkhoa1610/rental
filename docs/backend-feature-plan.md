# Backend — use cases và phạm vi đã duyệt

Ngày chốt: **2026-09-20**. Trạng thái: **đã duyệt phạm vi nghiệp vụ, chưa triển khai**.
Baseline ứng dụng: source version 9. Tài liệu này thay thế bản đề xuất BE trong chat trước đó; chưa chọn kiến trúc, database, công nghệ đăng nhập hoặc endpoint.

## 1. Cơ sở phê duyệt

Người dùng xác nhận các phần không nhắc sửa trong plan vừa trình đều được duyệt. Bốn điều chỉnh bắt buộc: bỏ biến thể sản phẩm; lịch theo sản phẩm; có đăng nhập để giảm input khi thuê và có ghi chú của khách; thanh toán offline do admin cập nhật sau. Sự đồng ý này áp dụng cho plan đã trình cùng các sửa đổi đó, không tự động duyệt các ý tưởng mới ngoài phạm vi.

MVP có tài khoản khách hàng, cửa hàng duyệt yêu cầu thuê và nhận/trả tại cửa hàng. Giữ đồng bộ wishlist theo tài khoản, giao hàng và cổng thanh toán online ngoài MVP. Có đăng nhập không tự động mở rộng wishlist hiện tại sang đồng bộ server.

## 2. Vai trò và use case

| Nhóm               | Use case / kết quả mong đợi                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Khách và tài khoản | Khách chưa đăng nhập xem catalog, lịch, Collections, Lookbook và feedback công khai. Khách đăng nhập quản lý thông tin liên hệ, gửi yêu cầu thuê, xem đơn của mình, yêu cầu đổi ngày/hủy và gửi feedback sau thuê. Phạm vi tài khoản gồm tạo tài khoản, đăng nhập/đăng xuất, khôi phục truy cập; phương thức cụ thể chưa chọn. |
| Sản phẩm           | Admin quản lý ảnh, tên, mô tả, danh mục, giá thuê, số lượng theo sản phẩm và trạng thái hiển thị. Không có biến thể, lựa chọn size/màu hoặc tồn kho theo biến thể. Thông tin mô tả không tạo lựa chọn biến thể ngầm.                                                                                                           |
| Khả dụng           | Khách chọn ngày nhận–trả; hệ thống đối chiếu lịch và số lượng theo sản phẩm. Loại trừ lượng đang thuê/đã xác nhận hoặc đang vệ sinh/bảo trì theo quy định được chốt. Kiểm lại khi admin xác nhận; không xác nhận vượt số lượng khả dụng.                                                                                       |
| Yêu cầu thuê       | Lấy sản phẩm từ giỏ, ngày nhận–trả và liên hệ từ hồ sơ. Khách bổ sung ghi chú tùy chọn, xem chi tiết tiền và gửi. Liên kết đơn với tài khoản đăng nhập; gửi thành công chỉ tạo yêu cầu chờ duyệt.                                                                                                                              |
| Quản lý đơn        | Admin/nhân viên có quyền duyệt/từ chối, nêu lý do và xử lý yêu cầu đổi ngày/hủy. Khách chỉ xem/thao tác trên đơn của mình; thay đổi lịch phải kiểm lại khả dụng.                                                                                                                                                               |
| Nhận–trả           | Nhân viên ghi nhận bàn giao, hoàn trả và tình trạng đồ. Nhận/trả tại cửa hàng trong MVP. Lịch sử ghi rõ người thao tác và thời điểm.                                                                                                                                                                                           |
| Thanh toán offline | Admin cập nhật khoản đã thu/hoàn và trạng thái thanh toán sau giao dịch thực tế. Đơn mới chưa thanh toán; việc gửi/duyệt đơn hoặc giao/trả đồ không tự đánh dấu đã thanh toán. Khách chỉ xem thông tin thanh toán của đơn mình.                                                                                                |
| Nội dung           | Admin quản lý Collections, bài Lookbook với hướng dẫn phối và sản phẩm liên quan. Nội dung có bản nháp/xuất bản.                                                                                                                                                                                                               |
| Feedback thật      | Khách hoàn tất thuê gửi đánh giá và ảnh, đồng ý công khai; admin duyệt trước khi hiển thị. Nhãn đã thuê phải đối chiếu đơn hợp lệ của chính khách. Giữ khả năng chia sẻ feedback công khai đã duyệt.                                                                                                                           |
| Quản trị           | Chủ cửa hàng quản lý nhân viên và quyền theo tác vụ. Lưu lịch sử thay đổi đơn, thanh toán và nội dung quan trọng. Chỉ admin có quyền thanh toán mới cập nhật thu/hoàn; không mặc định mọi nhân viên được sửa tiền.                                                                                                             |

## 3. Form yêu cầu thuê gọn

| Thông tin                       | Cách lấy / hiển thị                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tài khoản khách                 | Từ phiên đăng nhập; không cho khách nhập hoặc chọn chủ sở hữu đơn.                                                                                                                                  |
| Sản phẩm thuê                   | Kế thừa lựa chọn trong giỏ, hiển thị để kiểm tra; không có bước chọn biến thể.                                                                                                                      |
| Ngày nhận và ngày trả           | Bắt buộc. Kế thừa lựa chọn trước đó nếu có; chỉ yêu cầu nhập khi thiếu hoặc khách muốn sửa.                                                                                                         |
| Họ tên và số điện thoại liên hệ | Điền từ hồ sơ, hiển thị tóm tắt. Chỉ yêu cầu bổ sung khi thiếu hoặc sửa khi không đúng; không bắt nhập lại mỗi đơn. Lưu thông tin liên hệ tại thời điểm gửi để việc đổi hồ sơ không làm đổi đơn cũ. |
| Ghi chú / yêu cầu thêm          | Tùy chọn: khách viết yêu cầu chuẩn bị hoặc lưu ý cho cửa hàng. Hiển thị cho nhân viên trong chi tiết đơn; ghi chú không tự thay đổi giá, lịch hay cam kết của cửa hàng.                             |
| Chi tiết tiền                   | Hệ thống tính và hiển thị từ dữ liệu giá/quy định hợp lệ; khách không nhập tổng tiền. Không thu tiền trong form.                                                                                    |

MVP nhận tại cửa hàng nên không hỏi địa chỉ giao hàng. Không yêu cầu lại email đã có ở tài khoản, thông tin thẻ hay chứng từ thanh toán trong form thuê. Nếu cần đăng nhập ở bước gửi, giữ lựa chọn/ngày/ghi chú để khách tiếp tục. Kiểm tra dữ liệu và lỗi tại chỗ; không tạo route/query cho validation, filter, popup hoặc từng bước điền form.

## 4. Đơn và thanh toán là hai trạng thái riêng

Luồng đơn giữ nguyên: **Chờ duyệt → Đã xác nhận → Đang thuê → Đã trả → Hoàn tất**, kèm **Từ chối/Hủy**. Đổi ngày/hủy được nhân viên xử lý theo quyền và chính sách; không bỏ qua kiểm tra khả dụng.

Thanh toán thể hiện khoản phải thu, đã thu, đã hoàn và phần còn lại; phân biệt chưa thanh toán, thanh toán một phần và đã thanh toán theo khoản ghi nhận thực tế. Khoản hoàn phải được ghi nhận riêng, không xóa dấu vết thu tiền. Admin lưu số tiền, thời điểm giao dịch và ghi chú cần thiết; chỉnh sai phải có lý do và lịch sử. Không tạo giao dịch online, callback thanh toán hoặc tự suy ra đã trả tiền từ trạng thái đơn.

Các khoản cọc, phí phát sinh và điều kiện hoàn chỉ áp dụng sau khi có chính sách cụ thể. Không tự đặt mức tiền, bắt trả trước hoặc ép thời điểm thanh toán khi người dùng chưa chốt.

## 5. Thứ tự triển khai

1. **Tài khoản, dữ liệu và quản trị:** đăng nhập/hồ sơ/quyền, sản phẩm không biến thể, Collections và Lookbook với nội dung thật.
2. **Thuê và vận hành:** lịch theo sản phẩm, form gọn có ghi chú, gửi/duyệt/tra cứu đơn trong tài khoản, đổi ngày/hủy, nhận–trả, admin ghi nhận thanh toán offline.
3. **Sau thuê:** feedback gắn đơn, kiểm duyệt nội dung/ảnh, chia sẻ feedback đã duyệt và thông báo trạng thái. Kênh thông báo sẽ xác định khi triển khai, không tự thêm SMS trả phí.

Routes hiện có vẫn là `/`, `/products`, `/products/[slug]`, `/collections`, `/lookbook`, `/feedback`, `/wishlist`, `/cart`. Các màn hình tài khoản/đơn/quản trị là business đã được duyệt; đường dẫn cụ thể chưa thiết kế. Không khôi phục `/search` hoặc URL cho tác vụ tại trang.

## 6. Điều kiện nghiệm thu

- Dữ liệu và quyền: khách không xem/sửa đơn của người khác, không sửa giá hoặc trạng thái tiền; nhân viên chỉ thao tác trong quyền được cấp. Phiên hết hạn không làm mất form nhưng phải xác thực lại trước khi gửi.
- Sản phẩm/lịch: không có biến thể ở UI, yêu cầu hoặc quản trị; hai xác nhận đồng thời không vượt số lượng; đổi ngày và ngày biên được kiểm đúng. Số lượng không hợp lệ hoặc ngày đảo ngược bị từ chối.
- Form: profile có liên hệ thì không phải nhập lại; thiếu liên hệ chỉ hỏi trường thiếu; ghi chú trống hợp lệ, ghi chú quá giới hạn/markup được xử lý an toàn. Gửi lặp không tạo đơn ngoài ý muốn.
- Thanh toán: khách/nhân viên không có quyền bị chặn; gửi/duyệt/trả đồ không đánh dấu đã thu; thao tác lặp không ghi nhận thu/hoàn hai lần; cập nhật có lịch sử và số tiền hợp lệ.
- Feedback: chỉ đơn đủ điều kiện của khách mới gửi được; ảnh sai định dạng/quá giới hạn bị chặn; chưa duyệt không công khai; việc công khai ảnh cần sự đồng ý của khách.
- Mỗi đợt: format, lint, tests, build, security review và E2E khách–nhân viên; UI responsive, keyboard, trạng thái lỗi/loading/empty và không điều hướng thừa. Không coi một bài test DOM là visual QA.

## 7. Chi tiết còn cần chốt khi triển khai

Phạm vi trên đã duyệt, không hỏi duyệt lại toàn bộ plan. Những giá trị chưa từng được cung cấp vẫn chưa phải chính sách: mức cọc/phí/hoàn; cách tính ngày và mốc giờ nhận–trả; thời hạn hủy; thời gian vệ sinh; thời điểm yêu cầu được tính là giữ chỗ và thời hạn xử lý. Làm rõ đúng phần cần thiết trước khi áp dụng, không bịa mặc định nghiệp vụ.

Kiến trúc, database, cách đăng nhập/xác minh và thiết kế endpoint thuộc bước kỹ thuật tiếp theo. Hiện tại chưa có code BE, account, đơn hay payment thật trong ứng dụng; dữ liệu FE vẫn là mẫu.
