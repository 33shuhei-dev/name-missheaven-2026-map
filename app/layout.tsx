import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const SITE_URL = "https://name-missheaven-2026-map.vercel.app";
const SITE_TITLE = "ミスヘブン総選挙2026 全国情報まとめ（非公式）";
const SITE_DESCRIPTION =
  "ミスヘブン総選挙2026について、公開情報から確認できた都道府県・掲載地域・部門・店舗・出場者を全国地図から探せる非公式のまとめ。公式サイトではありません。";

export const metadata: Metadata = {
  // SNS（X など）に貼ったときのプレビュー用。検索エンジンへの登録（noindex）とは別
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-feature.jpg", width: 1200, height: 630, alt: "まず200人。そして15万票へ。2026年の神15を数学で考える" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-feature.jpg"],
  },
  title: {
    default: "ミスヘブン総選挙2026 全国情報まとめ（非公式）",
    template: "%s | ミスヘブン総選挙2026 全国情報まとめ（非公式）",
  },
  description:
    "ミスヘブン総選挙2026について、公開情報から確認できた都道府県・掲載地域・部門・店舗・出場者を全国地図から探せる非公式のまとめ。公式サイトではありません。",
  // 候補情報（未確認）を多く含むため、当面は検索エンジンへの登録を控える
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0914",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main">
          本文へ移動
        </a>
        <SiteHeader />
        <main id="main" className="container main">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
