"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import {
  maxProductPhotos,
  type ManagedProduct,
  type ProductPhoto,
} from "@/lib/api/contracts";
import { categories, formatPrice, occasions } from "@/lib/catalog";
import { uploadImage } from "@/lib/api/upload-image";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { FashionImage } from "@/components/ui/fashion-image";
import { AdminData } from "./admin-data";

const emptyProduct: ManagedProduct = {
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

const visibilityLabels = { draft: "Bản nháp", published: "Công khai" };

export function AdminProducts() {
  return (
    <AdminData operation="admin.products.list" showRefresh={false}>
      {(products, reload) => (
        <ProductWorkspace products={products} reload={reload} />
      )}
    </AdminData>
  );
}

function ProductWorkspace({
  products,
  reload,
}: {
  products: ManagedProduct[];
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [editing, setEditing] = useState<ManagedProduct | null>(null);
  const actionToRestore = useRef<string | null>(null);
  const workspace = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!editing && actionToRestore.current) {
      const button = Array.from(
        workspace.current?.querySelectorAll<HTMLButtonElement>(
          "button[data-product-action]",
        ) ?? [],
      ).find(
        (element) => element.dataset.productAction === actionToRestore.current,
      );
      button?.focus();
      actionToRestore.current = null;
    }
  }, [editing]);

  if (editing) {
    return (
      <ProductEditor
        product={editing}
        onCancel={() => setEditing(null)}
        onSaved={reload}
      />
    );
  }

  const query = search.trim().toLocaleLowerCase("vi");
  const filtered = products.filter(
    (product) =>
      (!category || category === product.category) &&
      (!visibility || visibility === product.visibility) &&
      `${t(product.name)} ${product.name} ${product.slug} ${t(product.collection)}`
        .toLocaleLowerCase("vi")
        .includes(query),
  );

  return (
    <section
      className="admin-surface"
      ref={workspace}
      aria-labelledby="admin-products-list"
    >
      <div className="admin-page-actions">
        <h2 id="admin-products-list">Danh sách sản phẩm</h2>
        <div className="admin-action-group">
          <Button variant="outline" onClick={() => reload()}>
            Làm mới
          </Button>
          <Button
            type="button"
            data-product-action="new"
            onClick={() => {
              actionToRestore.current = "new";
              setEditing(emptyProduct);
            }}
          >
            <Plus aria-hidden="true" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>
      <div className="admin-field-row admin-form">
        <label>
          Tìm sản phẩm
          <input
            type="search"
            maxLength={100}
            placeholder="Tên, slug hoặc bộ sưu tập"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Danh mục
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hiển thị
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Công khai</option>
            <option value="draft">Bản nháp</option>
          </select>
        </label>
      </div>
      <p className="admin-product-count" aria-live="polite">
        {filtered.length} / {products.length} sản phẩm
      </p>
      {filtered.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table" aria-labelledby="admin-products-list">
            <thead>
              <tr>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Danh mục</th>
                <th scope="col">Giá thuê</th>
                <th scope="col">Số lượng</th>
                <th scope="col">Hiển thị</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.slug}>
                  <th scope="row">
                    <div className="admin-product-name">
                      <FashionImage
                        className="admin-thumb"
                        src={product.image}
                        alt=""
                        width={48}
                        height={60}
                        unoptimized
                      />
                      <div>
                        <strong>{t(product.name)}</strong>
                        <div>{product.slug}</div>
                      </div>
                    </div>
                  </th>
                  <td data-label="Danh mục">{t(product.category)}</td>
                  <td data-label="Giá thuê">
                    {formatPrice(product.price)} / {product.rentalDays} ngày
                  </td>
                  <td data-label="Số lượng">{product.quantity}</td>
                  <td data-label="Hiển thị">
                    <span
                      className="admin-badge"
                      data-status={product.visibility}
                    >
                      {visibilityLabels[product.visibility]}
                    </span>
                  </td>
                  <td data-label="Thao tác">
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={`Chỉnh sửa ${t(product.name)}`}
                      data-product-action={`edit:${product.slug}`}
                      onClick={() => {
                        actionToRestore.current = `edit:${product.slug}`;
                        setEditing(product);
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {products.length
            ? "Không tìm thấy sản phẩm phù hợp."
            : "Chưa có sản phẩm. Thêm sản phẩm đầu tiên để bắt đầu."}
        </p>
      )}
    </section>
  );
}

