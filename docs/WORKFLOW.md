# Quy trình làm việc — Rental Store

Cập nhật: 2026-09-10. Đây là quy trình người dùng yêu cầu ghi nhớ và áp dụng cho các lần phát triển tiếp theo.

## Mỗi lần tiếp tục dự án

1. Đọc `AGENTS.md`, `docs/PROJECT_STATE.md` và source hiện hành.
2. Kiểm tra bản source mới nhất trước khi sửa. Không dùng lại ZIP upload ban đầu nếu đã có phiên bản mới hơn.
3. Đối chiếu yêu cầu hiện tại với scope đã chốt. Yêu cầu mới của người dùng có ưu tiên hơn giới hạn của phase cũ.
4. Nêu ngắn gọn hiện trạng, vấn đề, mục tiêu, file cần sửa và những quyết định chưa biết.
5. Làm phần đã được yêu cầu; chỉ hỏi khi quyết định thiếu thông tin có thể thay đổi nghiệp vụ. Không tự bịa policy/API/data thật.

## Khi code FE / Next.js

- Giữ stack hiện có. Đọc tài liệu tại `node_modules/next/dist/docs/` cho API sắp dùng.
- Page/layout mặc định là Server Component. Chỉ dùng Client Component cho tương tác cần state hoặc browser API.
- Tách dữ liệu mẫu, kiểu dữ liệu và hàm thuần khỏi giao diện. Dùng cùng một nguồn dữ liệu cho landing, catalog, detail và giỏ.
- Tách component khi có vai trò rõ hoặc được dùng lại; tránh vừa gom tất cả vào page vừa tránh chia thành quá nhiều file nhỏ không cần thiết.
- Dùng TypeScript strict, tên rõ nghĩa, không `any`, không mutate dữ liệu nguồn.
- Reuse Button, Sheet, ScrollReveal và component sẵn có. Chưa cần state/form/query library mới.
- `params` / `searchParams` là Promise; dùng `await`. Unknown slug trả 404 qua `notFound` / `dynamicParams`.
- Filter/search lưu trong URL và submit bằng `next/form`. Nhờ vậy Back/Forward và client navigation giữ đúng trạng thái.
- Dùng `next/image` với `alt`, tỷ lệ và `sizes` rõ; metadata theo route; Link cho navigation.
- CSS khách hàng dùng namespace `store-*`; token màu và navigation chung đi theo landing đã chấp nhận.
- Có label, focus, keyboard, empty/not-found/loading state phù hợp; xét responsive và reduced motion.
- Format file đã sửa để dễ đọc. Không cài thêm dependency runtime chỉ để trang trí code.

## Cổng kiểm tra bắt buộc

```bash
npm run check
```

Lệnh chạy tuần tự:

```bash
npm run lint
npm test
npm run build
npm run test:smoke
```

- Lint: ESLint và quy tắc Next.js/React hiện có.
- Unit test: Node test runner chạy logic TypeScript trực tiếp; cần Node.js >= 22.18. Bản này dùng Node.js 24.19.0.
- Build: compile, TypeScript và prerender của Next.js.
- Smoke test: tự mở một production server trên cổng trống được hệ điều hành cấp, kiểm tra route/filter/404/escape input rồi tắt đúng process nó tạo.
- Không dùng smoke test thay cho kiểm tra browser/E2E. Khi có yêu cầu browser QA, kiểm tra riêng desktop/mobile, focus, menu, form và các nút chọn/xóa.
- Nếu có lỗi: sửa nguyên nhân, chạy lại test liên quan và gate cuối. Báo rõ Verified / Not verified.

## Lưu và bàn giao

- Cập nhật `docs/PROJECT_STATE.md`: scope hoàn thành, route, quyết định, file chính, kết quả kiểm tra và việc còn lại.
- Cập nhật quy trình này nếu người dùng thay đổi cách làm việc.
- Đóng gói toàn bộ source thành `rental-main.zip`; file đầy đủ để thay trực tiếp, không yêu cầu ghép patch.
- Không kèm `node_modules`, `.next`, Git internals, cache, log hoặc secret.
- Lưu phiên bản mới vào cùng artifact source để giữ lịch sử. Không tự deploy khi yêu cầu chỉ là phát triển và lưu source.
- Phản hồi ngắn gọn: đã làm gì, test nào pass, giới hạn nào chưa xác minh, link source.

## Quy tắc scope hiện tại

Landing page đã được người dùng chấp nhận tạm ổn. Phase tiếp theo là UI khám phá và lựa chọn trang phục: catalog, search, collections, lookbook, detail, wishlist, rental bag.

Dữ liệu vẫn là sample. Giỏ/yêu thích lưu trên thiết bị bằng localStorage có version, khôi phục sau refresh, loại bỏ ID cũ/trùng và fallback trong bộ nhớ nếu storage không dùng được. Không có giữ hàng, đặt thuê, thanh toán hoặc lưu đơn thật.

Checkout, auth/account, lịch sử đơn, admin và backend cần bước riêng cùng thông tin nghiệp vụ thích hợp. Không chuyển các quy tắc thuê máy ảnh của FAO thành quy tắc thuê thời trang.

## Cập nhật: scroll và kiểm tra browser

- Dùng ScrollReveal sẵn có: fade và dịch chuyển nhỏ, chỉ một lần cho nội dung ngoài viewport.
- Không animation nội dung đầu trang theo cách chặn hiển thị. Giữ nội dung hiện khi không có JavaScript, khi giảm chuyển động hoặc khi keyboard focus đi vào.
- Ảnh sản phẩm chỉ dùng asset đã có. Hiện một ảnh mẫu mỗi sản phẩm: hỗ trợ xem toàn ảnh bằng Sheet, không tự tạo các góc chụp hay số đo/chất liệu.
- Preview hiện bị chặn vì môi trường giám sát truyền `--host`/`--strictPort` mà `next dev` không hỗ trợ. Đã dừng sau các thử nghiệm giới hạn. Không đổi framework hoặc bỏ qua môi trường preview được hỗ trợ để khắc phục.
- Browser QA vẫn là việc cần thực hiện ở môi trường tương thích; không đánh dấu pass dựa trên unit/HTTP tests.
