import Link from "next/link";
import { CONTACT_X_HANDLE, CONTACT_X_URL } from "@/lib/contact";

/** 掲載依頼の案内。「推しが見つからない」ときの入口 */
export function ListingRequestCta({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={compact ? "listing-cta listing-cta--compact" : "listing-cta"} aria-label="掲載依頼">
      <p className="listing-cta__title">推しが載っていない？</p>
      <p className="listing-cta__body">
        出場者本人・ファン・お店からの<strong>掲載依頼</strong>を受け付けています。名前・店舗・部門と、<strong>在籍ページのURLかスクショ</strong>（または出場が分かる投稿）を{" "}
        <a href={CONTACT_X_URL} target="_blank" rel="noopener noreferrer">
          {CONTACT_X_HANDLE}
        </a>{" "}
        のDMへ。
      </p>
      <Link href="/about#listing" className="listing-cta__more">
        依頼文を作る ›
      </Link>
    </aside>
  );
}
