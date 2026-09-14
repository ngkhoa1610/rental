# Bộ nhớ dự án — đọc trước khi tiếp tục

Checkpoint docs: **2026-09-14 — changed-files delivery & naming rules**.
Source đầy đủ nội bộ: **`rental-main.zip`**. Baseline lượt này là checkpoint version 4, khớp 60/60 file local trước sửa. Gói bàn giao chỉ chứa file thay đổi, không phải full source. Lượt này không sửa code ứng dụng, dependency hoặc test script.

Đây là bộ nhớ bền của dự án đi cùng source. Code đầy đủ nằm trong ZIP/repository, không nằm trong đoạn tóm tắt hội thoại. Khi tiếp tục phải mở source mới nhất và đọc docs; không giả định lịch sử chat/bộ nhớ mô hình giữ toàn bộ code.

## Quyết định phải giữ

- Chỉ output file mới/thay đổi so với baseline, giữ path và nội dung file đầy đủ; liệt kê delete/rename. Không gửi lại full source trừ khi được yêu cầu.
- Tên file phải có nghĩa và theo quy ước ở `WORKFLOW.md` mục 7; gói dùng project/scope/changes/ngày/rNN. Checkpoint nội bộ vẫn giữ code đầy đủ.

- Landing tạm được chấp nhận; tiếp tục UI khách hàng theo phong cách hiện có, FE/Next.js dễ đọc và maintain.
- Scroll animation nhẹ đã có; giữ reduced motion, keyboard và no-JS visibility.
- Sau mỗi lượt code **và mỗi lần nhận source hiện tại**: đối chiếu baseline, cập nhật memory/docs/test status rồi lưu source mới có phiên bản.
- Docs đủ feature, URL/query, hành vi, state, dữ liệu, file chính và giới hạn.
- Sau code kiểm format, lint, tests, build, security và browser UI; báo đúng blocker, không coi HTTP/build là UI QA.
- Tính năng tại trang xử lý tại chỗ, tránh navigate/CTA/reset thừa. Query cho filter và link đổi đích chủ động vẫn hợp lệ.
- Catalog/giá/ảnh là sample; selection lưu thiết bị. Chưa có booking/payment/account/backend thật.

## Đọc tiếp

| Cần biết | Tài liệu |
| --- | --- |
| Rule cho agent | `../AGENTS.md` |
| Nhận source → code → QA → lưu | `WORKFLOW.md` |
| Feature, URL, thao tác | `FEATURES.md` |
| Kiến trúc/dữ liệu/triển khai | `PROJECT_STATE.md` |
| Gate và mẫu evidence | `QA.md` |

## Kiểm chứng và bước tiếp theo

- Lịch sử app 2026-09-10: lint/build pass, 30 unit + 14 HTTP pass. Browser chưa kiểm chứng do runner cũ không tương thích; chưa security audit đầy đủ hoặc format gate cố định.
- Lượt 2026-09-13: rà source, cập nhật rule/docs và kiểm tính nhất quán tài liệu/source; không tuyên bố chạy lại app tests.
- Task code tiếp theo cần xử lý gap format/security tooling và môi trường browser phù hợp, rồi review UI thực tế gồm Explore/reset filter trùng. Đây là backlog, chưa triển khai.
- Nhận source mới phải cập nhật checkpoint này ngay; giữ lịch sử ở `PROJECT_STATE.md`, không chuyển pass cũ sang source chưa test.

- Lượt 2026-09-14 chỉ cập nhật rule/docs về output và naming; kiểm gói chỉ chứa file thay đổi, code ứng dụng không đổi, không chạy lại app suite.
