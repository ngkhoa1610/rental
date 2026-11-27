# Feature — website làm được gì và dữ liệu đi đâu

## Tích hợp ECC vào workflow Codex

- **Quy tắc:** Main Codex tiếp tục phân công theo sáu vai trò hiện có. ECC bổ trợ theo nhu cầu của từng nhiệm vụ. Đặc tả thiết kế được main duyệt trở thành tiêu chí nghiệm thu cho triển khai và kiểm tra độc lập. Phạm vi thay đổi là hướng dẫn và cấu hình agent của project.
- **UAT cấu hình:** xác nhận Codex nhận diện ECC và sáu vai trò. Chạy kiểm tra protocol, rồi dùng fixture để chuyển `design.md` qua developer, tester và reviewer. Xác nhận validator từ chối tham chiếu ngoài phạm vi. Với tác vụ chỉ đọc, giao trực tiếp cho vai trò phù hợp. Đối chiếu diff để xác nhận phạm vi cấu hình.

## Khôi phục tuyến sản phẩm và kiểm tra workflow Codex

- **Quy tắc:** `/products` hiển thị danh mục cùng công cụ tra lịch. `/products/[slug]` hiển thị chi tiết sản phẩm công khai hoặc trang không tìm thấy. Giữ các quy tắc thuê hiện hành khi khôi phục hai điểm vào.
- **UAT:** mở danh mục, tra lịch và lọc trên trang, sau đó mở một sản phẩm công khai để xem ảnh, giá và form thuê. Mở slug không tồn tại để kiểm tra trang lỗi. Với workflow Codex, kiểm tra sáu vai trò, gửi handoff mẫu và xác nhận validator từ chối các đường dẫn sai phạm vi.
- **Điều hướng mobile:** thanh xem lịch trên trang chi tiết phải nằm trên thanh điều hướng dưới. Ở 390 và 768 px, bấm “Xem lịch trống” và xác nhận trang cuộn tới form thuê, đồng thời thanh điều hướng vẫn sử dụng được.

Bảng ghi input, phản hồi và dữ liệu bền vững trong PostgreSQL. Tên bảng là model trong `prisma/schema.prisma`.

## Phạm vi đã chốt — tinh gọn luồng khách đặt thuê

**Quy tắc giới hạn:** khách duyệt/tìm sản phẩm, xem chi tiết, chọn số lượng/ngày, kiểm tra khả dụng và gửi yêu cầu; staff kiểm tra ngoài hệ thống rồi cập nhật trạng thái đơn. Không cung cấp thanh toán/ghi sổ thanh toán trong app, yêu cầu khách tự đổi ngày/hủy, trang lịch sử thuê riêng, trang public collection/lookbook, hoặc khối ưu đãi và lookbook/feedback minh họa trên trang chủ. Trang đơn của khách gộp mọi trạng thái để khách tra cứu; các URL đã bỏ không được còn trong menu. Không xóa migration/bảng cũ có thể chứa dữ liệu; chỉ ngắt khỏi luồng và API đang dùng. Trang feedback riêng giữ nguyên.

**UAT trước triển khai:** (1) khách có thể tìm sản phẩm, chọn ngày/số lượng, kiểm tra còn hàng, gửi yêu cầu và thấy mã đơn/trạng thái chờ duyệt; (2) trang `/account/orders` hiển thị cả đơn đang xử lý và đơn đã kết thúc, không có thanh toán hoặc yêu cầu đổi/hủy; (3) customer navigation không có history, collections hoặc lookbook; các route đó không hiển thị nội dung; (4) admin không còn trang/menu/endpoint ghi nhận thu/hoàn tiền nhưng vẫn xem và cập nhật trạng thái đơn; (5) trang chủ tập trung vào sản phẩm và đặt thuê, không có khu ưu đãi giả lập hay lưới cảm hứng lặp lại danh mục; (6) desktop/mobile giữ khả năng đọc, focus bàn phím và điều hướng tiếng Việt.

## Tông màu sáng và một ngôn ngữ — 14/11/2026

