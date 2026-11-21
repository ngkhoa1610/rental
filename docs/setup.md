# SETUP — bắt đầu từ số 0 đến khi chạy cửa hàng

Tài liệu này dành cho người nhận bàn giao chưa biết dự án. Bạn có thể xem giao diện mẫu ngay mà không có database. Để nhận đơn thật, cần thêm PostgreSQL, cấu hình đăng nhập, dữ liệu sản phẩm và chính sách giá được cửa hàng duyệt. Staff xác nhận và cập nhật đơn; thanh toán nằm ngoài ứng dụng.

## 1. Hiểu 4 thứ trước khi bắt đầu

| Thuật ngữ                              | Hiểu đơn giản                          | Trong dự án này                                                                               |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Source code                            | Các file tạo nên website               | Thư mục chứa `package.json`, `src/`, `prisma/`, `docs/`                                       |
| Terminal                               | Cửa sổ gõ lệnh                         | Mở tại **thư mục gốc** nói trên, không mở tại `docs/`                                         |
| Environment variable (biến môi trường) | Giá trị cài đặt riêng cho mỗi nơi chạy | Bản mẫu ở `.env.example`; máy của bạn dùng `.env`; server thật dùng secret của nơi triển khai |
| Database (DB)                          | Nơi giữ sản phẩm, tài khoản, đơn       | PostgreSQL, chỉ dùng ở chế độ `http`                                                          |

**Hai chế độ:** `mock` là dữ liệu minh họa nằm trong ứng dụng/trình duyệt; `http` gọi API thật, đọc/ghi PostgreSQL. Khi chuyển sang `http`, dữ liệu demo **không chuyển** sang DB. Chế độ `http` cũng không âm thầm quay về `mock` khi có lỗi.

**Bạn cần chuẩn bị:** máy có Node.js **22.18 trở lên**, npm và chương trình sửa văn bản thuần (VS Code, Notepad…). Có thể kiểm tra bằng `node --version` và `npm --version`. Với chế độ thật, cần người có quyền tạo PostgreSQL và có quyền cấu hình nơi triển khai.

## 2. Chạy bản mẫu — chưa cần DB hay tài khoản đăng nhập thật

1. Giải nén source; mở Terminal trong thư mục gốc, nơi có `package.json`.
2. Chạy các lệnh sau theo thứ tự:

   ```bash
   npm ci
   npm run db:validate
   npm run dev
   ```

3. Mở `http://localhost:3000`. Dừng server bằng `Ctrl+C`.

`npm ci` cài đúng thư viện theo `package-lock.json` và tạo Prisma Client. `db:validate` chỉ kiểm tra **định nghĩa schema**, không xác nhận DB đã kết nối. Nếu chưa tạo `.env`, code mặc định chọn `mock`; có thể tạo `.env` ở bước 3 cho rõ ràng.

Đây là bản diễn thử: sản phẩm/ảnh/giá chỉ để minh họa. Đơn và hồ sơ mock ở bộ nhớ của tab, có thể mất khi tải lại trang; wishlist/giỏ là lựa chọn lưu trên thiết bị, **không** giữ kho và không tạo đơn trong DB. Không dùng bản này để tiếp nhận đơn thật.

## 3. Tìm biến môi trường ở đâu, sửa ở đâu?

File `.env.example` ngay cạnh `package.json` là **mẫu danh sách**; không chứa khóa thật. Hãy sao chép nó thành `.env` trong **cùng thư mục**, rồi sửa phần **sau dấu `=`** của từng dòng. Ví dụ:

```text
NEXT_PUBLIC_RENTAL_API_MODE=mock
DATABASE_URL=
```

Trên macOS/Linux: `cp .env.example .env`. Trên Windows Command Prompt: `copy .env.example .env`. Có thể sao chép bằng File Explorer/Finder và đặt tên `.env`. Nếu không thấy file bắt đầu bằng dấu chấm, bật hiển thị file ẩn. Không thêm dấu `< >` quanh giá trị thật. Không gửi `.env`, mật khẩu, URL DB hay secret qua email/chat hoặc đưa vào ZIP/Git. `.env.example` chỉ là bản chỉ dẫn; sửa nó **không** thay cấu hình đang chạy.

