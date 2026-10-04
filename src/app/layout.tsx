import { CatalogDataProvider } from "@/components/store/catalog-data";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SelectionProvider } from "@/components/store/selection-provider";
import { LanguageProvider } from "@/components/store/language-provider";
import {
  ApiProvider,
  ApiBackendProvider,
} from "@/components/store/api-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Rental Store — Fashion Rental",
  description:
    "Discover curated fashion looks for dates, weddings, weekends and every moment worth dressing up for.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ApiBackendProvider>
            <ApiProvider>
              <CatalogDataProvider>
                <SelectionProvider>{children}</SelectionProvider>
              </CatalogDataProvider>
            </ApiProvider>
          </ApiBackendProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