**Quy tắc giới hạn:** dùng nền trắng, điểm nhấn hồng sakura và vàng kem sáng; tránh sắc tím/mauve. Giữ chữ tối dễ đọc, màu nút chính đủ tương phản tối thiểu 4.5:1; giữ nguyên màu success/warning/error để không làm mờ trạng thái. Giao diện chỉ dùng tiếng Việt: bỏ công tắc VI/EN và bỏ lưu lựa chọn ngôn ngữ; giá trị English cũ trên thiết bị không được ảnh hưởng giao diện.

**UAT:** (1) trang chủ, danh mục, chi tiết sản phẩm và admin có nền trắng, điểm nhấn hồng/vàng pastel nhất quán, không ngả tím; (2) chữ thường trên nút/nền đạt tối thiểu 4.5:1, focus dễ thấy, màu trạng thái success/warning/error vẫn phân biệt; (3) không còn điều khiển VI/EN desktop/mobile/admin và `html lang` luôn là `vi`; (4) ở chiều rộng 390px nội dung không tràn ngang.

## Hành trình khách hàng

| Tính năng và URL                                  | File sở hữu                                                                                                                | Input → output và luồng                                                                                                                                                                                                  | Database HTTP                                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trang chủ `/`                                     | `(store)/page.tsx`, `quick-booking.tsx`, `rental-faq.tsx`                                                                  | Xem giới thiệu, quy trình bốn bước, chọn ngày/danh mục → sản phẩm/lịch hoặc trạng thái trống/lỗi. Nút trong trang cuộn tại chỗ.                                                                                          | Đọc `Product`, `ProductImage`, `InventoryBlock` và đơn đã xác nhận để tính lịch; không ghi khi chỉ xem.                                           |
| Danh mục `/products`, chi tiết `/products/[slug]` | `catalog.tsx`, `product-card.tsx`, `product-gallery.tsx`, `product-booking.tsx`, `src/lib/catalog.ts`                      | Tìm/lọc/sắp xếp tại trang, mở mẫu, xem ảnh/size tư vấn → chỉ sản phẩm published. Không tạo `/search`.                                                                                                                    | Đọc `Product` và `ProductImage` của sản phẩm công khai.                                                                                           |
| Lịch `/availability` và lịch trong PDP            | `availability-calendar.tsx`, `quick-booking.tsx`, `rental-date-fields.tsx`, `rental-calendar.ts`, `server/rental/stock.ts` | Chọn sản phẩm, ngày nhận/trả → số lượng còn ở thời điểm tra. Ngày quá khứ hoặc trả trước nhận bị chặn; cùng ngày/hôm sau hợp lệ. Đổi ngày kiểm lại.                                                                      | Đọc `Product`, `RentalOrder`/`OrderLine` trạng thái confirmed/renting và `InventoryBlock`; không giữ chỗ.                                         |
| Báo giá và yêu cầu thuê `/cart`, drawer ở PDP     | `rental-request.tsx`, `booking-drawer.tsx`, `booking-confirmation.tsx`, `server/rental/order-service.ts`, `pricing.ts`     | Sản phẩm/số lượng/ngày + ghi chú, liên hệ lấy từ hồ sơ → quote có hạn rồi mã đơn `pending`. Quote/create kiểm lại stock, giá và chủ đơn; gửi trùng có idempotency. Nhu cầu size/ship chỉ ở ghi chú và shop xác nhận sau. | `RentalQuote`, `QuoteLine`, `RentalOrder`, `OrderLine`, `AuditEvent`, `IdempotencyRecord`; snapshot liên hệ/giá để đơn cũ không đổi theo catalog. |
| Tài khoản `/account`, đơn `/account/orders`       | `session-panel.tsx`, `rental-orders.tsx`, `account-navigation.tsx`, `server/rental/service.ts`                             | Đăng ký, đăng nhập, sửa tên/SĐT, xem tất cả đơn của mình trên một trang. Khách liên hệ staff nếu cần thay đổi yêu cầu.                                                                                                   | `User`, `Session`, `RentalOrder`; update hồ sơ không sửa snapshot liên hệ của đơn cũ. Người khác biết ID cũng không đọc được đơn.                 |
| Yêu thích `/wishlist`, giỏ chọn mẫu `/cart`       | `saved-looks.tsx`, `rental-bag.tsx`, `selection-provider.tsx`, `src/lib/rental-selection.ts`                               | Thêm/bỏ mẫu, chọn số lượng → danh sách trên thiết bị. Đây là lựa chọn, không phải giữ tồn; thao tác không tự chuyển trang.                                                                                               | Không lưu wishlist/giỏ lên DB; localStorage có version và fallback bộ nhớ. Đơn chỉ ghi khi gửi yêu cầu thành công.                                |
| Feedback `/feedback`                              | `published-reviews.tsx`, `review-form.tsx`, `server/http/media.ts`                                                         | Xem đánh giá thật đã được đồng ý và duyệt; sau thuê hoàn tất khách gửi rating, câu chuyện, tối đa 3 ảnh → chờ duyệt.                                                                                                     | `CustomerReview`, `ReviewMedia`, `MediaAsset`, liên hệ `RentalOrder`; public chỉ approved + consent + completed. Ảnh WebP binary ở PostgreSQL.    |
| Hướng dẫn `/rental-guide`, liên hệ nhanh          | `contact-options.tsx`, `store-details.ts`, trang guide                                                                     | Đọc hướng dẫn size/thuê và mở Zalo/Fanpage/Hotline đã cấu hình; thiếu thông tin thì báo đang cập nhật.                                                                                                                   | Không tự ghi DB hoặc gửi tin. Thông tin liên hệ là config công khai trong `store-details.ts`.                                                     |

