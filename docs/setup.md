# SETUP — bắt đầu từ số 0 đến khi chạy cửa hàng

Tài liệu này dành cho người nhận bàn giao chưa biết dự án. Bạn có thể xem giao diện mẫu ngay mà không có database. Để nhận đơn thật, cần thêm PostgreSQL, dịch vụ đăng nhập OIDC, dữ liệu sản phẩm và chính sách giá được cửa hàng duyệt. Staff xác nhận và cập nhật đơn; thanh toán nằm ngoài ứng dụng.

## 1. Hiểu 5 thứ trước khi bắt đầu

| Thuật ngữ                              | Hiểu đơn giản                          | Trong dự án này                                                                               |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Source code                            | Các file tạo nên website               | Thư mục chứa `package.json`, `src/`, `prisma/`, `docs/`                                       |
| Terminal                               | Cửa sổ gõ lệnh                         | Mở tại **thư mục gốc** nói trên, không mở tại `docs/`                                         |
| Environment variable (biến môi trường) | Giá trị cài đặt riêng cho mỗi nơi chạy | Bản mẫu ở `.env.example`; máy của bạn dùng `.env`; server thật dùng secret của nơi triển khai |
| Database (DB)                          | Nơi giữ sản phẩm, tài khoản, đơn       | PostgreSQL, chỉ dùng ở chế độ `http`                                                          |
| OIDC                                   | Dịch vụ xác minh người đăng nhập       | Một cấu hình cho khách và một cấu hình riêng cho nhân viên quản trị                           |

**Hai chế độ:** `mock` là dữ liệu minh họa nằm trong ứng dụng/trình duyệt; `http` gọi API thật, đọc/ghi PostgreSQL. Khi chuyển sang `http`, dữ liệu demo **không chuyển** sang DB. Chế độ `http` cũng không âm thầm quay về `mock` khi có lỗi.

**Bạn cần chuẩn bị:** máy có Node.js **22.18 trở lên**, npm và chương trình sửa văn bản thuần (VS Code, Notepad…). Có thể kiểm tra bằng `node --version` và `npm --version`. Với chế độ thật, cần người có quyền tạo PostgreSQL, ứng dụng OIDC và quyền cấu hình nơi triển khai.

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

## 6. Gắn đăng nhập khách và quản trị

Hệ thống dùng **hai scope Auth.js**: khách đi qua `/api/auth/*`, quản trị qua `/api/admin/auth/*`. Trang quản trị ở `/admin/*`; trang của khách ở `/account/*`. Link quản trị không xuất hiện trên điều hướng khách; đăng nhập khách **không** được quyền admin.

1. Chọn dịch vụ OIDC hỗ trợ issuer HTTPS và trả `sub`, `email`, `email_verified=true`. Cần cấu hình ứng dụng OIDC cho **customer** và **admin** theo chính sách nhà cung cấp; lấy issuer, client ID, client secret cho từng scope. Đăng ký callback URI chính xác tại dịch vụ OIDC. Route callback có dạng `<APP_ORIGIN>/api/auth/callback/<provider-id>` cho khách và `<APP_ORIGIN>/api/admin/auth/callback/<provider-id>` cho admin. `<provider-id>` được code sinh từ hash của issuer, vì vậy người triển khai cần xác định ID thực từ cấu hình/chạy ứng dụng rồi đối chiếu với provider; không nhập nguyên chuỗi placeholder.
2. Điền vào `.env` hoặc secrets hosting:

   ```dotenv
   AUTH_CUSTOMER_OIDC_ISSUER=https://issuer-cua-khach.example
   AUTH_CUSTOMER_OIDC_CLIENT_ID=ID_KHACH
   AUTH_CUSTOMER_OIDC_CLIENT_SECRET=SECRET_KHACH
   AUTH_ADMIN_OIDC_ISSUER=https://issuer-cua-admin.example
   AUTH_ADMIN_OIDC_CLIENT_ID=ID_ADMIN
   AUTH_ADMIN_OIDC_CLIENT_SECRET=SECRET_ADMIN
   ```

   Sau khi điền `.env`, người triển khai có thể lấy hai `<provider-id>` bằng lệnh sau trong thư mục gốc (chỉ in ID, không in client secret):

   ```bash
   node -r dotenv/config -e "const h=require('node:crypto').createHash;for(const s of ['CUSTOMER','ADMIN']){const issuer=process.env['AUTH_'+s+'_OIDC_ISSUER'];if(!issuer)continue;console.log(s,'oidc-'+h('sha256').update(issuer).digest('hex').slice(0,16))}"
   ```

   Ghép ID vào hai URL callback tương ứng và đăng ký với provider. Đổi issuer thì tính lại ID/callback.

