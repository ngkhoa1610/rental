"use client";
import { useState } from "react";
import type { EditorialContent } from "@/lib/api/contracts";
import { products } from "@/lib/catalog";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
export function AdminContent() {
  return (
    <AdminData operation="admin.content.list">
      {(content, reload) => <ContentList content={content} reload={reload} />}
    </AdminData>
  );
}
function ContentList({
  content,
  reload,
}: {
  content: EditorialContent[];
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<EditorialContent>({
    id: "",
    version: 0,
    kind: "lookbook",
    title: "",
    body: "",
    productSlugs: [],
    visibility: "draft",
  });
  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <h2>{t("Editorial content")}</h2>
        <Button
          variant="outline"
          onClick={() =>
            setSelected({
              id: "",
              version: 0,
              kind: "lookbook",
              title: "",
              body: "",
              productSlugs: [],
              visibility: "draft",
            })
          }
        >
          {t("New content")}
        </Button>
        {content.map((item) => (
          <article className="admin-record" key={item.id}>
            <h3>{item.title}</h3>
            <p>
              {item.kind} · {item.visibility}
            </p>
            <Button variant="outline" onClick={() => setSelected(item)}>
              {t("Edit content")}
            </Button>
          </article>
        ))}
        {!content.length && <p>{t("No content yet.")}</p>}
      </section>
      <ContentEditor
        key={`${selected.id}:${selected.version}`}
        value={selected}
        reload={reload}
      />
    </div>
  );
}
function ContentEditor({
  value,
  reload,
}: {
  value: EditorialContent;
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const { api } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const key = useRequestKey();
  return (
    <section className="admin-panel">
      <h2>{t(value.id ? "Edit content" : "New content")}</h2>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const content = {
            ...value,
            title: String(data.get("title")),
            body: String(data.get("body")),
            kind: String(data.get("kind")) as EditorialContent["kind"],
            visibility: String(
              data.get("visibility"),
            ) as EditorialContent["visibility"],
            productSlugs: data.getAll("products").map(String),
          };
          void run(async () => {
            await api.call("admin.content.save", {
              content,
              idempotencyKey: key(content),
            });
            reload("Changes saved in this tab.");
          });
        }}
      >
        <label>
          {t("Title")}
          <input
            name="title"
            defaultValue={value.title}
            required
            maxLength={150}
          />
        </label>
        <label>
          {t("Content type")}
          <select name="kind" defaultValue={value.kind}>
            <option value="lookbook">Lookbook</option>
            <option value="collection">Collection</option>
          </select>
        </label>
        <label>
          {t("Body")}
          <textarea
            name="body"
            defaultValue={value.body}
            maxLength={4000}
            required
          />
        </label>
        <fieldset>
          <legend>{t("Related products")}</legend>
          {products.map((p) => (
            <label className="admin-check" key={p.slug}>
              <input
                type="checkbox"
                name="products"
                value={p.slug}
                defaultChecked={value.productSlugs.includes(p.slug)}
              />
              {p.name}
            </label>
          ))}
        </fieldset>
        <label>
          {t("Visibility")}
          <select name="visibility" defaultValue={value.visibility}>
            <option value="draft">{t("Draft")}</option>
            <option value="published">{t("Published in mock")}</option>
          </select>
        </label>
        <Button disabled={busy}>{t("Save content")}</Button>
        {error && <p role="alert">{t(error)}</p>}
      </form>
    </section>
  );
}