## Hành trình quản trị — URL và quyền riêng

| Tính năng và URL                             | File sở hữu                                                          | Input → output và luồng                                                                                                                                                         | Database HTTP                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Đăng nhập `/admin/login`, dashboard `/admin` | `admin-shell.tsx`, `server/auth/*`, `admin-overview.tsx`             | Email và mật khẩu → phiên admin riêng. Quyền lấy từ `StaffProfile` mỗi thao tác. Phiên khách không dùng cho admin.                                                              | `User`, `Session`, `StaffProfile`; dashboard đọc dữ liệu theo quyền.            |
| Đơn `/admin/orders`                          | `admin-orders.tsx`, `server/rental/order-service.ts`                 | Staff duyệt/từ chối, giao, nhận trả, hoàn tất và ghi chú trạng thái → trạng thái/version/audit. Kiểm tồn khi staff xác nhận. Staff tự kiểm tra/thỏa thuận thanh toán ngoài web. | `RentalOrder`, `OrderLine`, `AuditEvent`, `IdempotencyRecord`.                  |
| Sản phẩm `/admin/products`                   | `admin-products.tsx`, `admin-service.ts`, `server/http/media.ts`     | Tạo/sửa mô tả, giá/block, số lượng, ẩn/hiện; upload ảnh → sản phẩm công khai khi published. Giảm lượng dưới mức đã giữ bị từ chối.                                              | `Product`, `ProductImage`, `MediaAsset`, audit/version. Không có biến thể size. |
| Khóa lịch `/admin/availability`              | `admin-availability.tsx`, `admin-service.ts`, `stock.ts`             | Khóa/mở số lượng theo khoảng bảo trì → lịch khách thay đổi sau lần đọc kế tiếp; không đè đơn đã giữ.                                                                            | `InventoryBlock`, audit/version.                                                |
| Khách `/admin/customers`                     | `admin-customers.tsx`, `admin-read-service.ts`                       | Tra cứu khách phục vụ đơn theo quyền `customers:read` → danh sách liên hệ.                                                                                                      | Đọc `User`, đơn liên quan; không ghi khi xem.                                   |
| Duyệt feedback `/admin/reviews`              | `admin-reviews.tsx`, `admin-service.ts`                              | Duyệt/từ chối review → public chỉ khi đơn completed và khách đã consent.                                                                                                        | `CustomerReview`, `ReviewMedia`, `MediaAsset`, audit.                           |
| Nhân viên `/admin/team`                      | `admin-team.tsx`, `admin-service.ts`, `server/auth/authorization.ts` | Owner cấp/thu hồi quyền, vô hiệu staff → áp dụng ngay ở request sau; cấm tự nâng quyền/cấp owner từ browser.                                                                    | `StaffProfile`, audit/version; owner đầu tiên được provision qua CLI máy chủ.   |

## API, trạng thái và phản hồi

