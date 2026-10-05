import Link from "next/link";
import type { Confidence } from "@/data/types";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { ConfidenceBadge } from "./Badges";

/** 店舗への一覧行リンク（店名 ＞ 確認状態 ＞ 掲載地域・部門 ＞ 公開ページの有無） */
export function StoreRow({
  store,
  confidence,
  showArea = true,
}: {
  store: {
    id: string;
    name: string;
    listingAreas?: string[];
    categoryOriginals?: string[];
    storePublicUrl?: string;
    hasPublicUrl?: boolean;
    isNewSincePhase1?: boolean;
  };
  /** 表示する確認状態（部門ページでは店舗×部門関係の確認状態） */
  confidence: Confidence;
  showArea?: boolean;
}) {
  const hasPublic = store.hasPublicUrl ?? !!store.storePublicUrl;
  const cats = store.categoryOriginals;
  return (
    <Link href={`/store/${store.id}`} className={`div-card div-card--store div-card--${confidence}`}>
      <span className="div-card__head">
        <span className="div-card__title">{store.name}</span>
        <ConfidenceBadge value={confidence} small subject="store" />
      </span>
      <span className="div-card__meta">
        {showArea && store.listingAreas && (
          <span>{store.listingAreas.length ? store.listingAreas.join("、") : UNKNOWN_AREA_LABEL}</span>
        )}
        {cats && <span>{cats.length ? `部門 ${cats.length}` : "部門未確認"}</span>}
        <span className={hasPublic ? "pill pill--ok" : "pill"}>{hasPublic ? "公開ページあり" : "公開ページ未登録"}</span>
        {store.isNewSincePhase1 && <span className="pill pill--new">追加調査で判明</span>}
      </span>
    </Link>
  );
}