**Chỗ đọc thêm để tự kiểm:** tìm `process.env` trong `src/`, `prisma.config.ts` và `scripts/`; bảng ở mục 7 bao gồm cả biến có trong code nhưng chưa có trong `.env.example`. Trên hosting, điền cùng tên biến ở trang **Environment Variables/Secrets** của dịch vụ đó; chỉnh `.env` trên máy chỉ ảnh hưởng máy của bạn. Sau khi đổi biến, dừng/chạy lại `npm run dev`; với production phải **build và triển khai lại**. Biến `NEXT_PUBLIC_` nằm trong mã gửi xuống trình duyệt, tuyệt đối không đặt secret vào đó.

> **Lưu ý Prisma:** `prisma.config.ts` nạp `dotenv/config` từ `.env`. Nếu chỉ tạo `.env.local`, các lệnh `npm run db:migrate` và `npm run db:validate` không tự lấy `DATABASE_URL` từ file đó. Hướng dẫn này dùng `.env` cho cả ứng dụng và Prisma; hosting có thể cấp biến trực tiếp cho process.

## 4. Dữ liệu demo đang ở đâu? Thay gì khi muốn dùng thật?

| Vị trí                                                                       | Có gì                                                           | Đổi thì xảy ra gì                                                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/lib/catalog.ts`                                                         | Ba sản phẩm mẫu, giá, mô tả, ảnh                                | Đổi catalog mock; **không** thêm hàng vào PostgreSQL. Cần build/chạy lại để thấy thay đổi.    |
| `public/images/`                                                             | Ảnh mẫu dùng trong giao diện                                    | Thay file/đường dẫn làm đổi ảnh hiển thị; không đổi giá, tồn kho hay đơn.                     |
| `src/lib/api/mock.ts`                                                        | Người dùng demo, kho/quote/đơn và thao tác giả lập trong bộ nhớ | Chỉ thay hành vi demo, dữ liệu không bền. Không chỉnh để khai báo chính sách kinh doanh thật. |
| `src/components/store/api-provider.tsx` và `src/server/rental/storefront.ts` | Chọn adapter mock/HTTP và nguồn catalog server                  | Đổi `NEXT_PUBLIC_RENTAL_API_MODE` để chọn; chế độ HTTP lấy sản phẩm **published** trong DB.   |
| `src/lib/rental-selection.ts`, `src/components/store/selection-provider.tsx` | Wishlist/giỏ ở `localStorage` của trình duyệt                   | Xóa dữ liệu trình duyệt làm mất lựa chọn trên thiết bị; DB/đơn thật không bị xóa.             |
| `src/lib/store-details.ts`                                                   | Số điện thoại, Zalo/Facebook công khai                          | Ban đầu rỗng; điền thông tin shop đã xác nhận rồi build lại.                                  |

Không có script seed catalog production. Sau khi gắn DB mới, danh sách hàng sẽ trống cho đến khi quản trị viên có quyền tạo sản phẩm và **publish**. Đừng sao chép người dùng, giá, ảnh hay tồn kho demo thành dữ liệu thật mà chưa được shop xác nhận.

## 5. Gắn PostgreSQL thật — từng bước

**Quyết định trước:** dùng một DB phát triển riêng để thử. Với DB đang có dữ liệu, người vận hành cần backup và kế hoạch migration trước khi chạy lệnh. Không trỏ bản thử vào DB production. Có thể chạy PostgreSQL trên máy hoặc thuê dịch vụ PostgreSQL; lấy từ người quản trị DB: host, port, tên database, username, password, yêu cầu SSL/TLS, quyền chạy migration và bản sao lưu.

1. Tạo DB rỗng trên PostgreSQL theo hướng dẫn của nhà cung cấp. Xác nhận bạn đã chọn đúng môi trường (dev/staging/production).
2. Trong `.env`, điền URL do nhà cung cấp cấp và chọn chế độ `http`:

   ```dotenv
   NEXT_PUBLIC_RENTAL_API_MODE=http
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
   APP_ORIGIN=http://localhost:3000
   AUTH_SECRET=THAY_BANG_SECRET_NGAU_NHIEN_DU_MANH
   ```

   Dòng URL là **mẫu cú pháp**, không phải tài khoản dùng được. Nếu password có ký tự đặc biệt như `@`, `:`, `/`, hãy URL-encode theo hướng dẫn provider. Nếu provider yêu cầu SSL, dùng đúng tham số kết nối họ cung cấp; không đoán rồi tắt SSL. `APP_ORIGIN` trong production phải là URL HTTPS thật, không có `/` cuối. Tạo `AUTH_SECRET` ngẫu nhiên đủ mạnh bằng công cụ quản lý secret của hosting; đừng dùng chuỗi mẫu trên.

3. Cài thư viện bằng `npm ci` nếu chưa làm. Chạy `npm run db:validate` để kiểm schema; lệnh này **không kiểm tra kết nối**.
4. **Kiểm tra lại `DATABASE_URL` đang trỏ đúng DB** và đã có backup nếu DB không rỗng. Chạy `npm run db:migrate`. Lệnh này kết nối DB và áp dụng migration trong `prisma/migrations/`, tức là có thể thay đổi schema/dữ liệu DB đích. Không dùng `db push` để lách migration.
5. Cấu hình đăng nhập ở mục 6, chính sách giá ở mục 7. Tạo và công khai sản phẩm thật từ admin. Khởi động lại `npm run dev` hoặc chạy `npm run build` rồi `npm run start` để dùng bản production.
6. Kiểm tra danh sách sản phẩm, đăng nhập theo hai vai trò, lịch trống, gửi yêu cầu và quản trị đơn.

Nếu `DATABASE_URL` đổi sang DB khác, ứng dụng nhìn thấy dữ liệu ở DB mới; DB cũ không bị xóa bởi thao tác đổi URL. Nếu thiếu URL hoặc DB không vào được, tính năng HTTP/Auth lỗi; không có fallback sang mock. Nếu schema chưa migrate, API cũng không làm việc đúng. DB rỗng sau migration vẫn chưa có catalog, account owner hay chính sách cửa hàng.

## 6. Cấu hình đăng nhập và cấp tài khoản quản trị

Khách mở `/account` để đăng ký bằng tên, email và mật khẩu, rồi đăng nhập bằng email và mật khẩu. Quản trị đăng nhập ở `/admin/login` bằng tài khoản được cấp qua CLI. Hai khu có cookie và phiên riêng.

1. Xác nhận đã cấu hình `DATABASE_URL`, `AUTH_SECRET`, `APP_ORIGIN` và đã chạy migration theo mục 5.
2. Từ Terminal tương tác, tạo owner đầu tiên bằng email riêng của quản trị:

   ```sh
   npm run staff:provision -- --email owner@example.com --name "Tên quản trị" --role owner
   ```

   Công cụ nhắc nhập rồi xác nhận mật khẩu với phần nhập được ẩn. Owner chỉ tạo một lần. Tạo nhân viên bằng `--role staff` và `--permissions` chứa danh sách quyền ngăn cách bằng dấu phẩy, ví dụ `orders:manage,availability:manage`. Dùng email mới, chưa có trong hệ thống.

3. Mở `/admin/login` để kiểm tra tài khoản quản trị, rồi quản lý quyền staff từ `/admin/team` nếu tài khoản được cấp quyền.

Môi trường triển khai sử dụng HTTPS. Sau khi đổi domain hoặc secret, khởi động lại và UAT đăng nhập, đăng xuất và thao tác ghi ở cả hai khu.

## 7. Danh sách biến môi trường và hậu quả khi đổi

**Bắt buộc theo nhu cầu:** để xem mock, không phải điền DB hoặc secret xác thực. Để tạo quote/đơn thật ở HTTP, cần DB, cấu hình đăng nhập và chính sách giá đã phê duyệt. Mọi secret chỉ để ở `.env`/secrets server.

| Biến                          | Lấy/điền ở đâu                                                        | Nếu thiếu hoặc đổi                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_RENTAL_API_MODE` | `.env`: `mock` hoặc `http`; mặc định mock                             | Đổi nguồn dữ liệu và cần restart/rebuild, nhất là vì được đưa vào bundle trình duyệt. Giá trị khác bị từ chối. Không di chuyển dữ liệu giữa hai nguồn. |
| `DATABASE_URL`                | URL PostgreSQL do người quản trị DB/provider cấp                      | HTTP/Auth cần DB. Đổi URL là trỏ sang dữ liệu khác; DB cũ vẫn còn. Migration tác động **DB đang trỏ tới**.                                             |
| `AUTH_SECRET`                 | Secret ngẫu nhiên của operator/hosting                                | Thiếu thì đăng nhập không chạy; đổi có thể làm người dùng phải đăng nhập lại, không xóa DB.                                                            |
| `APP_ORIGIN`                  | URL chính xác của site, ví dụ `https://shop.example`, không `/` cuối  | Sai host/protocol làm xác thực và mutation lỗi. Production dùng HTTPS.                                                                                 |
| `RENTAL_PRICING_MODE`         | Chỉ đặt `per-block` sau khi shop duyệt cách tính                      | Thiếu/sai: quote HTTP bị chặn `POLICY_REQUIRED`; không tự dùng giá mock.                                                                               |
| `RENTAL_PRICING_VERSION`      | Tên phiên bản chính sách do shop đặt, ví dụ `2026-10-approved`        | Thiếu: quote bị chặn. Đổi nhãn policy có thể khiến quote cũ phải báo lại; đơn đã tạo lưu snapshot của nó.                                              |
| `RENTAL_QUOTE_TTL_SECONDS`    | Tùy chọn, 30–3600; mặc định 300 giây                                  | Giá trị sai phạm vi dùng mặc định. Đổi ảnh hưởng quote mới; quote cũ đã có hạn lưu riêng.                                                              |
| `TRUST_PROXY_IP`              | Mặc định `false`; chỉ operator sau khi cấu hình trusted reverse proxy | Bật sai có thể khiến rate limit tin IP giả trong header. Không cần đổi để chạy local.                                                                  |
| `DATABASE_POOL_SIZE`          | Tùy chọn, server; code giới hạn tối đa 10, `1` cho trường hợp test    | Đổi số kết nối/hiệu năng và giới hạn của provider, không đổi dữ liệu.                                                                                  |
| `RENTAL_BUILD_DIR`            | Tùy chọn, thư mục output Next thay `.next`                            | Đổi nơi chứa build; build/start cần cùng cấu hình, không đổi DB.                                                                                       |
| `NODE_ENV`                    | Next/npm thường tự đặt theo dev/production                            | Ảnh hưởng cookie bảo mật và kiểm HTTPS; không đặt `production` giả khi chạy HTTP local.                                                                |

