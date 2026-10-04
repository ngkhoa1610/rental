import { monthDates } from "../rental-calendar";
import { permissions, scopeAllows, type ApiScope } from "../access";
import { orderStatusLabels, orderTransitions } from "../order-workflow";
import { rentalToday, rentalDateError } from "../rental-dates";
import { filterProducts, normalizeCatalogFilters, products } from "../catalog";
import {
  ApiError,
  type Input,
  type OperationName,
  type Output,
  type Permission,
  type Profile,
  type Quote,
  type RentalApi,
  type RentalDates,
  type RentalOrder,
  type OrderMutation,
  type ManagedProduct,
  type InventoryBlock,
  type EditorialContent,
  type CustomerReview,
  type StaffMember,
} from "./contracts";

export type DemoIdentity = "customer" | "other-customer" | "staff" | "admin";
const identities: Record<DemoIdentity, Profile> = {
  customer: {
    id: "demo-customer",
    name: "Demo customer",
    phone: "0900000000",
    permissions: [],
  },
  "other-customer": {
    id: "demo-other",
    name: "Other customer",
    phone: "",
    permissions: [],
  },
  staff: {
    id: "demo-staff",
    name: "Demo staff",
    phone: "",
    permissions: ["orders:manage", "availability:manage", "customers:read"],
  },
  admin: {
    id: "demo-admin",
    name: "Demo admin",
    phone: "",
    permissions: [...permissions],
  },
};
type Handlers = { [K in OperationName]: (input: Input<K>) => Output<K> };
const clone = <T>(value: T): T => structuredClone(value);
function requireText(
  value: string,
  field: string,
  max: number,
  required = true,
) {
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  ) {
    throw new ApiError("VALIDATION", `Check ${field}.`, {
      [field]: `Use ${required ? "1" : "0"}–${max} characters.`,
    });
  }
  return value.trim();
}
function parseDate(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== value
  )
    throw new ApiError("VALIDATION", "Enter valid pickup and return dates.");
  return parsed;
}
const overlap = (a: RentalDates, b: RentalDates) =>
  a.pickupDate <= b.returnDate && b.pickupDate <= a.returnDate;

