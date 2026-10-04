import { T } from "@/components/store/language-provider";
import { PageHeading, EmptyState } from "@/components/store/page-heading";

export default function ProductNotFound() {
  return (
    <>
      <PageHeading
        title="This look is not here."
        description="The link may be incorrect or the sample look may have changed."
      />
      <EmptyState title="Find something else worth wearing.">
        <T>
          {"Return to the collection to explore the available sample looks."}
        </T>
      </EmptyState>
    </>
  );
}
