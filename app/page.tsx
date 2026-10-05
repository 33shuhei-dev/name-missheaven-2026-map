import Link from "next/link";
import { site } from "@/lib/data";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { CONFIDENCE_DESCRIPTION, CONFIDENCE_LABEL, CONFIDENCE_ORDER } from "@/lib/labels";
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
  }));
  const total = stats.recordCount || 1;

  return (
    <div className="home">
      {/* ファーストビューは短く。主役は地図 */}
      <section className="hero">
        <h1 className="hero__title">
          <span className="hero__unofficial">非公式</span>
          <span className="hero__event">ミスヘブン総選挙2026</span>
          <span className="hero__name">全国情報まとめ</span>
        </h1>
        <p className="hero__lead">公開情報で確認できた部門・店舗・出場者を地図から探せます。</p>
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
                <dt>観測レコード</dt>
                <dd>{stats.recordCount}</dd>
              </div>
              <div>
                <dt>部門情報あり</dt>
                <dd>
                  {stats.prefecturesWithData}
                  <small>県</small>
                </dd>
              </div>
              <div>
                <dt>部門名（原文）</dt>
                <dd>{stats.categoryNameCount}</dd>
              </div>
              <div>
                <dt>掲載地域</dt>
                <dd>{stats.listingAreaCount}</dd>
              </div>
              <div>
                <dt>店舗</dt>
                <dd>{stats.storeCount}</dd>
              </div>
              <div>
                <dt>出場者</dt>
                <dd>{stats.entrantCount}</dd>
              </div>
            </dl>

            <div className="conf-bar" aria-label="確認状態の内訳">
              <div className="conf-bar__track" aria-hidden="true">
                {CONFIDENCE_ORDER.map((c) => (
                  <span
                    key={c}
                    className={`conf-bar__seg conf-bar__seg--${c}`}
                    style={{ width: `${(stats.byConfidence[c] / total) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="conf-bar__legend">
                {CONFIDENCE_ORDER.map((c) => (
                  <li key={c}>
                    <Link href={`/search?confidence=${c}&kind=division`} title={CONFIDENCE_DESCRIPTION[c]}>
                      <span className={`conf-bar__dot conf-bar__dot--${c}`} aria-hidden="true" />
                      {CONFIDENCE_LABEL[c]}
                      <strong>{stats.byConfidence[c]}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {unknownPrefecture && (
              <Link href={`/pref/${UNKNOWN_PREFECTURE_SLUG}`} className="row-link row-link--compact">
                <span className="row-link__main">
                  <span className="row-link__title">地域未判明の情報</span>
                  <span className="row-link__sub">都道府県を確認できていない観測 {unknownPrefecture.recordCount}件</span>
                </span>
                <span aria-hidden="true" className="row-link__arrow">›</span>
              </Link>
            )}
            <p className="hint hint--tight">
              件数はすべて観測レコードからの自動集計です。出場者は店舗名×人物名の数で、全出場者数ではありません。
              {stats.lastCheckedAt && ` 最終確認日：${stats.lastCheckedAt}`}
            </p>
          </section>

          {/* ④ 都道府県一覧（地図の補助。地方ごとに折りたたみ） */}
          <section className="side-block" aria-labelledby="list-heading">
            <h2 id="list-heading">都道府県一覧</h2>
            <p className="hint hint--tight">地方を開くと都道府県を選べます。色は地図と同じ、数字は観測レコード数です。</p>
            <PrefecturePicker model={site} />
          </section>
        </div>
      </div>

      {/* ⑤ 部門一覧への導線 */}
      <section className="section">
        <Link href="/categories" className="cta">
          <span className="cta__main">
            <span className="cta__title">部門一覧</span>
            <span className="cta__sub">全国の部門名（原文）{stats.categoryNameCount}種類を、件数・都道府県・確認状態で探す</span>
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