`src/lib/api/contracts.ts` định nghĩa input/output; `src/lib/api/http.ts` ánh xạ operation đang dùng tới `/api/v1/*`. Các route tiền, yêu cầu đổi/hủy và quản lý editorial đã bị gỡ khỏi ánh xạ HTTP. Một số contract/service và bảng cũ còn trong source/migration để không phá lịch sử; không phải tính năng đang dùng. `src/server/rental/input.ts` kiểm input lúc chạy; `mappers.ts` không trả dữ liệu sổ tiền hoặc yêu cầu đổi/hủy cho API thật. `server/http/security.ts` kiểm session/scope, Origin, CSRF và rate limit; mutation chạy transaction với kiểm quyền/stock/version/idempotency. Ảnh upload JPEG/PNG/WebP tối đa 4 MB, tối đa 16 Mpx, được chuẩn hóa WebP; review tối đa 3 ảnh.

Đơn đi từ `pending → confirmed → renting → returned → completed`, với nhánh `rejected/cancelled` hợp lệ. Pending không giữ tồn; staff cập nhật trạng thái bằng admin. Thanh toán diễn ra bên ngoài app và không được hiển thị/ghi sổ trong luồng hiện tại. Lịch là snapshot, không phải kết nối realtime/push. Các nút submit có trạng thái đang xử lý, lỗi giữ form, thành công/toast sau commit; thao tác đọc lỗi hiện inline. Đường dẫn và nhiệm vụ khách/admin luôn tách nhau.

## Cần chốt trước khi dùng thật

Database vận hành, chính sách giá và thông tin liên hệ thật chưa được cung cấp. Ảnh và giá ở trang xem bố cục không phải hàng/giá shop; không tự hứa giặt hấp, freeship, giữ giấy tờ hay chính sách đổi size chưa duyệt. Không có thông báo realtime. Test fixture PGlite và UI trước đây không thay thế UAT với PostgreSQL và cấu hình đăng nhập thật.

## Refactor nội bộ giữ nguyên hành vi — 21/11/2026

**Quy tắc giới hạn:** bỏ kiểu dự phòng và hàm phân nhóm đơn không có caller, dùng lại cách đọc tồn đang chạy thật cho adapter kiểm thử, và giảm biểu thức lồng trong tính tồn. Giữ nguyên UI, API/DTO, truy vấn về sở hữu và sản phẩm public, quy tắc tồn/ngày, phân quyền, transaction, schema và migration.

**UAT:** trên desktop/mobile, tra lịch và gửi yêu cầu với DB phát triển, sau đó xem đơn chờ duyệt và luồng xử lý đơn admin. Các kiểm thử service/API phải giữ điều kiện chỉ đơn confirmed/renting giữ tồn, ngày nhận/trả tính bao gồm cả hai đầu, và kiểm chủ đơn. Đối chiếu diff để xác nhận không có thay đổi trong UI hoặc migration.

## Checkpoint Git

Quy trình checkpoint trong `setup.md` chỉ áp dụng khi bàn giao thay đổi mã nguồn. Các luồng thuê, API và dữ liệu khách hàng giữ nguyên.

Quy trình phân công Codex áp dụng cho công việc phát triển. Phạm vi vận hành hiện hành nằm ở hai mốc Admin bên dưới. Admin và API được giữ. Phạm vi đăng nhập bằng email và mật khẩu nằm ở cuối tài liệu.

## Admin Mốc 1 — vận hành cửa hàng

| Luồng     | Thao tác được hỗ trợ                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| Tổng quan | Đọc hàng việc và mở danh sách hoặc chi tiết đơn tương ứng.                           |
| Đơn thuê  | Đọc đơn và các dòng, cập nhật trạng thái hợp lệ kèm ghi chú xử lý.                   |
| Sản phẩm  | Tạo, đọc, sửa thông tin và ảnh đại diện, chuyển về nháp để ngừng hiển thị công khai. |
| Lịch kho  | Đọc tồn theo ngày, tạo, đọc, sửa và gỡ khóa theo sản phẩm.                           |

**Phạm vi đã duyệt:** giữ Admin. Hoàn thiện Tổng quan, Đơn thuê, Sản phẩm với một ảnh đại diện và Lịch kho. Đơn chỉ đổi trạng thái theo luồng hiện hành. Sản phẩm ngừng cho thuê chuyển về nháp, giữ liên kết lịch sử. Lịch kho cho tạo, sửa và gỡ khóa. Phiên, quyền Admin và quy tắc tính tồn hiện hành tiếp tục áp dụng.

