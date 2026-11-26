# Structure — bản đồ dự án Rental Store

Cập nhật 04/10/2026. Đây là website thuê quần áo/phụ kiện gồm khu khách và khu quản trị. Hãy bắt đầu ở `src/app` để tìm trang, `src/components` để tìm giao diện, `src/lib` để tìm quy tắc dùng chung, `src/server` để tìm xử lý có database, rồi `prisma` để xem dữ liệu được lưu ra sao. Nếu chỉ sửa chữ/hình trên trang, thường không cần sửa database.

## Một yêu cầu đi qua đâu?

1. Người dùng mở URL. Next.js chọn `page.tsx` tương ứng trong `src/app`.
2. Trang ghép các component. Component gọi API qua `src/components/store/api-provider.tsx` và contract trong `src/lib/api`.
3. Request đi vào `src/app/api`, qua xác thực và kiểm tra ở `src/server/http`, nghiệp vụ ở `src/server/rental`, rồi tới PostgreSQL qua Prisma. Server Component có thể đọc trực tiếp qua service server-only.
4. Kết quả trả về giao diện. Thao tác lưu/xử lý chỉ báo thành công sau khi server hoàn tất.

Khu khách ở `src/app/(store)` (dấu ngoặc là nhóm thư mục, **không** xuất hiện trong URL). Khu quản trị ở `src/app/admin`; `/api/auth` và `/api/admin/auth` có phiên/cookie riêng. Không có link hoặc thông tin quản trị trong menu khách. Quyền nhân viên được đọc từ database, không lấy từ form hoặc nhà cung cấp đăng nhập.

## Vai trò thư mục và file gốc

| Vị trí                                                                                                                           | Chứa gì                                                                                                                                    | Khi nào cần mở?                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `src/app/(store)/`                                                                                                               | Trang công khai, sản phẩm, lịch trống, giỏ, tài khoản; CSS theo trang                                                                      | Đổi bố cục hoặc thêm trang khách.                                                |
| `src/app/admin/`                                                                                                                 | Dashboard và trang đơn, sản phẩm, lịch khóa, khách, đánh giá, nhân viên; CSS admin                                                         | Đổi giao diện vận hành.                                                          |
| `src/app/api/` và `src/app/media/`                                                                                               | Cửa vào HTTP, đăng ký/đăng nhập, upload/đọc ảnh                                                                                            | Đổi tuyến API hoặc quyền truy cập file.                                          |
| `src/components/store/`                                                                                                          | Các khối giao diện khách: lịch, đặt thuê, tài khoản, danh mục, feedback, thông báo                                                         | Đổi cách khách thao tác.                                                         |
| `src/components/admin/`                                                                                                          | Giao diện quản trị và bảng dữ liệu                                                                                                         | Đổi form/bảng của nhân viên.                                                     |
| `src/components/layout/`, `src/components/ui/`                                                                                   | Header/footer và thành phần UI dùng lại                                                                                                    | Đổi phần chung, có thể ảnh hưởng nhiều trang.                                    |
| `src/lib/`                                                                                                                       | Quy tắc ngày thuê, giỏ/yêu thích, quy tắc danh mục, ngôn ngữ, thông tin liên hệ, hợp đồng và HTTP client                                   | Đổi quy tắc dùng ở nhiều nơi. `catalog.ts` định nghĩa kiểu và bộ lọc dùng chung. |
| `src/server/auth/`                                                                                                               | Xác thực mật khẩu, phiên customer/admin, quyền                                                                                             | Đổi cách đăng nhập hoặc phân quyền.                                              |
| `src/server/http/`                                                                                                               | Kiểm URL/method/body, origin, CSRF, rate limit, upload và lỗi API                                                                          | Đổi ranh giới bảo mật HTTP.                                                      |
| `src/server/rental/`                                                                                                             | Giá, tồn/lịch, đơn, sản phẩm, review, DTO, transaction; `service.ts` ghép các handler, `admin-read-service.ts` chứa truy vấn đọc của admin | Đổi nghiệp vụ và dữ liệu trả về.                                                 |
| `src/server/db/`                                                                                                                 | Kết nối Prisma/PostgreSQL, transaction, khóa bản ghi                                                                                       | Đổi cách kết nối/xử lý đồng thời.                                                |
| `prisma/schema.prisma`, `prisma/migrations/`                                                                                     | Bản thiết kế bảng và lịch sử thay đổi SQL                                                                                                  | Thêm/sửa dữ liệu bền vững. Không dùng `db push` thay migration có trigger/check. |
| `tests/`, `scripts/`                                                                                                             | Test unit/DOM/server/integration, smoke/browser, lệnh provision staff và bảo trì DB                                                        | Kiểm tra hoặc thao tác vận hành có kiểm soát.                                    |
| `public/images/`                                                                                                                 | Ảnh minh họa đóng gói cùng website                                                                                                         | Thay ảnh mẫu đã được phép dùng.                                                  |
| `docs/`                                                                                                                          | Ba tài liệu hiện hành này                                                                                                                  | Hiểu cấu trúc, tính năng, cài đặt.                                               |
| `package.json`, `package-lock.json`                                                                                              | Thư viện và lệnh npm, lock phiên bản                                                                                                       | Đổi dependency/lệnh chạy; luôn đi cùng nhau.                                     |
| `.env.example`, `prisma.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.prettierrc*` | Mẫu biến môi trường, cấu hình DB/build/type/lint/CSS/format                                                                                | Cài đặt hoặc thay quy tắc build. Xem `setup.md` trước khi sửa.                   |
| `AGENTS.md`, `README.md`                                                                                                         | Quy tắc làm việc ngắn và điểm vào tài liệu                                                                                                 | Bắt đầu một lượt phát triển.                                                     |

