import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ミスヘブン総選挙2026 非公式全国マップ",
    template: "%s | ミスヘブン総選挙2026 非公式全国マップ",
  },
  description:
    "ミスヘブン総選挙2026の都道府県・エリア・部門・出場者・店舗の情報を全国横断で探せる非公式サイト。公式サイトではありません。",
  // v0.1 は未確認の調査候補が中心のため、検索エンジンへの登録を控える
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f4e79",
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