| Entity                  | Trường phục vụ vận hành                                                                                                                        | Trường do hệ thống quản lý                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| RentalOrder / OrderLine | Mã đơn, liên hệ lúc đặt, ngày nhận/trả, trạng thái, ngày tạo, tên mẫu, số lượng, tiền từng dòng/tổng, ghi chú khách và lịch sử xử lý           | ID liên kết khách, báo giá và sản phẩm, số khả dụng tại báo giá, version, thời gian cập nhật, dấu vết audit |
| Product / ProductImage  | Slug khi tạo, tên, mô tả, danh mục, bộ sưu tập, dịp sử dụng, giá mỗi block, số ngày/block, số lượng, nháp/công khai, ảnh đại diện và mô tả ảnh | ID, version, thời gian tạo/cập nhật, thứ tự ảnh đại diện 0 và liên kết đơn                                  |
| InventoryBlock          | Sản phẩm, ngày bắt đầu/kết thúc, lượng khóa, lý do                                                                                             | ID, version, người và thời gian tạo, audit                                                                  |

**UAT:** ở 1440px và 390px, mở hàng việc hôm nay từ dashboard, tìm đơn, xem chi tiết và chuyển trạng thái hợp lệ. Tạo/sửa sản phẩm, xem trước ảnh và chuyển nháp/công khai. Tạo/sửa/gỡ khóa, đối chiếu số đã giữ/đang khóa/còn trống ở cả hai đầu khoảng ngày. Đơn chờ duyệt chưa giữ tồn. Nhân viên chỉ có quyền lịch kho vẫn nhập/chọn sản phẩm được, còn phiên khách không truy cập API mới. Thử gửi dữ liệu cũ hoặc số lượng xung đột, giữ form và hiện lỗi.

**UAT theo trường:** mở lại sản phẩm sau khi lưu và đối chiếu từng trường trong bảng, gồm dịp sử dụng và mô tả ảnh. Khi sửa, slug vẫn định danh cùng sản phẩm và giữ liên kết với đơn cũ. Mở lại khóa để đối chiếu sản phẩm, hai ngày, số lượng và lý do. Sau khi đổi trạng thái đơn, kiểm tra liên hệ lúc đặt, ngày thuê và các dòng vẫn khớp với đơn ban đầu.

## Admin Mốc 2

**Phạm vi:** quản lý album trong Admin, tra cứu Khách hàng, duyệt Feedback và quản lý quyền Nhân sự qua các API hiện có. Khách hàng chỉ đọc hồ sơ liên hệ, lịch sử yêu cầu quyền đơn song song. Feedback hiển thị nội dung, ảnh, điểm, đồng ý công khai và trạng thái duyệt. Nhân sự hiển thị trạng thái và quyền tác vụ, giữ bảo vệ tài khoản quản trị.

**Quy tắc album:** vị trí đầu là ảnh đại diện, mỗi ảnh có mô tả thay thế. Cho thêm, đổi thứ tự, đặt làm đại diện và gỡ ảnh phụ. Mỗi album khi lưu có tối đa 8 ảnh khác nhau. Album cũ dài hơn vẫn đọc được và cần rút gọn khi lưu. Cập nhật ảnh trong giao dịch lưu sản phẩm, kiểm version, quyền và nguồn ảnh. Client cũ gửi ảnh đại diện theo contract hiện tại vẫn giữ ảnh phụ.

**UAT:** lưu ảnh đại diện và hai ảnh phụ, đổi ảnh đại diện, đổi thứ tự, sửa mô tả, gỡ một ảnh rồi mở lại. Kiểm thử quyền danh sách khách và xem lịch sử, lọc feedback và lưu quyết định hợp lệ, kiểm quyền và trạng thái nhân sự sau lưu. Chạy trên desktop và mobile.

## Đăng nhập bằng email và mật khẩu

**Phạm vi:** khách tự đăng ký tài khoản mới, đăng nhập và đăng xuất. Admin đăng nhập riêng bằng tài khoản được cấp qua CLI và quyền lấy từ StaffProfile. Giữ Prisma, PostgreSQL và lịch sử migration. DB chưa có tài khoản nên không cần bước chuyển đổi tài khoản.

