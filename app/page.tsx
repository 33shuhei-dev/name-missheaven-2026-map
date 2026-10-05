import Link from "next/link";
import { site } from "@/lib/data";
import { PREFECTURES, UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
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

  return (
    <>
      <section className="hero">
        <p className="hero__unofficial">非公式</p>
        <h1 className="hero__title">
          ミスヘブン総選挙2026
          <br />
          全国情報まとめ<span className="hero__title-note">（非公式）</span>
        </h1>
        <p className="hero__lead">
          公開情報から確認できた都道府県・掲載地域・部門・店舗・出場者を、全国地図から探せる非公式のまとめです。
        </p>
      </section>

      <div className="home-grid">
      <section className="card map-card" aria-labelledby="map-heading">
        <h2 id="map-heading">地図から探す</h2>
        <JapanMap prefectures={mapPrefs} />
        <MapLegend counts={stats.statusCounts} />
      </section>

      <div>

      <section className="section" aria-labelledby="search-heading">
        <h2 id="search-heading">全国から検索</h2>
        <SearchBox />
        <p className="hint">都道府県・掲載地域・部門・店舗・出場者を横断して探せます。空白で区切ると絞り込み検索になります。</p>
      </section>

      <section className="section" aria-labelledby="stats-heading">
        <h2 id="stats-heading">全国の状況</h2>
        <dl className="stats">
          <div>
            <dt>都道府県</dt>
            <dd>{stats.prefectureTotal}</dd>
          </div>
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
        </dl>
        <ul className="confidence-breakdown">
          {CONFIDENCE_ORDER.map((c) => (
            <li key={c}>
              <Link href={`/search?confidence=${c}&kind=division`} title={CONFIDENCE_DESCRIPTION[c]}>
                <span className={`badge badge--${c}`}>{CONFIDENCE_LABEL[c]}</span>
                <span className="confidence-breakdown__num">
                  {stats.byConfidence[c]}
                  <small>件</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="hint">
          件数はすべて観測レコードからの自動集計です。「部門情報あり」は観測が1件以上ある都道府県（全{PREFECTURES.length}都道府県中）。
          出場者数（{stats.entrantCount}）は店舗名×人物名の数で、実際の人数の重複排除や全出場者数ではありません。
          {stats.lastCheckedAt && ` 最終確認日：${stats.lastCheckedAt}`}
        </p>
        {unknownPrefecture && (
          <Link href={`/pref/${UNKNOWN_PREFECTURE_SLUG}`} className="row-link">
            <span className="row-link__main">
              <span className="row-link__title">地域未判明の情報</span>
              <span className="row-link__sub">
                都道府県を確認できていない観測 {unknownPrefecture.recordCount}件（地図には配置していません）
              </span>
            </span>
            <span aria-hidden="true" className="row-link__arrow">›</span>
          </Link>
        )}
      </section>
      </div>
      </div>

      <section className="section" aria-labelledby="list-heading">
        <h2 id="list-heading">都道府県一覧</h2>
        <p className="hint">地図と同じ色分けです。数字は観測レコード数です。</p>
        <PrefecturePicker model={site} />
      </section>

      <section className="section">
        <h2>部門から探す</h2>
        <p>全国で見つかった部門名（原文）を、件数・都道府県・確認状態で絞り込みながら一覧できます。</p>
        <Link href="/categories" className="button">
          部門一覧を見る
        </Link>
      </section>

      <section className="section notice">
        <p>
          <strong>ご注意：</strong>
          本サイトは非公式です。公開情報から確認できた範囲だけを掲載しており、全出場者・全部門の網羅や、正式な選挙エリアを示すものではありません。情報は更新される可能性があります。
        </p>
      </section>
    </>
  );
}
