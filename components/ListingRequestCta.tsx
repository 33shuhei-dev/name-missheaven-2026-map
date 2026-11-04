import Link from "next/link";
import { CONTACT_X_HANDLE, CONTACT_X_URL } from "@/lib/contact";

/** 掲載依頼の案内。「推しが見つからない」ときの入口 */
export function ListingRequestCta({ compact = false, forStore = false }: { compact?: boolean; forStore?: boolean }) {
  return (
    <aside className={compact ? "listing-cta listing-cta--compact" : "listing-cta"} aria-label="掲載依頼">
      <p className="listing-cta__title">{forStore ? "お店の方へ：在籍キャストをまとめて載せられます" : "推しが載っていない？ 私がいない？"}</p>
      <p className="listing-cta__body">
        {forStore ? <>このお店のキャストの名前・部門をまとめてお知らせいただければ、1件ずつ確認して載せます。</> : null}
        「私がいない！」という<strong>出場者ご本人</strong>からのDMも待っています。ファン・お店からの<strong>掲載依頼</strong>も受け付けています。名前・店舗・部門と、<strong>在籍ページのスクショ</strong>（アカウント凍結を避けるため、<strong>リンクは貼らず</strong>スクショをお願いします）を{" "}
        <a href={CONTACT_X_URL} target="_blank" rel="noopener noreferrer">
          {CONTACT_X_HANDLE}
        </a>{" "}
        のDMへ。
      </p>
      <Link href="/about#listing" className="listing-cta__more">
        掲載依頼の文面を作る ›
      </Link>
    </aside>
  );
}
