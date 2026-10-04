import Link from "next/link";
import { site } from "@/lib/data";
import { SearchBox } from "@/components/SearchBox";
import { PrefecturePicker } from "@/components/PrefecturePicker";
import { StatusNotice } from "@/components/StatusNotice";
import { CONFIDENCE_LABEL, CONFIDENCE_ORDER } from "@/lib/labels";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";

export default function HomePage() {
  const { stats, unknownPrefecture } = site;
  return (
    <>
      <section className="hero">
        <p className="hero__unofficial">非公式・有志によるまとめ</p>
        <h1>ミスヘブン総選挙2026 非公式全国マップ</h1>
        <p className="hero__lead">
          全国に分散している都道府県・エリア・部門・出場者・店舗の情報を、確認元とあわせて全国横断で探せます。公式サイトではありません。
        </p>
        <SearchBox />
        <p className="hint">例：「川崎」「コスプレ」「美尻美脚」「福岡」など。空白で区切ると絞り込み検索になります。</p>
      </section>

      <section aria-labelledby="stats-heading" className="section">
        <h2 id="stats-heading">掲載状況</h2>
        <StatusNotice stats={stats} />
        <dl className="stats">
          <div>
            <dt>情報件数</dt>
            <dd>{stats.recordCount}</dd>
          </div>
          <div>
            <dt>部門</dt>
            <dd>{stats.divisionCount}</dd>
          </div>
          <div>
            <dt>部門名の種類</dt>
            <dd>{stats.categoryNameCount}</dd>
          </div>
          <div>
            <dt>掲載都道府県</dt>
            <dd>
              {stats.prefectureWithDataCount}
              <small> / {stats.prefectureTotal}</small>
            </dd>
          </div>
          <div>
            <dt>出場者</dt>
            <dd>{stats.entrantCount}</dd>
          </div>
          <div>
            <dt>店舗</dt>
            <dd>{stats.storeCount}</dd>
          </div>
        </dl>
        <ul className="confidence-breakdown">
          {CONFIDENCE_ORDER.map((c) => (
            <li key={c}>
              <Link href={`/search?confidence=${c}`}>
                <span className={`badge badge--${c}`}>{CONFIDENCE_LABEL[c]}</span>
                <span>{stats.byConfidence[c]}件</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="hint">
          {stats.lastCheckedAt ? `最終確認日：${stats.lastCheckedAt}` : "確認日が登録された情報はまだありません。"}
          {" "}
          掲載都道府県は情報が1件以上ある都道府県の数、部門は「都道府県・エリア・部門名」の組み合わせ単位で数えています。
        </p>
      </section>

      <section aria-labelledby="area-heading" className="section">
        <h2 id="area-heading">地方・都道府県から探す</h2>
        <PrefecturePicker model={site} />
        {unknownPrefecture && (
          <Link href={`/pref/${UNKNOWN_PREFECTURE_SLUG}`} className="row-link row-link--plain">
            <span className="row-link__main">
              <span className="row-link__title">都道府県未判明の情報</span>
              <span className="row-link__sub">
                部門名だけ判明している情報など {unknownPrefecture.recordCount}件
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </section>

      <section className="section">
        <h2>部門名から探す</h2>
        <p>全国の部門名を一覧し、同じ名前・似た表記の部門がどの地域にあるかを確認できます。</p>
        <Link href="/categories" className="button">
          部門名一覧を見る
        </Link>
      </section>
    </>
  );
}
