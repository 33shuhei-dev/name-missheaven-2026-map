import Link from "next/link";
import { site } from "@/lib/data";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { JapanMap, type MapPrefecture } from "@/components/JapanMap";
import { MapLegend } from "@/components/MapLegend";
import { SearchBox } from "@/components/SearchBox";
import { PrefecturePicker } from "@/components/PrefecturePicker";
import { featuredCategories, summarizeCategories } from "@/lib/categories";

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

  const categories = summarizeCategories(site);
  const featured = featuredCategories(categories);

  return (
    <div className="home">
      {/* ファーストビュー：何のサイトか・何ができるか・次に押す場所 */}
      <section className="hero">
        <h1 className="hero__title">
          <span className="hero__unofficial">非公式</span>
          <span className="hero__event">ミスヘブン総選挙2026</span>
          <span className="hero__name">全国情報まとめ</span>
        </h1>
        <p className="hero__lead">
          ミスヘブン総選挙2026の出場情報を、<strong>全国・地域・部門・店舗</strong>から探せる非公式まとめです。
        </p>
        <dl className="hero-stats">
          <div>
            <dt>掲載店舗</dt>
            <dd>{stats.stores.storeCount}</dd>
          </div>
          <div>
            <dt>部門</dt>
            <dd>{categories.length}</dd>
          </div>
          <div>
            <dt>都道府県</dt>
            <dd>
              {stats.prefecturesWithData}
              <small>/{stats.prefectureTotal}</small>
            </dd>
          </div>
        </dl>
        <div className="hero-actions">
          <a href="#categories" className="hero-action hero-action--primary">
            部門から探す
          </a>
          <a href="#map" className="hero-action">
            地図から探す
          </a>
        </div>
        <ol className="flow" aria-label="探し方">
          <li>部門・地図で探す</li>
          <li>店舗を見つける</li>
          <li>店舗の公開ページで出場者をチェック</li>
        </ol>
      </section>

      {/* 部門の面白さ：データに実在する部門名から */}
      <section className="section fun-cats" id="categories" aria-labelledby="fun-heading">
        <h2 id="fun-heading">こんな部門まである</h2>
        <p className="hint hint--tight">ミスヘブン総選挙には、ユニークな部門がたくさん。気になる部門をタップしてみてください。</p>
        <ul className="fun-cats__list">
          {featured.map((c) => (
            <li key={c.name}>
              <Link href={c.href} className="fun-cat">
                <span className="fun-cat__name">{c.name}</span>
                <span className="fun-cat__meta">
                  {c.storeCount}店{c.prefectureCount > 1 && ` ・ ${c.prefectureCount}都道府県`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/categories" className="cta">
          <span className="cta__main">
            <span className="cta__title">部門一覧を見る</span>
            <span className="cta__sub">全国で見つかった{categories.length}種類の部門から探す</span>
          </span>
          <span aria-hidden="true" className="cta__arrow">›</span>
        </Link>
      </section>

      <div className="home-grid section">
        {/* 全国地図 */}
        <section className="map-card" id="map" aria-labelledby="map-heading">
          <div className="map-card__head">
            <h2 id="map-heading">地図から探す</h2>
            <span className="map-card__sub">都道府県をタップ</span>
          </div>
          <JapanMap prefectures={mapPrefs} />
          <MapLegend counts={stats.statusCounts} />
        </section>

        <div className="home-side">
          <section className="side-block" aria-labelledby="search-heading">
            <h2 id="search-heading">キーワードで探す</h2>
            <SearchBox />
            <p className="hint hint--tight">部門名・店舗名・地域名などで全国から探せます。</p>
          </section>

          {/* 都道府県一覧（地図の補助。地方ごとに折りたたみ） */}
          <section className="side-block" aria-labelledby="list-heading">
            <h2 id="list-heading">都道府県から探す</h2>
            <p className="hint hint--tight">地方を開くと都道府県を選べます。数字は掲載店舗数です。</p>
            <PrefecturePicker model={site} />
            {unknownPrefecture && (
              <p className="hint hint--tight">
                <Link href={`/pref/${UNKNOWN_PREFECTURE_SLUG}`}>
                  都道府県が分かっていない情報（店舗 {unknownPrefecture.stores.length}店）
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>

      <p className="home-note">
        本サイトは非公式です。公開情報から確認できた範囲の情報で、公式情報ではありません。全出場者・全部門の網羅や正式な選挙エリアを示すものではないため、詳しい出場者情報は各店舗の公開ページでご確認ください。
        {stats.lastCheckedAt && ` 最終確認日：${stats.lastCheckedAt}。`}
        <Link href="/about">このサイトについて・データの内訳</Link>
      </p>
    </div>
  );
}