**UAT:** đăng ký khách, đăng xuất rồi đăng nhập lại, thử gửi yêu cầu thuê và tra cứu đơn. Cấp nhân sự qua CLI rồi duyệt đơn từ phiên Admin riêng. Kiểm mật khẩu sai, email trùng, Origin sai, CSRF, phiên hết hạn và từ chối dùng phiên khách cho Admin.

## Một luồng chạy ứng dụng và một trang xem bố cục

**Quy tắc:** `npm run dev` dùng cùng API và PostgreSQL như ứng dụng vận hành. Xóa bộ chọn chế độ, adapter giả lập và trình nạp DB QA. Giữ quyền và phiên khách/Admin tách riêng, hợp đồng API, schema và migration hiện hành. `/layout-preview` chỉ mở khi phát triển và nhận một object JSON qua props để hiển thị thẻ trang phục, chi tiết, lịch, đơn và phản hồi theo bố cục sakura hiện có. Trang fixture không đọc hoặc ghi API hay DB, không tạo phiên. Kiểm thử SQL có fixture cô lập phục vụ nghiệp vụ riêng với trang thử bố cục.

**UAT:** chạy `npm run dev` và mở `/layout-preview` ngay cả khi chưa cấu hình DB. Kiểm tra 1440 px và 390 px, bàn phím, tiếng Việt, reduced motion, không gọi API; kiểm tra production trả 404. Với DB phát triển có sẵn, mở storefront, đăng nhập email/mật khẩu và kiểm tra quyền từng khu, trạng thái đơn, sở hữu và tồn qua API thật.

## Đăng nhập mô phỏng trên trang xem bố cục

**Quy tắc giới hạn.** Trên `/layout-preview`, ai cũng xem được danh mục và lịch mẫu. Đăng nhập mô phỏng bằng tài khoản công khai trong `setup.md` để xem đơn và phản hồi mẫu của khách hoặc bảng đơn Admin mẫu. State chỉ nằm trong bộ nhớ trang và xóa khi đăng xuất hoặc tải lại. Preview chỉ chạy ở môi trường phát triển. Luồng xác thực và phân quyền của các trang nghiệp vụ vẫn dùng cơ chế hiện tại.

**UAT.** Thử email hoặc mật khẩu sai và kiểm thông báo lỗi. Nhập lần lượt hai cặp thông tin đúng, kiểm phần mẫu hiển thị đúng vai trò. Đăng xuất hoặc tải lại để trở về danh mục và lịch mẫu. Kiểm bàn phím, độ rộng 390 px và 1440 px, không phát sinh request API, cookie hoặc lưu trữ, và production trả 404 cho `/layout-preview`.

**Lối vào mặc định khi chưa có DB.** Với `npm run dev` và `DATABASE_URL` trống, trang chủ chuyển sang `/layout-preview` trước khi đọc danh mục. Tài khoản mẫu nhập tay chỉ mở dữ liệu mẫu theo vai trò trên trang này.

**UAT trang chủ.** Khởi động dev khi chưa đặt `DATABASE_URL` rồi mở `/`. Kiểm tra trình duyệt chuyển sang `/layout-preview` và đăng nhập được bằng cả hai tài khoản mẫu. Kiểm tra trang chủ vẫn mở luồng cửa hàng khi có cấu hình DB phát triển hoặc khi chạy bản production.

## Giao diện ELMEE cho khu khách

**Quy tắc giới hạn.** Áp dụng màu nhấn `#660000` đã xác minh cho khu khách. Nền giấy kem và vân giấy CSS là bản tạm trong lúc chờ thông số màu và tài nguyên nền từ Canva. Giữ font hiện tại đến khi xác định chính xác font và độ đậm của tiêu đề chính, tiêu đề phụ cùng nguồn font được phép dùng trên web. Giữ nguyên cấu trúc, nội dung, lề, khoảng cách, cỡ chữ, chiều cao dòng, ảnh và quy tắc thuê. Màu trạng thái tiếp tục biểu thị đúng kết quả nghiệp vụ.

**UAT.** So sánh ở 1440 px và 390 px trên trang khách và `/layout-preview`. Kiểm chữ tiếng Việt có dấu, nền giấy, nút và focus, ảnh mở rộng, bảng lịch và drawer gửi yêu cầu. Bảng Admin trong preview và các tuyến Admin vẫn dùng màu gốc. Dùng bàn phím để mở và đóng drawer, kiểm focus và chế độ giảm chuyển động.

