import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "特集：総選挙の歴史（ルールと盛り上がりの移り変わり）" };

type Row = { year: string; what: string; src: string; href: string; level: string };

/** 年表。出典のページを実際に開いて、本文に書かれていたことだけを載せる（確認日：2026-11-08） */
const TIMELINE: Row[] = [
  { year: "2015", what: "「2015年からスタートしたイベント」と説明されている", src: "ABEMA TIMES（2025/9/12）", href: "https://times.abema.tv/articles/-/10198348", level: "媒体の記事のみ" },
  { year: "2021", what: "全国総合ランキングの1位は天野リリスさん（記事は「1万1877人の頂点に」と表記）", src: "ABEMA TIMES（2025/9/12）", href: "https://times.abema.tv/articles/-/10198348", level: "媒体の記事のみ" },
  { year: "2022", what: "グランプリ（全国1位）は西本ちかさん", src: "姫デコ magazine", href: "https://www.girlsheaven-job.net/girlsbox/nisihimoto-chika/", level: "媒体の記事のみ" },
  { year: "2023", what: "グランプリはまりてんさん", src: "姫デコ magazine", href: "https://www.girlsheaven-job.net/girlsbox/mariten00/", level: "媒体の記事のみ" },
  { year: "2024", what: "グランプリは朝日奈みうさん、準グランプリは聖来さん、3位はえみりさん。総投票は695万票で史上最多と記載（朝日奈みうさんは前年の準グランプリからのリベンジ）", src: "姫デコ magazine（2025/12/17更新）", href: "https://www.girlsheaven-job.net/girlsbox/miss-heaven-2024-grandprix/", level: "媒体の記事のみ" },
  { year: "2024", what: "ブロック本選の結果発表は12月3日（火）12時。グランプリの発表配信は12月21日（土）21時から（YouTube）", src: "ヘブンネット公式FAQ（2024/12/3）", href: "https://www.hgjn-help.com/info_and_news/show/320?site_domain=heavennet_faq", level: "公式" },
  { year: "2025", what: "グランプリは白星ホタルさん（関西ブロック）、準グランプリはセラさん、3位は小林ルルさん。投票した会員は約51万人、エントリーは約1万人、グランプリは約15万票（史上最多）", src: "インスプレス／姫デコ magazine", href: "https://ins-press.com/topic-903", level: "媒体の記事のみ" },
  { year: "2026", what: "地方予選10/28〜11/3、ブロック本選11/17〜11/23。チケットは最大50票（事前ミッション40＋期間中10）", src: "ヘブンnavi／公式FAQ", href: "https://link-f.biz/archives/25134", level: "公式・媒体" },
];

const RULES: { item: string; before: string; after: string; src: string; href: string }[] = [
  {
    item: "本選に進む条件",
    before: "〜2024年：都道府県の総合順位の上位約10%",
    after: "2025年〜：地方予選で50人のユーザーから投票されること（順位ではなく、投票した人数で判定）",
    src: "姫デコ magazine（2025年の地方予選解説）",
    href: "https://www.girlsheaven-job.net/girlsbox/miss-heaven-2025/",
  },
  {
    item: "称号",
    before: "（2024年以前は記載なし）",
    after: "2025年〜：都道府県代表（50人）、ブロック代表（100人）、日本代表（200人）、神15。姫デコで投票人数の進捗を確認できるように",
    src: "姫デコ magazine（2025年の地方予選解説）",
    href: "https://www.girlsheaven-job.net/girlsbox/miss-heaven-2025/",
  },
  {
    item: "1キャストへの投票の上限",
    before: "2025年：一般会員は最大50票（1日10票まで）、有料会員は最大100票（1日50票まで）",
    after: "2026年：全員、1日10票まで・最大50票（有料会員の枠は記載なし）",
    src: "姫デコ magazine／2026年公式FAQ",
    href: "https://www.hgjn-help.com/faq/show/13558?site_domain=heavennet_faq",
  },
  {
    item: "チケットと倍率",
    before: "（2025年以前は記載なし）",
    after: "2026年：最大50票、予選の余りは本選に持ち越せない。ネット予約で票が2倍・3倍",
    src: "ヘブンnavi／2026年公式FAQ",
    href: "https://link-f.biz/archives/25134",
  },
];

