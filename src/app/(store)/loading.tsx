export default function StoreLoading() {
  return (
    <div className="store-page-loading" role="status" aria-busy="true">
      <p>Đang tải…</p>
      <div className="store-loading-grid" aria-hidden="true">
        <div className="store-skeleton" />
        <div className="store-skeleton" />
        <div className="store-skeleton" />
      </div>
    </div>
  );
}
