# Setup — cài đặt và thay đổi môi trường

Cập nhật 04/10/2026. Có hai cách chạy: `mock` để xem UI mà không cần database, và `http` để dùng Prisma/PostgreSQL. Chế độ được đưa vào bundle khi build; đổi từ mock sang http phải build lại. Chưa có OIDC và chính sách giá thật thì không thể nghiệm thu đăng nhập/đặt đơn thật. Không đưa `.env` hoặc tài khoản thật vào ZIP/source.

## Chạy nhanh

Cần Node.js 22.18+ và npm. Trong thư mục gốc dự án:

```bash
npm ci
npm run db:validate
npm run dev
```

Mở `http://localhost:3000`. Mặc định `NEXT_PUBLIC_RENTAL_API_MODE=mock`, dữ liệu đơn/hồ sơ demo chỉ ở tab và sẽ mất khi tải lại. Wishlist/giỏ là lựa chọn trên thiết bị, không phải đơn. `npm ci` đọc `package-lock.json`, cài dependency và tự generate Prisma Client. Không cần DB cho mock.

Để chạy HTTP với **database phát triển trống được phép sử dụng**, sao chép `.env.example` thành `.env` hoặc `.env.local`, điền biến bên dưới, kiểm tra đúng DB rồi chạy:

```bash
npm run db:validate
npm run db:migrate
NEXT_PUBLIC_RENTAL_API_MODE=http npm run build
NEXT_PUBLIC_RENTAL_API_MODE=http npm run start
```

`db:migrate` thay đổi schema và dữ liệu của DB được trỏ tới. Chỉ chạy sau khi xác nhận đúng môi trường và có backup; database đã có dữ liệu cần kế hoạch migration riêng, không reset hay `db push`. Với `npm run dev`, đặt mode trong env trước khi khởi động. Production bắt buộc HTTPS origin đúng địa chỉ đang phục vụ. `http` không tự fallback về demo khi server lỗi.

## Biến môi trường

Điền ở server/deployment secrets, không sửa trực tiếp source để lưu secret. `NEXT_PUBLIC_` được đưa tới trình duyệt và phải được phép công khai. Biến chưa có trong `.env.example` nhưng code có đọc được ghi rõ ở đây.

| Biến                                                        | Dùng ở đâu / giá trị                                                                         | Nếu đổi, thiếu hoặc sai                                                                                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_RENTAL_API_MODE`                               | `mock` mặc định hoặc `http`; `api-provider.tsx`, storefront SSR                              | Đổi phải build lại. `mock` reset hồ sơ/đơn theo tab; `http` đọc DB, lỗi thì hiện lỗi. Giá trị khác bị từ chối.                                                                   |
| `DATABASE_URL`                                              | PostgreSQL URL server-only; `prisma.config.ts`, `src/server/db/client.ts`                    | Trỏ DB khác là xem/ghi **dữ liệu khác**; DB cũ không bị xóa chỉ vì đổi URL. Thiếu thì HTTP/Auth không hoạt động. Không in URL ra log.                                            |
| `AUTH_SECRET`                                               | Secret Auth.js và CSRF; server-only                                                          | Thiếu: đăng nhập 503. Thay secret có thể làm phiên/cookie hiện có không hợp lệ, người dùng đăng nhập lại; không xóa DB. Dùng secret ngẫu nhiên mạnh, không lấy ví dụ trong docs. |
| `APP_ORIGIN`                                                | Origin chính xác, ví dụ `https://ten-mien-cua-shop.vn`, không dấu `/` cuối; Auth/Origin/CSRF | Sai host/protocol làm callback hoặc mutation thất bại; đổi domain phải cập nhật OIDC redirect URI. Production yêu cầu HTTPS.                                                     |
| `AUTH_CUSTOMER_OIDC_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET` | OIDC customer ở `server/auth/providers.ts`                                                   | Thiếu bộ ba: customer login 503. Đổi issuer/ứng dụng là danh tính provider khác; account linkage/phiên cũ cần kế hoạch chuyển, không tự ghép theo email.                         |
| `AUTH_ADMIN_OIDC_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET`    | OIDC admin riêng                                                                             | Thiếu: admin login 503. Đổi issuer/ứng dụng cần provision/liên kết staff theo subject đã xác minh, không tự tạo owner.                                                           |
| `AUTH_CUSTOMER_OIDC_NAME`, `AUTH_ADMIN_OIDC_NAME`           | Nhãn provider tùy chọn trong trang đăng nhập                                                 | Chỉ đổi nhãn hiển thị, không đổi account/DB.                                                                                                                                     |
| `RENTAL_PRICING_MODE`                                       | Chỉ `per-block` sau khi shop phê duyệt cách tính                                             | Thiếu/sai: quote trả `POLICY_REQUIRED`, không dùng giá mẫu.                                                                                                                      |
| `RENTAL_PRICING_VERSION`                                    | Nhãn phiên bản chính sách giá được snapshot trong quote                                      | Thiếu: quote bị chặn. Đổi nhãn thể hiện policy mới; quote cũ có thể không tương thích để tạo đơn, cần báo giá lại. Không tự đặt mức cọc/phí.                                     |
| `RENTAL_QUOTE_TTL_SECONDS`                                  | Thời gian sống quote, mặc định 300, hợp lệ 30–3600                                           | Sai phạm vi dùng mặc định 300; đổi ảnh hưởng quote mới, quote cũ vẫn có expiry đã lưu.                                                                                           |
| `TRUST_PROXY_IP`                                            | `false` mặc định; `true` chỉ sau reverse proxy đáng tin đã thay thế `X-Forwarded-For`        | Bật sai khiến rate limit có thể dùng IP giả. Không đổi khi chưa kiểm ingress.                                                                                                    |
| `DATABASE_POOL_SIZE`                                        | `1` cho trường hợp test một kết nối, còn lại tối đa 10 ở `db/client.ts`                      | Đổi ảnh hưởng kết nối/hiệu năng, không thay dữ liệu. Cần cân đối giới hạn DB.                                                                                                    |
| `RENTAL_BUILD_DIR`                                          | Thư mục output Next thay `.next` (test dùng `.next-http`)                                    | Đổi nơi chứa build; `next start` phải dùng cùng giá trị, không đổi DB. Không đóng gói cache build.                                                                               |
| `NODE_ENV`                                                  | Do Next đặt theo dev/production                                                              | Production làm cookie Secure và yêu cầu HTTPS; không tự giả production khi test local HTTP.                                                                                      |

