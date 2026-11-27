# SETUP — bắt đầu từ số 0 đến khi chạy cửa hàng

Tài liệu này dành cho người nhận bàn giao chưa biết dự án. Bạn có thể xem giao diện mẫu ngay mà không có database. Để nhận đơn thật, cần thêm PostgreSQL, cấu hình đăng nhập, dữ liệu sản phẩm và chính sách giá được cửa hàng duyệt. Staff xác nhận và cập nhật đơn; thanh toán nằm ngoài ứng dụng.

## 1. Hiểu 4 thứ trước khi bắt đầu

| Thuật ngữ                              | Hiểu đơn giản                          | Trong dự án này                                                                               |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Source code                            | Các file tạo nên website               | Thư mục chứa `package.json`, `src/`, `prisma/`, `docs/`                                       |
| Terminal                               | Cửa sổ gõ lệnh                         | Mở tại **thư mục gốc** nói trên, không mở tại `docs/`                                         |
| Environment variable (biến môi trường) | Giá trị cài đặt riêng cho mỗi nơi chạy | Bản mẫu ở `.env.example`; máy của bạn dùng `.env`; server thật dùng secret của nơi triển khai |
| Database (DB)                          | Nơi giữ sản phẩm, tài khoản, đơn       | PostgreSQL cho các trang nghiệp vụ                                                            |

Ứng dụng luôn dùng API và PostgreSQL cho nghiệp vụ. Trang xem trước đọc fixture JSON trực tiếp qua props.

**Bạn cần chuẩn bị:** máy có Node.js **22.18 trở lên**, npm và chương trình sửa văn bản thuần (VS Code, Notepad…). Có thể kiểm tra bằng `node --version` và `npm --version`. Với chế độ thật, cần người có quyền tạo PostgreSQL và có quyền cấu hình nơi triển khai.

## 2. Xem bố cục cục bộ

1. Giải nén source; mở Terminal trong thư mục gốc, nơi có `package.json`.
2. Chạy các lệnh sau theo thứ tự:

   ```bash
   npm ci
   npm run db:validate
   npm run dev
   ```