**Giá thật:** `src/server/rental/pricing.ts` tính số block bằng cách làm tròn lên số ngày thuê (tính cả ngày nhận/trả) chia `Product.rentalDays`, rồi nhân `Product.price` và số lượng. Owner cần duyệt đơn giá, độ dài block, cọc, giao nhận trước khi vận hành; đặt `per-block` và version không tự tạo mức cọc hay phí ship. Sản phẩm mới thường ở trạng thái draft; chỉ published xuất hiện ở catalog HTTP.

**Biến dành cho test, không phải cấu hình shop:** `RENTAL_TEST_DB_ENGINE`, `POSTGRES_BIN_DIR`, `RENTAL_TEST_DATABASE_URL`, `RENTAL_QA_ORIGIN`, `RENTAL_QA_OUTPUT`, `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`. Đừng trỏ integration test vào DB chứa dữ liệu khách.

## 8. Link, dịch vụ và thông tin liên hệ

| Địa chỉ/dịch vụ                                                  | Dùng để làm gì                                        | Ai cần cấu hình?                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `http://localhost:3000`                                          | Site trên máy khi chạy dev                            | Không cần mua domain; production đổi sang HTTPS domain thật qua `APP_ORIGIN`/hosting.                                                                                                            |
| `/`, `/products`, `/availability`, `/cart`                       | Tìm đồ/lịch và chuẩn bị thuê                          | Khách; catalog thật cần sản phẩm published trong DB.                                                                                                                                             |
| `/account`, `/account/orders`                                    | Hồ sơ và toàn bộ đơn của khách                        | Email, mật khẩu và DB trong HTTP.                                                                                                                                                                |
| `/admin/login`, `/admin/*`                                       | Quản trị đơn, sản phẩm, kho, khách, đánh giá, nhân sự | Email, mật khẩu và StaffProfile có quyền. Không đưa link này vào navigation của khách.                                                                                                           |
| `/api/auth/register`, `/api/auth/login`, `/api/admin/auth/login` | Endpoint đăng ký khách và đăng nhập của hai scope     | Tài khoản admin do người vận hành cấp qua CLI.                                                                                                                                                   |
| `/api/v1/*`, `/media/[id]`                                       | API nghiệp vụ, ảnh do hệ thống phục vụ                | App cùng origin; server kiểm session/quyền/Origin.                                                                                                                                               |
| `src/lib/store-details.ts`                                       | Zalo, Facebook, hotline **công khai**                 | Shop xác minh thông tin rồi developer điền và deploy. Zalo phải `https://zalo.me/...`; Facebook dùng `facebook.com`, `www.facebook.com` hoặc `m.me`; số điện thoại 8–15 chữ số, có thể thêm `+`. |

