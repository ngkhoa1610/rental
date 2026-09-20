# Sakura refactor — changed-file handoff

Ngày: **2026-09-15**. Baseline: full-source **version 6**, gói FE polish ngày 2026-09-14. Delta: `rental-store-sakura-refactor-changes-2026-09-15-r01.zip`.

Gói này chứa **29 file mới/thay đổi**, nội dung đầy đủ và path tương đối từ root project; **12 file cũ cần xóa** ở danh sách bên dưới. Không phải source độc lập. Full checkpoint vẫn lưu riêng để tiếp tục dự án.

## Áp dụng

1. Giữ bản backup source đang dùng. Đối chiếu nếu bạn có sửa thêm sau baseline version 6.
2. Giải nén delta vào root project chứa `package.json`, copy đè các file cùng path. Không tạo thêm thư mục `rental-main` bên trong project.
3. Xóa chính xác các file trong mục Deleted. Đặc biệt phải bỏ `src/app/(store)/search/page.tsx`, nếu không Next vẫn tạo route `/search`. Folder rỗng có thể xóa.
4. Khi dừng dev server, đổi tên hoặc dọn cache build `.next` để Next sinh lại route types (cache cũ có thể còn trỏ `/search`). Không đưa cache vào source.
5. Dependencies không đổi; dùng Node >=22.18, `npm ci` nếu chưa có dependencies, rồi `npm run check` và `npm run dev`.

Theme/ảnh đã đổi sang hoa anh đào/hồng phấn; geometry layout đã nghiệm thu được giữ. Search/filter/sort/chip/reset tại catalog không đổi URL/history; collections/lookbook mở trang sản phẩm tương ứng. Filter không chia sẻ qua URL và trở về mặc định khi Catalog mount lại. Wishlist/bag vẫn lưu riêng trên thiết bị.

Đã pass format/lint/48 tests/build/21 HTTP/audit (0 vulnerabilities). Browser regression bị chặn bởi `ERR_BLOCKED_BY_CLIENT`; xem `sakura-refactor-review.md`. Đã cập nhật rules, memory, architecture, feature URLs, QA và nguồn ảnh. Chưa thêm BE/database.

## Added (7)

- `docs/sakura-refactor-handoff.md`
- `docs/sakura-refactor-review.md`
- `public/images/sakura-luna-set.png`
- `public/images/sakura-muse-dress.png`
- `public/images/sakura-soleil-top.png`
- `src/components/store/catalog.tsx`
- `src/components/ui/section-button.tsx`

## Modified (22)

- `AGENTS.md`
- `README.md`
- `docs/FEATURES.md`
- `docs/PROJECT_MEMORY.md`
- `docs/PROJECT_STATE.md`
- `docs/QA.md`
- `docs/WORKFLOW.md`
- `docs/image-sources.md`
- `scripts/smoke-test.mjs`
- `src/app/(store)/collections/page.tsx`
- `src/app/(store)/lookbook/page.tsx`
- `src/app/(store)/products/[slug]/page.tsx`
- `src/app/(store)/products/page.tsx`
- `src/app/(store)/store.css`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/store/rental-bag.tsx`
- `src/lib/catalog.ts`
- `tests/catalog.test.mjs`
- `tests/interactions.test.jsx`

## Deleted — cần xóa (12)

- `public/images/hero-street-style.jpg`
- `public/images/luna-set.jpg`
- `public/images/muse-dress.jpg`
- `public/images/rental-edit.jpg`
- `public/images/soleil-wardrobe.jpg`
- `public/images/summer-editorial.jpg`
- `src/app/(store)/search/page.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/nav-link.tsx`
- `src/components/store/catalog-form.tsx`
- `src/components/store/catalog-view.tsx`
- `src/components/store/clear-bag-button.tsx`

## Quan hệ thay thế

| File cũ                             | Chủ sở hữu mới                                               |
| ----------------------------------- | ------------------------------------------------------------ |
| catalog-form.tsx + catalog-view.tsx | `src/components/store/catalog.tsx`                           |
| mobile-nav.tsx + nav-link.tsx       | Helper private trong `src/components/layout/site-header.tsx` |
| clear-bag-button.tsx                | Helper private trong `src/components/store/rental-bag.tsx`   |
| 6 ảnh JPG cũ                        | 3 ảnh `sakura-*.png`; xem `image-sources.md`                 |
| `/search` page                      | Đã xóa; tìm kiếm nằm tại `/products`                         |

Không rename nguyên xi; đây là các thay thế/consolidation có thay đổi nội dung. Không giữ file cũ để tránh route/import lỗi hoặc hiểu nhầm nguồn chuẩn.

Git message gợi ý: `refactor(fe): apply sakura theme and keep catalog actions local`.