3. Mở [trang chủ local](http://localhost:3000). Khi chưa đặt `DATABASE_URL`, trang chủ tự chuyển sang `/layout-preview`. Bạn cũng có thể mở [trang xem bố cục](http://localhost:3000/layout-preview) trực tiếp. Dừng server bằng `Ctrl+C`.

`npm ci` cài đúng thư viện theo `package-lock.json` và tạo Prisma Client. `db:validate` chỉ kiểm tra **định nghĩa schema**, không xác nhận DB đã kết nối.

Trang xem trước dùng ảnh và dữ liệu minh họa. Trang nghiệp vụ đọc dữ liệu từ PostgreSQL đã cấu hình.

## 3. Tìm biến môi trường ở đâu, sửa ở đâu?

File `.env.example` ngay cạnh `package.json` là **mẫu danh sách**; không chứa khóa thật. Hãy sao chép nó thành `.env` trong **cùng thư mục**, rồi sửa phần **sau dấu `=`** của từng dòng. Ví dụ:

```text
DATABASE_URL=
```

Trên macOS/Linux: `cp .env.example .env`. Trên Windows Command Prompt: `copy .env.example .env`. Có thể sao chép bằng File Explorer/Finder và đặt tên `.env`. Nếu không thấy file bắt đầu bằng dấu chấm, bật hiển thị file ẩn. Không thêm dấu `< >` quanh giá trị thật. Không gửi `.env`, mật khẩu, URL DB hay secret qua email/chat hoặc đưa vào ZIP/Git. `.env.example` chỉ là bản chỉ dẫn; sửa nó **không** thay cấu hình đang chạy.

**Chỗ đọc thêm để tự kiểm:** tìm `process.env` trong `src/`, `prisma.config.ts` và `scripts/`; bảng ở mục 7 bao gồm cả biến có trong code nhưng chưa có trong `.env.example`. Trên hosting, điền cùng tên biến ở trang **Environment Variables/Secrets** của dịch vụ đó; chỉnh `.env` trên máy chỉ ảnh hưởng máy của bạn. Sau khi đổi biến, dừng/chạy lại `npm run dev`; với production phải **build và triển khai lại**. Biến `NEXT_PUBLIC_` nằm trong mã gửi xuống trình duyệt, tuyệt đối không đặt secret vào đó.

> **Lưu ý Prisma:** `prisma.config.ts` nạp `dotenv/config` từ `.env`. Nếu chỉ tạo `.env.local`, các lệnh `npm run db:migrate` và `npm run db:validate` không tự lấy `DATABASE_URL` từ file đó. Hướng dẫn này dùng `.env` cho cả ứng dụng và Prisma; hosting có thể cấp biến trực tiếp cho process.

## 4. Sửa dữ liệu xem bố cục

Chỉnh `src/components/layout-preview/fixtures.json` để thêm dữ liệu hiển thị trên trang xem trước. Dữ liệu nghiệp vụ chỉ xuất hiện sau khi có bản ghi tương ứng trong PostgreSQL.

## 5. Gắn PostgreSQL thật — từng bước

**Quyết định trước:** dùng một DB phát triển riêng để thử. Với DB đang có dữ liệu, người vận hành cần backup và kế hoạch migration trước khi chạy lệnh. Không trỏ bản thử vào DB production. Có thể chạy PostgreSQL trên máy hoặc thuê dịch vụ PostgreSQL; lấy từ người quản trị DB: host, port, tên database, username, password, yêu cầu SSL/TLS, quyền chạy migration và bản sao lưu.

1. Tạo DB rỗng trên PostgreSQL theo hướng dẫn của nhà cung cấp. Xác nhận bạn đã chọn đúng môi trường (dev/staging/production).
2. Trong `.env`, điền URL do người quản trị DB cấp:

   ```dotenv
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
   APP_ORIGIN=http://localhost:3000
   AUTH_SECRET=THAY_BANG_SECRET_NGAU_NHIEN_DU_MANH
   ```

   Dòng URL là **mẫu cú pháp**, không phải tài khoản dùng được. Nếu password có ký tự đặc biệt như `@`, `:`, `/`, hãy URL-encode theo hướng dẫn provider. Nếu provider yêu cầu SSL, dùng đúng tham số kết nối họ cung cấp; không đoán rồi tắt SSL. `APP_ORIGIN` trong production phải là URL HTTPS thật, không có `/` cuối. Tạo `AUTH_SECRET` ngẫu nhiên đủ mạnh bằng công cụ quản lý secret của hosting; đừng dùng chuỗi mẫu trên.

3. Cài thư viện bằng `npm ci` nếu chưa làm. Chạy `npm run db:validate` để kiểm schema; lệnh này **không kiểm tra kết nối**.
4. **Kiểm tra lại `DATABASE_URL` đang trỏ đúng DB** và đã có backup nếu DB không rỗng. Chạy `npm run db:migrate`. Lệnh này kết nối DB và áp dụng migration trong `prisma/migrations/`, tức là có thể thay đổi schema/dữ liệu DB đích. Không dùng `db push` để lách migration.
5. Cấu hình đăng nhập ở mục 6, chính sách giá ở mục 7. Tạo và công khai sản phẩm thật từ admin. Khởi động lại `npm run dev` hoặc chạy `npm run build` rồi `npm run start` để dùng bản production.
6. Kiểm tra danh sách sản phẩm, đăng nhập theo hai vai trò, lịch trống, gửi yêu cầu và quản trị đơn.

Nếu `DATABASE_URL` đổi sang DB khác, ứng dụng nhìn thấy dữ liệu ở DB mới; DB cũ không bị xóa bởi thao tác đổi URL. Nếu thiếu URL hoặc DB không vào được, tính năng HTTP/Auth lỗi. Nếu schema chưa migrate, API cũng không làm việc đúng. DB rỗng sau migration vẫn chưa có catalog, account owner hay chính sách cửa hàng.

## 6. Cấu hình đăng nhập và cấp tài khoản quản trị

### Tài khoản mẫu của kiểm thử tự động

DB phát triển mới sau migration chưa có tài khoản mặc định.

Chuẩn bị bản production build bằng `npm run build` với `RENTAL_BUILD_DIR=.next-http`, Playwright kèm Chromium và DB test dùng `RENTAL_TEST_DB_ENGINE=pglite` hoặc `POSTGRES_BIN_DIR` đã cấu hình. Sau đó chạy `npm run test:integration -- scripts/http-browser-test.mjs` để tạo hai tài khoản dưới đây trong DB cô lập của bài kiểm thử HTTP/trình duyệt.

| Vai trò          | Email                   | ID người dùng   | ID phiên  | Phạm vi phiên |
| ---------------- | ----------------------- | --------------- | --------- | ------------- |
| Khách            | `customer@test.invalid` | `http-customer` | `http-cs` | `customer`    |
| Chủ shop (Admin) | `admin@test.invalid`    | `http-admin`    | `http-as` | `admin`       |

Script cấp phiên tạm thời trực tiếp cho kiểm thử HTTP và trình duyệt. Hai bản ghi mẫu không có mật khẩu để đăng nhập bằng biểu mẫu. Để thử đăng nhập thủ công, hãy tạo tài khoản riêng trên DB phát triển theo hướng dẫn dưới đây.

### Tạo tài khoản để kiểm thử thủ công

Khách mở `/account` để đăng ký bằng tên, email mới và mật khẩu tự đặt, rồi đăng nhập bằng email đó. Thử quyền khách với tài khoản vừa đăng ký. Quản trị đăng nhập ở `/admin/login` bằng tài khoản được cấp qua CLI. Hai khu có cookie và phiên riêng.

1. Xác nhận đã cấu hình `DATABASE_URL`, `AUTH_SECRET`, `APP_ORIGIN` và đã chạy migration theo mục 5.
2. Từ Terminal tương tác, tạo owner đầu tiên bằng email riêng của quản trị:

   ```sh
   npm run staff:provision -- --email owner@example.com --name "Tên quản trị" --role owner
   ```

   Công cụ nhắc nhập rồi xác nhận mật khẩu với phần nhập được ẩn. Owner chỉ tạo một lần. Tạo nhân viên bằng `--role staff` và `--permissions` chứa danh sách quyền ngăn cách bằng dấu phẩy, ví dụ `orders:manage,availability:manage`. Dùng email mới, chưa có trong hệ thống.

3. Mở `/admin/login` để kiểm tra tài khoản quản trị, rồi quản lý quyền staff từ `/admin/team` nếu tài khoản được cấp quyền.

Môi trường triển khai sử dụng HTTPS. Sau khi đổi domain hoặc secret, khởi động lại và UAT đăng nhập, đăng xuất và thao tác ghi ở cả hai khu.

### Đăng nhập mô phỏng để xem bố cục

Mở `/layout-preview` khi chạy `npm run dev`. Danh mục và lịch mẫu mở sẵn. Dùng một cặp thông tin công khai sau để xem khối mẫu theo vai trò.

| Vai trò mẫu | Email                      | Mật khẩu mô phỏng |
| ----------- | -------------------------- | ----------------- |
| Khách       | `customer@preview.invalid` | `demo-khach-2026` |
| Admin       | `admin@preview.invalid`    | `demo-admin-2026` |

Các cặp này chỉ dùng trong form mô phỏng trên `/layout-preview`. Đăng xuất hoặc tải lại trang sẽ xóa lựa chọn vai trò. Đăng nhập thủ công vào `/account` hoặc `/admin/login` dùng tài khoản đã tạo trên DB phát triển theo hướng dẫn ở trên.

## 7. Danh sách biến môi trường và hậu quả khi đổi

Trang xem trước chạy mà không cần DB hoặc secret. Tạo đơn cần PostgreSQL, cấu hình xác thực và chính sách giá đã phê duyệt.

| Biến                       | Lấy/điền ở đâu                                                        | Nếu thiếu hoặc đổi                                                                                         |
| -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | URL PostgreSQL do người quản trị DB/provider cấp                      | HTTP/Auth cần DB. Đổi URL là trỏ sang dữ liệu khác; DB cũ vẫn còn. Migration tác động **DB đang trỏ tới**. |
| `AUTH_SECRET`              | Secret ngẫu nhiên của operator/hosting                                | Thiếu thì đăng nhập không chạy; đổi có thể làm người dùng phải đăng nhập lại, không xóa DB.                |
| `APP_ORIGIN`               | URL chính xác của site, ví dụ `https://shop.example`, không `/` cuối  | Sai host/protocol làm xác thực và mutation lỗi. Production dùng HTTPS.                                     |
| `RENTAL_PRICING_MODE`      | Chỉ đặt `per-block` sau khi shop duyệt cách tính                      | Thiếu/sai: quote HTTP bị chặn `POLICY_REQUIRED`.                                                           |
| `RENTAL_PRICING_VERSION`   | Tên phiên bản chính sách do shop đặt, ví dụ `2026-10-approved`        | Thiếu: quote bị chặn. Đổi nhãn policy có thể khiến quote cũ phải báo lại; đơn đã tạo lưu snapshot của nó.  |
| `RENTAL_QUOTE_TTL_SECONDS` | Tùy chọn, 30–3600; mặc định 300 giây                                  | Giá trị sai phạm vi dùng mặc định. Đổi ảnh hưởng quote mới; quote cũ đã có hạn lưu riêng.                  |
| `TRUST_PROXY_IP`           | Mặc định `false`; chỉ operator sau khi cấu hình trusted reverse proxy | Bật sai có thể khiến rate limit tin IP giả trong header. Không cần đổi để chạy local.                      |
| `DATABASE_POOL_SIZE`       | Tùy chọn, server; code giới hạn tối đa 10, `1` cho trường hợp test    | Đổi số kết nối/hiệu năng và giới hạn của provider, không đổi dữ liệu.                                      |
| `RENTAL_BUILD_DIR`         | Tùy chọn, thư mục output Next thay `.next`                            | Đổi nơi chứa build; build/start cần cùng cấu hình, không đổi DB.                                           |
| `NODE_ENV`                 | Next/npm thường tự đặt theo dev/production                            | Ảnh hưởng cookie bảo mật và kiểm HTTPS; không đặt `production` giả khi chạy HTTP local.                    |

**Giá thật:** `src/server/rental/pricing.ts` tính số block bằng cách làm tròn lên số ngày thuê (tính cả ngày nhận/trả) chia `Product.rentalDays`, rồi nhân `Product.price` và số lượng. Owner cần duyệt đơn giá, độ dài block, cọc, giao nhận trước khi vận hành; đặt `per-block` và version không tự tạo mức cọc hay phí ship. Sản phẩm mới thường ở trạng thái draft; chỉ published xuất hiện ở catalog HTTP.

**Biến dành cho test, không phải cấu hình shop:** `RENTAL_TEST_DB_ENGINE`, `POSTGRES_BIN_DIR`, `RENTAL_TEST_DATABASE_URL`, `RENTAL_QA_ORIGIN`, `RENTAL_QA_OUTPUT`, `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`. Đừng trỏ integration test vào DB chứa dữ liệu khách.

## 8. Link, dịch vụ và thông tin liên hệ

| Địa chỉ/dịch vụ                                                  | Dùng để làm gì                                        | Ai cần cấu hình?                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `http://localhost:3000`                                          | Site trên máy khi chạy dev                            | Không cần mua domain; production đổi sang HTTPS domain thật qua `APP_ORIGIN`/hosting.                                                                                                            |
| `/`, `/products`, `/availability`, `/cart`                       | Tìm đồ/lịch và chuẩn bị thuê                          | Khách; catalog thật cần sản phẩm published trong DB.                                                                                                                                             |
| `/account`, `/account/orders`                                    | Hồ sơ và toàn bộ đơn của khách                        | Email, mật khẩu và DB.                                                                                                                                                                           |
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

- **Bố cục:** chạy `npm run dev`, mở `/layout-preview` ở 1440 px và 390 px, kiểm tra bàn phím và reduced motion.
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
| Catalog rỗng                              | Kiểm tra DB có sản phẩm **published**.                                                       |
| Báo `POLICY_REQUIRED`/503                 | `AUTH_SECRET`, `APP_ORIGIN`, `DATABASE_URL` và đã khởi động lại ứng dụng.                    |
| Không tạo được quote                      | `RENTAL_PRICING_MODE=per-block`, version, giá và số ngày block của sản phẩm thật; lịch kho.  |
| Nút liên hệ Zalo không mở                 | `src/lib/store-details.ts` còn rỗng/URL sai host; đã build/deploy lại chưa.                  |
| Vừa đổi `.env` mà trang vẫn như cũ        | Khởi động lại dev hoặc build và triển khai lại bản production.                               |

Nếu cần biết một tính năng lưu gì và file nào xử lý, xem tiếp `docs/feature.md`; để hình dung cấu trúc folder, xem `docs/structure.md`.

## Kiểm tra refactor phần tồn

Chạy `npm run test:server` để kiểm tra contract truy vấn và `npm run test:integration` với `RENTAL_TEST_DB_ENGINE=pglite` để kiểm thử trên fixture cô lập. Sau build, chạy `npm run test:smoke` để kiểm tra tuyến công khai và trang lỗi mà không kết nối DB. Với DB phát triển, tra lịch, gửi đơn và cập nhật bằng phiên admin riêng.

## Checkpoint Git theo mốc

Kiểm tra handoff và vai trò bằng `node --test tests/agent-protocol.test.mjs tests/codex-config.test.mjs`. Với tuyến sản phẩm, kiểm tra hai trang bằng `node scripts/check-translations.mjs 'src/app/(store)/products/page.tsx' 'src/app/(store)/products/[slug]/page.tsx'`. Lệnh đọc cụm chữ tĩnh trong `<T>` và báo vị trí khóa còn thiếu.

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

Đăng nhập `/admin/login` trên một DB phát triển để kiểm tra Tổng quan, Đơn thuê, Sản phẩm và Lịch kho. Kiểm tra thay đổi ảnh, trạng thái sản phẩm và ngày khóa ở 1440 px và 390 px.

Nguồn thiết kế trong đợt này: [Mobbin — Dashboard Design](https://mobbin.com/blog/what-good-dashboard-design-looks-like), [Booqable — Dashboard](https://help.booqable.com/en/articles/5603615-how-to-use-the-dashboard), [Shopify — Lọc đơn](https://help.shopify.com/en/manual/fulfillment/managing-orders/viewing-orders), [Square — Quản lý sản phẩm](https://squareup.com/help/us/en/article/8335-create-and-edit-items), [Carbon — Data table](https://v10.carbondesignsystem.com/components/data-table/usage/) và [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- Tham chiếu thứ tự ưu tiên của hàng việc và cách chuyển từ tổng quan sang tác vụ tại [Mobbin — Dashboard Design](https://mobbin.com/blog/what-good-dashboard-design-looks-like).
- Tham chiếu điều hướng, bộ lọc và biểu mẫu tạo/sửa cho Đơn thuê, Sản phẩm và Lịch kho tại [Mobbin — Web Internal Tools](https://mobbin.com/explore/web/screens/internal-tool).
- Tham chiếu cách nhóm biểu mẫu sản phẩm với phần xem trước ảnh trên desktop. Kiểm tra các nhóm nội dung đọc theo thứ tự khi xếp dọc trên mobile. [Mobbin — Web Multi-Column Layout](https://mobbin.com/explore/web/screens/multi-column-layout)

## Chạy thử Admin Mốc 2

Trên DB phát triển, mở `/admin/products`, `/admin/customers`, `/admin/reviews` và `/admin/team`. Kiểm tra album, bộ lọc, lịch sử khách và quyền theo tài khoản được cấp.

## Kiểm tra giao diện ELMEE

Mở `/products` khi DB phát triển có sản phẩm công khai. Kiểm tra mục “Tra lịch thuê” và vùng “Danh mục trang phục” ở 390 px, 768 px và 1440 px. Thử tra lịch rồi lọc danh mục bằng từ khóa để kiểm tra hai kết quả độc lập. Thử cùng ngày nhận và trả, trạng thái đang kiểm tra và thông báo lỗi ngay bên dưới biểu mẫu.

Ở 390 px, 768 px và 1440 px, kiểm nền giấy sáng `#FDFAF6`, điểm nhấn `#660000`, độ gọn của thanh tìm kiếm khi bộ lọc đóng và thao tác bộ lọc bằng bàn phím.

Ở 390 px, 768 px và 1440 px, kiểm tra form mô phỏng đứng trước danh mục, ảnh và giá trên thẻ, và bảng đơn mẫu sau khi đăng nhập Admin. Mở “Xem email và mật khẩu mẫu” để nhập từng cặp bằng tay. Trên DB phát triển, thử thứ tự nhập bộ lọc rồi áp dụng và thứ tự chọn ngày trước tư vấn size trên trang sản phẩm.

Mở `/layout-preview` ở 1440 px và 390 px để kiểm màu nhấn `#660000`, nền giấy kem tạm thời, chữ tiếng Việt, độ tương phản và ô ngày. Mở ảnh lớn để kiểm token trong sheet. Trên môi trường phát triển đã cấu hình, thử menu mobile, drawer thuê, liên hệ và xác nhận xóa giỏ. Đối chiếu bảng Admin trong preview và trang Admin với màu gốc.

Đối chiếu font của tiêu đề chính và tiêu đề phụ sau khi có tên font, độ đậm và nguồn font được phép dùng trên web. Đối chiếu nền sau khi có mã màu và tài nguyên vân giấy gốc từ Canva.

## Sử dụng Designer Agent

Yêu cầu phiên Codex gốc: “Giao `designer/design` audit theme khu khách theo Canva này. Giữ bố cục và nêu mã màu, font đã xác minh, tài nguyên còn thiếu.” Đính kèm nguồn tham chiếu, các màn hình cần kiểm tra và phạm vi đọc. Để triển khai, nêu rõ file trình bày được phép sửa. Phiên gốc kiểm tra envelope và giao kiểm thử, review độc lập theo `AGENTS.md`.

Chạy kiểm tra tích hợp cấu hình:

```sh
node --test tests/agent-protocol.test.mjs tests/codex-config.test.mjs
```

Với một thay đổi giao diện sau này, mở route liên quan hoặc `/layout-preview` trong môi trường phát triển. Kiểm tra 1440 px, 768 px và 390 px, thứ tự focus bằng bàn phím, tương phản, tiếng Việt có dấu, reduced motion và trạng thái liên quan. Ghi bằng chứng đã xem và điều kiện còn thiếu. Trang preview phục vụ kiểm hình thức. Kiểm nghiệp vụ dùng DB phát triển riêng theo hướng dẫn ở trên.