3. Đảm bảo `DATABASE_URL`, `AUTH_SECRET`, `APP_ORIGIN` đều hợp lệ; restart/rebuild. Mở `/account` để thử đăng nhập khách, `/admin/login` để thử admin. Thiếu một bộ ba OIDC hoặc secret/DB cần thiết thì flow có thể trả `AUTH_NOT_CONFIGURED`/503.
4. **Owner đầu tiên:** website không tự tạo owner. Người vận hành xác minh User thật trong DB và `sub` từ issuer admin, rồi chạy `npm run staff:provision -- --user-id <User.id> --subject <OIDC-sub> --role owner` trong môi trường đã cấu hình đúng. Đây là thao tác cấp quyền thật, không điền ID đoán; sau đó có thể quản lý nhân viên tại `/admin/team` theo quyền. Người nhận bàn giao nên giao bước này cho người vận hành có quyền DB/OIDC.

Đổi `AUTH_SECRET` có thể làm phiên đăng nhập cũ hết hiệu lực. Đổi issuer/client app có thể đổi định danh provider, cần đối chiếu liên kết account và provision lại theo danh tính đã xác minh; không ghép account chỉ vì email giống nhau. Đổi `APP_ORIGIN` khi chuyển domain yêu cầu sửa redirect URIs phía OIDC và triển khai lại. Production cần HTTPS đúng domain.

## 7. Danh sách biến môi trường và hậu quả khi đổi

**Bắt buộc theo nhu cầu:** để xem mock, không phải điền DB/OIDC. Để tạo quote/đơn thật ở HTTP, cần DB, Auth, OIDC và chính sách giá đã phê duyệt. Mọi secret chỉ để ở `.env`/secrets server.

