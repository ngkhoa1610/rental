# Bộ nhớ dự án — đọc trước khi tiếp tục

Checkpoint: **2026-09-20 — Lookbook role & compact feedback layout**.
Baseline: full-source **version 8**, đã đối chiếu 84 file khớp source trước sửa. Source đầy đủ tiếp tục lưu theo phiên bản ở `rental-main.zip`. Gói bàn giao: `rental-store-lookbook-feedback-changes-2026-09-20-r01.zip`; xem `lookbook-feedback-handoff.md`; không xóa/rename file.

## Quyết định phải giữ

- **Người dùng đã nghiệm thu layout UI**. Không thiết kế lại grid, container 1.200px, lề đối xứng `clamp(1rem, 3vw, 2rem)`, breakpoint và khung ảnh khi chỉ đổi theme/tính năng.
- Theme mới: nền hồng phấn/hoa anh đào, chữ và CTA rose đậm đủ tương phản. Ba ảnh outfit được tạo mới, lưu local và dùng nhất quán trên landing/catalog/detail/editorial.
- **Chỉ business có route**: `/`, `/products`, `/products/[slug]`, `/collections`, `/lookbook`, `/feedback`, `/wishlist`, `/cart`. Đã bỏ `/search`. Search/filter/sort/chip/reset/Sheet/scroll section không đổi URL hoặc history. Chỉ skip link accessibility được dùng fragment.
- Catalog dùng draft/applied state tại trang; Apply cập nhật grid; clear/chip trả focus phù hợp. Mount lại bắt đầu với catalog mặc định. Không lưu/chia sẻ filter qua URL.
- Source gọn theo tính năng: `catalog.tsx` sở hữu form/chips/grid; `site-header.tsx` sở hữu nav/menu; clear confirmation nằm trong `rental-bag.tsx`. Giữ riêng logic selection và adapter React vì có trách nhiệm storage/SSR/test rõ ràng.
- Sau **mỗi lượt code và mỗi lần nhận source hiện tại**: đối chiếu baseline, cập nhật memory/docs/test status rồi lưu source mới có phiên bản.
- Output chỉ file mới/thay đổi, giữ path và nội dung đầy đủ; liệt kê file xóa/rename. Không gửi full source trừ khi yêu cầu. Naming theo `WORKFLOW.md` mục 7.
- Format/lint/tests/build/security/browser UI là gate thường trực; báo đúng PASS/FAIL/BLOCKED. Không gọi DOM tests là browser visual QA.
- Giữ scroll reveal nhẹ, reduced motion, keyboard và no-JS visibility. Không thêm BE/database trong lượt này.
- Catalog/ảnh/giá là sample. Selection lưu thiết bị; chưa có booking, payment, account hoặc tồn kho thật.

## Bổ sung ngày 2026-09-20

- `/feedback` là business page mới: grid hai cột liền mạch, quote/card/ảnh phối cạnh nội dung, sắc hồng–tím–lime; hover nâng/xoay rõ trên chuột, mobile một cột thẳng hàng, reduced motion không dịch chuyển. Các trang đã duyệt giữ layout.
- Sáu feedback là ví dụ minh họa, không phải đánh giá thật. Form tên/rating/story tạo một preview private trong memory của component, mất khi rời trang/reload. Có share thiết bị, clipboard và manual-copy fallback; không đăng công khai, không lưu dữ liệu này vào localStorage/BE.
- ScrollReveal: dịch chuyển mặc định 10px (cap 16), opacity 420ms/transform 680ms, delay cap 120ms, trigger trước viewport 64px. Near-viewport/no-JS/reduced motion/keyboard/fast-scroll đều không để nội dung bị ẩn.
- Feature/UI chính ở `src/components/store/feedback-wall.tsx`, dữ liệu/validation/share text ở `src/lib/feedback.ts`; CSS riêng tại route. Không thêm dependency/provider/router-state.
- Docs chi tiết: `feedback-wall.md`. Kiểm thử mới và browser blocker: `feedback-motion-review.md`.

## UI revision cùng ngày

- Lookbook là hướng dẫn phối đồ theo dịp: cách phối, phụ kiện gợi ý, biến tấu và món chính. Giá/tên/số ngày lấy từ catalog; phụ kiện không được hiểu là món thuê kèm. Shortcut scroll/focus tại trang, không thay URL/history. Giữ grid, khung ảnh và lề cũ.
- Feedback bỏ span hàng, chỉ định cột/offset thủ công và negative margin làm trống grid. Hai cột, card cùng hàng giãn đầy; ảnh ngang cạnh quote từ 1100px, ảnh phía trên ở màn hình nhỏ hơn; một cột dưới 768px. Giữ sample/private labels, share và reduced motion.
- Full gate hiện tại: 37 pure + 27 DOM tests, 24 HTTP checks, format/lint/build PASS; audit 0 vulnerabilities. Browser QA vẫn BLOCKED khi mở localhost (`ERR_BLOCKED_BY_CLIENT`); xem `lookbook-feedback-review.md`.
- Chỉ cập nhật memory/source cho FE đã làm. Plan BE chờ người dùng duyệt; chưa ghi nội dung plan, chưa chọn kiến trúc hay triển khai BE.

## Đọc tiếp

| Cần biết                | Tài liệu                               |
| ----------------------- | -------------------------------------- |
| Rule FE/Next.js         | `../AGENTS.md`, `WORKFLOW.md`          |
| Feature/route/state     | `FEATURES.md`                          |
| Kiến trúc/data boundary | `PROJECT_STATE.md`                     |
| QA hiện tại             | `lookbook-feedback-review.md`, `QA.md` |
| Áp dụng delta           | `lookbook-feedback-handoff.md`         |
| Ảnh và prompt           | `image-sources.md`                     |

Rule ngày 2026-09-15 ưu tiên hơn handoff cũ cho phép query filter và ghi layout chưa được nghiệm thu. Kết quả cũ chỉ là lịch sử; không chuyển pass sang source chưa test. Browser regression của theme mới và các giới hạn hiện tại được ghi trong review, độc lập với việc người dùng đã duyệt layout.