Không đặt `AUTH_URL`/`AUTH_TRUST_HOST` như một cách sửa origin; handler dùng `APP_ORIGIN` đã pin và kiểm mâu thuẫn. `AUTH_SECRET`, OIDC secret, `DATABASE_URL` không có tiền tố `NEXT_PUBLIC_`.

## URL và dịch vụ ngoài

| URL                                                                                                                                                                           | Vai trò                           | Cần thiết lập                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/`, `/products`, `/products/[slug]`, `/availability`, `/accessories`, `/collections`, `/lookbook`, `/feedback`, `/rental-guide`, `/wishlist`, `/cart`                        | Khu công khai/khách               | Cùng origin app; catalog HTTP chỉ hiện published.                                                |
| `/account`, `/account/orders`, `/account/history`                                                                                                                             | Hồ sơ và đơn của khách            | OIDC customer + DB trong HTTP.                                                                   |
| `/admin/login`, `/admin`, `/admin/orders`, `/admin/products`, `/admin/availability`, `/admin/payments`, `/admin/customers`, `/admin/content`, `/admin/reviews`, `/admin/team` | Quản trị riêng                    | OIDC admin, StaffProfile active và quyền tác vụ. Không dẫn từ customer nav.                      |
| `/api/auth/*`, `/api/admin/auth/*`                                                                                                                                            | Callback/phiên Auth.js khác scope | Đăng ký đúng redirect URI với từng OIDC provider trên `APP_ORIGIN`; kiểm flow thật sau cấu hình. |
| `/api/v1/*`, `/media/[id]`                                                                                                                                                    | API nghiệp vụ và ảnh              | Cùng origin; session, Origin, CSRF, rate limit. Ảnh private tới khi đủ điều kiện công khai.      |

Vendor/chức năng: Next.js phục vụ web; Auth.js + OIDC provider xác thực; Prisma 7 + `pg` kết nối PostgreSQL; Sharp chuẩn hóa ảnh WebP; Radix/shadcn/Lucide hỗ trợ UI. Không có payment gateway, SMS/Zalo API, object storage hay realtime push. `src/lib/store-details.ts` chứa Zalo/Facebook/phone và thông tin bank/QR **công khai** (mặc định rỗng). Khi thay: các nút/QR hiển thị hoặc biến mất theo giá trị; đơn/ledger DB không bị sửa. Chỉ điền tài khoản đã được shop xác nhận; đường dẫn Zalo/Facebook phải HTTPS thuộc host cho phép, điện thoại đúng định dạng. `public/images/` là ảnh mẫu; thay ảnh có thể thay hình khách thấy, không đổi giá/kho.

## File cấu hình và hậu quả khi sửa

| File                                                              | Kiểm soát gì                                                         | Sửa thì tác động gì?                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `.env.example`                                                    | Danh sách mẫu, không chứa secret                                     | Chỉ đổi hướng dẫn; phải sửa env thật ở deployment riêng.                                                            |
| `package.json`, `package-lock.json`                               | Script và phiên bản thư viện                                         | Cài lại bằng `npm ci`, build/test lại; lockfile phải khớp.                                                          |
| `prisma/schema.prisma`, `prisma/migrations/*`, `prisma.config.ts` | Model, ràng buộc SQL, URL migration                                  | Thay schema cần migration review, backup, generate Client và test; xóa/sửa migration cũ có thể làm môi trường lệch. |
| `next.config.ts`                                                  | Build output, ảnh remote (hiện không cho), security response headers | Build lại; đổi header/remote pattern ảnh hưởng browser và bảo mật, không đổi nội dung DB.                           |
| `tsconfig.json`                                                   | Strict TS, alias `@/`, đường dẫn generated                           | Sai alias/build gây lỗi compile, không sửa dữ liệu.                                                                 |
| `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`        | Lint/format và file được bỏ qua                                      | Thay gate/kiểu code; không đổi hành vi runtime nhưng cần check lại.                                                 |
| `postcss.config.mjs`, `components.json`, `src/app/globals.css`    | Tailwind/shadcn style, alias UI và token giao diện                   | Build lại và kiểm desktop/mobile; có thể đổi nhiều trang.                                                           |
| `.gitignore`                                                      | File cục bộ không theo source                                        | Đừng bỏ qua `.env`, generated, build/cache; sửa sai có thể làm lộ bí mật khi đóng gói.                              |
| `src/lib/store-details.ts`                                        | Kênh liên hệ/QR công khai                                            | Build/deploy lại, chỉ đổi thông tin khách thấy; không ghi nhận chuyển khoản.                                        |

## Provision và bảo trì

Owner đầu tiên **không** được tạo từ browser. Sau khi OIDC admin liên kết User thực đã xác minh, dùng `npm run staff:provision -- --user-id <User.id> --subject <OIDC-sub> --role owner` trên máy chủ theo source script và `AUTH_ADMIN_OIDC_ISSUER` đúng. Xem subject/issuer và DB trước khi chạy; thao tác tạo quyền, không dùng ID đoán. Staff còn lại cấp/thu hồi từ `/admin/team`. `npm run db:maintenance` chỉ dành cho vận hành có kiểm soát; đọc `scripts/db-maintenance.ts` trước khi áp dụng vào DB thật.

## Kiểm tra và giới hạn

`npm run db:validate`, `npm run format:check`, `npm run lint`, `npm test`, `npm run test:server`, `npm run build`, `npm run test:smoke`; `npm run check` còn gọi dependency audit. Integration SQL dùng DB tạm qua `RENTAL_TEST_DB_ENGINE=pglite npm run test:integration` hoặc native PostgreSQL do script tạo, không dùng `DATABASE_URL` shop. Biến QA tùy chọn: `RENTAL_QA_ORIGIN`, `RENTAL_QA_OUTPUT`, `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`, `POSTGRES_BIN_DIR`, `RENTAL_TEST_DATABASE_URL`; chỉ dành cho script test. Không đưa secrets/dữ liệu người thật vào fixture.

Checkpoint trước 04/10/2026 đã kiểm mock/SQL fixture/HTTP browser, nhưng OIDC provider thật, PostgreSQL production đa kết nối, và audit sau nâng Next chưa hoàn tất trong nguồn đã bàn giao. Kết quả test của bản mới phải được ghi riêng; không coi các kết quả lịch sử là PASS cho deploy. Sau khi sửa config, test đúng chế độ/môi trường bị ảnh hưởng và kiểm đường dẫn đăng nhập/đơn/ảnh trước vận hành.

## Kiểm chứng bản refactor 04/10/2026

- PASS: `npm run db:validate`, `npm run format:check`, `npm run lint`, `npm test`, `npm run test:server`, `tsc --noEmit`; kiểm cú pháp ba script browser và kiểm đúng ba file docs, link nội bộ hợp lệ.
- BLOCKED: `npm run build` không qua bước TypeScript `--showConfig` trong workspace này vì chỉ có dependency Next 16.3.4 cũ để liên kết tạm, trong khi lockfile của source yêu cầu 16.3.8. `npm ci --offline` thiếu tarball trong cache; `npm ci` qua mạng không hoàn tất. Không coi build/smoke/browser trên bản này là PASS.
- BLOCKED: integration PGlite runner thoát mã 99 trước khi in kết quả test trong môi trường hiện tại. Cần chạy lại bằng `npm ci` đúng lockfile trên môi trường có thể cài gói, rồi `npm run check` và browser desktop/mobile. Audit sau bản vá và OAuth/DB production vẫn cần kiểm riêng.

Phần code refactor chỉ di chuyển các truy vấn đọc admin và dùng chung truy vấn danh sách đơn; không đổi schema/API/URL. Việc xóa báo cáo phase và ảnh QA cũ khỏi source không xóa dữ liệu cửa hàng: chúng còn ở phiên bản source trước. QA mới ghi ảnh vào `artifacts/qa/` (được bỏ qua khi đóng gói), nên `docs/` tiếp tục đúng ba file.