`src/generated/prisma`, `node_modules`, `.next` là sản phẩm tạo ra từ cài đặt/build; không chỉnh tay hoặc đóng gói như source. File `.env` chứa bí mật cục bộ, không commit/gửi trong ZIP.

## Foundation đang áp dụng

- Next.js App Router, React, TypeScript strict, Tailwind 4; route mặc định là Server Component, tương tác mới dùng Client Component.
- API contract và response validation nằm ở `src/lib/api`; service chỉ trả trường công khai qua mapper, không xuất thẳng model Prisma.
- PostgreSQL lưu dữ liệu thật; Prisma schema cùng migration là nguồn cấu trúc. Giao dịch thay đổi dùng kiểm quyền, version, idempotency, audit và transaction để hạn chế ghi trùng hoặc ghi nửa chừng.
- Không có biến thể size/SKU. Size là lời tư vấn trong ghi chú. Đơn khách gửi là `pending`; kho chỉ được giữ sau khi staff xác nhận. Thanh toán diễn ra ngoài app; app không có màn hình hay API ghi sổ thanh toán trong phạm vi hiện tại.
- Theme dùng token màu ở `src/app/globals.css`: nền trắng, điểm nhấn sakura pastel và chữ có tương phản đủ đọc. Giao diện hiện chỉ dùng tiếng Việt, không lưu lựa chọn ngôn ngữ trên thiết bị.
- Ứng dụng dùng một luồng nghiệp vụ. Thông tin xác thực và chính sách giá thuê cần được cấu hình khi vận hành.

## Quy tắc sửa an toàn

Trước code: xác định use case, file sở hữu và UAT mong đợi; không tự đặt giá/cọc/phí/quy định. Sau code: format, lint, test, build, smoke, security review và kiểm giao diện desktop/mobile liên quan. Nếu thiếu môi trường, ghi `BLOCKED`, không coi test cũ là kết quả mới. Mỗi file đổi cần được giải thích vai trò, có test và bản lưu source mới. Xem `feature.md` cho hành vi, `setup.md` cho cấu hình và lệnh.

- Catalog phân trang và lọc cục bộ, không đổi URL hay ghi DB.

## Xác thực bằng email và mật khẩu

Form đăng ký và đăng nhập gửi JSON đến route xác thực theo khu. Handler kiểm tra dữ liệu, Origin và giới hạn tần suất trước khi tạo `User` hoặc kiểm mật khẩu. Server phát cookie phiên và lưu hash token trong `Session`, theo scope. `sessionContext` trong `src/server/http/security.ts` đọc phiên và tạo token CSRF cho API. Nghiệp vụ Admin tiếp tục kiểm `StaffProfile` trên server; CLI cấp tài khoản qua `scripts/provision-staff.ts`.

## Đọc tồn dùng chung

`src/server/rental/stock.ts` sở hữu truy vấn các đơn đang giữ tồn, khóa kho và phép tính tồn theo ngày. Adapter `prisma-repository.ts` dùng cùng truy vấn và chỉ trả các trường tồn theo hợp đồng của adapter. `services.ts` giữ các kiểu dùng để ghép handler, còn `repositories.ts` mô tả contract đọc đang được dùng.

Quy tắc tạo checkpoint Git nằm trong `AGENTS.md`. Hook tại `.githooks/pre-commit` gọi `scripts/check-staged-secrets.mjs` để kiểm tra dữ liệu staged. Xem mục Checkpoint Git trong `docs/setup.md` để bật hook trên một checkout.

`AGENTS.md` xác định cách phân công Codex và các quyết định nghiệp vụ hiện hành. `.codex/agents/` chứa các vai trò chuyên trách, `.codex/protocol/` chứa hợp đồng bàn giao và `.agents/skills/` chứa hướng dẫn theo loại thay đổi.

## Admin Mốc 1

Đối chiếu trường vận hành với `prisma/schema.prisma`, sau đó kiểm tra trường đi qua biểu mẫu, contract và service trước khi ghi dữ liệu. Ma trận thao tác và UAT theo trường nằm ở `feature.md`. Tài liệu tham chiếu bố cục Mobbin và cách chạy kiểm tra nằm ở `setup.md`.