| Biến                                                                                            | Lấy/điền ở đâu                                                         | Nếu thiếu hoặc đổi                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_RENTAL_API_MODE`                                                                   | `.env`: `mock` hoặc `http`; mặc định mock                              | Đổi nguồn dữ liệu và cần restart/rebuild, nhất là vì được đưa vào bundle trình duyệt. Giá trị khác bị từ chối. Không di chuyển dữ liệu giữa hai nguồn. |
| `DATABASE_URL`                                                                                  | URL PostgreSQL do người quản trị DB/provider cấp                       | HTTP/Auth cần DB. Đổi URL là trỏ sang dữ liệu khác; DB cũ vẫn còn. Migration tác động **DB đang trỏ tới**.                                             |
| `AUTH_SECRET`                                                                                   | Secret ngẫu nhiên của operator/hosting                                 | Thiếu thì đăng nhập không chạy; đổi có thể làm người dùng phải đăng nhập lại, không xóa DB.                                                            |
| `APP_ORIGIN`                                                                                    | URL chính xác của site, ví dụ `https://shop.example`, không `/` cuối   | Sai host/protocol làm callback/mutation lỗi. Đổi domain cần cập nhật OIDC; production phải HTTPS.                                                      |
| `AUTH_CUSTOMER_OIDC_ISSUER`, `AUTH_CUSTOMER_OIDC_CLIENT_ID`, `AUTH_CUSTOMER_OIDC_CLIENT_SECRET` | Ứng dụng OIDC dành cho khách                                           | Thiếu bộ ba thì login khách không dùng được. Đổi issuer/app có thể ảnh hưởng account linkage; cần thử đăng nhập lại.                                   |
| `AUTH_ADMIN_OIDC_ISSUER`, `AUTH_ADMIN_OIDC_CLIENT_ID`, `AUTH_ADMIN_OIDC_CLIENT_SECRET`          | Ứng dụng OIDC dành cho quản trị                                        | Thiếu bộ ba thì admin login không dùng được. Đổi issuer/app cần rà soát StaffProfile và owner.                                                         |
| `AUTH_CUSTOMER_OIDC_NAME`, `AUTH_ADMIN_OIDC_NAME`                                               | Tùy chọn, nhãn nút đăng nhập; có trong code, chưa ghi ở `.env.example` | Đổi tên hiển thị, không đổi danh tính DB.                                                                                                              |
| `RENTAL_PRICING_MODE`                                                                           | Chỉ đặt `per-block` sau khi shop duyệt cách tính                       | Thiếu/sai: quote HTTP bị chặn `POLICY_REQUIRED`; không tự dùng giá mock.                                                                               |
| `RENTAL_PRICING_VERSION`                                                                        | Tên phiên bản chính sách do shop đặt, ví dụ `2026-10-approved`         | Thiếu: quote bị chặn. Đổi nhãn policy có thể khiến quote cũ phải báo lại; đơn đã tạo lưu snapshot của nó.                                              |
| `RENTAL_QUOTE_TTL_SECONDS`                                                                      | Tùy chọn, 30–3600; mặc định 300 giây                                   | Giá trị sai phạm vi dùng mặc định. Đổi ảnh hưởng quote mới; quote cũ đã có hạn lưu riêng.                                                              |
| `TRUST_PROXY_IP`                                                                                | Mặc định `false`; chỉ operator sau khi cấu hình trusted reverse proxy  | Bật sai có thể khiến rate limit tin IP giả trong header. Không cần đổi để chạy local.                                                                  |
| `DATABASE_POOL_SIZE`                                                                            | Tùy chọn, server; code giới hạn tối đa 10, `1` cho trường hợp test     | Đổi số kết nối/hiệu năng và giới hạn của provider, không đổi dữ liệu.                                                                                  |
| `RENTAL_BUILD_DIR`                                                                              | Tùy chọn, thư mục output Next thay `.next`                             | Đổi nơi chứa build; build/start cần cùng cấu hình, không đổi DB.                                                                                       |
| `NODE_ENV`                                                                                      | Next/npm thường tự đặt theo dev/production                             | Ảnh hưởng cookie bảo mật và kiểm HTTPS; không đặt `production` giả khi chạy HTTP local.                                                                |

**Giá thật:** `src/server/rental/pricing.ts` tính số block bằng cách làm tròn lên số ngày thuê (tính cả ngày nhận/trả) chia `Product.rentalDays`, rồi nhân `Product.price` và số lượng. Owner cần duyệt đơn giá, độ dài block, cọc, giao nhận trước khi vận hành; đặt `per-block` và version không tự tạo mức cọc hay phí ship. Sản phẩm mới thường ở trạng thái draft; chỉ published xuất hiện ở catalog HTTP.

**Biến dành cho test, không phải cấu hình shop:** `RENTAL_TEST_DB_ENGINE`, `POSTGRES_BIN_DIR`, `RENTAL_TEST_DATABASE_URL`, `RENTAL_QA_ORIGIN`, `RENTAL_QA_OUTPUT`, `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`. Đừng trỏ integration test vào DB chứa dữ liệu khách.

## 8. Link, dịch vụ và thông tin liên hệ