Staff tự kiểm tra và thỏa thuận thanh toán ngoài app rồi cập nhật trạng thái đơn. App không hiển thị hướng dẫn chuyển khoản, không ghi thu/hoàn tiền và không xác nhận tiền. Không có SMS/Zalo API, payment gateway, object storage hay push realtime được cấu hình sẵn.

## 9. Những file cấu hình khác: sửa thì mất/đổi gì?

| File                                                              | Chứa gì                                       | Tác động khi sửa                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `.env.example`                                                    | Tên biến mẫu, không có secret                 | Chỉ đổi bản mẫu, không tự cập nhật `.env`/hosting.                                               |
| `.env` (tự tạo)                                                   | Giá trị cho máy này, không commit             | Sửa ảnh hưởng môi trường local sau restart; xóa nó mất cấu hình local, **không** xóa DB.         |
| `package.json`, `package-lock.json`                               | Lệnh chạy và phiên bản thư viện               | Cài lại bằng `npm ci`, build/test; lockfile và package cần khớp.                                 |
| `prisma/schema.prisma`, `prisma/migrations/*`, `prisma.config.ts` | Model DB, lịch sử migration, cách lấy URL     | Thay model cần migration/review/backup; sửa migration đã áp dụng có thể làm các môi trường lệch. |
| `next.config.ts`                                                  | Build output, security headers, cấu hình Next | Build lại; sửa sai có thể ảnh hưởng ảnh, browser hoặc bảo mật.                                   |
| `tsconfig.json`                                                   | Kiểm TypeScript, alias import                 | Sai gây lỗi compile; không xóa DB.                                                               |
| `postcss.config.mjs`, `components.json`, `src/app/globals.css`    | Style, Tailwind, token màu nền trắng/sakura   | Có thể đổi giao diện nhiều trang; build/kiểm desktop và mobile lại.                              |
| `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`        | Quy tắc code/format                           | Đổi tiêu chí kiểm code, không tự đổi đơn/DB.                                                     |
| `.gitignore`                                                      | File không đưa vào Git                        | Sửa sai có thể làm lộ `.env`/file build; kiểm kỹ trước commit/ZIP.                               |
| `src/lib/store-details.ts`                                        | Kênh liên lạc công khai                       | Đổi thông tin khách nhìn thấy sau build/deploy.                                                  |