## Admin Mốc 2

`/admin/products` lưu qua `admin.products.save` → HTTP handler → `input.ts` và quyền `catalog:manage` → transaction trong `admin-service.ts` → `ProductImage`. `additionalPhotos` biểu diễn ảnh sau ảnh đại diện. Ghi vị trí từ thứ tự mảng và gỡ liên kết ảnh thừa trong cùng transaction. Media đã tải tiếp tục dùng endpoint và chính sách truy cập hiện có. DTO catalog vẫn trả ảnh đại diện.

`/admin/customers`, `/admin/reviews`, `/admin/team` đọc qua `admin-read-service.ts`. Lịch sử khách tải theo yêu cầu sau khi giao diện kiểm quyền đơn, API tiếp tục kiểm quyền phía server. Quyết định feedback và chỉnh quyền nhân sự ghi qua service hiện hành.

Tổng quan và Đơn thuê cùng dùng dữ liệu `admin.orders.list`. Đường dẫn từ Tổng quan truyền hàng việc qua `queue` và mã đơn qua `order`. Ghi đơn tiếp tục qua `admin.orders.transition`. Sản phẩm dùng `admin.products.list/save` và endpoint tải ảnh sản phẩm hiện có. Lịch kho gọi `GET /api/v1/admin/availability/stock` → HTTP handler → contract và quyền `availability:manage` → `admin-read-service.ts` → truy vấn tồn Prisma. Phản hồi gồm thông tin vận hành của sản phẩm và số lượng mỗi ngày, không kèm dữ liệu cá nhân trên đơn. Các thao tác ghi khóa dùng các mutation hiện có.

## Xem trước bố cục

`/layout-preview` dùng một object trong `src/components/layout-preview/fixtures.json`. Component nhận dữ liệu qua props. `AppProviders` bỏ qua provider API, phiên và lựa chọn ở tuyến xem trước khi phát triển. Trang nghiệp vụ tiếp tục dùng provider HTTP theo scope và trả dữ liệu thật.

Trong môi trường phát triển, `src/app/(store)/page.tsx` chuyển `/` sang `/layout-preview` khi `DATABASE_URL` trống. Điều kiện được kiểm tra trước lệnh đọc danh mục `storeProducts()`.

Trang chủ đặt thao tác xem danh mục và tra lịch cạnh nhau. `product-card.tsx` dùng chung phần ảnh, tên và giá giữa cửa hàng và preview. `booking.css` trình bày lịch và drawer. `admin.css` quy định cách hiển thị bảng và điều hướng quản trị.

`catalog.tsx` giữ bộ lọc cục bộ và dùng thanh tìm gọn trong `store.css`. Nền giấy `#FDFAF6` trong `theme.css` dùng chung cho trang khách và preview.

`/products` ghép mục tra lịch `quick-booking.tsx` và danh mục `catalog.tsx` thành hai vùng độc lập. Tra lịch kiểm tra từng sản phẩm qua báo giá hiện có và hiển thị kết quả trong mục tra ngày. Danh mục dùng từ khóa, bộ lọc và sắp xếp cục bộ.

`preview-sign-in.tsx` đọc hai tài khoản mẫu từ fixture và giữ vai trò đã chọn trong state của component. Vai trò chỉ quyết định khối đơn/phản hồi khách hoặc bảng Admin mẫu được hiển thị trên trang phát triển. Tải lại trang sẽ xóa state.

`src/app/(store)/theme.css` giữ màu nhấn `#660000` đã xác minh và nền giấy CSS tạm thời của khu khách. Layout khách nhập file này sau CSS bố cục. Các portal khách nhận token theo lớp của từng sheet. Phần khách trong preview dùng bộ màu này. Bảng Admin dùng token gốc. Font tiêu đề và tiêu đề phụ tiếp tục lấy từ CSS hiện tại trong khi chờ thông số và tài nguyên font Canva dùng được trên web.

## Nguồn thiết kế và phạm vi token

`.codex/agents/designer.toml` định nghĩa vai trò `designer/design`. Đi từ route trong `src/app` tới các component trong `src/components/store`, `src/components/admin`, `src/components/layout` và thành phần shadcn/Radix trong `src/components/ui`. Đối chiếu CSS toàn cục, CSS theo khu, token portal, và font ở `src/app/layout.tsx` trước khi đề xuất token mới.

Quyết định đã duyệt và thông số ELMEE nằm trong [feature.md](feature.md#giao-diện-elmee-cho-khu-khách). Khi thiết kế thay đổi, ghi giá trị token đã xác minh, layout cần giữ, quy ước typography và component, nguồn tham chiếu, cách áp dụng, điều đã loại và điểm chưa xử lý trong tài liệu hiện có. Cách chạy kiểm tra trực quan nằm trong [setup.md](setup.md#sử-dụng-designer-agent).