| Địa chỉ/dịch vụ                            | Dùng để làm gì                                        | Ai cần cấu hình?                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `http://localhost:3000`                    | Site trên máy khi chạy dev                            | Không cần mua domain; production đổi sang HTTPS domain thật qua `APP_ORIGIN`/hosting.                                                                                                            |
| `/`, `/products`, `/availability`, `/cart` | Tìm đồ/lịch và chuẩn bị thuê                          | Khách; catalog thật cần sản phẩm published trong DB.                                                                                                                                             |
| `/account`, `/account/orders`              | Hồ sơ và toàn bộ đơn của khách                        | OIDC customer và DB trong HTTP.                                                                                                                                                                  |
| `/admin/login`, `/admin/*`                 | Quản trị đơn, sản phẩm, kho, khách, đánh giá, nhân sự | OIDC admin + StaffProfile có quyền. Không đưa link này vào navigation của khách.                                                                                                                 |
| `/api/auth/*`, `/api/admin/auth/*`         | Endpoint phiên/callback Auth.js của hai scope         | Operator đăng ký callback đúng với từng OIDC provider.                                                                                                                                           |
| `/api/v1/*`, `/media/[id]`                 | API nghiệp vụ, ảnh do hệ thống phục vụ                | App cùng origin; server kiểm session/quyền/Origin.                                                                                                                                               |
| `src/lib/store-details.ts`                 | Zalo, Facebook, hotline **công khai**                 | Shop xác minh thông tin rồi developer điền và deploy. Zalo phải `https://zalo.me/...`; Facebook dùng `facebook.com`, `www.facebook.com` hoặc `m.me`; số điện thoại 8–15 chữ số, có thể thêm `+`. |

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
- **Gate code:** `npm run check` chạy validate, format, lint, test, test server, build, smoke và audit; `npm run test:integration` dùng DB test cô lập khi có hạ tầng test. Kiểm thêm OIDC, DB và browser thật của môi trường triển khai.

Khi thay secret/domain/DB hoặc giá, cần kiểm lại những flow tương ứng; không suy từ việc trang chủ mở được rằng admin/đơn hoạt động. Bản source đã bàn giao trước đó có ghi nhận build/audit/integration còn bị chặn bởi môi trường cài dependency; các kết quả lịch sử **không** thay cho lần test mới với `npm ci` đúng lockfile. Không chạy `db:maintenance` trên production nếu chưa đọc `scripts/db-maintenance.ts` và thống nhất vận hành.

## 11. Lỗi thường gặp

| Biểu hiện                                 | Kiểm ngay                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm ci` lỗi                              | Phiên bản Node >=22.18, mạng/registry và đúng thư mục có `package-lock.json`.                   |
| `db:validate` qua nhưng app không thấy DB | Lệnh validate không kiểm kết nối; kiểm `.env`, URL, quyền, SSL và `db:migrate` trên DB đúng.    |
| Đổi sang HTTP mà catalog rỗng             | DB mới chưa có sản phẩm **published**; ba món demo không tự import.                             |
| Báo `AUTH_NOT_CONFIGURED`/503             | `AUTH_SECRET`, `APP_ORIGIN`, `DATABASE_URL`, ba biến OIDC đúng scope, issuer HTTPS và restart.  |
| Callback đăng nhập lỗi                    | Domain/protocol của `APP_ORIGIN`, callback URI đã đăng ký, issuer, claim `email_verified=true`. |
| Không tạo được quote                      | `RENTAL_PRICING_MODE=per-block`, version, giá và số ngày block của sản phẩm thật; lịch kho.     |
| Nút liên hệ Zalo không mở                 | `src/lib/store-details.ts` còn rỗng/URL sai host; đã build/deploy lại chưa.                     |
| Vừa đổi `.env` mà trang vẫn như cũ        | Dừng/chạy lại dev; ở production rebuild/deploy, nhất là `NEXT_PUBLIC_RENTAL_API_MODE`.          |

Nếu cần biết một tính năng lưu gì và file nào xử lý, xem tiếp `docs/feature.md`; để hình dung cấu trúc folder, xem `docs/structure.md`.

Mock wardrobe: danh mục có 12 mẫu minh họa, chia 6 món mỗi trang để xem bố cục và tương tác. Không nhập các mẫu này vào DB; ở chế độ HTTP chỉ sản phẩm đã published từ DB mới hiển thị.
