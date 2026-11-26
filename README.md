# Rental Store

Website thuê quần áo và phụ kiện với khu khách và quản trị tách biệt. Đọc ba tài liệu hiện hành:

- [Structure](docs/structure.md): bản đồ source và nền tảng app.
- [Feature](docs/feature.md): trang, luồng, input/output và dữ liệu lưu.
- [Setup](docs/setup.md): môi trường, cấu hình, URL, vendor và cách chạy.

Cần Node.js 22.18+ và npm. Để xem bản thử không cần database:

```bash
npm ci
npm run dev
```

Mở `http://localhost:3000/layout-preview` để xem bố cục từ dữ liệu JSON. Để chạy luồng nghiệp vụ, cấu hình PostgreSQL, xác thực và chính sách giá theo [Setup](docs/setup.md), rồi mở trang chủ.

Các lệnh kiểm tra: `npm run db:validate`, `npm run format:check`, `npm run lint`, `npm test`, `npm run test:server`, `npm run build`, `npm run test:smoke`. `npm run check` thêm dependency audit; browser QA và rà soát bảo mật cần làm riêng. Đơn gửi online chỉ chờ duyệt, thanh toán và cọc được xác nhận offline.

## Codex subagents

Native Codex roles live under `.codex/agents/*.toml` (orchestrator, developer, tester, reviewer, debugger). See [setup and handoff rules](.codex/README.md). These are configurable role prompts and local validators, not running autonomous services.
