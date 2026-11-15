# Structure — bản đồ dự án Rental Store

Cập nhật 04/10/2026. Đây là website thuê quần áo/phụ kiện gồm khu khách và khu quản trị. Hãy bắt đầu ở `src/app` để tìm trang, `src/components` để tìm giao diện, `src/lib` để tìm quy tắc dùng chung, `src/server` để tìm xử lý có database, rồi `prisma` để xem dữ liệu được lưu ra sao. Nếu chỉ sửa chữ/hình trên trang, thường không cần sửa database.

## Một yêu cầu đi qua đâu?

1. Người dùng mở URL. Next.js chọn `page.tsx` tương ứng trong `src/app`.
2. Trang ghép các component. Component gọi API qua `src/components/store/api-provider.tsx` và contract trong `src/lib/api`.
3. Ở chế độ `mock`, API dùng dữ liệu minh họa trong bộ nhớ tab. Ở chế độ `http`, request đi vào `src/app/api`, qua xác thực/kiểm tra request ở `src/server/http`, nghiệp vụ ở `src/server/rental`, rồi tới PostgreSQL qua Prisma.
4. Kết quả trả về giao diện. Thao tác lưu/xử lý chỉ báo thành công sau khi server hoàn tất.

Khu khách ở `src/app/(store)` (dấu ngoặc là nhóm thư mục, **không** xuất hiện trong URL). Khu quản trị ở `src/app/admin`; `/api/auth` và `/api/admin/auth` có phiên/cookie riêng. Không có link hoặc thông tin quản trị trong menu khách. Quyền nhân viên được đọc từ database, không lấy từ form hoặc nhà cung cấp đăng nhập.

## Vai trò thư mục và file gốc

| Vị trí                                                                                                                           | Chứa gì                                                                                                                                    | Khi nào cần mở?                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `src/app/(store)/`                                                                                                               | Trang công khai, sản phẩm, lịch trống, giỏ, tài khoản; CSS theo trang                                                                      | Đổi bố cục hoặc thêm trang khách.                                                |
| `src/app/admin/`                                                                                                                 | Dashboard và trang đơn, sản phẩm, lịch khóa, khách, đánh giá, nhân viên; CSS admin                                                         | Đổi giao diện vận hành.                                                          |
| `src/app/api/` và `src/app/media/`                                                                                               | Cửa vào HTTP, Auth.js, upload/đọc ảnh                                                                                                      | Đổi tuyến API hoặc quyền truy cập file.                                          |
| `src/components/store/`                                                                                                          | Các khối giao diện khách: lịch, đặt thuê, tài khoản, danh mục, feedback, thông báo                                                         | Đổi cách khách thao tác.                                                         |
| `src/components/admin/`                                                                                                          | Giao diện quản trị và bảng dữ liệu                                                                                                         | Đổi form/bảng của nhân viên.                                                     |
| `src/components/layout/`, `src/components/ui/`                                                                                   | Header/footer và thành phần UI dùng lại                                                                                                    | Đổi phần chung, có thể ảnh hưởng nhiều trang.                                    |
| `src/lib/`                                                                                                                       | Quy tắc ngày thuê, giỏ/yêu thích, catalog mẫu, ngôn ngữ, thông tin liên hệ, API contract/mock/HTTP                                         | Đổi quy tắc dùng ở nhiều nơi. `catalog.ts` là dữ liệu mẫu, không phải kho thật.  |
| `src/server/auth/`                                                                                                               | Auth.js, OIDC, phiên customer/admin, quyền                                                                                                 | Đổi cách đăng nhập hoặc phân quyền.                                              |
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
- Trang có dữ liệu ví dụ trong mock. HTTP không tự rơi về mock khi lỗi. OIDC và giá thuê thực cần cấu hình trước vận hành; thanh toán thỏa thuận ngoài app.

## Quy tắc sửa an toàn

Trước code: xác định use case, file sở hữu và UAT mong đợi; không tự đặt giá/cọc/phí/quy định. Sau code: format, lint, test, build, smoke, security review và kiểm giao diện desktop/mobile liên quan. Nếu thiếu môi trường, ghi `BLOCKED`, không coi test cũ là kết quả mới. Mỗi file đổi cần được giải thích vai trò, có test và bản lưu source mới. Xem `feature.md` cho hành vi, `setup.md` cho cấu hình và lệnh.

- src/lib/catalog.ts giữ danh mục demo cục bộ (12 mẫu) và quy tắc lọc; Catalog phân trang trong component, không đổi URL hay ghi DB. Chỉ dùng dữ liệu này khi chế độ mock.
