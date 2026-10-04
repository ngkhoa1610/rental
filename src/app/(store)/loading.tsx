import { T } from "@/components/store/language-provider";
export default function StoreLoading() {
  return (
    <div className="store-page-loading" role="status" aria-busy="true">
      <p>
        <T>{"Finding your next look…"}</T>
      </p>
      <div className="store-loading-grid" aria-hidden="true">
        <div className="store-skeleton" />
        <div className="store-skeleton" />
        <div className="store-skeleton" />
      </div>
    </div>
  );
}
