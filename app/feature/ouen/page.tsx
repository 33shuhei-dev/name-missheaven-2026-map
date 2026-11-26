import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";
import { SelfCheck } from "@/components/SelfCheck";

export const metadata: Metadata = { title: "特集6：応援も、がんばりだった。 応援する側のみなさんへ" };

const NAVI = "https://link-f.biz/archives/25125";
const FAQ_START = "https://www.hgjn-help.com/info_and_news/show/600?site_domain=heavennet_faq";

/** 応援する側の気持ちの曲線（イメージ）。投稿の傾向と考察をもとにした図で、数値ではない。y は小さいほど、気持ちが上向き */
const CURVE = [
  { x: 32, y: 92, mood: "迷い", stage: ["本選", "前"] },
  { x: 92, y: 62, mood: "わくわく", stage: ["本選", "初日"] },
  { x: 152, y: 42, mood: "全力", stage: ["期間中", ""] },
  { x: 212, y: 84, mood: "そわそわ", stage: ["終盤", ""] },
  { x: 272, y: 112, mood: "祈り", stage: ["最終日", ""] },
  { x: 328, y: 30, mood: "誇り", stage: ["終了", "直後"] },
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
  { t: "票の配分に迷う", d: "「50票を、どう使おう」と、使い方に迷う声が見られました。" },
  { t: "応援する側のほうが、しんどい", d: "推しを思うあまり、応援する側が、疲れてしまう、という声がありました。" },
  { t: "相互投票への違和感", d: "頼み合う形に、違和感を書く投稿が見られました。" },
  { t: "投稿まわりの、一時停止", d: "投票に関する投稿で、アカウントが一時停止になった、という報告が、少数ありました。" },
] as const;

const TODOITA = [
  { t: "「心強かった」", d: "票だけでなく、いっしょにいてくれたことへの感謝が、多く見られました。" },
  { t: "「励みになった」", d: "DMなどの、ひとことが、励みになった、という声がありました。" },
  { t: "「ひとりじゃない」", d: "どんな結果でも、前に進める。ひとりではないと思えた、という言葉がありました。" },
  { t: "ファンが作った、応援", d: "サイトやゲーム、ポスターなどを作って、盛り上げる動きが、複数見られました。" },
] as const;

const SHOTAI = [
  { t: "応援の「効き方」が、見えにくい", d: "推しの人数の進捗は、本人側の画面で見られる仕組みです（ヘブンnavi）。応援する側には、自分の1票が、どう届いたか、見えにくいと考えられます。" },
  { t: "推しの気持ちを、背負ってしまう", d: "お願いされると、断りにくい。結果が出ないと、自分の応援が足りなかったのでは、と考えてしまいます。" },
  { t: "選べる自由が、迷いになる", d: "50票を、1人に集めるか、分けるか。正解がないので、迷います。" },
  { t: "まわりの空気に、気をつかう", d: "相互投票の頼み合いや、投稿の規約への不安など、気をつかう場面が、増えます。" },
] as const;

const MAMORU = [
  { t: "詮索しない", d: "本名、年齢、住んでいる場所、私生活を、探ったり、書いたり、広めたりしない。" },
  { t: "写真を、勝手に使わない", d: "本人の写真や動画は、了承なく、転載しない。" },
  { t: "身元につながる拡散を、しない", d: "身元が分かる情報と、結びつく広め方は、特に危険です。" },
  { t: "ほかの出場者を、攻撃しない", d: "誰かを下げて、誰かを上げる応援は、推しを、望まない争いに巻き込みます。" },
  { t: "しつこく、求めない", d: "DMなどで、返信や、会うことを、しつこく求めない。" },
  { t: "無理を、しない", d: "お金も、時間も、続かない応援は、推しも、望みません。" },
] as const;

const TSUKURU = [
  { t: "本人の了承を、取る", d: "名前を中心にしたページは、本人が望まない形で、広がるおそれがあります。" },
  { t: "載せないものを、決める", d: "顔写真、年齢、身体の情報、店名・所在地、私生活は、載せません。" },
  { t: "削除の依頼に、すぐ応じる", d: "本人から、載せないでほしいと言われたら、すぐに消します。" },
  { t: "非公式と、明記する", d: "公式の情報と、間違われないようにします。" },
  { t: "票を操作しない", d: "投票に見える機能を作るなら、「本物の投票ではない」と、明記します。" },
] as const;

