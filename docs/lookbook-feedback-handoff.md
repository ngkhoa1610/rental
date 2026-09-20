# Lookbook / feedback — changed-file handoff

Ngày: **2026-09-20**. Baseline: source **version 8** (feedback & motion).
Gói: `rental-store-lookbook-feedback-changes-2026-09-20-r01.zip`.

## Áp dụng

**Có thể copy đè. Không xóa hoặc đổi tên file nào.**

1. Backup nếu đã chỉnh source sau version 8.
2. Giải nén vào root project có `package.json`, giữ nguyên đường dẫn. Gói chứa 16 file mới/thay đổi với nội dung đầy đủ, không phải project độc lập.
3. Dependency/lockfile không đổi. Chạy `npm ci` nếu cần cài, sau đó `npm run check` và `npm run dev`.
4. Mở `/lookbook`: chọn dịp để scroll/focus tại chỗ, đọc cách phối và mở món chính. Mở `/feedback`: kiểm grid liền mạch, ảnh/card/hover và preview/share.

## Đã làm và kiểm chứng

- Lookbook có vai trò hướng dẫn phối đồ; giữ layout/khung ảnh/lề đã duyệt. Các shortcut không thay URL/history.
- Feedback gọn hơn, bỏ ô trống do span hàng/cột và offset; giữ nét collage qua màu, độ xoay nhỏ và hover. Card co giãn theo nội dung, không cắt quote.
- PASS format/lint/build, **64 tests**, **24 HTTP checks**; audit **0 vulnerabilities**.
- Browser QA **BLOCKED** do localhost `ERR_BLOCKED_BY_CLIENT`. Chưa kiểm chứng visual/crop/hover/hydration thực tế; xem `lookbook-feedback-review.md`.
- Memory/docs cập nhật cho FE. Plan BE chỉ trình trong chat để duyệt, chưa ghi nội dung vào memory và chưa triển khai.

## Added (4)

- `docs/lookbook-feedback-handoff.md`
- `docs/lookbook-feedback-review.md`
- `docs/lookbook-guide.md`
- `tests/lookbook-interactions.test.jsx`

## Modified (12)

- `README.md`
- `docs/FEATURES.md`
- `docs/PROJECT_MEMORY.md`
- `docs/PROJECT_STATE.md`
- `docs/QA.md`
- `docs/WORKFLOW.md`
- `docs/feedback-wall.md`
- `scripts/smoke-test.mjs`
- `src/app/(store)/feedback/feedback.css`
- `src/app/(store)/lookbook/page.tsx`
- `src/app/(store)/store.css`
- `src/components/store/feedback-wall.tsx`

## Deleted / renamed

Không có.

Git message: `fix(fe): clarify lookbook styling guides and compact feedback layout`.
