# Quy trình làm việc — Rental Store

Cập nhật: 2026-09-15. Áp dụng thường trực theo yêu cầu người dùng, không chờ nhắc lại.

## 1. Nhận source / tiếp tục công việc

- Đọc `AGENTS.md`, `PROJECT_MEMORY.md`, `PROJECT_STATE.md`, docs feature và source liên quan.
- Xác định source mới nhất bằng phiên bản/commit và đối chiếu nội dung. Không quay lại ZIP upload ban đầu khi đã có bản mới.
- Mỗi lần người dùng gửi source hiện tại: ghi nguồn, ngày nhận, phiên bản/hash nếu có, khác biệt và trạng thái test. Giữ checkpoint trước, không ghi đè thay đổi đang làm một cách mù quáng.
- Source được người dùng xác nhận là hiện tại trở thành baseline mới. Nếu các bản mâu thuẫn chưa xác định được, hoàn thành so sánh rồi mới hỏi.
- Cập nhật memory ngay cả khi chỉ nhận source, chưa code. Test của bản cũ không tự động là kết quả của source mới.
- Nêu phạm vi và acceptance criteria có thể kiểm chứng; tiếp tục phần đã được yêu cầu. Không tự bịa policy, dữ liệu thật hoặc API. Yêu cầu mới của người dùng ưu tiên hơn giới hạn phase cũ.

## 2. Code FE / Next.js

- Tuân thủ `AGENTS.md`; giữ stack hiện có, TypeScript strict, đọc tài liệu Next.js cài tại `node_modules/next/dist/docs/` cho API liên quan.
- Mặc định Server Component; Client Component chỉ tại biên cần state/browser API. Page phụ trách composition, logic thuần trong `src/lib`, UI dùng lại trong `src/components`.
- Catalog và selection dùng một nguồn dữ liệu/logic. Reuse primitive có sẵn; không thêm dependency hoặc abstraction chưa có nhu cầu cụ thể.
- Layout UI đã được người dùng nghiệm thu ngày 2026-09-15. Giữ grid, container, lề và khung ảnh; palette hiện tại là sakura/hồng phấn. Gom helper chỉ dùng một nơi vào feature sở hữu, không tạo wrapper/barrel/provider khi chưa có lợi ích cụ thể.
- Giữ thiết kế landing đã chấp nhận; có responsive, accessibility, loading/empty/error/not-found phù hợp. Không nuốt lỗi để hiển thị thành công giả.
- ScrollReveal chuyển động nhỏ, không chặn nội dung đầu trang; hỗ trợ reduced motion, keyboard và nội dung hiện khi tắt JavaScript.

## 3. Không điều hướng thừa

| Ý định                                 | Cách xử lý                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Save/unsave, add/remove/clear bag      | Button cập nhật tại chỗ và feedback rõ; không tự chuyển trang                  |
| Xem toàn ảnh, FAQ, thông tin bổ sung   | Sheet/disclosure trong trang; đóng trả focus phù hợp                           |
| Search/filter/sort trên catalog        | State React tại trang; native form preventDefault; không đổi URL/history       |
| Xem sản phẩm khác hoặc chủ động mở giỏ | Link tới URL thật vì người dùng đổi đích đến                                   |
| Đi tới section có sẵn                  | Button scroll/focus tại chỗ; reduced motion; skip link a11y được dùng fragment |

Trong cùng vùng nhìn thấy, mỗi mục đích có một CTA chính. Tránh nav và CTA trùng vai trò cạnh nhau hoặc hai nút reset cùng bộ lọc. Global navigation có thể lặp ở header/footer khi phục vụ ngữ cảnh khác. Chỉ tạo route cho business: `/`, `/products`, `/products/[slug]`, `/collections`, `/lookbook`, `/wishlist`, `/cart`. `/search` đã bỏ theo yêu cầu 2026-09-15; không khôi phục rule query filter trong tài liệu cũ.

Không lồng button trong link, dùng `href="#"` giả, reload sau thao tác local, tự redirect khi mở popup, hoặc tạo history entry không có trạng thái hữu ích. Giữ scroll/focus/filter/selection khi hợp lý. Optional “View bag” sau add là hợp lệ nếu người dùng chủ động click.

## 4. Kiểm tra sau code

1. Format rồi check format; chạy lint, meaningful unit/regression tests, build và production HTTP smoke.
2. Security: review bề mặt thay đổi, dependency và negative tests cho dữ liệu không tin cậy liên quan.
3. Browser UI/interaction desktop và mobile: responsive, keyboard, state, navigation, console/hydration/network lỗi.
4. Sửa lỗi, chạy lại test bị ảnh hưởng và gate cuối trên code cuối.
5. Ghi PASS / FAIL / BLOCKED / N/A cùng lệnh/steps, kết quả và bằng chứng theo `QA.md`. Thiếu môi trường là BLOCKED; N/A cần lý do không áp dụng.

`npm run check` hiện gồm format/lint/pure tests/DOM tests/build/HTTP/dependency audit; vẫn cần security source review và browser UI riêng. DOM tests không kiểm layout/hydration. Browser QA là yêu cầu thường trực, không cần người dùng nhắc. Có thể lưu checkpoint bị chặn, nhưng không tuyên bố implementation đã đủ kiểm chứng.

Nếu chỉ sửa docs và đối chiếu byte/hash xác nhận code/config/dependency không đổi: kiểm nội dung, link, URL, command và archive; không cần chạy lại app suite. Phải ghi rõ app test cũ là lịch sử, không phải kết quả lượt mới.

## 5. Docs đi cùng feature