## Vai trò Designer trong workflow Codex

**Quy tắc giới hạn.** Giao việc về giao diện hoặc tương tác cho `designer/design` trước khi triển khai. Designer đọc màn hình và token hiện tại, dùng tài liệu người dùng cung cấp và nghiên cứu giao diện tham chiếu khi đề xuất hướng thiết kế đáng kể. Audit và đề xuất chỉ đọc. Khi đã được giao triển khai, Designer chỉ sửa file trình bày hoặc tài liệu thiết kế mà nhiệm vụ chỉ rõ. Tác vụ chỉ đổi theme giữ bố cục, thứ tự nội dung, lưới, kích thước chữ, điều hướng và hành vi thuê theo phạm vi ELMEE hiện hành.

**UAT.** Giao một yêu cầu đổi theme ngắn với đường dẫn Canva và các file CSS được phép sửa. Kiểm tra Designer nêu mã màu và font đã xác minh, đánh dấu tài nguyên còn thiếu, mô tả cách kiểm tra trên desktop, tablet và mobile, và bàn giao qua envelope `designer/design`. Giao `tester` và `reviewer` xác minh độc lập. Nếu chỉ giao audit thì `changed_files` rỗng. Lần cấu hình vai trò này chỉ kiểm workflow, không triển khai thay đổi giao diện.

## Bố cục cửa hàng và quản trị

**Quy tắc giới hạn.** Dùng nền giấy kem, màu nhấn `#660000` và font hiện có cho khu khách. Trang chủ đặt hai thao tác xem trang phục và kiểm tra ngày cạnh nhau, rồi đưa danh mục lên trước hướng dẫn. Thẻ ảnh và nội dung giá xếp theo chiều đọc. Bản xem trước đưa form mẫu lên trước danh mục. Bảng Admin dùng hàng kẻ rõ và giữ màu, nhãn và thao tác hiện có.

**UAT.** Ở 390 px, 768 px và 1440 px, kiểm tra vị trí thao tác, giá và thời lượng có thể đọc, trạng thái rỗng xuất hiện đúng lúc, tiêu điểm bàn phím và chế độ giảm chuyển động. Nhập tay hai tài khoản mẫu. Kiểm tra bảng Admin ở desktop và nhãn từng hàng ở mobile. Luồng thuê, quyền và dữ liệu dùng kiểm thử nghiệp vụ hiện có.

**Tìm kiếm và màu nền.** Thu gọn bộ lọc trang sản phẩm và đặt thanh tìm kiếm về bên phải trên màn hình rộng. Giữ các thao tác tìm kiếm, tra ngày và điều hướng bàn phím. Dùng nền giấy sáng hơn cho khu khách và bản xem trước, giữ điểm nhấn `#660000`.

**UAT tìm kiếm.** Ở 390 px, 768 px và 1440 px, kiểm tra thanh tìm kiếm gọn khi bộ lọc đóng. Khi mở bộ lọc, Tab qua các trường trước nút áp dụng rồi kiểm kết quả và thao tác xóa điều kiện.

## Tìm trang phục và tra lịch thuê

**Quy tắc giới hạn.** Trên `/products`, tìm theo từ khóa và tra theo ngày có hai biểu mẫu và hai vùng kết quả riêng. Mục tra lịch mở theo yêu cầu. Giữ nền giấy và màu nhấn ELMEE, dùng nút chính cho tra ngày và nút phụ cho bộ lọc. Ngày nhận và ngày trả đứng cạnh nhau khi đủ chỗ. Kết quả tra lịch vẫn lấy từ báo giá và tồn hiện có.

**UAT.** Ở 390 px, 768 px và 1440 px, mở mục tra lịch bằng bàn phím. Kiểm thứ tự Tab từ ngày nhận, ngày trả, loại sản phẩm đến nút kiểm tra. Thử trả cùng ngày, ngày không hợp lệ, kết quả có hoặc hết đồ và đổi ngày sau khi kiểm tra. Nhập từ khóa, mở bộ lọc và áp dụng để xác nhận chỉ danh mục thay đổi. Kiểm tra tra lịch độc lập ở trang chủ và `/availability`.
