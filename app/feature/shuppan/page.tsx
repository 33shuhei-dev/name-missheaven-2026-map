import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";
import { PrepChecklist, type PrepItem } from "@/components/PrepChecklist";
import { SelfCheck } from "@/components/SelfCheck";

export const metadata: Metadata = { title: "特集5：楽しかったなら、勝ち。 出場者のみなさんへ" };

const NAVI = "https://link-f.biz/archives/25125";
const FAQ_START = "https://www.hgjn-help.com/info_and_news/show/600?site_domain=heavennet_faq";
const X_ADULT = "https://help.x.com/ja/rules-and-policies/adult-content";
const X_SENSITIVE = "https://help.x.com/ja/safety-and-security/sensitive-media";

const PREP: readonly PrepItem[] = [
  { id: "p1", label: "応援者との連絡手段を、2つ以上にした", hint: "1つが止まっても、別の方法で連絡が取れる形" },
  { id: "p2", label: "応援者への案内文を、手元に保存した", hint: "投票の手順、期間、お礼の文章。端末のメモやファイルに" },
  { id: "p3", label: "プロフィールと主な投稿の控えを取った", hint: "アカウントが使えなくなっても、文章を作り直せるように" },
  { id: "p4", label: "各サービスの規約と、表示のルールを確認した", hint: "センシティブな内容の扱いなど。投稿する前に" },
  { id: "p5", label: "お店や応援者と、役割と案内文を共有した", hint: "本人だけに、負担を集めないために" },
  { id: "p6", label: "数字を見る時間を決めた", hint: "1日に何回、いつ見るか。見ない時間も決める" },
  { id: "p7", label: "発信を軽くする日を決めた", hint: "7日間の中に、短い投稿だけの日を入れる" },
  { id: "p8", label: "話せる相手を1人決めた", hint: "数字の悩みを、1人で抱えないために" },
  { id: "p9", label: "結果の発表の日の予定を、軽くした", hint: "信頼できる人と過ごせるように" },
] as const;

/** 気持ちの曲線（イメージ）。投稿の傾向をもとにした図で、数値ではない。y は小さいほど、気持ちが上向き */
const CURVE = [
  { x: 32, y: 100, mood: "緊張", stage: ["予選", "最終盤"] },
  { x: 92, y: 68, mood: "わくわく", stage: ["本選", "初日"] },
  { x: 152, y: 46, mood: "盛り上がり", stage: ["期間中", ""] },
  { x: 212, y: 76, mood: "ドキドキ", stage: ["終盤", ""] },
  { x: 272, y: 116, mood: "限界", stage: ["最終日", ""] },
  { x: 328, y: 30, mood: "喜び", stage: ["終了", "直後"] },
] as const;