| Tài liệu            | Vai trò                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `../AGENTS.md`      | Rule bắt buộc cho người/agent tiếp tục code                          |
| `PROJECT_MEMORY.md` | Điểm bắt đầu: source mới nhất, quyết định, checkpoint, bước tiếp     |
| `PROJECT_STATE.md`  | Kiến trúc, dữ liệu, trạng thái triển khai và lịch sử kiểm chứng      |
| `FEATURES.md`       | Catalog feature, URL/query, thao tác, state, file sở hữu và giới hạn |
| `QA.md`             | Gate, tình huống kiểm thử, bằng chứng, khoảng trống kiểm chứng       |
| `WORKFLOW.md`       | Quy trình hiện tại; tránh sao chép nhiều bản rule độc lập            |

Mỗi feature thêm/sửa phải cập nhật cùng lượt: mục đích; URL/query; thao tác tại trang/navigation; loading/empty/error phù hợp; data/API/storage; file chính; test; giới hạn/chưa làm. Viết ngắn, dùng bảng để tra cứu. Feature lớn có thể tách `features/<name>.md` và link từ catalog. Chưa có backend thì ghi rõ, không viết endpoint giả.

## 6. Memory và lưu source

- Sau mỗi lượt code và mỗi lần nhận source hiện tại: cập nhật checkpoint, docs, quyết định, evidence test và việc còn lại trước khi bàn giao.
- Bộ nhớ dự án là docs đi cùng source có phiên bản. Toàn bộ code nằm trong archive/repository; không chỉ tóm tắt vào chat rồi coi là đã lưu code.
- Checkpoint nội bộ: lưu toàn bộ source + lockfile + tests + docs + rule vào `rental-main.zip`, cập nhật cùng artifact để giữ lịch sử. Không kèm dependency đã cài, build/cache/log, secret, `.env` chứa giá trị thật hoặc Git internals; giữ config cần tái tạo app.
- Nếu dự án chuyển sang Git repository bên ngoài: dùng commit/checkpoint Git và docs trong repo, không duy trì thêm bản source song song gây lệch phiên bản.
- Xác nhận lưu thành công trước khi nói đã lưu; nếu lỗi phải báo rõ và giữ bản local để khôi phục. Không tự deploy/publish khi chỉ được yêu cầu code và lưu.
- Bàn giao ngắn: thay đổi, test thực sự chạy, giới hạn/blocker, link source. Có FAIL/BLOCKED thì ghi là checkpoint chưa đủ kiểm chứng.

## 7. Output chỉ file thay đổi và quy tắc đặt tên

Rule bổ sung 2026-09-14 có ưu tiên hơn yêu cầu bàn giao toàn bộ ZIP trước đây.

- Output mặc định chỉ gồm file mới hoặc nội dung đã thay đổi so với source người dùng gửi hiện tại hoặc bản bàn giao gần nhất đã xác định. So sánh nội dung/hash hoặc Git diff, không dựa riêng vào timestamp. Không gửi lại file không đổi.
- Gửi nội dung đầy đủ của từng file thay đổi, không chỉ đoạn code rời; giữ nguyên đường dẫn tương đối từ root dự án để copy đè đúng chỗ. File phụ thuộc/lockfile chỉ kèm nếu thực sự đổi.
- Có file xóa hoặc đổi tên: liệt kê rõ đường dẫn cũ → mới hoặc cần xóa; không để người dùng giữ nhầm file cũ. Không tự xóa thay đổi riêng của người dùng.
- Ghi baseline, danh sách added/modified/deleted/renamed, hướng dẫn áp dụng và kết quả kiểm tra trong phần bàn giao hoặc tài liệu thay đổi. Không có thay đổi thì không tạo ZIP rỗng.
- Bộ nhớ nội bộ vẫn lưu checkpoint đầy đủ để tiếp tục chính xác; chỉ đính kèm gói thay đổi cho người dùng. Full source chỉ output khi người dùng yêu cầu. Gói thay đổi không phải project độc lập để chạy ngay.

| Loại tên                 | Quy ước                                                                                                      | Ví dụ                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Gói bàn giao thay đổi    | `<project>-<scope>-changes-YYYY-MM-DD-rNN.zip`; scope ngắn, có nghĩa; ngày UTC; rNN tăng nếu cùng scope/ngày | `rental-store-delivery-rules-changes-2026-09-14-r01.zip`     |
| File source thông thường | Tiếng Anh, kebab-case, theo feature/vai trò; không gắn ngày/version vào tên import                           | `product-gallery.tsx`, `rental-selection.ts`                 |
| Component / hook / hàm   | Component PascalCase; hook useCamelCase; hàm/biến camelCase                                                  | `ProductGallery`, `useSelection`, `normalizeCatalogFilters`  |
| Test                     | Theo module/flow và convention test runner hiện có                                                           | `selection-storage.test.mjs`                                 |
| Docs mới                 | Tên mô tả nội dung, kebab-case; giữ nguyên tên docs/convention đang dùng                                     | `wishlist-behavior.md`; giữ `PROJECT_MEMORY.md`, `AGENTS.md` |
| File framework/config    | Giữ đúng tên bắt buộc hoặc convention công cụ                                                                | `page.tsx`, `layout.tsx`, `not-found.tsx`, `package.json`    |

Không dùng tên mơ hồ như `final`, `new`, `latest-v2`, `fix2`, `test123`; tránh dấu tiếng Việt/khoảng trắng trong tên mới. Không đổi tên hàng loạt file hiện có chỉ để hợp rule; rename phải có lý do và cập nhật import/docs liên quan. Tên checkpoint canonical đang dùng được giữ ổn định, phiên bản quản lý bằng lịch sử thay vì rename liên tục.
