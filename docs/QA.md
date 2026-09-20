# Quality gates — Rental Store

Cập nhật: 2026-09-15. Đây là yêu cầu kiểm tra, không phải báo cáo mọi gate đã pass.

## Gate sau mỗi lượt code

| Gate                   | Thực hiện                                                           | Bằng chứng / điều kiện                                                                                                      |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Format                 | Formatter version xác định: format rồi check file sửa               | Exit 0; ghi version/phạm vi. Prettier 3.6.2: `npm run format`, `npm run format:check`; generated/history files được exclude |
| Lint                   | `npm run lint`                                                      | Exit 0; xử lý lỗi/warning mới liên quan                                                                                     |
| Unit/regression        | `npm test` và coverage hành vi thay đổi                             | Logic, edge/error cases, regression; không chỉ lặp implementation                                                           |
| Build/type             | `npm run build`                                                     | Compile, TypeScript, prerender thành công                                                                                   |
| Production HTTP        | `npm run test:smoke` sau build                                      | Business routes/removed route/ignored legacy query/404/images/headers; dừng đúng server process tạo để test                 |
| Security               | Review source/config/dependency và negative tests liên quan         | Findings, tác động, xử lý/còn lại; scanner sạch không chứng minh an toàn tuyệt đối                                          |
| Browser UI/interaction | Browser thật trên build tương ứng, desktop/mobile và flow ảnh hưởng | Viewport, steps, expected/actual; screenshot cho review layout                                                              |
| Docs/checkpoint        | Kiểm path/URL/script/status, source version và đóng gói             | Docs khớp code cuối; lưu source thành công                                                                                  |

`npm run check` gộp **format → lint → pure/DOM tests → build → HTTP → dependency audit**. Unit cần Node.js >= 22.18; runtime kiểm chứng: 24.19.0. DOM tests dùng jsdom/Testing Library và tsx loader; không đổi module semantics của package. `npm run test:security` chạy dependency audit, còn security source review và browser QA phải làm riêng. Báo cáo hiện tại: `sakura-refactor-review.md`.

## Security theo bề mặt FE hiện tại

- Review diff/config: không lộ secret qua bundle/`NEXT_PUBLIC_*`, log, docs hoặc ZIP; không `eval`/raw HTML từ input; kiểm URL/link/image origin nếu nhận dữ liệu ngoài.
- Kiểm dependency production và tooling, ví dụ `npm audit --json`; ghi ngày, scope, kết quả và ảnh hưởng thực tế. Không tự chạy `npm audit fix --force`. Registry/mạng chặn là BLOCKED, không phải zero vulnerabilities.
- Input tìm kiếm độc hại hiển thị như text, không thực thi script. Kiểm input dài, sort lạ, legacy query bị bỏ qua, /search 404 và unknown slug; giới hạn input ở logic, không chỉ thuộc tính form.
- LocalStorage là dữ liệu không tin cậy: JSON sai, version lạ, key thừa, ID cũ/trùng, storage blocked/quota; không crash, không lấy giá/đơn từ storage, không ghi đè trước restore hoặc rò selection giữa server requests.
- Khi có API/auth thật: thêm server authorization, session/cookie, CSRF/CORS, rate limit, kiểm giá/tồn kho server phù hợp. Bề mặt chưa tồn tại hiện N/A; frontend validation không thay bảo vệ server.
- Chỉ thử app/môi trường được phép, không scan website ngoài. Findings có khả năng lộ secret, thực thi script hoặc bypass quyền phải sửa trước khi công nhận hoàn tất; vấn đề khác ghi tác động/quyết định xử lý, không bỏ qua im lặng.

## Browser matrix / navigation

Tối thiểu **390px mobile và 1440px desktop**. Thêm **320px, 768px** khi layout/shared shell đổi; kiểm 200% zoom khi đổi typography/navigation.

| Flow            | Kỳ vọng cần thao tác kiểm chứng                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Navigation      | Link/active đúng, menu đóng/focus đúng; không CTA trùng trong cùng vùng nhìn thấy                                   |
| Catalog/search  | Apply/reset/no-match/sort/chip tại chỗ; URL/history không đổi; mount lại mặc định; không có /search                 |
| Wishlist/bag    | Save/add/remove/clear cập nhật ngay, URL giữ nguyên; add trùng không tăng bag; View bag chỉ chuyển khi click        |
| Persistence     | Reload giữ lựa chọn; remove/clear không hồi sinh; cross-tab, storage blocked, loading trước restore                 |
| Gallery         | Ảnh fit; Sheet tại chỗ, Escape đóng, focus về trigger; keyboard không lọt ra nền modal                              |
| Responsive/a11y | Không overflow ngang hoặc bottom bar che nội dung; label/alt/focus, keyboard order, touch target, contrast vùng đổi |
| Scroll          | Nội dung đầu trang hiện, reveal nhẹ; reduced motion/no-JS/keyboard không làm mất nội dung hoặc focus vô hình        |
| Runtime         | Không console/hydration errors, request thất bại bất ngờ hoặc asset hỏng trong flow thử                             |

Dùng automation regression phù hợp cho flow quan trọng; thay đổi visual nhỏ có thể browser review có bằng chứng. Không cần E2E cho mỗi dòng CSS. Test reducer không phải đã click thử UI; HTTP không phải browser QA.

## Mẫu kết quả checkpoint

```text
Checkpoint / source version hoặc commit/hash:
Ngày, runtime, môi trường:
Phạm vi thay đổi:
Gate | PASS / FAIL / BLOCKED / N/A | Lệnh hoặc steps | Kết quả / evidence
Defect đã sửa và retest:
Giới hạn / blocker / bước tiếp theo:
Docs và source đã lưu:
```

FAIL phải xử lý/retest. BLOCKED ghi nguyên nhân và cách tiếp tục. N/A cần lý do không áp dụng; thiếu môi trường không phải N/A. Sửa code sau test thì chạy lại gate ảnh hưởng và gate cuối. Không dùng pass cũ cho code mới.

## Baseline rà 2026-09-13

- Source trước sửa docs khớp từng byte ZIP version 3 (57 file). Lượt này chỉ cập nhật rule/docs.
- Kết quả lịch sử 2026-09-10: lint/build pass, 30 unit + 14 HTTP pass; không chạy lại app suite trong lượt docs.
- Chưa có format gate cố định, security/dependency audit được ghi nhận hoặc browser/E2E pass. Một escape case không thay security review.
- Browser trước đây bị chặn bởi preview runner truyền flag không hợp Next CLI. Lần QA tiếp theo dùng môi trường tương thích hiện có; blocker cũ không trở thành quy định của app.