function curvePath(): string {
  const p = CURVE;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const TSURAI = [
  { t: "緊張と不安", d: "緊張やプレッシャーを、率直に書く投稿が、予選の終わりごろから見られました。" },
  { t: "「あと○人」", d: "進捗バーの残りの人数を添えて、期待と不安を書く投稿が、多く見られました。" },
  { t: "「ありがとう」と「ごめんなさい」", d: "お願いを重ねたことを、感謝とセットで謝る投稿が、複数ありました。" },
  { t: "限界の声", d: "最終日に「もう無理」と書いた投稿や、途中で投げ出しそうだったと振り返る投稿がありました。" },
  { t: "応援する側の負担", d: "「応援する側のほうがしんどい」という声や、50票の配分に迷う声がありました。" },
  { t: "相互投票の摩擦", d: "頼んだのに返ってこない不満や、相互投票そのものへの違和感を書く投稿がありました。" },
  { t: "凍結への警戒", d: "告知をためらう声や、一時停止の報告が少数ありました。大規模な一斉凍結を裏付ける詳しい報告は、確認できていません。" },
  { t: "燃え尽きへの注意", d: "専門職を名乗るアカウントが、目標のあとの虚無感への注意を呼びかけていました（11/21）。" },
] as const;

const URESHII = [
  { t: "達成を、ストレートに喜ぶ", d: "日本代表・ブロック代表を達成して、うれしくて泣いた、幸せだ、という声が、終了日から翌日に集中しました。" },
  { t: "感謝が、「ありがとう」だけではない", d: "「心強かった」「励みになった」「ひとりではないと思えた」など、心の支えを伝える言葉が多く見られました。" },
  { t: "結果にかかわらず、前向きに", d: "思うような結果でなくても、「悔いはない」「あたたかい気持ちで終われた」と書く投稿がありました。" },
  { t: "みんなで喜ぶ", d: "応援してくれた人や、周りの人といっしょに、達成を喜ぶ報告も見られました。" },
] as const;

const MORATTA = [
  { t: "選んでくれた人がいた", d: "「あなたに投票した人の数」は、あなたを選んでくれた人の数です。" },
  { t: "「ありがとう」を交わした", d: "たくさん言って、たくさん受け取りました。" },
  { t: "数字の向こうに、人がいた", d: "応援してくれる人が、本当にいる、という実感。" },
  { t: "自分で決めて、やりきった", d: "順位とは別の、あなただけの達成です。" },
  { t: "盛り上がる仲間", d: "ファンの企画や、カウントダウンを、楽しんだ人もいたはずです。" },
] as const;

const SHOTAI = [
  { t: "見えるのに、比べられない", d: "自分に投票した人の数は見えても、ほかの人の数や順位は見えません（公式FAQ）。比べる材料がないのに、比べたくなります。" },
  { t: "お願いは、「自分を差し出す」こと", d: "毎日同じお願いをするのは、勇気がいります。「しつこいかも」と「届けたい」の間で揺れて、「ごめんなさい」が口ぐせに。" },
  { t: "数字が、自分の価値に見える", d: "人数が増えない日は、「私が足りない」に変わりがち。でも数字は、曜日や応援者の予定など、本人の外の事情にも左右されます。" },
  { t: "ひとりで、全部やっている", d: "発信、お礼、確認、そして日々の生活。しんどいのは、弱いからではなく、量が多いからです。" },
] as const;

const ROLES = [
  { w: "お知らせを出す", me: "◎", shop: "○", fan: "○" },
  { w: "お礼を伝える", me: "◎", shop: "○", fan: "○" },
  { w: "案内文を整える", me: "○", shop: "◎", fan: "－" },
  { w: "連絡手段を複数にする", me: "○", shop: "◎", fan: "○" },
  { w: "休む日を守る・声をかける", me: "○", shop: "○", fan: "◎" },
] as const;

export default function ShuppanPage() {
  const path = curvePath();
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集" }]} />
      <FeatureTabs current={5} />
      <h1>特集5：楽しかったなら、勝ち。</h1>
      <p className="hint">出場者のみなさんへ。7日間の、うれしかったことも、しんどかったことも、ぜんぶ。</p>

      <section className="hookbox">
        <h2>7日間、どんな日でしたか</h2>
        <ul>
          <li>数字が増えて、思わずガッツポーズした日</li>
          <li>「ありがとう」が届いて、じんときた日</li>
          <li>ドキドキして、何度も画面を開いた日</li>
          <li>疲れて、「もう無理…」と思った日</li>
        </ul>
        <p>どれも、ぜんぶ、あなたの7日間です。おつかれさまでした。</p>
        <p className="hookbox__small">
          ブロック本選の結果は、12月2日（水）12:00から（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの日程表</a>）。その前に、実際の投稿から、あの7日間の気持ちを、ひもといてみます。
        </p>
      </section>

      <nav className="jump" aria-label="この特集の目次">
        <a href="#map">気持ちの地図</a>
        <a href="#tsurai">しんどかった声</a>
        <a href="#ureshii">うれしかった声</a>
        <a href="#shotai">しんどい理由</a>
        <a href="#swap">言いかえ</a>
        <a href="#check">ふりかえり</a>
        <a href="#genjitsu">ひとりでは難しい</a>
        <a href="#freeze">お守り</a>
      </nav>

      <section className="section card prose" id="map">
        <h2>7日間の、気持ちの地図<span className="mapmark">実際の投稿から</span></h2>
        <p className="keypoint">祈りと、わくわくと、疲れと、喜びが、混ざり合っていました。</p>
        <figure className="curve">
          <svg viewBox="0 0 360 168" role="img" aria-labelledby="curve-t">
            <title id="curve-t">7日間の気持ちの曲線のイメージ。緊張から始まり、わくわく、盛り上がりで上がり、終盤のドキドキと最終日の限界で下がり、終了直後に喜びで大きく上がる。</title>
            <line x1="12" y1="138" x2="348" y2="138" className="curve__axis" />
            <path d={path} className="curve__line" fill="none" />
            {CURVE.map((c) => (
              <g key={c.mood}>
                <circle cx={c.x} cy={c.y} r="5.5" className="curve__dot" />
                <text x={c.x} y={c.mood === "限界" ? c.y + 19 : c.y - 11} textAnchor="middle" className="curve__mood">{c.mood}</text>
                <text x={c.x} y="152" textAnchor="middle" className="curve__stage">{c.stage[0]}</text>
                {c.stage[1] ? <text x={c.x} y="163" textAnchor="middle" className="curve__stage">{c.stage[1]}</text> : null}
              </g>
            ))}
          </svg>
          <figcaption>投稿の傾向をもとにした、イメージの図です。数値ではありません。</figcaption>
        </figure>
        <p className="small">選挙期間中のX上の公開投稿を、AIの調査補助も使って調べました（2026年11月25日）。個別の投稿は、本人を守るために、載せません。件数は目安で、全体を代表するものではありません。</p>
        <details className="fold">
          <summary>日付ごとの動きを見る</summary>
          <ol className="timeline">
            <li><b>11/11（予選の結果発表）</b><span>1位や上位に入れたことを、喜びの言葉で報告する投稿が見られた。<em>うれしさ・達成感</em></span></li>
            <li><b>11/2〜3（予選の最終盤）</b><span>緊張や、プレッシャーを、率直に書く投稿が見られた。<em>緊張・不安</em></span></li>
            <li><b>11/17（本選の初日）</b><span>本選がスタート。応援する側にも、投票の配分に迷う声があった。<em>わくわくと迷い</em></span></li>
            <li><b>期間中</b><span>ファンが、サイトやゲーム、ポスターを作って応援する動きが、複数見られた。残り人数のカウントダウン投稿も、あちこちで。<em>盛り上がり・わくわく</em></span></li>
            <li><b>11/20〜21</b><span>凍結を恐れて告知をためらう声が、少数あった。「燃え尽き」への注意の呼びかけも。<em>怖さ・気づかい</em></span></li>
            <li><b>11/22〜23（終盤〜最終日）</b><span>「あと○人」と数字を添えて、「ドキドキしてます」と書く投稿が多く見られた。同じころ、「もう無理」という投稿も。<em>祈り・ドキドキ・限界</em></span></li>
            <li><b>11/23〜24（終了直後）</b><span>日本代表やブロック代表を達成して、うれしくて泣いた、幸せだ、という投稿が、この時期に集中。感謝と、謝る言葉が、セットになった投稿も。<em>喜び・安堵・申し訳なさ</em></span></li>
          </ol>
        </details>
      </section>

      <section className="section card prose" id="tsurai">
        <h2>しんどかった声<span className="mapmark">実際の投稿から</span></h2>
        <p className="keypoint">同じ気持ちを書いている人が、たくさんいました。ひとりじゃありません。</p>
        <div className="vgrid">
          {TSURAI.map((v) => (
            <div key={v.t} className="vcard vcard--tsurai">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="small">言葉は、本人を守るため、言い換えています。</p>
      </section>

      <section className="section card prose" id="ureshii">
        <h2>うれしかった声<span className="mapmark">実際の投稿から</span></h2>
        <p className="keypoint">楽しかった人、うれしかった人は、ちゃんと、いました。</p>
        <div className="vgrid">
          {URESHII.map((v) => (
            <div key={v.t} className="vcard vcard--ureshii">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="small">数字のプレッシャーの裏側で、応援の実感や、自分を認める気持ちを、強く感じていた人も、確かにいました。言葉は、本人を守るため、言い換えています。</p>
      </section>

      <section className="section card prose" id="moratta">
        <h2>7日間で、もらったもの</h2>
        <p className="keypoint">数字のほかにも、きっと、受け取っていたものがあります。</p>
        <div className="vgrid">
          {MORATTA.map((v) => (
            <div key={v.t} className="vcard vcard--ureshii">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="small">考察です。しんどかった人も、この中の、どれかひとつは、あったかもしれません。</p>
      </section>

      <section className="section card prose" id="shotai">
        <h2>しんどい日があったなら：あなたのせいじゃない、4つの理由</h2>
        <p className="keypoint">楽しいと、しんどいは、いっしょにいて、大丈夫です。</p>
        <ol className="reasons">
          {SHOTAI.map((v) => (
            <li key={v.t}>
              <b>{v.t}</b>
              <p>{v.d}</p>
            </li>
          ))}
        </ol>
        <p className="small">考察です。</p>
      </section>

      <section className="section card prose" id="swap">
        <h2>気持ちが軽くなる、言いかえ</h2>
        <p className="keypoint">つい、思ってしまうことを、少しだけ、やさしい言葉に。</p>
        <table className="swap">
          <thead>
            <tr><th>つい、思ってしまうこと</th><th>こう言い換えてみて</th></tr>
          </thead>
          <tbody>
            <tr><td>「また、お願いして、ごめんなさい」</td><td>「大事な案内を、もう一度、届けます」</td></tr>
            <tr><td>「数字が、増えない…」</td><td>「届いた人が、そこにいる」</td></tr>
            <tr><td>「みんな、もっと取ってる」</td><td>「見えているのは、自分の数字だけ。比べる材料は、もともとない」</td></tr>
            <tr><td>「順位に入れなかった＝だめだった」</td><td>「上位は、ほんの一握り。やりきったことが、結果」</td></tr>
            <tr><td>「楽しんでいて、いいのかな」</td><td>「楽しんでいい。楽しい気持ちは、あなたの力になる」</td></tr>
            <tr><td>「数字しか、見えない」</td><td>「数字のほかに、うれしかったことを、3つ書き出してみる」</td></tr>
            <tr><td>「ひとりで、がんばらなきゃ」</td><td>「頼っていい。役割は、分けられる」</td></tr>
          </tbody>
        </table>
      </section>

      <section className="section card prose" id="check">
        <h2>7日間の、ふりかえりチェック</h2>
        <p className="keypoint">うれしかったことも、しんどかったことも、どちらも、あっていいんです。</p>
        <SelfCheck />
      </section>

      <section className="section card prose genjitsu" id="genjitsu">
        <h2>ひとりでは、上位は難しい。それは、現実です</h2>
        <p className="keypoint keypoint--big">順位は、あなたひとりの力の点数では、ありません。</p>

        <h3>数字の裏には、いくつもの「力」がある</h3>
        <div className="sum" role="list" aria-label="順位を支える力">
          <span role="listitem" className="sum__item">本人の魅力と努力</span>
          <span className="sum__op" aria-hidden="true">＋</span>
          <span role="listitem" className="sum__item">応援してくれる人の数と時間</span>
          <span className="sum__op" aria-hidden="true">＋</span>
          <span role="listitem" className="sum__item">発信を支える人</span>
          <span className="sum__op" aria-hidden="true">＋</span>
          <span role="listitem" className="sum__item">まわりの協力</span>
          <span className="sum__op" aria-hidden="true">＝</span>
          <span role="listitem" className="sum__item sum__item--total">数字に見える力</span>
        </div>
        <p className="small">考察です。個人の事情を断定するものではありません。</p>

        <h3>ひとりで、全部 と、みんなで、分ける</h3>
        <div className="vs">
          <div className="vs__col vs__col--alone">
            <b>ひとりで、全部</b>
            <ul>
              <li>毎日のお願い</li>
              <li>お礼</li>
              <li>数字の確認</li>
              <li>いつもの生活</li>
            </ul>
            <p>→ 力を使い切って、疲れと限界が来やすい</p>
          </div>
          <div className="vs__col vs__col--team">
            <b>みんなで、分ける</b>
            <ul>
              <li>役割を分ける</li>
              <li>案内文を共通にする</li>
              <li>休む日を共有する</li>
              <li>お礼を、みんなで</li>
            </ul>
            <p>→ 続けられて、楽しさも残りやすい</p>
          </div>
        </div>

        <blockquote className="bigquote">
          順位に届かなかったことは、<br />「努力が足りなかった」ということには、<br />なりません。
        </blockquote>
        <p>上位に入るのは、ごく一部で、ほとんどの人は、上位には入りません（数字は、<Link href="/feature/bumon">特集4</Link>）。それは、ふつうのことです。</p>

        <h3>がんばりの仕組みをつくる：役割分担の例</h3>
        <div className="roles" role="table" aria-label="役割分担の例">
          <div className="roles__row roles__row--head" role="row">
            <span role="columnheader" />
            <span role="columnheader">本人</span>
            <span role="columnheader">お店</span>
            <span role="columnheader">応援者</span>
          </div>
          {ROLES.map((r) => (
            <div className="roles__row" role="row" key={r.w}>
              <span className="roles__what" role="rowheader">{r.w}</span>
              <span role="cell" className={`roles__c roles__c--${r.me === "◎" ? "main" : r.me === "○" ? "help" : "none"}`}>{r.me}</span>
              <span role="cell" className={`roles__c roles__c--${r.shop === "◎" ? "main" : r.shop === "○" ? "help" : "none"}`}>{r.shop}</span>
              <span role="cell" className={`roles__c roles__c--${r.fan === "◎" ? "main" : r.fan === "○" ? "help" : "none"}`}>{r.fan}</span>
            </div>
          ))}
        </div>
        <p className="small">◎ 中心になる　○ 手伝う　－ 任せない。「お店」は、お店のスタッフです。あくまで「例」です。ほんとうの役割は、それぞれの状況で、話し合って決めてください。</p>

        <p className="keypoint">まず、ひとつだけ。「案内文」を、みんなが同じものを使えるようにしてみてください。</p>
      </section>

      <section className="section card prose" id="freeze">
        <h2>お守り①：凍結への備え</h2>
        <p className="keypoint">1つの場所に、頼りすぎない。それが、いちばんの備えです。</p>
        <div className="vgrid">
          <div className="vcard"><b>連絡手段を、複数持つ</b><p>1つが止まっても、別の手段で、応援者と連絡が取れる形に。</p></div>
          <div className="vcard"><b>大事な情報を、手元に残す</b><p>投稿の控え、案内文、プロフィールの文章を、自分で保存。</p></div>
          <div className="vcard"><b>規約を、定期的に確認</b><p>利用規約や、センシティブな内容の扱いは、変わることがあります。</p></div>
          <div className="vcard"><b>止められたら、焦らない</b><p>サービスの異議申し立ての手続きに従います。別アカウントを次々に作るのは、状況を悪くすることがあります。</p></div>
          <div className="vcard"><b>連絡先を、1か所にまとめる</b><p>応援者が、あなたを見つけ直せる場所（自分で管理するページなど）を。</p></div>
        </div>
        <p className="small">ここでは、特定の出来事ではなく、予防の考え方を書いています。ルールをすり抜ける方法は、書きません。</p>
        <details className="fold">
          <summary>Xの公式ヘルプで確認できること</summary>
          <p>
            Xのヘルプページには、直接アクセスできなかったため、検索で確認できた範囲の要約です（内容は、2024年5月ごろのものが中心です）。ページは更新されるので、最新は、必ず、ヘルプで確認してください。
          </p>
          <ul>
            <li>成人向けコンテンツは、適切なラベルを付けるなどの条件で、投稿が認められる、と説明されています（18歳未満のユーザーには表示されません）。<a href={X_ADULT} target="_blank" rel="noopener noreferrer nofollow ugc">成人向けコンテンツのヘルプ</a>、<a href={X_SENSITIVE} target="_blank" rel="noopener noreferrer nofollow ugc">センシティブなメディアのヘルプ</a></li>
            <li>凍結に対しては、該当のアカウントでログインして、異議申し立てを出せる手続きがあるとされています。一方、ラベルのないセンシティブな投稿を繰り返した結果、アカウントの設定が固定された場合は、異議を申し立てる方法が、現在のところない、との記載もあります。</li>
            <li>つまり、<strong>「ラベルを付けて投稿する」「規約を定期的に確認する」</strong>ことが、予防の基本になります。</li>
          </ul>
        </details>
      </section>

      <section className="section card prose" id="prep">
        <h2>お守り②：備えのチェックリスト</h2>
        <p className="keypoint">前もって、できることを、ひとつずつ。</p>
        <PrepChecklist items={PREP} />
      </section>

      <section className="section card prose" id="after">
        <h2>結果を待つ時間の、過ごし方</h2>
        <div className="dates">
          <div><b>12月2日（水）12:00</b><span>ブロック本選の結果発表</span></div>
          <div><b>12月19日（土）21:00</b><span>神15・グランプリの発表（動画配信）</span></div>
        </div>
        <div className="vgrid">
          <div className="vcard"><b>数字を見る頻度を、戻す</b><p>選挙期間が終わったら、毎日の確認は、いったんやめます。</p></div>
          <div className="vcard"><b>発表の日の予定を、軽く</b><p>結果が出る日は、信頼できる人と過ごします。</p></div>
          <div className="vcard"><b>「虚脱感」に備える</b><p>終わったあとに、疲れや、虚しさが、あとから来ることがあります。休む、予定を入れる、人と話す、数字から離れる。</p></div>
          <div className="vcard"><b>結果と、自分の価値は、別</b><p>順位は、その期間の、その仕組みの中での数字です。</p></div>
        </div>
      </section>

      <section className="section card prose" id="owari">
        <h2>どんな結果でも、楽しかったなら、勝ち</h2>
        <div className="letter">
          <p>順位は、その期間の、その仕組みの中での数字です。あなたの価値の点数では、ありません。</p>
          <p>7日間、名前を呼んでもらって、誰かに「ありがとう」を言った。その時間が、少しでも、楽しかったなら。それは、もう、勝ちです。</p>
          <p>ドキドキした日も、疲れた日も、うれしかった日も、ぜんぶ、あなたの7日間。</p>
          <p>どんな結果でも、この期間をやりきった、あなたに。おつかれさまでした。そして、ありがとう。</p>
        </div>
      </section>

      <section className="section card prose">
        <details className="fold">
          <summary>出典・注意</summary>
          <ul>
            <li>姫デコの進捗表示、順位に紐づく票数が公開されないこと：<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日。媒体の記事で、公式の発表とは言い切れません）、公式FAQ（「あなたに投票した人数」ステータスバーについて）。</li>
            <li>本選の期間・投票回数：<a href={FAQ_START} target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ（2026/11/17）</a>。結果発表の日程：ヘブンnaviの記事の日程表。</li>
            <li>「気持ちの地図」「しんどかった声」「うれしかった声」：X上の公開投稿の調査（2026年11月25日。AIの調査補助を使用。うれしかった声は、感謝・達成・喜びが前面に出ている投稿を抽出）。個別の投稿は、掲載せず、言葉も言い換えています。割合は、数えていません。</li>
            <li>「もらったもの」「しんどい理由」「言いかえ」「ひとりでは難しい」「備え」は、一般的な考え方をまとめた考察で、特定の出場者の体験ではありません。役割分担の表は、例です。ふりかえりチェックは、診断ではありません。医療や法律の助言ではありません。</li>
            <li>この特集は有志による非公式のもので、公式の見解ではありません。</li>
          </ul>
        </details>
        <div className="operator-note operator-note--small">
          <strong>運営者より</strong>
          <p>私は、凍結への備え、拡散、コンテンツづくりの形のひとつとして、<a href="https://yuzu-gakari.vercel.app/" target="_blank" rel="noopener noreferrer">「ゆず係」</a>サイトを立ち上げました。出場者さんの応援サイトの制作を、ご相談いただけます（ご本人の了承があるものに限ります）。ご相談は、DM（<a href="https://x.com/rego0701" target="_blank" rel="noopener noreferrer">@rego0701</a>）へ。</p>
        </div>
      </section>
    </>
  );
}