function ProductEditor({
  product,
  onCancel,
  onSaved,
}: {
  product: ManagedProduct;
  onCancel: () => void;
  onSaved: (notice: string) => void;
}) {
  const { t } = useLanguage();
  const { api, session } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const requestKey = useRequestKey();
  const heading = useRef<HTMLHeadingElement>(null);
  const existing = product.version > 0;
  const [coverImage, setCoverImage] = useState(product.image);
  const [imageAlt, setImageAlt] = useState(product.imageAlt);
  const [additionalPhotos, setAdditionalPhotos] = useState(
    product.additionalPhotos ?? [],
  );
  const [localPreview, setLocalPreview] = useState("");
  const uploaded = useRef<{ file: File; url: string } | null>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (localPreview) return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const preview = localPreview || coverImage;
  const addPhoto = (photo: ProductPhoto) => {
    if (
      photo.url === coverImage ||
      additionalPhotos.some(({ url }) => url === photo.url)
    ) {
      throw new Error("Ảnh này đã có trong album.");
    }
    setAdditionalPhotos([...additionalPhotos, photo]);
  };
  const movePhoto = (index: number, offset: number) => {
    const photos = [...additionalPhotos];
    [photos[index], photos[index + offset]] = [
      photos[index + offset],
      photos[index],
    ];
    setAdditionalPhotos(photos);
  };

  return (
    <section
      className="admin-surface"
      aria-labelledby="admin-product-editor-title"
    >
      <div className="admin-page-actions">
        <h2 ref={heading} id="admin-product-editor-title" tabIndex={-1}>
          {existing ? `Chỉnh sửa ${t(product.name)}` : "Thêm sản phẩm"}
        </h2>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden="true" /> Về danh sách
        </Button>
      </div>
      <form
        className="admin-form admin-product-editor"
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const file = (
            event.currentTarget.elements.namedItem(
              "image",
            ) as HTMLInputElement | null
          )?.files?.[0];
          const formValue = (name: string) =>
            String(data.get(name) ?? "").trim();
          void run(async () => {
            const name = formValue("name");
            const description = formValue("description");
            const collection = formValue("collection");
            const alt = formValue("imageAlt");

            if (!name || !description || !collection || !alt)
              throw new Error(
                "Nhập tên, mô tả, bộ sưu tập và mô tả ảnh trước khi lưu.",
              );

            let image = coverImage;
            if (file?.size) {
              if (uploaded.current?.file !== file)
                uploaded.current = {
                  file,
                  url: "/media/" + (await uploadImage(file, session.csrfToken)),
                };
              image = uploaded.current.url;
            }
            if (!image) throw new Error("Chọn ảnh đại diện cho sản phẩm.");

            const value: ManagedProduct = {
              slug: existing ? product.slug : formValue("slug"),
              name,
              description,
              collection,
              image,
              imageAlt: alt,
              additionalPhotos: additionalPhotos.map(({ url, alt }) => ({
                url,
                alt: alt.trim(),
              })),
              price: Number(data.get("price")),
              rentalDays: Number(data.get("rentalDays")),
              quantity: Number(data.get("quantity")),
              category: formValue("category") as ManagedProduct["category"],
              visibility: formValue(
                "visibility",
              ) as ManagedProduct["visibility"],
              occasions: data.getAll(
                "occasions",
              ) as ManagedProduct["occasions"],
              version: product.version,
            };
            await api.call("admin.products.save", {
              product: value,
              idempotencyKey: requestKey(value),
            });
            onSaved("Đã lưu sản phẩm.");
          });
        }}
      >
        <div className="admin-field-row">
          <label>
            Tên sản phẩm
            <input
              name="name"
              defaultValue={product.name}
              required
              maxLength={100}
            />
          </label>
          <label>
            Slug sản phẩm
            <input
              name="slug"
              defaultValue={product.slug}
              readOnly={existing}
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              aria-describedby="admin-product-slug-hint"
            />
            <small id="admin-product-slug-hint">
              {existing
                ? "Slug được giữ cố định sau khi tạo."
                : "Dùng chữ thường, số và dấu gạch ngang. Ví dụ: dam-hoa."}
            </small>
          </label>
        </div>
        <label>
          Mô tả sản phẩm
          <textarea
            name="description"
            defaultValue={product.description}
            required
            maxLength={1000}
          />
        </label>
        <div className="admin-field-row">
          <label>
            Danh mục
            <select name="category" defaultValue={product.category}>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bộ sưu tập
            <input
              name="collection"
              defaultValue={product.collection}
              required
              maxLength={100}
            />
          </label>
        </div>
        <fieldset className="admin-occasion-list">
          <legend>Dịp sử dụng</legend>
          {occasions.map((value) => (
            <label key={value} className="admin-check">
              <input
                name="occasions"
                value={value}
                type="checkbox"
                defaultChecked={product.occasions.includes(value)}
              />
              {t(value)}
            </label>
          ))}
        </fieldset>
        <div className="admin-field-row">
          <label>
            Giá mỗi block (VND)
            <input
              name="price"
              type="number"
              min={1}
              max={2147483647}
              defaultValue={existing ? product.price : undefined}
              required
            />
          </label>
          <label>
            Số ngày mỗi block
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
            Tổng số lượng
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
            Hiển thị
            <select name="visibility" defaultValue={product.visibility}>
              <option value="draft">Bản nháp · Ẩn khỏi cửa hàng</option>
              <option value="published">Công khai</option>
            </select>
          </label>
        </div>
        <fieldset disabled={busy}>
          <legend>Ảnh đại diện</legend>
          <div className="admin-product-media">
            <div className="admin-product-preview">
              {preview ? (
                <FashionImage
                  src={preview}
                  alt={imageAlt || "Xem trước ảnh sản phẩm"}
                  width={240}
                  height={300}
                  unoptimized
                />
              ) : (
                <p>Chưa chọn ảnh</p>
              )}
            </div>
            <div className="admin-product-image-fields">
              <label>
                {existing ? "Thay ảnh đại diện" : "Tải ảnh đại diện"}
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={!coverImage}
                  disabled={busy}
                  aria-describedby="admin-product-photo-hint"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    uploaded.current = null;
                    setLocalPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <small id="admin-product-photo-hint">
                  JPEG, PNG hoặc WebP, tối đa 4 MB.
                </small>
              </label>

              <label>
                Mô tả ảnh
                <input
                  name="imageAlt"
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  required
                  maxLength={200}
                />
              </label>
            </div>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Ảnh phụ</legend>
          {additionalPhotos.map((photo, index) => (
            <div className="admin-record" key={photo.url}>
              <FashionImage
                src={photo.url}
                alt={photo.alt}
                width={80}
                height={100}
                unoptimized
              />
              <label>
                Mô tả ảnh phụ {index + 1}
                <input
                  required
                  maxLength={200}
                  value={photo.alt}
                  onChange={(event) => {
                    const alt = event.target.value;
                    setAdditionalPhotos(
                      additionalPhotos.map((item, i) =>
                        i === index ? { ...item, alt } : item,
                      ),
                    );
                  }}
                />
              </label>
              <div className="admin-action-group">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!!localPreview}
                  onClick={() => {
                    setAdditionalPhotos(
                      additionalPhotos.flatMap((item, i) =>
                        i === index
                          ? coverImage
                            ? [{ url: coverImage, alt: imageAlt }]
                            : []
                          : [item],
                      ),
                    );
                    setCoverImage(photo.url);
                    setImageAlt(photo.alt);
                  }}
                >
                  Đặt làm đại diện
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => movePhoto(index, -1)}
                >
                  Lên
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === additionalPhotos.length - 1}
                  onClick={() => movePhoto(index, 1)}
                >
                  Xuống
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAdditionalPhotos(
                      additionalPhotos.filter((_, i) => i !== index),
                    )
                  }
                >
                  Gỡ ảnh
                </Button>
              </div>
            </div>
          ))}
          {additionalPhotos.length < maxProductPhotos - 1 && (
            <label>
              Tải thêm ảnh JPEG, PNG hoặc WebP
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file)
                    void run(async () => {
                      const id = await uploadImage(file, session.csrfToken);
                      addPhoto({ url: "/media/" + id, alt: "" });
                    });
                }}
              />
            </label>
          )}
        </fieldset>
        {error && <p role="alert">{t(error)}</p>}
        <div className="admin-page-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu sản phẩm"}
          </Button>
        </div>
      </form>
    </section>
  );
}