export default function OuenPage() {
  const path = curvePath();
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集" }]} />
      <FeatureTabs current={6} />
      <h1>特集6：応援も、がんばりだった。</h1>
      <p className="hint">応援する側のみなさんへ。推しの7日間を、いっしょに走った、あなたへ。</p>

      <section className="hookbox">
        <h2>応援した7日間、どんな日でしたか</h2>
        <ul>
          <li>毎日、推しのことを考えて、投票した日</li>
          <li>50票の使いどころで、迷った日</li>
          <li>自分の応援が、足りているか、不安になった日</li>
          <li>結果が出るまで、ずっと、そわそわした日</li>
        </ul>
        <p>どれも、ぜんぶ、あなたの応援の7日間です。おつかれさまでした。</p>
        <p className="hookbox__small">
          ブロック本選の結果は、12月2日（水）12:00から（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの日程表</a>）。その前に、実際の投稿から、応援する側の気持ちを、ひもといてみます。
        </p>
      </section>

      <nav className="jump" aria-label="この特集の目次">
        <a href="#map">気持ちの地図</a>
        <a href="#tsurai">しんどかった声</a>
        <a href="#todoita">届いた声</a>
        <a href="#shotai">しんどい理由</a>
        <a href="#check">ふりかえり</a>
        <a href="#kataku">届く応援</a>
        <a href="#mamoru">守る応援</a>
        <a href="#tsukuru">つくる応援</a>
      </nav>

      <section className="section card prose" id="map">
        <h2>応援した7日間の、気持ちの地図<span className="mapmark">考察</span></h2>
        <p className="keypoint">迷いと、わくわくと、祈りと、誇りが、混ざり合っていました。</p>
        <figure className="curve">
          <svg viewBox="0 0 360 168" role="img" aria-labelledby="curve-t">
            <title id="curve-t">応援する側の7日間の気持ちの曲線のイメージ。迷いから始まり、わくわく、全力で上がり、終盤のそわそわと最終日の祈りで下がり、終了直後に誇りで大きく上がる。</title>
            <line x1="12" y1="138" x2="348" y2="138" className="curve__axis" />
            <path d={path} className="curve__line" fill="none" />
            {CURVE.map((c) => (
              <g key={c.mood}>
                <circle cx={c.x} cy={c.y} r="5.5" className="curve__dot" />
                <text x={c.x} y={c.mood === "祈り" ? c.y + 19 : c.y - 11} textAnchor="middle" className="curve__mood">{c.mood}</text>
                <text x={c.x} y="152" textAnchor="middle" className="curve__stage">{c.stage[0]}</text>
                {c.stage[1] ? <text x={c.x} y="163" textAnchor="middle" className="curve__stage">{c.stage[1]}</text> : null}
              </g>
            ))}
          </svg>
          <figcaption>投稿の傾向と、考察をもとにした、イメージの図です。数値ではありません。</figcaption>
        </figure>
        <p className="small">応援する側の声は、調査で見つかった投稿が、出場者より少なく、傾向は、目安です。個別の投稿は、本人を守るために、載せません。</p>
      </section>

      <section className="section card prose" id="tsurai">
        <h2>しんどかった声<span className="mapmark">実際の投稿から</span></h2>
        <p className="keypoint">しんどかったのは、あなただけではありません。</p>
        <div className="vgrid">
          {TSURAI.map((v) => (
            <div key={v.t} className="vcard vcard--tsurai">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="small">X上の公開投稿の調査（2026年11月25日。AIの調査補助を使用）。言葉は、本人を守るため、言い換えています。</p>
      </section>

      <section className="section card prose" id="todoita">
        <h2>推しに、届いていた声<span className="mapmark">実際の投稿から</span></h2>
        <p className="keypoint">あなたの応援は、ちゃんと、届いていました。</p>
        <p>出場者が、終了後に書いた、感謝の言葉を、見ていくと、こんな傾向がありました。</p>
        <div className="vgrid">
          {TODOITA.map((v) => (
            <div key={v.t} className="vcard vcard--ureshii">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="keypoint keypoint--soft">「票の数」より、「いっしょにいてくれた」ことが、力になっていました。</p>
        <p className="small">考察です。言葉は、本人を守るため、言い換えています。</p>
      </section>

      <section className="section card prose" id="shotai">
        <h2>しんどい日があったなら：あなたのせいじゃない、4つの理由</h2>
        <p className="keypoint">応援は、気持ちを、使います。疲れるのは、自然なことです。</p>
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

      <section className="section card prose" id="check">
        <h2>応援した7日間の、ふりかえりチェック</h2>
        <p className="keypoint">うれしかったことも、しんどかったことも、どちらも、あっていいんです。</p>
        <SelfCheck
          good={[
            "推しの数字が増えて、自分のことのように、うれしかった",
            "「ありがとう」を言われて、報われた気がした",
            "同じ推しの仲間と、盛り上がれた",
            "応援していて、楽しいと思えた瞬間があった",
          ]}
          tired={[
            "票の配分に迷って、疲れた",
            "推しの様子を、何度も見に行ってしまった",
            "自分の応援が、足りているか、不安になった",
            "眠れない、食欲がないなど、体にも影響が出た",
          ]}
        />
      </section>

      <section className="section card prose" id="kataku">
        <h2>届く応援のかたち</h2>
        <p className="keypoint">推しが「心強かった」と言った応援は、特別なことでは、ありませんでした。</p>
        <div className="vgrid">
          <div className="vcard vcard--ureshii"><b>短くても、ひとこと</b><p>長い文章より、「今日も、おつかれさま」のような、ひとことが、負担にならず、続きます。</p></div>
          <div className="vcard vcard--ureshii"><b>数字が動かない日にも</b><p>増えない日に、変わらず、そばにいてくれることが、いちばんの励みになる、と考えられます。</p></div>
          <div className="vcard vcard--ureshii"><b>手順を、正しく伝える</b><p>投票の手順や期間を、迷わない形で、伝えます。</p></div>
          <div className="vcard vcard--ureshii"><b>結果のあとの、ねぎらい</b><p>順位に関係なく、やりきったことに、声をかけます。</p></div>
        </div>
        <div className="keypoint keypoint--soft">
          <p style={{ margin: 0 }}>50票の使い方に、正解は、ありません。1人に集めても、分けても、自由です（同じ人へは、1日10回まで）。自分が、無理なく続けられる形で。</p>
        </div>
        <details className="fold">
          <summary>票のルールの要点</summary>
          <ul>
            <li>同じキャストへは、1日10回まで。本選は、11/17〜11/23（<a href={FAQ_START} target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ</a>）。</li>
            <li>1人のキャストに入れられるのは、最大50票。予選の使わなかったチケットは、本選に持ち越せません（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnavi</a>）。</li>
            <li>称号（ブロック代表・日本代表）は、票の数ではなく、「投票した人の数」で決まります。同じ人が、何票入れても、人数としては、1人です。</li>
            <li>票の倍率には、条件があります。詳しくは、公式の案内で確認してください（<Link href="/feature">特集1</Link>にも、まとめています）。</li>
            <li>公式の仕組みに沿わない方法で、票を増やそうとする呼びかけは、投票が無効になるおそれがあります。</li>
          </ul>
        </details>
      </section>

      <section className="section card prose" id="mamoru">
        <h2>守る応援：やらないこと</h2>
        <p className="keypoint">応援は、本人のため。本人を、守る応援が、いちばん、長く続きます。</p>
        <div className="vgrid">
          {MAMORU.map((v) => (
            <div key={v.t} className="vcard">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p>相互投票は、頼んだ側も、頼まれた側も、返せなかった、返してもらえなかったことで、関係を壊さないようにします。投票は、自分の意思で、見返りを求めずに。</p>
      </section>

      <section className="section card prose" id="tsukuru">
        <h2>つくる応援：応援サイトや企画を作るときの線引き</h2>
        <p className="keypoint">サイトやゲーム、ポスターで盛り上げる人たちも、いました。作るなら、この5つを。</p>
        <div className="vgrid">
          {TSUKURU.map((v) => (
            <div key={v.t} className="vcard vcard--ureshii">
              <b>{v.t}</b>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
        <p className="small">このサイトの「<Link href="/game">無限投票</Link>」も、「本物の投票ではない」と、明記しています。</p>
      </section>

      <section className="section card prose" id="owari">
        <h2>応援も、がんばりだった</h2>
        <div className="letter">
          <p>推しの結果が、どうであっても、いっしょに走った7日間は、本物です。</p>
          <p>迷って、そわそわして、祈った。その全部が、推しにとって、「心強かった」時間でした。</p>
          <p>うれしかった日は、思いきり、喜んでください。しんどかった日は、ゆっくり、休んでください。</p>
          <p>応援してくれて、ありがとう。おつかれさまでした。</p>
        </div>
        <p className="small">出場者のみなさんへの特集は、<Link href="/feature/shuppan">特集5</Link>にあります。</p>
      </section>

      <section className="section card prose">
        <details className="fold">
          <summary>出典・注意</summary>
          <ul>
            <li>票のルール：<a href={FAQ_START} target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ（2026/11/17）</a>、<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日。媒体の記事で、公式の発表とは言い切れません）。結果発表の日程：ヘブンnaviの記事の日程表。</li>
            <li>「しんどかった声」「推しに、届いていた声」：X上の公開投稿の調査（2026年11月25日。AIの調査補助を使用）。応援する側の投稿は、見つかった数が少なく、傾向は目安です。個別の投稿は、掲載せず、言葉も言い換えています。割合は、数えていません。</li>
            <li>「気持ちの地図」「4つの理由」「届く応援」は、一般的な考え方をまとめた考察で、特定の人の体験ではありません。ふりかえりチェックは、診断ではありません。医療や法律の助言ではありません。</li>
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
