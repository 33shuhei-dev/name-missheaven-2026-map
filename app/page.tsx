import Link from "next/link";
import { site } from "@/lib/data";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { JapanMap, type MapPrefecture } from "@/components/JapanMap";
import { MapLegend } from "@/components/MapLegend";
import { SearchBox } from "@/components/SearchBox";
import { PrefecturePicker } from "@/components/PrefecturePicker";

export default function HomePage() {
  const { stats, unknownPrefecture } = site;
  const mapPrefs: MapPrefecture[] = site.prefectures.map((p) => ({
    code: String(p.code).padStart(2, "0"),
    slug: p.slug,
    name: p.name,
    regionId: p.regionId ?? "",
    status: p.status,
    recordCount: p.recordCount,
    storeCount: p.stores.length,
  }));

  return (
    <div className="home">
      {/* ファーストビューは短く。主役は地図 */}
      <section className="hero">
        <h1 className="hero__title">
          <span className="hero__unofficial">非公式</span>
          <span className="hero__event">ミスヘブン総選挙2026</span>
          <span className="hero__name">全国情報まとめ</span>
        </h1>
        <p className="hero__lead">公開情報で確認できた部門・参加店舗を地図から探せます。</p>
      </section>

      <div className="home-grid">
        {/* ① 全国地図 */}
        <section className="map-card" aria-labelledby="map-heading">
          <div className="map-card__head">
            <h2 id="map-heading">地図から探す</h2>
            <span className="map-card__sub">{stats.prefectureTotal}都道府県</span>
          </div>
          <JapanMap prefectures={mapPrefs} />
          <MapLegend counts={stats.statusCounts} />
        </section>

        <div className="home-side">
          {/* ② 全国検索 */}
          <section className="side-block" aria-labelledby="search-heading">
            <h2 id="search-heading">全国から検索</h2>
            <SearchBox />
            <p className="hint hint--tight">都道府県・掲載地域・部門・店舗・出場者を横断して探せます。</p>
          </section>

          {/* ③ 全国状況 */}
          <section className="side-block" aria-labelledby="stats-heading">
            <h2 id="stats-heading">全国の状況</h2>
            <dl className="stats">
              <div>
                <dt>情報のある県</dt>
                <dd>
                  {stats.prefecturesWithData}
                  <small>/{stats.prefectureTotal}</small>
                </dd>
              </div>
              <div>
                <dt>掲載地域</dt>
                <dd>{stats.allListingAreaCount}</dd>
              </div>
              <div>
                <dt>部門名（原文）</dt>
                <dd>{stats.allCategoryNameCount}</dd>
              </div>
              <div>
                <dt>参加関連店舗</dt>
                <dd>{stats.stores.storeCount}</dd>
              </div>
              <div>
                <dt>公開ページあり</dt>
                <dd>{stats.stores.publicUrlCount}</dd>
              </div>
              <div>
                <dt>観測レコード</dt>
                <dd>{stats.recordCount}</dd>
              </div>
            </dl>

            <ConfidenceBar
              title="店舗の参加情報"
              counts={stats.stores.byConfidence}
              subject="store"
              hrefFor={(c) => `/search?kind=store&confidence=${c}`}
            />
            <ConfidenceBar
              title="部門の観測の確認状態"
              counts={stats.byConfidence}
              hrefFor={(c) => `/search?confidence=${c}&kind=division`}
            />

            {unknownPrefecture && (
              <Link href={`/pref/${UNKNOWN_PREFECTURE_SLUG}`} className="row-link row-link--compact">
                <span className="row-link__main">
                  <span className="row-link__title">地域未判明の情報</span>
                  <span className="row-link__sub">
                    都道府県を確認できていない店舗 {unknownPrefecture.stores.length}店・観測 {unknownPrefecture.recordCount}件
                  </span>
                </span>
                <span aria-hidden="true" className="row-link__arrow">›</span>
              </Link>
            )}
            <p className="hint hint--tight">
              件数はすべてデータからの自動集計です。店舗は候補を含み、全参加店舗の数ではありません。
              {stats.lastCheckedAt && ` 最終確認日：${stats.lastCheckedAt}`}
            </p>
          </section>

          {/* ④ 都道府県一覧（地図の補助。地方ごとに折りたたみ） */}
          <section className="side-block" aria-labelledby="list-heading">
            <h2 id="list-heading">都道府県一覧</h2>
            <p className="hint hint--tight">地方を開くと都道府県を選べます。色は地図と同じ、数字は参加関連店舗数です。</p>
            <PrefecturePicker model={site} />
          </section>
        </div>
      </div>

      {/* ⑤ 部門一覧への導線 */}
      <section className="section">
        <Link href="/categories" className="cta">
          <span className="cta__main">
            <span className="cta__title">部門一覧</span>
            <span className="cta__sub">全国の部門名（原文）{stats.allCategoryNameCount}種類を、店舗数・都道府県・確認状態で探す</span>
          </span>
          <span aria-hidden="true" className="cta__arrow">›</span>
        </Link>
      </section>

      <p className="home-note">
        本サイトは非公式です。公開情報から確認できた範囲だけを掲載しており、全出場者・全部門の網羅や正式な選挙エリアを示すものではありません。情報は更新される可能性があります。
        <Link href="/about">このサイトについて</Link>
      </p>
    </div>
  );
}