## 10. Kiểm tra trước khi bàn giao/chạy thật

- **Mock:** `npm run dev`, mở trang chủ/PDP, thử lọc lịch và xem layout desktop/mobile. Reload tab để hiểu giới hạn demo.
- **DB:** kiểm đúng `DATABASE_URL`; `npm run db:validate` chỉ kiểm schema, `npm run db:migrate` mới kết nối và sửa DB. Xác nhận migration và sản phẩm published thật.
- **Auth/phân quyền:** thử khách đăng nhập và xem đơn của mình; thử admin có quyền và người không có quyền; kiểm customer UI không hiện lối vào admin.
- **Flow đơn:** thử ngày trống/kín, quote/giá đã duyệt, gửi yêu cầu, mã đơn và trạng thái chờ staff xác nhận.
- **Gate code:** `npm run check` chạy validate, format, lint, test, test server, build, smoke và audit; `npm run test:integration` dùng DB test cô lập khi có hạ tầng test. Kiểm thêm đăng ký, đăng nhập, DB và browser thật của môi trường triển khai.

Khi thay secret/domain/DB hoặc giá, cần kiểm lại những flow tương ứng; không suy từ việc trang chủ mở được rằng admin/đơn hoạt động. Bản source đã bàn giao trước đó có ghi nhận build/audit/integration còn bị chặn bởi môi trường cài dependency; các kết quả lịch sử **không** thay cho lần test mới với `npm ci` đúng lockfile. Không chạy `db:maintenance` trên production nếu chưa đọc `scripts/db-maintenance.ts` và thống nhất vận hành.

