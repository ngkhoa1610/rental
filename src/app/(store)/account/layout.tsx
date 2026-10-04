import { SessionPanel } from "@/components/store/session-panel";
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="store-account-layout">
        <aside className="store-account-sidebar">
          <SessionPanel />
        </aside>
        <section>{children}</section>
      </div>
    </>
  );
}
