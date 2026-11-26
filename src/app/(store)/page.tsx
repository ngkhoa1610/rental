import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Sparkles,
  Shirt,
  ClipboardCheck,
  MapPin,
} from "lucide-react";
import { T } from "@/components/store/language-provider";
import { ProductCard } from "@/components/store/product-card";
import { QuickBooking } from "@/components/store/quick-booking";
import { RentalFaq } from "@/components/store/rental-faq";
import { FashionImage } from "@/components/ui/fashion-image";
import { SectionButton } from "@/components/ui/section-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { storeProducts } from "@/server/rental/storefront";
export const metadata: Metadata = {
  title: "Rental Store — Trang phục đẹp, đúng lịch của bạn",
  description:
    "Khám phá trang phục, xem lịch trống và gửi yêu cầu thuê để cửa hàng xác nhận.",
};
const steps = [
  {
    icon: Shirt,
    title: "Find your look",
    copy: "Explore silhouettes and measurements before choosing.",
  },
  {
    icon: CalendarDays,
    title: "Pick dates. Send a request.",
    copy: "Check availability and use your saved contact details.",
  },
  {
    icon: ClipboardCheck,
    title: "Get your booking ID",
    copy: "The store reviews your request and confirms the rental.",
  },
  {
    icon: MapPin,
    title: "Try on. Pick up. Enjoy.",
    copy: "Arrange your visit. Delivery requests need store confirmation.",
  },
];
export default async function HomePage() {
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.DATABASE_URL?.trim()
  )
    redirect("/layout-preview");

  const products = await storeProducts();
  if (!products.length)
    return (
      <div className="store-home">
        <h1>Trang phục đẹp, đúng lịch của bạn</h1>
        <p>Cửa hàng đang chuẩn bị bộ sưu tập.</p>
        <RentalFaq />
      </div>
    );
  return (
    <div className="store-home">
      <section className="store-home-hero" aria-labelledby="hero-title">
        <div className="store-hero-copy">
          <h1 id="hero-title">
            <T>{"The right look."}</T>
            <em>
              <T>{"For your day."}</T>
            </em>
          </h1>
          <p className="store-hero-lead">
            <T>
              {
                "Dress for the invitation, the celebration, or just a different kind of day. Find a look, check your dates, and let the store take it from there."
              }
            </T>
          </p>
          <div className="home-actions">
            <Link href="/products" className="home-cta">
              <T>{"Explore the wardrobe"}</T>
            </Link>
            <SectionButton target="quick-booking" className="home-cta-ghost">
              <CalendarDays />
              <T>{"Check outfit availability"}</T>
            </SectionButton>
          </div>
        </div>
        <figure className="store-hero-image">
          <FashionImage
            src={products[0].image}
            alt={products[0].imageAlt}
            fill
            preload
            sizes="(max-width:767px) 92vw, 550px"
          />
        </figure>
      </section>
      <ul className="store-trust-strip">
        {[
          { icon: CalendarDays, text: "Check dates before you book" },
          { icon: Sparkles, text: "Send a request. The store will confirm." },
        ].map(({ icon: Icon, text }) => (
          <li key={text}>
            <Icon aria-hidden="true" />
            <T>{text}</T>
          </li>
        ))}
      </ul>
      <QuickBooking />
      <section className="store-home-section">
        <div className="store-section-heading">
          <div>
            <h2>Danh mục trang phục</h2>
          </div>
          <Link href="/products" className="store-text-link">
            <T>{"Explore the wardrobe"}</T>
            <ArrowUpRight />
          </Link>
        </div>
        <div className="store-product-grid">
          {products.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      </section>
      <ScrollReveal>
        <section className="store-home-section" id="rental-process">
          <div className="store-section-heading">
            <div>
              <h2>Cách thuê trang phục</h2>
            </div>
            <Link href="/rental-guide" className="store-text-link">
              <T>{"See the rental guide"}</T>
              <ArrowUpRight />
            </Link>
          </div>
          <ol className="store-step-grid">
            {steps.map(({ icon: Icon, title, copy }, index) => (
              <li key={title}>
                <div>
                  <span>0{index + 1}</span>
                  <Icon />
                </div>
                <h3>
                  <T>{title}</T>
                </h3>
                <p>
                  <T>{copy}</T>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </ScrollReveal>
      <section className="store-home-section store-home-faq">
        <div>
          <h2>Câu hỏi thường gặp</h2>
        </div>
        <RentalFaq />
      </section>
    </div>
  );
}
