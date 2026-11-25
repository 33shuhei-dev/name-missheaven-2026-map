import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";

export const metadata: Metadata = { title: "特集6：応援する側として 本人を守る応援のしかた" };

const NAVI = "https://link-f.biz/archives/25125";
const FAQ = "https://www.hgjn-help.com/faq/show/13558?site_domain=heavennet_faq";

export default function OuenPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集" }]} />
      <FeatureTabs current={6} />
      <h1>特集6：応援する側として</h1>
      <p className="hint">本人を守る応援のしかたと、やってはいけないこと。投票のルールの確認から、数字との付き合い方、応援サイトを作るときの線引きまでを、まとめます。</p>

      <section className="section card prose">
        <h2>先に、3つの原則</h2>
        <ol>
          <li><strong>本人の意向が、いちばん大切です。</strong>応援は、本人のためのものです。本人が望まないことは、しません。</li>
          <li><strong>無理をさせない、無理をしない。</strong>順位や数字で、本人を追い詰めません。自分の生活を崩すような応援も、しません。</li>
          <li><strong>守る。</strong>本人の個人情報や、身元につながることは、書かない、広めない、探らない。</li>
        </ol>
      </section>

      <section className="section card prose">
        <h2>投票のルールを、正しく知る</h2>
        <p>2026年のルールの要点です（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>、<a href={FAQ} target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ</a>）。</p>
        <ul>
          <li>1人のキャストに入れられるのは、最大50票。1日10票までです。</li>
          <li>予選の使わなかったチケットは、本選に持ち越せません。</li>
          <li>票の倍率には条件があります。条件の詳細は、公式の案内で確認してください（<Link href="/feature">特集1</Link>にも、まとめています）。</li>
          <li>公式の仕組みに沿わない方法で、票を増やそうとする呼びかけは、投票が無効になるおそれがあります。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>数字との付き合い方</h2>
        <p>応援する側も、数字に振り回されることがあります。</p>
        <ul>
          <li><strong>順位や人数で、本人を責めない。</strong>数字は、本人が1番気にしています。励ますなら、数字の話ではなく、気持ちの話を。</li>
          <li><strong>他の出場者と、比べる言葉を避ける。</strong>誰かを下げて、誰かを上げる応援は、本人を、望まない争いに巻き込みます。</li>
          <li><strong>結果で、本人を評価しない。</strong>結果が思うようでなくても、「ここまでやった」ことは、変わりません。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>やってはいけないこと</h2>
        <ul>
          <li>本人の本名、年齢、住んでいる場所、私生活を、詮索する、書く、広める。</li>
          <li>本人の写真や動画を、本人の了承なく、転載する。</li>
          <li>本人が望まない形で、広める。身元が分かる情報と結びつく拡散は、特に危険です。</li>
          <li>ほかの出場者や、その応援者を、攻撃する。</li>
          <li>本人に、DMなどで、しつこく返信や会うことを求める。</li>
          <li>応援のために、無理にお金や時間を使う。続かない応援は、本人も望みません。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>うれしい応援のかたち（考察）</h2>
        <ul>
          <li><strong>短くても、毎日の一言。</strong>長い文章より、「今日もお疲れさま」のような一言のほうが、続けやすく、負担になりません。</li>
          <li><strong>数字が動かない日にこそ。</strong>人数が増えない日の、変わらない応援が、いちばん励みになる、と考えられます。</li>
          <li><strong>決まった手順を、守る。</strong>投票の手順や期間を、正しく伝えます。</li>
          <li><strong>結果が出たあとの、ねぎらい。</strong>順位に関係なく、期間をやりきったことに、声をかけます。</li>
        </ul>
      </section>

      <section className="section card prose" id="site">
        <h2>応援サイトを作るときの線引き</h2>
        <p>特定の出場者の応援サイトや、まとめページを作る人もいます。作るなら、次の線引きを、おすすめします。</p>
        <ul>
          <li><strong>本人の了承を、取る。</strong>名前を中心にしたページは、本人が望まない形で、情報が広がるおそれがあります。</li>
          <li><strong>載せないものを、決める。</strong>顔写真、年齢、身体の情報、店名・所在地、私生活は、載せません。</li>
          <li><strong>削除の依頼に、すぐ応じる。</strong>本人から、載せないでほしいと言われたら、すぐに消します。</li>
          <li><strong>非公式であることを、明記する。</strong>公式の情報と、間違われないようにします。</li>
          <li><strong>票を操作する仕組みに、しない。</strong>公式の仕組みと別の、投票に見える機能を作る場合は、「本物の投票ではない」と明記します（このサイトの「<Link href="/game">無限投票</Link>」も、そうしています）。</li>
        </ul>
        <div className="operator-note">
          <strong>運営者より</strong>
          <p>このサイトの運営者は、出場者さんの応援サイトの制作を、ご相談いただけます（ご本人の了承があるものに限ります）。制作例として、「ゆず係」があります（運営者の制作）。ご相談は、運営者の <a href="https://x.com/rego0701" target="_blank" rel="noopener noreferrer">@rego0701</a> のDMへ。</p>
        </div>
      </section>

      <section className="section card prose">
        <h2>出典・注意</h2>
        <ul>
          <li>投票のルール：<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日。媒体の記事で、公式の発表とは言い切れません）、<a href={FAQ} target="_blank" rel="noopener noreferrer nofollow ugc">公式FAQ</a>。</li>
          <li>「うれしい応援」や「線引き」は、一般的な考え方をまとめた考察で、特定の出場者の声ではありません。</li>
          <li>この特集は有志による非公式のもので、公式の見解ではありません。</li>
        </ul>
        <p>
          <Link href="/feature/shuppan">特集5：数字にされる、ということ ›</Link>
        </p>
      </section>
    </>
  );
}
