import { T } from "@/components/store/language-provider";
import { PageHeading, EmptyState } from "@/components/store/page-heading";

export default function ProductNotFound() {
  return (
    <>
      <PageHeading
        title="This look is not here."
        description="Liên kết có thể đã thay đổi hoặc trang phục hiện không còn được công khai."
      />
      <EmptyState title="Find something else worth wearing.">
        <T>{"Quay về danh mục để xem các trang phục đang được công khai."}</T>
      </EmptyState>
    </>
  );
}