## 11. Lỗi thường gặp

| Biểu hiện                                 | Kiểm ngay                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm ci` lỗi                              | Phiên bản Node >=22.18, mạng/registry và đúng thư mục có `package-lock.json`.                |
| `db:validate` qua nhưng app không thấy DB | Lệnh validate không kiểm kết nối; kiểm `.env`, URL, quyền, SSL và `db:migrate` trên DB đúng. |
| Đổi sang HTTP mà catalog rỗng             | DB mới chưa có sản phẩm **published**; ba món demo không tự import.                          |
| Báo `POLICY_REQUIRED`/503                 | `AUTH_SECRET`, `APP_ORIGIN`, `DATABASE_URL` và đã khởi động lại ứng dụng.                    |
| Không tạo được quote                      | `RENTAL_PRICING_MODE=per-block`, version, giá và số ngày block của sản phẩm thật; lịch kho.  |
| Nút liên hệ Zalo không mở                 | `src/lib/store-details.ts` còn rỗng/URL sai host; đã build/deploy lại chưa.                  |
| Vừa đổi `.env` mà trang vẫn như cũ        | Dừng/chạy lại dev; ở production rebuild/deploy, nhất là `NEXT_PUBLIC_RENTAL_API_MODE`.       |

Nếu cần biết một tính năng lưu gì và file nào xử lý, xem tiếp `docs/feature.md`; để hình dung cấu trúc folder, xem `docs/structure.md`.

Mock wardrobe: danh mục có 12 mẫu minh họa, chia 6 món mỗi trang để xem bố cục và tương tác. Không nhập các mẫu này vào DB; ở chế độ HTTP chỉ sản phẩm đã published từ DB mới hiển thị.

## Kiểm tra refactor phần tồn

Chạy `npm run test:server` để kiểm tra contract truy vấn và `npm run test:integration` với `RENTAL_TEST_DB_ENGINE=pglite` để kiểm thử trên fixture cô lập. Sau build, chạy `npm run test:smoke` ở chế độ mock. Trên desktop và mobile, tra lịch và gửi đơn mẫu, sau đó thử cập nhật một đơn mẫu bằng phiên admin riêng.

## Checkpoint Git theo mốc

Với thay đổi workflow Codex, kiểm tra bằng `node --test tests/agent-protocol.test.mjs tests/codex-config.test.mjs`. UAT: cả sửa một file và thay đổi liên tầng đều được phân công triển khai, kiểm thử độc lập và review. Tác vụ chỉ đọc được giao trực tiếp cho vai trò kiểm tra hoặc review phù hợp. Khi host thiếu khả năng phân vai, ghi BLOCKED cho bước tương ứng và tiếp tục các bước còn phân công được.

**Quy tắc giới hạn:** tạo commit cục bộ sau khi hoàn thành và kiểm tra một tính năng, bản sửa lỗi hoặc refactor có phạm vi rõ ràng. Chọn đúng file hoặc hunk của mốc. Kiểm tra dữ liệu staged để chặn file chứa credential và các mẫu secret nhận diện được.

**UAT:** với repo Git thử nghiệm, commit thay đổi nguồn sạch thành công. Hook phải từ chối file credential bị force-add và secret nhận diện được trong blob staged, kể cả khi bản làm việc đã được sửa sạch. Thông báo chỉ nêu đường dẫn và loại vi phạm.

Trên mỗi checkout, chạy `git config --local core.hooksPath .githooks` để bật kiểm tra cho các lệnh `git commit` thông thường. Nếu cài từ source rời trên macOS/Linux, chạy `chmod +x .githooks/pre-commit`. Khi đưa hook lên Git lần đầu, dùng `git add --chmod=+x -- .githooks/pre-commit` để lưu quyền thực thi vào Git.

Khi tới một mốc, stage đúng file hoặc hunk, kiểm tra `git diff --cached --stat` và xem nội dung thay đổi, rồi chạy:

```sh
node scripts/check-staged-secrets.mjs
git -c core.hooksPath=.githooks commit -m "checkpoint: mô tả mốc"
```

Nếu bị chặn, gỡ phần vi phạm khỏi stage hoặc thay dữ liệu nhạy cảm bằng biến môi trường trước khi thử lại. Biến chứa thông tin xác thực trong `.env.example` phải để trống. Kiểm tra tự động nhận diện các định dạng phổ biến và chỉ đọc blob được stage cho commit hiện tại. Vẫn cần rà diff để phát hiện secret có định dạng riêng hoặc nằm trong dữ liệu nhị phân.

## Chạy thử Admin Mốc 1

Trong mock, mở `/admin/login`, dùng tài khoản quản trị mẫu và nạp dữ liệu mẫu trong mục prototype. Kiểm tra bốn màn `/admin`, `/admin/orders`, `/admin/products`, `/admin/availability`. Tạo sản phẩm mock bằng ảnh mẫu có sẵn, còn HTTP tải ảnh JPEG/PNG/WebP qua endpoint Admin hiện có. Đổi trạng thái công khai, tạo/sửa/gỡ khóa và so sánh lịch trước/sau ở kích thước 1440px và 390px. Dùng fixture PostgreSQL cô lập khi kiểm tra HTTP, quyền và xung đột tồn.

Nguồn thiết kế trong đợt này: [Mobbin — Dashboard Design](https://mobbin.com/blog/what-good-dashboard-design-looks-like), [Booqable — Dashboard](https://help.booqable.com/en/articles/5603615-how-to-use-the-dashboard), [Shopify — Lọc đơn](https://help.shopify.com/en/manual/fulfillment/managing-orders/viewing-orders), [Square — Quản lý sản phẩm](https://squareup.com/help/us/en/article/8335-create-and-edit-items), [Carbon — Data table](https://v10.carbondesignsystem.com/components/data-table/usage/) và [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- Tham chiếu thứ tự ưu tiên của hàng việc và cách chuyển từ tổng quan sang tác vụ tại [Mobbin — Dashboard Design](https://mobbin.com/blog/what-good-dashboard-design-looks-like).
- Tham chiếu điều hướng, bộ lọc và biểu mẫu tạo/sửa cho Đơn thuê, Sản phẩm và Lịch kho tại [Mobbin — Web Internal Tools](https://mobbin.com/explore/web/screens/internal-tool).
- Tham chiếu cách nhóm biểu mẫu sản phẩm với phần xem trước ảnh trên desktop. Kiểm tra các nhóm nội dung đọc theo thứ tự khi xếp dọc trên mobile. [Mobbin — Web Multi-Column Layout](https://mobbin.com/explore/web/screens/multi-column-layout)

## Chạy thử Admin Mốc 2

Chạy mock, nạp dữ liệu mẫu và lần lượt mở `/admin/products`, `/admin/customers`, `/admin/reviews` và `/admin/team`. Dùng ảnh mẫu để tạo album và kiểm lại sau khi mở form lần nữa. Dùng phiếu thuê và tài khoản nhân sự mẫu để kiểm trạng thái, bộ lọc và phân quyền trên desktop và mobile. Chạy `node --import tsx --test tests/admin-ui.test.jsx tests/admin-m1.test.jsx tests/admin-boundary.test.jsx`. Kiểm tra upload và lưu album HTTP với PostgreSQL cô lập.
