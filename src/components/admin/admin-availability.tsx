"use client";

import { useEffect, useState } from "react";
import type { AdminStockSnapshot, InventoryBlock } from "@/lib/api/contracts";
import { rentalToday } from "@/lib/rental-dates";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";

const formatDay = (date: string) => date.split("-").reverse().join("/");

export function AdminAvailability() {
  const [month, setMonth] = useState(() => rentalToday().slice(0, 7));
  const [slug, setSlug] = useState("");
  return (
    <AdminData operation="admin.availability.list" showRefresh={false}>
      {(blocks, reload) => (
        <AvailabilityWorkspace
          blocks={blocks}
          reload={reload}
          month={month}
          slug={slug}
          setMonth={setMonth}
          setSlug={setSlug}
        />
      )}
    </AdminData>
  );
}

function AvailabilityWorkspace({
  blocks,
  reload,
  month,
  slug,
  setMonth,
  setSlug,
}: {
  blocks: InventoryBlock[];
  reload: (notice?: string) => void;
  month: string;
  slug: string;
  setMonth: (month: string) => void;
  setSlug: (slug: string) => void;
}) {
  const { api } = useRentalApi();
  const { t } = useLanguage();
  const [edit, setEdit] = useState<InventoryBlock | "new" | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [stock, setStock] = useState<AdminStockSnapshot>();
  const [pending, setPending] = useState(true);
  const [stockError, setStockError] = useState("");
  const { busy, error, run, clearError } = useApiAction();
  const key = useRequestKey();

  useEffect(() => {
    const abort = new AbortController();
    void api
      .call(
        "admin.availability.stock",
        { month, productSlug: slug || undefined },
        { signal: abort.signal },
      )
      .then((result) => {
        if (!abort.signal.aborted) {
          setStock(result);
          setPending(false);
        }
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) {
          setStockError(
            error instanceof Error ? error.message : "Không tải được lịch kho.",
          );
          setPending(false);
        }
      });
    return () => abort.abort();
  }, [api, month, slug, revision]);

  const selected = stock?.products.find(
    (product) => product.slug === stock.productSlug,
  );
  const lastDay = stock?.days.at(-1)?.date;
  const visibleBlocks = lastDay
    ? blocks.filter(
        (block) =>
          block.productSlug === selected?.slug &&
          block.pickupDate <= lastDay &&
          block.returnDate >= month + "-01",
      )
    : [];

  function beginRead() {
    setPending(true);
    setStockError("");
    setEdit(null);
    setRemoving(null);
  }

  return (
    <>
      <section className="admin-surface" aria-labelledby="admin-stock-title">
        <div className="admin-page-actions">
          <div>
            <h2 id="admin-stock-title">Lịch tồn theo sản phẩm</h2>
            <p className="admin-subtle">
              Đã giữ gồm các đơn đã xác nhận hoặc đang thuê.
            </p>
          </div>
          <div className="admin-action-group">
            <Button
              variant="outline"
              disabled={pending || busy || !!edit}
              onClick={() => reload()}
            >
              Làm mới
            </Button>
            <Button
              disabled={pending || busy || !!edit || !!stockError || !selected}
              onClick={() => {
                setRemoving(null);
                setEdit("new");
              }}
            >
              Tạo khóa lịch
            </Button>
          </div>
        </div>
        <div className="admin-field-row admin-filter">
          <label>
            Sản phẩm
            <select
              value={slug || stock?.productSlug || ""}
              disabled={busy || !!edit || !stock?.products.length}
              onChange={(event) => {
                beginRead();
                setSlug(event.target.value);
              }}
            >
              {!stock?.products.length && (
                <option value="">Chưa có sản phẩm</option>
              )}
              {stock?.products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.name}
                  {product.visibility === "draft" ? " · Bản nháp" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tháng
            <input
              type="month"
              min="2000-01"
              max="2100-12"
              disabled={busy || !!edit}
              value={month}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  !/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value) ||
                  value === month
                )
                  return;
                beginRead();
                setMonth(value);
              }}
            />
          </label>
        </div>
        {pending ? (
          <p role="status">Đang tải lịch kho…</p>
        ) : stockError ? (
          <div>
            <p role="alert">{t(stockError)}</p>
            <Button
              variant="outline"
              onClick={() => {
                beginRead();
                setRevision((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          </div>
        ) : selected ? (
          <>
            <p className="admin-subtle">
              Tổng số lượng trong kho: <strong>{selected.quantity}</strong>
            </p>
            <div className="admin-stock-days">
              {stock?.days.map((day) => (
                <article
                  className="admin-stock-day"
                  key={day.date}
                  data-empty={day.available === 0 || undefined}
                >
                  <time dateTime={day.date}>{formatDay(day.date)}</time>
                  <dl>
                    <div>
                      <dt>Đã giữ</dt>
                      <dd>{day.reserved}</dd>
                    </div>
                    <div>
                      <dt>Đang khóa</dt>
                      <dd>{day.blocked}</dd>
                    </div>
                    <div>
                      <dt>Còn trống</dt>
                      <dd>
                        <strong>{day.available}</strong>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p>Chưa có sản phẩm để xem lịch kho.</p>
        )}
      </section>
      {edit && selected && stock && (
        <BlockEditor
          key={edit === "new" ? "new" : edit.id}
          block={edit === "new" ? null : edit}
          products={stock.products}
          defaultSlug={selected.slug}
          defaultDate={
            month === rentalToday().slice(0, 7) ? rentalToday() : month + "-01"
          }
          onCancel={() => setEdit(null)}
          onSaved={() => reload("Đã lưu khóa lịch.")}
        />
      )}
      {!pending && !stockError && selected && (
        <section className="admin-surface" aria-labelledby="admin-blocks-title">
          <h2 id="admin-blocks-title">Khóa lịch trong tháng</h2>
          {visibleBlocks.length === 0 && (
            <p>Không có khóa lịch cho sản phẩm này trong tháng đã chọn.</p>
          )}
          {visibleBlocks.map((block) => (
            <article className="admin-record" key={block.id}>
              <div className="admin-page-actions">
                <div>
                  <h3>
                    {formatDay(block.pickupDate)} –{" "}
                    {formatDay(block.returnDate)}
                  </h3>
                  <p>
                    {block.quantity} món · {block.reason}
                  </p>
                </div>
                <div className="admin-action-group">
                  <Button
                    variant="outline"
                    disabled={busy || !!edit}
                    onClick={() => {
                      setRemoving(null);
                      setEdit(block);
                    }}
                  >
                    Sửa khóa
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || !!edit}
                    onClick={() => {
                      clearError();
                      setEdit(null);
                      setRemoving(block.id);
                    }}
                  >
                    Gỡ khóa
                  </Button>
                </div>
              </div>
              {removing === block.id && (
                <div className="admin-confirm">
                  <p>Gỡ khóa {block.quantity} món trong khoảng ngày này?</p>
                  <div className="admin-action-group">
                    <Button
                      disabled={busy}
                      onClick={() => {
                        const payload = {
                          id: block.id,
                          version: block.version,
                        };
                        void run(async () => {
                          await api.call("admin.availability.remove", {
                            ...payload,
                            idempotencyKey: key(payload),
                          });
                          reload("Đã gỡ khóa lịch.");
                        });
                      }}
                    >
                      Xác nhận gỡ
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setRemoving(null)}
                    >
                      Giữ khóa
                    </Button>
                  </div>
                  {error && <p role="alert">{t(error)}</p>}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function BlockEditor({
  block,
  products,
  defaultSlug,
  defaultDate,
  onCancel,
  onSaved,
}: {
  block: InventoryBlock | null;
  products: AdminStockSnapshot["products"];
  defaultSlug: string;
  defaultDate: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { api } = useRentalApi();
  const { t } = useLanguage();
  const { busy, error, run } = useApiAction();
  const key = useRequestKey();
  const today = rentalToday();
  const start =
    block?.pickupDate ?? (defaultDate > today ? defaultDate : today);

  return (
    <section
      className="admin-surface"
      aria-labelledby="admin-block-editor-title"
    >
      <h2 id="admin-block-editor-title">
        {block ? "Sửa khóa lịch" : "Tạo khóa lịch"}
      </h2>
      {block && block.pickupDate < today && (
        <p className="admin-subtle">
          Khoảng khóa đã bắt đầu. Chọn lại ngày bắt đầu từ hôm nay để lưu.
        </p>
      )}
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const payload = {
            id: block?.id ?? "",
            version: block?.version ?? 0,
            productSlug: String(data.get("product")),
            quantity: Number(data.get("quantity")),
            pickupDate: String(data.get("start")),
            returnDate: String(data.get("end")),
            reason: String(data.get("reason")),
          };
          void run(async () => {
            await api.call("admin.availability.save", {
              block: payload,
              idempotencyKey: key(payload),
            });
            onSaved();
          });
        }}
      >
        <div className="admin-field-row">
          <label>
            Sản phẩm
            <select
              name="product"
              autoFocus
              defaultValue={block?.productSlug ?? defaultSlug}
              required
            >
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số lượng khóa
            <input
              name="quantity"
              type="number"
              min={1}
              max={100}
              defaultValue={block?.quantity ?? 1}
              required
            />
          </label>
          <label>
            Từ ngày
            <input
              name="start"
              type="date"
              min={today}
              defaultValue={start}
              required
            />
          </label>
          <label>
            Đến ngày
            <input
              name="end"
              type="date"
              min={today}
              defaultValue={block?.returnDate ?? start}
              required
            />
          </label>
        </div>
        <label>
          Lý do
          <textarea
            name="reason"
            maxLength={1000}
            defaultValue={block?.reason}
            required
          />
        </label>
        {error && <p role="alert">{t(error)}</p>}
        <div className="admin-action-group">
          <Button disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu khóa lịch"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Hủy
          </Button>
        </div>
      </form>
    </section>
  );
}