/** Isolated in-memory simulator. No persistence, authentication or real inventory. */
export function createMockApi(
  options: {
    latencyMs?: number;
    now?: () => number;
    stockPerProduct?: number;
    blocks?: (RentalDates & { productSlug: string; quantity: number })[];
  } = {},
) {
  const now = options.now ?? Date.now;
  const profiles = clone(identities);
  const orders = new Map<string, RentalOrder>();
  const quotes = new Map<string, { quote: Quote; owner: string | null }>();
  const replays = new Map<string, { fingerprint: string; value: unknown }>();
  const inventory = new Map<string, ManagedProduct>(
    products.map((product) => [
      product.slug,
      {
        ...product,
        version: 1,
        quantity: options.stockPerProduct ?? 2,
        visibility: "published",
      },
    ]),
  );
  const blocks = new Map<string, InventoryBlock>(
    (options.blocks ?? []).map((block, index) => [
      `block-${index}`,
      {
        ...block,
        id: `block-${index}`,
        version: 1,
        reason: "Sample maintenance",
      },
    ]),
  );
  const content = new Map<string, EditorialContent>();
  const reviews = new Map<string, CustomerReview>();
  const staff = new Map<string, StaffMember>(
    [profiles.staff, profiles.admin].map((profile) => [
      profile.id,
      { ...profile, active: true, version: 1 },
    ]),
  );
  let counter = 0;
  let seeded = false;
  function createClient(scope?: ApiScope) {
    let identity: DemoIdentity | null = null;
    let identityVersion = 0;
    let nextFailure: ApiError | null = null;
    const timestamp = () => new Date(now()).toISOString();
    const id = (prefix: string) => `${prefix}-${++counter}`;
    const currentProfile = () => {
      if (!identity) return null;
      const profile = profiles[identity];
      const member = staff.get(profile.id);
      return member ? (member.active ? member : null) : profile;
    };
    function actor(permission?: Permission) {
      const profile = currentProfile();
      if (!profile)
        throw new ApiError(
          "UNAUTHENTICATED",
          "Please sign in again. Your draft is still here.",
        );
      if (permission && !profile.permissions.includes(permission))
        throw new ApiError(
          "FORBIDDEN",
          "Your account cannot perform this action.",
        );
      return profile;
    }
    function dates(input: RentalDates) {
      const start = parseDate(input.pickupDate);
      const end = parseDate(input.returnDate);
      const error = rentalDateError(input, now());
      if (error) throw new ApiError("VALIDATION", error);
      // 1–3 calendar days use an explicitly fixed sample amount, never a live rate.
      if (end - start > 2 * 86400000)
        throw new ApiError(
          "POLICY_REQUIRED",
          "This demo supports 1–3 calendar days. Longer rentals need an agreed pricing policy.",
        );
    }

    function available(slug: string, range: RentalDates, excludeId?: string) {
      // Evaluate peak occupancy per date, not a sum across disjoint bookings.
      let minimum = inventory.get(slug)?.quantity ?? 0;
      for (
        let day = parseDate(range.pickupDate);
        day <= parseDate(range.returnDate);
        day += 86400000
      ) {
        const point = new Date(day).toISOString().slice(0, 10);
        const oneDay = { pickupDate: point, returnDate: point };
        const held = [...orders.values()]
          .filter(
            (order) =>
              order.id !== excludeId &&
              ["confirmed", "renting"].includes(order.status) &&
              overlap(order, oneDay),
          )
          .reduce(
            (total, order) =>
              total +
              (order.lines.find((line) => line.productSlug === slug)
                ?.quantity ?? 0),
            0,
          );
        const blocked = [...blocks.values()]
          .filter(
            (block) => block.productSlug === slug && overlap(block, oneDay),
          )
          .reduce((total, block) => total + block.quantity, 0);
        minimum = Math.min(
          minimum,
          (inventory.get(slug)?.quantity ?? 0) - held - blocked,
        );
      }
      return Math.max(0, minimum);
    }
    function checkStock(
      lines: Quote["lines"],
      range: RentalDates,
      excludeId?: string,
    ) {
      for (const line of lines)
        if (available(line.productSlug, range, excludeId) < line.quantity)
          throw new ApiError(
            "UNAVAILABLE",
            `${line.name} is unavailable for these dates. Please check again.`,
          );
    }
    function getOrder(
      orderId: string,
      admin = false,
      permission: Permission = "orders:manage",
    ) {
      const user = actor(admin ? permission : undefined);
      const order = orders.get(orderId);
      if (!order || (!admin && order.customerId !== user.id))
        throw new ApiError("NOT_FOUND", "Order not found.");
      return order;
    }
    function version(order: RentalOrder, expected: number) {
      if (order.version !== expected)
        throw new ApiError(
          "CONFLICT",
          "This order changed. Refresh it before trying again.",
        );
    }
    function audit(order: RentalOrder, action: string, note: string) {
      order.version += 1;
      order.history.push({
        actorId: actor().id,
        at: timestamp(),
        action,
        note,
      });
      return order;
    }
    function once<T>(
      operation: string,
      input: { idempotencyKey: string },
      work: () => T,
    ): T {
      const key = `${actor().id}:${operation}:${requireText(input.idempotencyKey, "idempotencyKey", 150)}`;
      const fingerprint = JSON.stringify(input);
      const previous = replays.get(key);
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new ApiError(
            "CONFLICT",
            "This request key has already been used with different data.",
          );
        return clone(previous.value) as T;
      }
      const value = work();
      replays.set(key, { fingerprint, value: clone(value) });
      return value;
    }
    function modify(
      input: OrderMutation,
      action: string,
      work: (order: RentalOrder) => RentalOrder,
      admin = true,
      permission: Permission = "orders:manage",
    ) {
      const order = getOrder(input.orderId, admin, permission);
      return once(action, input, () => {
        version(order, input.version);
        return work(order);
      });
    }
    function checkRecordVersion(
      record: { version: number } | undefined,
      expected: number,
    ) {
      if ((record?.version ?? 0) !== expected)
        throw new ApiError(
          "CONFLICT",
          "This record changed. Refresh before saving.",
        );
    }
    function maxReserved(slug: string, candidates = [...blocks.values()]) {
      const ranges: (RentalDates & { quantity: number })[] = [
        ...orders.values(),
      ]
        .filter((order) => ["confirmed", "renting"].includes(order.status))
        .flatMap((order) =>
          order.lines
            .filter((line) => line.productSlug === slug)
            .map((line) => ({ ...order, quantity: line.quantity })),
        );
      ranges.push(
        ...candidates
          .filter((block) => block.productSlug === slug)
          .map((block) => ({ ...block })),
      );
      const events = new Map<number, number>();
      for (const range of ranges) {
        const start = parseDate(range.pickupDate),
          end = parseDate(range.returnDate) + 86400000;
        events.set(start, (events.get(start) ?? 0) + range.quantity);
        events.set(end, (events.get(end) ?? 0) - range.quantity);
      }
      let held = 0,
        peak = 0;
      for (const [, delta] of [...events].sort(([a], [b]) => a - b)) {
        held += delta;
        peak = Math.max(peak, held);
      }
      return peak;
    }
    const adminHandlers: Pick<
      Handlers,
      | "admin.products.list"
      | "admin.products.save"
      | "admin.availability.list"
      | "admin.availability.save"
      | "admin.availability.remove"
      | "admin.customers.list"
      | "admin.content.list"
      | "admin.content.save"
      | "admin.reviews.list"
      | "admin.reviews.moderate"
      | "admin.staff.list"
      | "admin.staff.update"
    > = {
      "admin.products.list": () => {
        actor("catalog:manage");
        return [...inventory.values()];
      },
      "admin.products.save": (input) => {
        actor("catalog:manage");
        return once("admin.products.save", input, () => {
          const value = input.product;
          checkRecordVersion(inventory.get(value.slug), value.version);
          if (
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) ||
            value.slug.length > 80 ||
            !Number.isSafeInteger(value.price) ||
            value.price < 1 ||
            !Number.isSafeInteger(value.quantity) ||
            value.quantity < 0 ||
            value.quantity > 100 ||
            !["draft", "published"].includes(value.visibility) ||
            !["Dresses", "Sets", "Tops", "Outerwear"].includes(
              value.category,
            ) ||
            !Array.isArray(value.occasions) ||
            value.occasions.some(
              (item) =>
                ![
                  "Date night",
                  "Wedding guest",
                  "Party",
                  "Vacation",
                  "Weekend",
                ].includes(item),
            ) ||
            !products.some((product) => product.image === value.image)
          )
            throw new ApiError(
              "VALIDATION",
              "Check product details, price and quantity.",
            );
          if (value.quantity < maxReserved(value.slug))
            throw new ApiError(
              "UNAVAILABLE",
              "Quantity cannot be lower than reserved or blocked stock.",
            );
          const product: ManagedProduct = {
            slug: value.slug,
            name: requireText(value.name, "name", 100),
            description: requireText(value.description, "description", 1000),
            price: value.price,
            quantity: value.quantity,
            visibility: value.visibility,
            category: value.category,
            collection: requireText(value.collection, "collection", 80),
            occasions: [...value.occasions],
            image: value.image,
            imageAlt: requireText(value.imageAlt, "imageAlt", 200),
            rentalDays: 3,
            version: value.version + 1,
          };
          inventory.set(product.slug, product);
          return product;
        });
      },
      "admin.availability.list": () => {
        actor("availability:manage");
        return [...blocks.values()];
      },
      "admin.availability.save": (input) => {
        actor("availability:manage");
        return once("admin.availability.save", input, () => {
          const value = input.block;
          checkRecordVersion(blocks.get(value.id), value.version);
          const error = rentalDateError(value, now());
          const product = inventory.get(value.productSlug);
          if (
            error ||
            !product ||
            !Number.isSafeInteger(value.quantity) ||
            value.quantity < 1 ||
            value.quantity > product.quantity
          )
            throw new ApiError(
              "VALIDATION",
              error ?? "Check blocked product quantity.",
            );
          const block: InventoryBlock = {
            id: value.id || id("block"),
            productSlug: value.productSlug,
            pickupDate: value.pickupDate,
            returnDate: value.returnDate,
            quantity: value.quantity,
            reason: requireText(value.reason, "reason", 500),
            version: value.version + 1,
          };
          if (
            maxReserved(
              value.productSlug,
              [...blocks.values()]
                .filter((item) => item.id !== block.id)
                .concat(block),
            ) > product.quantity
          )
            throw new ApiError(
              "UNAVAILABLE",
              "This block overlaps stock already reserved or blocked.",
            );
          blocks.set(block.id, block);
          return block;
        });
      },
      "admin.availability.remove": (input) => {
        actor("availability:manage");
        return once("admin.availability.remove", input, () => {
          const block = blocks.get(input.id);
          if (!block) throw new ApiError("NOT_FOUND", "Record not found.");
          checkRecordVersion(block, input.version);
          blocks.delete(input.id);
        });
      },
      "admin.customers.list": () => {
        actor("customers:read");
        return [profiles.customer, profiles["other-customer"]];
      },
      "admin.content.list": () => {
        actor("content:manage");
        return [...content.values()];
      },
      "admin.content.save": (input) => {
        actor("content:manage");
        return once("admin.content.save", input, () => {
          const value = input.content;
          checkRecordVersion(content.get(value.id), value.version);
          if (
            !["collection", "lookbook"].includes(value.kind) ||
            !["draft", "published"].includes(value.visibility) ||
            !Array.isArray(value.productSlugs) ||
            !value.productSlugs.length ||
            value.productSlugs.length > 100 ||
            value.productSlugs.some((slug) => !inventory.has(slug))
          )
            throw new ApiError(
              "VALIDATION",
              "Choose valid content type and related products.",
            );
          const record: EditorialContent = {
            id: value.id || id("content"),
            kind: value.kind,
            title: requireText(value.title, "title", 150),
            body: requireText(value.body, "body", 4000),
            visibility: value.visibility,
            productSlugs: [...new Set(value.productSlugs)],
            version: value.version + 1,
          };
          content.set(record.id, record);
          return record;
        });
      },
      "admin.reviews.list": () => {
        actor("reviews:moderate");
        return [...reviews.values()];
      },
      "admin.reviews.moderate": (input) => {
        actor("reviews:moderate");
        return once("admin.reviews.moderate", input, () => {
          const review = reviews.get(input.id);
          if (!review) throw new ApiError("NOT_FOUND", "Record not found.");
          checkRecordVersion(review, input.version);
          if (!["approved", "rejected"].includes(input.decision))
            throw new ApiError("VALIDATION", "Choose a moderation decision.");
          if (
            input.decision === "approved" &&
            (!review.consentToPublish ||
              orders.get(review.orderId)?.status !== "completed")
          )
            throw new ApiError(
              "VALIDATION",
              "Approval requires publication consent and a completed rental.",
            );
          const record = {
            ...review,
            moderation: input.decision,
            moderationNote: requireText(input.note, "note", 500),
            version: review.version + 1,
          };
          reviews.set(record.id, record);
          return record;
        });
      },
      "admin.staff.list": () => {
        actor("staff:manage");
        return [...staff.values()];
      },
      "admin.staff.update": (input) => {
        const user = actor("staff:manage");
        return once("admin.staff.update", input, () => {
          const member = staff.get(input.id);
          if (!member) throw new ApiError("NOT_FOUND", "Record not found.");
          checkRecordVersion(member, input.version);
          if (member.id === user.id || member.id === profiles.admin.id)
            throw new ApiError(
              "FORBIDDEN",
              "The owner account cannot be changed here.",
            );
          if (
            typeof input.active !== "boolean" ||
            !Array.isArray(input.permissions) ||
            input.permissions.some((value) => !permissions.includes(value)) ||
            input.permissions.includes("staff:manage")
          )
            throw new ApiError(
              "VALIDATION",
              "Choose valid staff permissions; owner access cannot be delegated in this demo.",
            );
          const updated = {
            ...member,
            active: input.active,
            permissions: [...new Set(input.permissions)],
            version: member.version + 1,
          };
          staff.set(member.id, updated);
          return updated;
        });
      },
    };
    function seedDemoData() {
      actor("staff:manage");
      if (seeded) return;
      seeded = true;
      const date = (offset: number) =>
        new Date(parseDate(rentalToday(now())) + offset * 86400000)
          .toISOString()
          .slice(0, 10);
      for (const [index, status] of (
        ["pending", "confirmed", "renting", "completed", "cancelled"] as const
      ).entries()) {
        const product = products[index % products.length];
        const orderId = `sample-order-${index + 1}`;
        const terminal = ["completed", "cancelled"].includes(status);
        const amount = product.price;
        const paid = status === "completed";
        const order: RentalOrder = {
          id: orderId,
          customerId: profiles.customer.id,
          contact: {
            name: profiles.customer.name,
            phone: profiles.customer.phone,
          },
          pickupDate: date(terminal ? -7 : index),
          returnDate: date(terminal ? -6 : index + 1),
          lines: [
            {
              productSlug: product.slug,
              quantity: 1,
              name: product.name,
              amount,
              available: 2,
            },
          ],
          notes: "Sample order for administration practice.",
          status,
          version: 1,
          createdAt: timestamp(),
          payment: {
            due: amount,
            collected: paid ? amount : 0,
            refunded: 0,
            remaining: paid ? 0 : amount,
            status: paid ? "paid" : "unpaid",
          },
          payments: paid
            ? [
                {
                  id: `sample-payment-${index}`,
                  kind: "collection",
                  amount,
                  occurredAt: timestamp(),
                  note: "Sample cash collection",
                  actorId: profiles.admin.id,
                },
              ]
            : [],
          changes: [],
          history: [
            {
              at: timestamp(),
              actorId: profiles.admin.id,
              action: "Sample data loaded",
              note: "Illustrative record only.",
            },
          ],
        };
        orders.set(orderId, order);
      }
      content.set("sample-lookbook", {
        id: "sample-lookbook",
        kind: "lookbook",
        title: "A gentle weekend",
        body: "Sample styling notes for the admin editor.",
        productSlugs: ["luna-set"],
        visibility: "draft",
        version: 1,
      });
      for (const [index, consent] of [true, false].entries())
        reviews.set(`sample-review-${index + 1}`, {
          id: `sample-review-${index + 1}`,
          orderId: "sample-order-4",
          rating: 5,
          story: "Sample review for moderation practice.",
          consentToPublish: consent,
          mediaIds: [],
          moderation: "pending",
          moderationNote: "",
          version: 1,
        });
    }

    const handlers: Handlers = {
      ...adminHandlers,
      "reviews.create": (input) =>
        once("reviews.create", input, () => {
          const order = getOrder(input.orderId);
          if (order.status !== "completed")
            throw new ApiError(
              "VALIDATION",
              "A completed rental of your own is required.",
            );
          if (order.review)
            throw new ApiError("CONFLICT", "You already reviewed this rental.");
          if (
            !Number.isInteger(input.rating) ||
            input.rating < 1 ||
            input.rating > 5 ||
            typeof input.consentToPublish !== "boolean" ||
            input.mediaIds.length
          )
            throw new ApiError(
              "VALIDATION",
              "Check review details. Photo upload requires live mode.",
            );
          const review: CustomerReview = {
            id: crypto.randomUUID(),
            orderId: order.id,
            rating: input.rating,
            story: requireText(input.story, "story", 2000),
            consentToPublish: input.consentToPublish,
            mediaIds: [],
            moderation: "pending",
            moderationNote: "",
            version: 1,
          };
          reviews.set(review.id, review);
          order.review = review;
          return review;
        }),
      "catalog.list": (input) =>
        filterProducts(
          [...inventory.values()].filter(
            (product) => product.visibility === "published",
          ),
          normalizeCatalogFilters(input),
        ),
      "catalog.get": ({ slug }) => {
        const product = [...inventory.values()].find(
          (item) => item.slug === slug && item.visibility === "published",
        );
        if (!product) throw new ApiError("NOT_FOUND", "Product not found.");
        return product;
      },
      "session.get": () => ({
        profile: currentProfile(),
        csrfToken: identity ? "demo-only-not-a-real-token" : null,
      }),
      "session.logout": () => {
        identity = null;
        identityVersion += 1;
      },
      "profile.update": (input) => {
        const profile = actor();
        const name = requireText(input.name, "name", 100);
        const phone = requireText(input.phone, "phone", 20);
        if (!/^\+?[\d ()-]{8,20}$/.test(phone))
          throw new ApiError("VALIDATION", "Enter a valid contact number.", {
            phone: "Use 8–20 phone characters.",
          });
        profile.name = name;
        profile.phone = phone;
        return profile;
      },
      "availability.calendar": ({ productSlug, month }) => {
        const product = inventory.get(productSlug);
        if (!product || product.visibility !== "published")
          throw new ApiError("NOT_FOUND", "Product not found.");
        const days = monthDates(month);
        if (!days.length)
          throw new ApiError("VALIDATION", "Choose a valid calendar month.");
        return {
          productSlug,
          month,
          checkedAt: timestamp(),
          days: days.map((date) => ({
            date,
            available: available(productSlug, {
              pickupDate: date,
              returnDate: date,
            }),
          })),
        };
      },
      "availability.quote": (input) => {
        dates(input);
        if (
          !Array.isArray(input.items) ||
          !input.items.length ||
          input.items.length > inventory.size
        )
          throw new ApiError(
            "VALIDATION",
            "Choose at least one valid product.",
          );
        const seen = new Set<string>();
        const lines = input.items.map((item) => {
          const product = [...inventory.values()].find(
            (entry) =>
              entry.slug === item.productSlug &&
              entry.visibility === "published",
          );
          if (
            !product ||
            seen.has(item.productSlug) ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 100
          )
            throw new ApiError(
              "VALIDATION",
              "Check product quantities; duplicate products are not allowed.",
            );
          seen.add(item.productSlug);
          return {
            productSlug: product.slug,
            quantity: item.quantity,
            name: product.name,
            amount: product.price * item.quantity,
            available: available(product.slug, input),
          };
        });
        checkStock(lines, input);
        const quote: Quote = {
          id: id("quote"),
          pickupDate: input.pickupDate,
          returnDate: input.returnDate,
          lines,
          total: lines.reduce((sum, line) => sum + line.amount, 0),
          currency: "VND",
          expiresAt: new Date(now() + 300000).toISOString(),
          policyLabel:
            "Demo: 1–3 calendar days use the same illustrative amount; this is not a confirmed daily rate. No deposit or extra fee is modelled.",
        };
        quotes.set(quote.id, { quote, owner: currentProfile()?.id ?? null });
        return quote;
      },
      "orders.create": (input) =>
        once("orders.create", input, () => {
          const user = actor();
          if (!user.name.trim() || !user.phone.trim())
            throw new ApiError(
              "VALIDATION",
              "Complete your name and phone in your profile first.",
            );
          const record = quotes.get(input.quoteId);
          if (!record || (record.owner && record.owner !== user.id))
            throw new ApiError(
              "NOT_FOUND",
              "Quote not found. Check availability again.",
            );
          const quote = record.quote;
          if (Date.parse(quote.expiresAt) <= now())
            throw new ApiError(
              "QUOTE_EXPIRED",
              "Your quote expired. Check availability again.",
            );
          dates(quote);
          checkStock(quote.lines, quote);
          const order: RentalOrder = {
            id: id("demo-order"),
            customerId: user.id,
            contact: { name: user.name, phone: user.phone },
            pickupDate: quote.pickupDate,
            returnDate: quote.returnDate,
            lines: clone(quote.lines),
            notes: requireText(input.notes, "notes", 1000, false),
            status: "pending",
            version: 1,
            createdAt: timestamp(),
            payment: {
              due: quote.total,
              collected: 0,
              refunded: 0,
              remaining: quote.total,
              status: "unpaid",
            },
            payments: [],
            changes: [],
            history: [
              {
                actorId: user.id,
                at: timestamp(),
                action: "Request submitted",
                note: "Pending approval; no reservation or payment.",
              },
            ],
          };
          orders.set(order.id, order);
          return order;
        }),
      "orders.list": () => {
        const user = actor();
        return [...orders.values()]
          .filter((order) => order.customerId === user.id)
          .reverse();
      },
      "orders.get": ({ orderId }) => getOrder(orderId),
      "orders.change": (input) =>
        modify(
          input,
          "orders.change",
          (order) => {
            if (!["pending", "confirmed"].includes(order.status))
              throw new ApiError(
                "CONFLICT",
                "This order no longer accepts a change request in the demo.",
              );
            if (order.changes.some((change) => change.status === "pending"))
              throw new ApiError(
                "CONFLICT",
                "A change request is already awaiting review.",
              );
            if (!["dates", "cancel"].includes(input.kind))
              throw new ApiError("VALIDATION", "Choose a valid change type.");
            const range = input.kind === "dates" ? input.dates : order;
            if (!range) throw new ApiError("VALIDATION", "Choose new dates.");
            if (input.kind === "dates") dates(range);
            const reason = requireText(input.reason, "reason", 1000);
            order.changes.push({
              id: id("change"),
              kind: input.kind,
              pickupDate: range.pickupDate,
              returnDate: range.returnDate,
              reason,
              status: "pending",
            });
            return audit(order, "Change requested", reason);
          },
          false,
        ),
      "admin.payments.list": () => {
        actor("payments:write");
        return [...orders.values()].reverse();
      },
      "admin.orders.list": () => {
        actor("orders:manage");
        return [...orders.values()].reverse();
      },
      "admin.orders.transition": (input) =>
        modify(input, "admin.orders.transition", (order) => {
          if (!orderTransitions[order.status].includes(input.status))
            throw new ApiError(
              "CONFLICT",
              "That status transition is not allowed.",
            );
          if (order.changes.some((change) => change.status === "pending"))
            throw new ApiError(
              "CONFLICT",
              "Resolve the pending change request first.",
            );
          const note = requireText(input.note, "note", 1000);
          if (input.status === "confirmed") {
            dates(order);
            checkStock(order.lines, order, order.id);
          }
          order.status = input.status;
          return audit(order, orderStatusLabels[input.status], note);
        }),
      "admin.orders.resolve": (input) =>
        modify(input, "admin.orders.resolve", (order) => {
          const change = order.changes.find(
            (entry) => entry.id === input.changeId,
          );
          if (
            !change ||
            change.status !== "pending" ||
            !["pending", "confirmed"].includes(order.status)
          )
            throw new ApiError(
              "CONFLICT",
              "This change request is no longer actionable.",
            );
          if (!["accepted", "rejected"].includes(input.decision))
            throw new ApiError("VALIDATION", "Choose a valid decision.");
          const note = requireText(input.note, "note", 1000);
          if (input.decision === "accepted") {
            if (change.kind === "dates") {
              dates(change);
              checkStock(order.lines, change, order.id);
              order.pickupDate = change.pickupDate;
              order.returnDate = change.returnDate;
            } else order.status = "cancelled";
          }
          change.status = input.decision;
          return audit(order, `Change ${input.decision}`, note);
        }),
      "admin.payments.record": (input) => {
        actor("payments:write");
        return modify(
          input,
          "admin.payments.record",
          (order) => {
            if (
              !["collection", "refund"].includes(input.kind) ||
              !Number.isSafeInteger(input.amount) ||
              input.amount <= 0
            )
              throw new ApiError(
                "VALIDATION",
                "Enter a positive whole VND amount.",
              );
            const note = requireText(input.note, "note", 1000);
            const occurred = Date.parse(input.occurredAt);
            if (!Number.isFinite(occurred) || occurred > now())
              throw new ApiError(
                "VALIDATION",
                "Enter a valid transaction time that is not in the future.",
              );
            const payment = order.payment;
            if (
              input.kind === "refund" &&
              input.amount > payment.collected - payment.refunded
            )
              throw new ApiError(
                "VALIDATION",
                "Refund cannot exceed net money collected.",
              );
            if (
              input.kind === "collection" &&
              (["cancelled", "rejected"].includes(order.status) ||
                input.amount > payment.remaining)
            )
              throw new ApiError(
                "VALIDATION",
                "Collection cannot exceed the remaining amount or target a closed request.",
              );
            if (input.kind === "collection") payment.collected += input.amount;
            else payment.refunded += input.amount;
            payment.remaining =
              payment.due - payment.collected + payment.refunded;
            payment.status =
              payment.remaining === 0
                ? "paid"
                : payment.collected === payment.refunded
                  ? "unpaid"
                  : "partial";
            order.payments.push({
              id: id("payment"),
              kind: input.kind,
              amount: input.amount,
              occurredAt: new Date(occurred).toISOString(),
              note,
              actorId: actor().id,
            });
            return audit(
              order,
              input.kind === "collection"
                ? "Offline collection recorded"
                : "Offline refund recorded",
              note,
            );
          },
          true,
          "payments:write",
        );
      },
    };
    const api: RentalApi = {
      async call<K extends OperationName>(
        operation: K,
        input: Input<K>,
        callOptions?: { signal?: AbortSignal },
      ): Promise<Output<K>> {
        if (scope && !scopeAllows(scope, operation))
          throw new ApiError(
            "FORBIDDEN",
            "This operation belongs to a different workspace.",
          );
        const principalVersion = identityVersion;
        const request = clone(input);
        await new Promise<void>((resolve, reject) => {
          const signal = callOptions?.signal;
          const abort = () => {
            clearTimeout(timer);
            reject(new ApiError("ABORTED", "Request cancelled."));
          };
          const timer = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
          }, options.latencyMs ?? 180);
          if (signal?.aborted) abort();
          else signal?.addEventListener("abort", abort, { once: true });
        });
        if (principalVersion !== identityVersion)
          throw new ApiError(
            "UNAUTHENTICATED",
            "Session changed. Please retry with your current account.",
          );
        if (nextFailure) {
          const error = nextFailure;
          nextFailure = null;
          throw error;
        }
        // Every mutation below is synchronous: a second confirmation observes the first.
        return clone(handlers[operation](request));
      },
    };
    return {
      api,
      seedDemoData,
      signIn(next: DemoIdentity) {
        if (
          scope &&
          (scope === "customer") !==
            ["customer", "other-customer"].includes(next)
        )
          throw new ApiError(
            "FORBIDDEN",
            "This account belongs to a different workspace.",
          );
        if (staff.get(profiles[next].id)?.active === false)
          throw new ApiError("FORBIDDEN", "This staff account is disabled.");
        identity = next;
        identityVersion += 1;
      },
      expireSession() {
        identity = null;
        identityVersion += 1;
      },
      failNext(
        error = new ApiError(
          "NETWORK",
          "Simulated connection failure. Retry your request.",
        ),
      ) {
        nextFailure = error;
      },
    };
  }
  return {
    ...createClient(),
    forScope: (scope: ApiScope) => createClient(scope),
  };
}
