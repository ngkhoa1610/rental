# Feedback & motion — changed-file handoff

Ngày: **2026-09-20**. Baseline: source **version 7**, gói Sakura ngày 2026-09-15.
Gói: `rental-store-feedback-motion-changes-2026-09-20-r01.zip`.

## Áp dụng

**Lượt này không có file xóa/rename. Có thể copy đè trực tiếp.**

1. Backup source nếu bạn có chỉnh thêm sau baseline version 7.
2. Giải nén vào root project chứa `package.json`, giữ nguyên đường dẫn tương đối. Gói gồm 23 file mới/thay đổi, nội dung đầy đủ; không phải project chạy độc lập.
3. Dependency/lockfile không đổi. Dùng `npm ci` nếu chưa cài, rồi `npm run check` và `npm run dev`.
4. Mở `/feedback` qua menu/footer. Kiểm hover/scroll và form preview/share. Khi build báo lỗi cache cũ, dừng dev server rồi đổi tên/dọn `.next` và build lại.

## Kết quả và giới hạn

- Scroll reveal nhẹ hơn, trigger sớm, keyboard/reduced-motion hiện ngay.
- Feedback wall collage trẻ trung, hover rõ; mobile một cột, không nghiêng thẻ. Giữ layout các trang cũ.
- Feedback mẫu ghi rõ minh họa. Composer chỉ tạo preview private tại trang; chưa đăng công khai/lưu server. Share có native menu, clipboard và manual-copy fallback.
- PASS format/lint/build/**62 tests**/**23 HTTP checks**/audit **0 vulnerabilities**.
- Browser UI regression bị chặn bởi `ERR_BLOCKED_BY_CLIENT`; không tuyên bố đã kiểm hình ảnh/độ mượt thực tế. Chi tiết: `feedback-motion-review.md`.
- Đã cập nhật rule, memory, feature/URL và kiến trúc; source checkpoint đầy đủ lưu riêng. Gói chỉ chứa file thay đổi.

## Added (9)

- `docs/feedback-motion-handoff.md`
- `docs/feedback-motion-review.md`
- `docs/feedback-wall.md`
- `src/app/(store)/feedback/feedback.css`
- `src/app/(store)/feedback/page.tsx`
- `src/components/store/feedback-wall.tsx`
- `src/lib/feedback.ts`
- `tests/feedback-interactions.test.jsx`
- `tests/feedback.test.mjs`

## Modified (14)

- `AGENTS.md`
- `README.md`
- `docs/FEATURES.md`
- `docs/PROJECT_MEMORY.md`
- `docs/PROJECT_STATE.md`
- `docs/QA.md`
- `docs/WORKFLOW.md`
- `scripts/smoke-test.mjs`
- `src/app/globals.css`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/ui/scroll-reveal.tsx`
- `tests/interactions.test.jsx`
- `tests/motion.test.jsx`

## Deleted / renamed

Không có.

Git message: `feat(fe): add playful feedback wall and refine scroll motion`.
