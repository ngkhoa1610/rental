# Feature & URL catalog

Rà source: 2026-09-13. UI mẫu phía khách hàng; chưa có backend/đặt thuê thật.
Kiến trúc: `PROJECT_STATE.md`. Kiểm chứng: `QA.md`.

## Routes

Path tương đối với origin app; local mặc định `http://localhost:3000`.

| Feature | URL | Hành vi / state | File sở hữu chính |
| --- | --- | --- | --- |
| Landing | `/`, `/#rental-process`, `/#faq` | Hero, lợi ích, quy trình, FAQ tại chỗ, sample looks; link catalog/detail | `src/app/page.tsx` |
| Catalog | `/products` | Search/filter/sort qua URL; grid/empty, apply/reset | `src/app/(store)/products/page.tsx`, `src/components/store/catalog-view.tsx` |
| Search | `/search` | CatalogView dùng chung, heading tìm kiếm, empty/reset | `src/app/(store)/search/page.tsx` |
| Collections | `/collections` | 3 editorial collection, mở catalog lọc collection | `src/app/(store)/collections/page.tsx` |
| Lookbook | `/lookbook` | 3 story, mở catalog lọc occasion | `src/app/(store)/lookbook/page.tsx` |
| Detail | `/products/[slug]` | Ảnh/giá mẫu/mô tả, fit/care chưa xác nhận, related looks; gallery Sheet, save/add tại chỗ; slug lạ 404 | `src/app/(store)/products/[slug]/page.tsx`, `src/components/store/product-gallery.tsx` |
| Wishlist | `/wishlist` | Chờ restore, danh sách/empty; unsave tại chỗ | `src/components/store/saved-looks.tsx` |
| Rental bag | `/cart` | Chờ restore, danh sách/empty; remove/clear/save tại chỗ; subtotal giá mẫu; chưa checkout | `src/components/store/rental-bag.tsx` |

Slug hiện có: `muse-dress`, `luna-set`, `soleil-top`; ví dụ `/products/muse-dress`.
`src/app/(store)/loading.tsx` cung cấp loading shell. Lỗi storage có feedback fallback riêng, không phải lỗi API.

## Query của `/products` và `/search`

| Query | Giá trị / hành vi |
| --- | --- |
| `q` | Trim, tối đa 120 ký tự; không phân biệt hoa/thường; tất cả từ phải khớp name/category/collection/occasion |
| `category` | `Dresses`, `Sets`, `Tops`, `Outerwear`; Outerwear hiện rỗng |
| `occasion` | `Date night`, `Wedding guest`, `Party`, `Vacation`, `Weekend` |
| `collection` | `The Occasion Edit`, `Weekend Edit`, `Everyday Edit` |
| `sort` | `featured` mặc định, `price-asc`, `price-desc`; giá trị lạ fallback featured |

Query lặp lấy giá trị đầu; trim tham số; category/occasion/collection lạ cho empty. Các filter kết hợp AND. Ví dụ `/products?category=Sets&occasion=Vacation&sort=price-asc`, `/search?q=wedding%20guest`. Reset về cùng pathname không query. Query có thể chia sẻ; save/add không đổi URL.

## Feature dùng chung

| Feature | Hành vi và giới hạn | Source / coverage hiện có |
| --- | --- | --- |
| Navigation | Header/footer, bottom tabs và mobile Sheet; active mobile tab | `src/components/layout/`; HTTP shell checks, browser chưa xác minh |
| Selection | Toggle wishlist; add bag idempotent/remove/clear; counter/feedback tại chỗ; disabled trước restore | `src/components/store/selection-actions.tsx`, `src/components/store/selection-provider.tsx`; selection/store unit tests |
| Persistence | `rental-store.selection.v1`; chỉ slug wishlist/bag; lọc dữ liệu sai/ID cũ/trùng; storage lỗi giữ memory; cross-tab last-write-wins | `src/lib/rental-selection.ts`; `tests/selection-storage.test.mjs` |
| Gallery | Một ảnh mẫu; Sheet tại trang, close/Escape; focus cần kiểm browser | `src/components/store/product-gallery.tsx`; browser QA thiếu |
| Scroll | Reveal ngoài viewport; chuyển động nhỏ; nhánh reduced motion/focus/no-JS | `src/components/ui/scroll-reveal.tsx`; browser QA thiếu |
| Catalog data | 3 sản phẩm, giá ví dụ VND/3 ngày, Unsplash inspiration; không phải inventory | `src/lib/catalog.ts`; `tests/catalog.test.mjs` |

## Chưa làm / cần rà tiếp

- Chưa có API, auth/account, checkout/payment, booking, đơn hàng, admin, tồn kho hoặc lịch thuê thật. Không lưu token/PII trong selection. Chưa có bộ validation form/popup hoàn chỉnh.
- Security coverage hiện có một HTTP case escape query và unit cases query/storage không hợp lệ; chưa phải security audit đầy đủ.
- Source header có hai link “Explore looks”; catalog empty có cả Clear filters và Reset filters. Kiểm vùng hiển thị theo breakpoint rồi loại trùng có chủ đích trong task UI tiếp theo.
- `/search` và `/products` dùng chung UI; giữ contract hiện tại, không tự xóa route trong lượt rule/docs.

## Mẫu bổ sung feature

**Mục đích · URL/query · Thao tác/navigation · States · Data/API/storage · File sở hữu · Test/evidence · Giới hạn.** Tách doc riêng nếu dài và link từ catalog này.
