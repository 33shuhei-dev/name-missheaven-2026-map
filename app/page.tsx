import Link from "next/link";
import { site } from "@/lib/data";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { JapanMap, type MapPrefecture } from "@/components/JapanMap";
import { MapLegend } from "@/components/MapLegend";
import { SearchBox } from "@/components/SearchBox";
import { PrefecturePicker } from "@/components/PrefecturePicker";
import { featuredCategories, summarizeCategories } from "@/lib/categories";
import { CategoryCard } from "@/components/CategoryCard";
import { RandomCategoryButton } from "@/components/RandomCategoryButton";

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
  const featured = featuredCategories(categories, 12);

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
          ミスヘブン総選挙2026の出場情報を、<strong>推しの名前・部門・地域</strong>から探せる非公式まとめです。
        </p>
        {/* 推しから探す（目的を持って来た人の入口） */}
        <div className="hero-search">
          <p className="hero-search__label">
            推しの名前・店舗・部門・地域から検索
          </p>
          <SearchBox placeholder="例：ゆず、abc＋、厚木" />
          <p className="hint hint--tight">出場者の名前は、このサイトで確認できた一部です。見つからないときは店舗名や地域でも探せます。</p>
        </div>
        {/* 数字はそのまま探索の入口 */}
        <ul className="hero-stats">
          <li>
            <a href="#categories" className="hero-stat hero-stat--primary">
              <span className="hero-stat__num">{categories.length}</span>
              <span className="hero-stat__label">部門</span>
              <span className="hero-stat__go">部門から探す ›</span>
            </a>
          </li>
          <li>
            <Link href="/search?kind=store" className="hero-stat">
              <span className="hero-stat__num">{stats.stores.storeCount}</span>
              <span className="hero-stat__label">掲載店舗</span>
              <span className="hero-stat__go">店舗を探す ›</span>
            </Link>
          </li>
          <li>
            <a href="#map" className="hero-stat">
              <span className="hero-stat__num">
                {stats.prefecturesWithData}
                <small>/{stats.prefectureTotal}</small>
              </span>
              <span className="hero-stat__label">都道府県</span>
              <span className="hero-stat__go">地域から探す ›</span>
            </a>
          </li>
        </ul>
        <ol className="flow" aria-label="探し方">
          <li>推し・部門・地域で探す</li>
          <li>店舗を見つける</li>
          <li>店舗の公開ページで詳しく見る</li>
        </ol>
      </section>

      {/* 部門の面白さ：データに実在する部門名から */}
      <section className="section fun-cats" id="categories" aria-labelledby="fun-heading">
        <h2 id="fun-heading">こんな部門まである</h2>
        <p className="hint hint--tight">ミスヘブン総選挙2026には、全国で{categories.length}種類もの部門が見つかっています。気になる部門をタップしてみてください。</p>
        <ul className="cat-grid">
          {featured.map((c) => (
            <li key={c.name}>
              <CategoryCard row={c} />
            </li>
          ))}
        </ul>
        <RandomCategoryButton hrefs={categories.map((c) => c.href)} />
        <Link href="/categories" className="cta">
          <span className="cta__main">
            <span className="cta__title">部門一覧を見る</span>
            <span className="cta__sub">{categories.length}種類をスクロールして眺める</span>
          </span>
          <span aria-hidden="true" className="cta__arrow">›</span>
        </Link>
      </section>

      <div className="home-grid section">
        {/* 全国地図 */}
        <section className="map-card" id="map" aria-labelledby="map-heading">
          <div className="map-card__head">
            <h2 id="map-heading">地域から探す</h2>
            <span className="map-card__sub">都道府県をタップ</span>
          </div>
          <JapanMap prefectures={mapPrefs} />
          <MapLegend counts={stats.statusCounts} />
        </section>

        <div className="home-side">

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