export default function HistoryPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集", href: "/feature" }, { label: "総選挙の歴史" }]} />
      <h1>特集：総選挙の歴史</h1>
      <p className="hint">
        ルールの変化と、盛り上がりの移り変わりを、公開されている情報から振り返る特集です。出典のページを実際に開いて確認できたことだけを載せています。わからないことは「わからない」と書きます。
      </p>

      <section className="section card prose">
        <h2>先に、わかっていること</h2>
        <ul>
          <li>総選挙は、媒体の記事で「2015年からスタート」と説明されています。</li>
          <li>グランプリは、2022年が西本ちかさん、2023年がまりてんさん、2024年が朝日奈みうさん、2025年が白星ホタルさんです。</li>
          <li>規模は年々大きくなっています。2024年は総投票695万票で史上最多、2025年は投票した会員が約51万人、グランプリが約15万票で、どちらも「史上最多」と書かれています。</li>
          <li>ルールは、2025年に本選へ進む条件が「順位の上位約10%」から「50人からの投票」に変わりました。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>年表</h2>
        <ol className="history-list">
          {TIMELINE.map((r, i) => (
            <li key={i} className="history-item">
              <span className="history-item__year">{r.year}</span>
              <div className="history-item__body">
                <p>{r.what}</p>
                <p className="history-item__src">
                  <a href={r.href} target="_blank" rel="noopener noreferrer nofollow ugc">{r.src}</a>
                  <span className="history-item__level">{r.level}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="hint">「媒体の記事のみ」は、公式ではなくニュースサイトや求人サイトの記事で確認できたという意味です。</p>
      </section>

      <section className="section card prose">
        <h2>ルールの変化</h2>
        <ul className="history-list">
          {RULES.map((r) => (
            <li key={r.item} className="history-item history-item--rule">
              <div className="history-item__body">
                <p><strong>{r.item}</strong></p>
                <p><span className="history-item__tag">以前</span>{r.before}</p>
                <p><span className="history-item__tag history-item__tag--now">いま</span>{r.after}</p>
                <p className="history-item__src">
                  <a href={r.href} target="_blank" rel="noopener noreferrer nofollow ugc">{r.src}</a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section card prose">
        <h2>盛り上がりの数字</h2>
        <div className="table-wrap">
          <table className="feature-table">
            <thead>
              <tr>
                <th>年</th>
                <th>数字</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="nowrap">2024</td><td>総投票 695万票（史上最多と記載）</td></tr>
              <tr><td className="nowrap">2025</td><td>投票した会員 約51万人／エントリー 約1万人／グランプリ 約15万票（いずれも史上最多と記載）</td></tr>
              <tr><td className="nowrap">2026</td><td>参加キャスト 約1万人（地方予選の案内より）</td></tr>
            </tbody>
          </table>
        </div>
        <p className="hint">数字の集計の範囲は、出典ごとに違うことがあります（例：総投票を倍率の適用前で数えるか、後で数えるか）。年をまたいで単純に比べないでください。</p>
      </section>

      <section className="section card prose">
        <h2>わからなかったこと</h2>
        <ul>
          <li>第1回がいつか、各年の回次の一覧は、公式の資料では見つかっていません。</li>
          <li>2015〜2020年のグランプリや、2021〜2022年の準グランプリ・3位、2023年の3位は、確認できていません。</li>
          <li>2023年以前のチケットの枚数や、ネット予約の倍率がいつ始まったかは、確認できていません。</li>
          <li>2022〜2024年の投票者数などを載せた広告資料は、本文を読めず、確認できていないため載せていません。</li>
        </ul>
        <p>この特集は有志による非公式のまとめで、公式の見解ではありません。情報が見つかり次第、追加します。</p>
        <p><Link href="/feature">特集：まず200人、そして15万票へ ›</Link></p>
      </section>
    </>
  );
}
