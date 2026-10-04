"use client";
import { useState } from "react";
import type { ManagedProduct } from "@/lib/api/contracts";
import { formatPrice, categories, occasions } from "@/lib/catalog";
import { uploadImage } from "@/lib/api/upload-image";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
const empty: ManagedProduct = {
  slug: "",
  name: "",
  description: "",
  price: 1,
  rentalDays: 1,
  quantity: 0,
  category: "Dresses",
  collection: "",
  occasions: [],
  image: "",
  imageAlt: "",
  visibility: "draft",
  version: 0,
};
export function AdminProducts() {
  return (
    <AdminData operation="admin.products.list">
      {(products, reload) => (
        <ProductList products={products} reload={reload} />
      )}
    </AdminData>
  );
}
function ProductList({
  products,
  reload,
}: {
  products: ManagedProduct[];
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage(),
    { demo } = useRentalApi();
  const [search, setSearch] = useState("");
  return (
    <>
      {!demo && <ProductEditor product={empty} reload={reload} />}
      <label className="admin-form">
        {t("Search products")}
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div className="admin-grid">
        {products
          .filter((p) =>
            `${p.name} ${p.slug}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((product) => (
            <ProductEditor
              key={product.slug}
              product={product}
              reload={reload}
            />
          ))}
      </div>
    </>
  );
}
function ProductEditor({
  product,
  reload,
}: {
  product: ManagedProduct;
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage(),
    { api, demo, session } = useRentalApi(),
    { busy, error, run } = useApiAction(),
    key = useRequestKey();
  return (
    <section className="admin-panel">
      <h2>{product.version ? product.name : t("New product")}</h2>
      {product.version > 0 && (
        <p>
          {formatPrice(product.price)} · {product.quantity} {t("units")}
        </p>
      )}
      <details>
        <summary>{t(product.version ? "Edit product" : "Add product")}</summary>
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(async () => {
              const file = data.get("image");
              const image =
                file instanceof File && file.size
                  ? "/media/" + (await uploadImage(file, session.csrfToken))
                  : product.image;
              if (!image) throw new Error("Upload a product image.");
              const value: ManagedProduct = {
                ...product,
                image,
                slug: product.version ? product.slug : String(data.get("slug")),
                name: String(data.get("name")),
                description: String(data.get("description")),
                price: Number(data.get("price")),
                quantity: Number(data.get("quantity")),
                category: String(
                  data.get("category"),
                ) as ManagedProduct["category"],
                visibility: String(
                  data.get("visibility"),
                ) as ManagedProduct["visibility"],
                ...(!demo
                  ? {
                      rentalDays: Number(data.get("rentalDays")),
                      collection: String(data.get("collection")),
                      occasions: data.getAll(
                        "occasions",
                      ) as ManagedProduct["occasions"],
                      imageAlt: String(data.get("imageAlt")),
                    }
                  : {}),
              };
              await api.call("admin.products.save", {
                product: value,
                idempotencyKey: key(value),
              });
              reload("Changes saved in this tab.");
            });
          }}
        >
          {!product.version && (
            <label>
              {t("Product slug")}
              <input
                name="slug"
                required
                maxLength={80}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
              />
            </label>
          )}
          <label>
            {t("Name")}
            <input
              name="name"
              defaultValue={product.name}
              required
              maxLength={100}
            />
          </label>
          <label>
            {t("Description")}
            <textarea
              name="description"
              defaultValue={product.description}
              required
              maxLength={1000}
            />
          </label>
          <label>
            {t("Category")}
            <select name="category" defaultValue={product.category}>
              {categories.map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Price (VND)")}
            <input
              name="price"
              type="number"
              min={1}
              max={2147483647}
              defaultValue={product.price}
              required
            />
          </label>
          {!demo && (
            <>
              <label>
                {t("Days per rental block")}
                <input
                  name="rentalDays"
                  type="number"
                  min={1}
                  max={366}
                  defaultValue={product.rentalDays}
                  required
                />
              </label>
              <label>
                {t("Collection")}
                <input
                  name="collection"
                  defaultValue={product.collection}
                  required
                  maxLength={100}
                />
              </label>
              <fieldset>
                <legend>{t("Occasion")}</legend>
                {occasions.map((v) => (
                  <label key={v}>
                    <input
                      name="occasions"
                      type="checkbox"
                      value={v}
                      defaultChecked={product.occasions.includes(v)}
                    />
                    {t(v)}
                  </label>
                ))}
              </fieldset>
              <label>
                {t("Product photo")}
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  required={!product.version}
                />
              </label>
              <label>
                {t("Image description")}
                <input
                  name="imageAlt"
                  defaultValue={product.imageAlt}
                  required
                  maxLength={200}
                />
              </label>
            </>
          )}
          <label>
            {t("Quantity")}
            <input
              name="quantity"
              type="number"
              min={0}
              max={100}
              defaultValue={product.quantity}
              required
            />
          </label>
          <label>
            {t("Visibility")}
            <select name="visibility" defaultValue={product.visibility}>
              <option value="draft">{t("Draft")}</option>
              <option value="published">
                {t(demo ? "Published in mock" : "Published")}
              </option>
            </select>
          </label>
          <Button disabled={busy}>{t("Save product")}</Button>
          {error && <p role="alert">{t(error)}</p>}
        </form>
      </details>
    </section>
  );
}
