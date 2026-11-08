import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";

export const metadata: Metadata = { title: "特集2：総選挙の歩みと、2026年の戦略" };

type Row = { year: string; what: string; src: string; href: string; level: string };

/** 年表。出典のページを実際に開いて、本文に書かれていたことだけを載せる（確認日：2026-11-08） */
const TIMELINE: Row[] = [
  { year: "2015", what: "「2015年からスタートしたイベント」と説明されている", src: "ABEMA TIMES（2025/9/12）", href: "https://times.abema.tv/articles/-/10198348", level: "媒体の記事のみ" },
  { year: "2021", what: "全国総合ランキングの1位は天野リリスさん（記事は「1万1877人の頂点に」と表記）", src: "ABEMA TIMES（2025/9/12）", href: "https://times.abema.tv/articles/-/10198348", level: "媒体の記事のみ" },
  { year: "2022", what: "グランプリ（全国1位）は西本ちかさん", src: "姫デコ magazine", href: "https://www.girlsheaven-job.net/girlsbox/nisihimoto-chika/", level: "媒体の記事のみ" },
  { year: "2022", what: "全国TOP10の発表（グランプリを含む）。グランプリ発表は12月5日（月）19時からYouTube「代官山メロン」でライブ配信され、アーカイブは12月8日から配信", src: "ヘブンネット公式FAQ（2022/11/28・12/6）", href: "https://www.hgjn-help.com/info_and_news/show/131?site_domain=heavennet_faq", level: "公式" },
  { year: "2023", what: "グランプリはまりてんさん、準グランプリは朝日奈みうさん。結果は12月17日に発表され、神15も登壇。まりてんさん本人は、講談社の記事で「6万票をいただいた」と語っている（本人の説明）", src: "集英社オンライン／姫デコ magazine／講談社（現代ビジネス）", href: "https://shueisha.online/articles/-/188951", level: "媒体の記事のみ" },
  { year: "2024", what: "グランプリは朝日奈みうさん、準グランプリは聖来さん、3位はえみりさん。総投票は695万票で史上最多と記載（朝日奈みうさんは前年の準グランプリからのリベンジ）", src: "姫デコ magazine（2025/12/17更新）", href: "https://www.girlsheaven-job.net/girlsbox/miss-heaven-2024-grandprix/", level: "媒体の記事のみ" },
  { year: "2024", what: "ブロック本選の結果発表は12月3日（火）12時。グランプリの発表配信は12月21日（土）21時から（YouTube）", src: "ヘブンネット公式FAQ（2024/12/3）", href: "https://www.hgjn-help.com/info_and_news/show/320?site_domain=heavennet_faq", level: "公式" },
  { year: "2024", what: "予選は10/29（火）12:00〜11/4（月・祝）23:59。同一キャストへの投票は1日5回まで（0時にリセット）", src: "ヘブンネット公式FAQ（2024/10/29）", href: "https://www.hgjn-help.com/info_and_news/show/302?site_domain=heavennet_faq", level: "公式" },
  { year: "2025", what: "グランプリは白星ホタルさん（関西ブロック）、準グランプリはセラさん、3位は小林ルルさん。投票した会員は約51万人、エントリーは約1万人、グランプリは約15万票（史上最多）", src: "インスプレス／姫デコ magazine", href: "https://ins-press.com/topic-903", level: "媒体の記事のみ" },
  { year: "2025", what: "ブロック本選の結果は12月3日（水）12時に発表。グランプリの発表は12月20日（土）21時から、ヘブンTVで動画配信", src: "ヘブンネット公式FAQ（2025/12/3）", href: "https://www.hgjn-help.com/info_and_news/show/468?site_domain=recruit_faq", level: "公式" },
  { year: "2026", what: "8月3日に、2026年大会のティザーサイトが公開された", src: "ヘブンネット公式FAQ（2026/8/3）", href: "https://www.hgjn-help.com/info_and_news/show/561?site_domain=recruit_faq", level: "公式" },
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
    item: "1日の投票の上限",
    before: "2024年：同一キャストへは1日5回まで（公式FAQの表記。「回」で数えている）",
    after: "2025年は一般会員1日10票まで、2026年も1日10票まで（「票」で数えている）。回と票では単位が違うため、「2倍になった」とは言い切れません",
    src: "ヘブンネット公式FAQ（2024年）／姫デコ magazine／2026年公式FAQ",
    href: "https://www.hgjn-help.com/info_and_news/show/302?site_domain=heavennet_faq",
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
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集", href: "/feature" }, { label: "歩みと2026年の戦略" }]} />
      <FeatureTabs current={2} />
      <h1>特集2：総選挙の歩みと、2026年の戦略</h1>
      <p className="hint">
        前半は、ルールの変化と盛り上がりの移り変わりを、公開されている情報から振り返ります。後半は、その歴史を踏まえて、2026年の本選をどう戦うかを考えます。事実は出典を開いて確認できたことだけを載せ、私たちの見立ては、そう分かるように分けて書いています。
      </p>
      <nav className="history-toc" aria-label="この特集の目次">
        <a href="#story">歩み</a>
        <a href="#timeline">年表</a>
        <a href="#rules">ルールの変化</a>
        <a href="#numbers">盛り上がりの数字</a>
        <a href="#strategy">2026年の戦略</a>
        <a href="#unknown">わからなかったこと</a>
      </nav>

      <section className="section card prose">
        <h2>先に、わかっていること</h2>
        <ul>
          <li>総選挙は、媒体の記事で「2015年からスタート」と説明されています。</li>
          <li>グランプリは、2022年が西本ちかさん、2023年がまりてんさん、2024年が朝日奈みうさん、2025年が白星ホタルさんです。</li>
          <li>近年の大会では、投票参加者数や得票数の記録更新が報じられています（2024年は総投票695万票、2025年は投票人数51万人・グランプリ約15万票。いずれも媒体の記事の表記です）。</li>
          <li>ルールは、2025年に本選へ進む条件が「順位の上位約10%」から「50人からの投票」に変わりました。</li>
        </ul>
      </section>

      <section className="section card prose" id="story">
        <h2>歩み：歴代グランプリと、応援のかたちの変化</h2>
        <p>
          総選挙を振り返ると、歴代グランプリの顔ぶれとともに、投票の仕組みにも変化が見えてきます。ここでは、出典を開いて確認できたことだけで、近年の歩みをたどります。
        </p>

        <h3>2015年に始まったと報じられる総選挙</h3>
        <p>
          大会の始まりについて、<a href="https://times.abema.tv/articles/-/10013935" target="_blank" rel="noopener noreferrer nofollow ugc">ABEMA TIMES</a>は「2015年からスタートしたイベント」と説明しています。ただし、第1回当時の公式の告知や、各年の正式な回次の一覧は、今回の調査では確認できていません。
        </p>
        <p>
          2021年は、同記事によると、全国総合ランキングの頂点に天野リリスさんが立ちました。記事はその順位を「1万1877人の頂点」と表現していて、少なくともこの年には、1万人を超えるキャストが名を連ねる大会だったことが分かります。
        </p>

        <h3>西本ちか、まりてん、そして朝日奈みうへ</h3>
        <p>
          2022年のグランプリは西本ちかさん（<a href="https://www.girlsheaven-job.net/girlsbox/nisihimoto-chika/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazine</a>）。この年のグランプリ発表は、12月5日19時からYouTubeでライブ配信され、グランプリを含む全国TOP10が特設サイトで公開されたと、<a href="https://www.hgjn-help.com/info_and_news/show/131?site_domain=heavennet_faq" target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ</a>が案内しています。
        </p>
        <p>
          2023年は、12月17日に結果が発表され、まりてんさんが全国No.1に選ばれました（<a href="https://shueisha.online/articles/-/188951" target="_blank" rel="noopener noreferrer nofollow ugc">集英社オンライン</a>）。準グランプリは朝日奈みうさんです（<a href="https://www.girlsheaven-job.net/girlsbox/missheaven2023-grand-prix/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazine</a>）。まりてんさん本人は、講談社の記事で、6万票をいただいて頂点に立てたと語っています（本人の説明で、運営の集計表ではありません）。
        </p>
        <p>
          2024年は、前年に準グランプリだった朝日奈みうさんが優勝しました。同年の準グランプリは聖来さん、3位はえみりさんです（<a href="https://www.girlsheaven-job.net/girlsbox/miss-heaven-2024-grandprix/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazine</a>）。年ごとに名前を並べるだけでは見えにくいのですが、前年の成績を添えると、翌年の結果とのつながりが見えてきます。
        </p>

        <h3>2025年の転換点：本選へ進む基準が変わった</h3>
        <p>
          制度の面で大きな変化が確認できるのは2025年です。<a href="https://www.girlsheaven-job.net/girlsbox/miss-heaven-2025/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazineの解説</a>によると、地方予選から本選に進む条件は、従来の「都道府県の総合順位で上位約10%」から、「50人のユーザーから投票を受けること」に変わりました。順位の競争から、必要な支持人数を達成する条件への変更と読めます。記事は、より多くのキャストが、地域の代表として見てもらえることを目的として説明しています。
        </p>
        <p>
          本選では、100人の投票でブロック代表、200人で日本代表という称号もできました。数えているのは「投票した人数」で、同じ人の複数の投票を含む「票数」とは別です。姫デコで、投票人数の進捗を確認できるようになったことも、同じ解説に書かれています。
        </p>
        <p>
          この年のグランプリは白星ホタルさんで、史上最多の約15万票。3位は小林ルルさんで、投票人数は51万人、エントリーは1万人と記載されています（<a href="https://www.girlsheaven-job.net/girlsbox/miss-heaven-grandprix/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazine</a>）。同じ解説には、2024年の投票人数が41.5万人だったことも書かれています。
        </p>

        <h3>数字で歴史を読むときに</h3>
        <p>
          大会の規模を知るために、数字は欠かせません。ただし、参加キャストの数、投票した人の数、総投票数、優勝者の得票数は、それぞれ別のものを数えています。2024年の総投票数は、記事では695万票ですが、別の資料には1,600万票という数字もあり、集計の範囲が違うのか、確認できていません。そのため、年をまたぐ前年比の計算や、どちらか一方を確定値とする扱いは控えています。
        </p>
        <p className="hint">調査日：2026年11月8日。確認できていない項目は、下の「わからなかったこと」にまとめています。</p>
      </section>

      <section className="section card prose" id="timeline">
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

      <section className="section card prose" id="rules">
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

      <section className="section card prose" id="numbers">
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
              <tr><td className="nowrap">2024</td><td>総投票 695万票（史上最多と記載）／投票人数 41.5万人（2025年の解説記事の記載）</td></tr>
              <tr><td className="nowrap">2025</td><td>投票した会員 約51万人／エントリー 約1万人／グランプリ 約15万票（いずれも史上最多と記載）</td></tr>
              <tr><td className="nowrap">2026</td><td>参加キャスト 約1万人（地方予選の案内より）</td></tr>
            </tbody>
          </table>
        </div>
        <p className="hint">数字の集計の範囲は、出典ごとに違うことがあります（例：総投票を倍率の適用前で数えるか、後で数えるか）。年をまたいで単純に比べないでください。</p>
      </section>

      <section className="section card prose" id="strategy">
        <h2>2026年の戦略：歴史から何が言えるか</h2>
        <p>ここからは、前半の事実を踏まえた、私たちの見立てです。結果を予測するものではなく、保証もしません。</p>

        <h3>まず、事実（出典つき）</h3>
        <ul>
          <li>2025年から、本選に進む条件が「順位の上位約10%」から「50人からの投票」に変わり、2026年も同じです（<a href="https://www.girlsheaven-job.net/girlsbox/miss-heaven-2025/" target="_blank" rel="noopener noreferrer nofollow ugc">姫デコ magazine</a>、<a href="https://www.hgjn-help.com/faq/show/13558?site_domain=heavennet_faq" target="_blank" rel="noopener noreferrer nofollow ugc">2026年公式FAQ</a>）。</li>
          <li>称号も人数で決まります（都道府県代表50人、ブロック代表100人、日本代表200人）。神15は別の基準で、ブロックごとに枠があります（東京3、北海道・東北2、東海2、関西2、ほかの6ブロックは各1の合計15名。2025年の表記）。</li>
          <li>2026年は、チケットが最大50票、1キャストへは1日10票まで。予選の余りは本選に持ち越せません。ネット予約を実際に利用した人の票は、2倍・3倍になります（<a href="https://www.hgjn-help.com/faq/show/13558?site_domain=heavennet_faq" target="_blank" rel="noopener noreferrer nofollow ugc">2026年公式FAQ</a>）。</li>
        </ul>

        <h3>私たちの見立て（5つ）</h3>
        <ol>
          <li><strong>勝負が「票数」から「人数」に移っています。</strong>2025年のグランプリは約15万票でしたが、2026年は1人が1キャストへ入れられる上限が50票です。2025年は有料会員に最大100票の枠がありましたが、2026年の公式FAQには、その記載がありません。少数の人が大量に入れる戦い方は効きにくくなり、広く応援者を集めた人が強くなると考えられます（<Link href="/feature">特集1</Link>の「候補A・B」の例と同じ考え方です）。</li>
          <li><strong>倍率が、差になりやすい点です。</strong>同じ50票でも、ネット予約を利用した人の票は3倍の150票になります。応援者に実際に来てもらう動きがある人は、票数が伸びやすいはずです。電話予約・姫予約は対象外です。</li>
          <li><strong>神15は、ブロックごとの勝負です。</strong>枠が3つの東京と、1つの九州南・沖縄では、入る難しさが違うはずです。「全国で15位」を目指すより、「自分のブロックの枠に入る」と考えるほうが現実的です。ただし、ボーダーの票数は公開されていないので、これは見立てにとどまります。</li>
          <li><strong>前年の上位は、強い傾向があります。</strong>朝日奈みうさんは、2023年の準グランプリから、2024年のグランプリになりました。南星聖来さんは、2年連続で準グランプリです（<a href="https://ins-press.com/topic-903" target="_blank" rel="noopener noreferrer nofollow ugc">アインズプレス</a>）。ただし、これは小さな例の数で、法則ではありません。初出場の人が不利、という意味でもありません。</li>
          <li><strong>本選は7日間で、早く動くほど有利です。</strong>1日10票までなので、50票に届くのは最短で5日目です。最終日にまとめて頼むより、初日からの毎日の声かけが効きます。</li>
        </ol>

        <h3>立場ごとの戦略</h3>
        <ul>
          <li><strong>出場者：</strong>目標は、まず200人から投票されることです（日本代表）。毎日の呼びかけは短く、前日に投票してくれた人に、お礼（投票ありがとうミテネ）を送ります。ネット予約の倍率の条件は、正しく伝えます。</li>
          <li><strong>お店：</strong>複数の出場者がいるお店は、お店のアカウントで、日替わりで応援先を紹介すると、応援者が分散しにくくなります。</li>
          <li><strong>応援する人：</strong>持ち票は全キャスト共通です。応援先が複数なら、毎日少しずつ配ります。最終日の駆け込みより、毎日入れるほうが、応援先の進捗に反映されます。</li>
        </ul>

        <h3>確かめられないこと</h3>
        <ul>
          <li>神15のボーダーの票数、ブロックごとの競争の強さ、2026年の有料会員枠の扱い（廃止か、記載がないだけかは、確認できていません）。</li>
          <li>2026年の神15の枠の配分は、確認できていません。2025年の枠を、2026年にそのまま当てはめてはいません。</li>
          <li>見立て1〜5は、公開された制度と過去の結果から考えたものです。</li>
        </ul>
        <p>
          本選のスケジュールは、<Link href="/feature">特集1</Link>に、日ごとの動きをまとめています（本選は11/17〜11/23。終了は運営者の確認による11/23(月) 23:59）。
        </p>
      </section>

      <section className="section card prose" id="unknown">
        <h2>わからなかったこと</h2>
        <ul>
          <li>第1回がいつか、各年の回次の一覧は、公式の資料では見つかっていません。</li>
          <li>2015〜2020年のグランプリや、2021〜2022年の準グランプリ・3位、2023年の3位は、確認できていません。（過去の結果を公式Xが発表した投稿の情報もありますが、投稿を直接開けなかったため、載せていません。）</li>
          <li>2024年の総投票数は、記事では695万票ですが、別の資料には1,600万票という数字もあります。集計の範囲が違うのか、確認できていないため、どちらか一方に決めていません。</li>
          <li>2026年の本選の終了日は、公式FAQの中に11/23と11/24の両方の記載があります。この特集では、運営者の確認による11/23(月) 23:59を使っています。</li>
          <li>2023年以前のチケットの枚数や、ネット予約の倍率がいつ始まったかは、確認できていません。</li>
          <li>2022〜2024年の投票者数などを載せた広告資料は、本文を読めず、確認できていないため載せていません。</li>
        </ul>
        <p>この特集は有志による非公式のまとめで、公式の見解ではありません。情報が見つかり次第、追加します。</p>
        <p><Link href="/feature">特集1：まず200人、そして15万票へ ›</Link></p>
      </section>
    </>
  );
}
