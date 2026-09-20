# Bộ nhớ dự án — đọc trước khi tiếp tục

Checkpoint: **2026-09-15 — Sakura theme & local feature interactions**.
Baseline: full-source **version 6**, đã lưu tại checkpoint 2026-09-14. Source đầy đủ tiếp tục lưu theo phiên bản ở `rental-main.zip`. Gói bàn giao lượt này: `rental-store-sakura-refactor-changes-2026-09-15-r01.zip`; xem `sakura-refactor-handoff.md` để áp dụng và xóa file cũ.

## Quyết định phải giữ

- **Người dùng đã nghiệm thu layout UI**. Không thiết kế lại grid, container 1.200px, lề đối xứng `clamp(1rem, 3vw, 2rem)`, breakpoint và khung ảnh khi chỉ đổi theme/tính năng.
- Theme mới: nền hồng phấn/hoa anh đào, chữ và CTA rose đậm đủ tương phản. Ba ảnh outfit được tạo mới, lưu local và dùng nhất quán trên landing/catalog/detail/editorial.
- **Chỉ business có route**: `/`, `/products`, `/products/[slug]`, `/collections`, `/lookbook`, `/wishlist`, `/cart`. Đã bỏ `/search`. Search/filter/sort/chip/reset/Sheet/scroll section không đổi URL hoặc history. Chỉ skip link accessibility được dùng fragment.
- Catalog dùng draft/applied state tại trang; Apply cập nhật grid; clear/chip trả focus phù hợp. Mount lại bắt đầu với catalog mặc định. Không lưu/chia sẻ filter qua URL.
- Source gọn theo tính năng: `catalog.tsx` sở hữu form/chips/grid; `site-header.tsx` sở hữu nav/menu; clear confirmation nằm trong `rental-bag.tsx`. Giữ riêng logic selection và adapter React vì có trách nhiệm storage/SSR/test rõ ràng.
- Sau **mỗi lượt code và mỗi lần nhận source hiện tại**: đối chiếu baseline, cập nhật memory/docs/test status rồi lưu source mới có phiên bản.
- Output chỉ file mới/thay đổi, giữ path và nội dung đầy đủ; liệt kê file xóa/rename. Không gửi full source trừ khi yêu cầu. Naming theo `WORKFLOW.md` mục 7.
- Format/lint/tests/build/security/browser UI là gate thường trực; báo đúng PASS/FAIL/BLOCKED. Không gọi DOM tests là browser visual QA.
- Giữ scroll reveal nhẹ, reduced motion, keyboard và no-JS visibility. Không thêm BE/database trong lượt này.
- Catalog/ảnh/giá là sample. Selection lưu thiết bị; chưa có booking, payment, account hoặc tồn kho thật.

## Đọc tiếp

| Cần biết                | Tài liệu                             |
| ----------------------- | ------------------------------------ |
| Rule FE/Next.js         | `../AGENTS.md`, `WORKFLOW.md`        |
| Feature/route/state     | `FEATURES.md`                        |
| Kiến trúc/data boundary | `PROJECT_STATE.md`                   |
| QA hiện tại             | `sakura-refactor-review.md`, `QA.md` |
| Áp dụng delta           | `sakura-refactor-handoff.md`         |
| Ảnh và prompt           | `image-sources.md`                   |

Rule ngày 2026-09-15 ưu tiên hơn handoff cũ cho phép query filter và ghi layout chưa được nghiệm thu. Kết quả cũ chỉ là lịch sử; không chuyển pass sang source chưa test. Browser regression của theme mới và các giới hạn hiện tại được ghi trong review, độc lập với việc người dùng đã duyệt layout.
