import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";

export const metadata: Metadata = { title: "特集3：予選を突破したのは何人？ 都道府県別の本選進出率" };

import { YOSEN, YOSEN_TOTAL, blockTotals } from "@/lib/yosen";

const pct = (a: number, n: number) => ((a / n) * 100).toFixed(1);
const SRC_URL = "https://x.com/hiropyon_0405";

function Pref({ row }: { row: readonly [string, number, number] }) {
  return (
    <li className="yosen-row">
      <span className="yosen-row__name">{row[0]}</span>
      <span className="yosen-row__num">{row[1]}人／{row[2]}人</span>
      <span className="yosen-row__rate">{pct(row[1], row[2])}%</span>
    </li>
  );
}

export default function YosenPage() {
  const big = YOSEN.filter((r) => r[2] >= 30);
  const byRate = [...big].sort((a, b) => b[1] / b[2] - a[1] / a[2]);
  const high = byRate.slice(0, 5);
  const low = byRate.slice(-5).reverse();
  const byNominee = [...YOSEN].sort((a, b) => b[2] - a[2]);
  const top5 = byNominee.slice(0, 5);
  const top5Share = (top5.reduce((s, r) => s + r[2], 0) / YOSEN_TOTAL.nominees) * 100;
  const rate = pct(YOSEN_TOTAL.advanced, YOSEN_TOTAL.nominees);
  const blocks = blockTotals();

  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集", href: "/feature" }, { label: "予選の結果" }]} />
      <FeatureTabs current={3} />
      <h1>特集3：予選を突破したのは何人？ 都道府県別の本選進出率</h1>
      <p className="hint">
        地方予選の結果が11/11に発表されました。ここでは、有志が集計した「本選進出数／ノミネート数」の数字を読み解きます。<strong>公式の発表ではなく、有志の集計</strong>です。出典は、<a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405さんの集計</a>（2026年11月12日11:06の投稿とそのスレッド）です。
      </p>

      <section className="section card prose">
        <h2>先に、要点</h2>
        <ul>
          <li>
            本選に進んだのは、ノミネート{YOSEN_TOTAL.nominees.toLocaleString()}人のうち<strong>{YOSEN_TOTAL.advanced.toLocaleString()}人（{rate}%）</strong>です。この全国平均には、辞退や退店で進めなかった人も含まれる、と集計した人は書いています。
          </li>
          <li>進出率が高かったのは、三重（96.8%）、岩手（96.0%）、香川（94.2%）、山梨（90.4%）、滋賀（88.7%）。ノミネートが30人以上の県での比較です。</li>
          <li>低かったのは、沖縄（47.5%）、栃木（59.1%）、石川（62.2%）、富山（68.7%）、千葉（69.8%）です。</li>
          <li>ノミネートは東京・愛知・大阪・福岡・神奈川の5都府県に集中し、全体の{top5Share.toFixed(1)}%を占めます。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>全国の数字</h2>
        <div className="yosen-total">
          <p className="yosen-total__big">{YOSEN_TOTAL.advanced.toLocaleString()}人<span> ／ {YOSEN_TOTAL.nominees.toLocaleString()}人</span></p>
          <p className="yosen-total__rate">全国平均の進出率 {rate}%</p>
        </div>
        <p className="hint">本選に進むには、地方予選で50人のユーザーから投票されることが条件でした。順位ではなく、投票した人数で決まる仕組みです（詳しくは<Link href="/feature/history">特集2</Link>）。本選は11/17(火)12:00に始まり、グランプリの発表は12/19(土)21:00からの配信です。</p>
      </section>

      <section className="section card prose">
        <h2>進出率が高い県・低い県</h2>
        <p>ノミネートが30人以上の県だけで比べました。人数が少ない県は、1人の違いで率が大きく動くためです。</p>
        <h3>高い5県</h3>
        <ul className="yosen-list">{high.map((r) => <Pref key={r[0]} row={r} />)}</ul>
        <h3>低い5県</h3>
        <ul className="yosen-list">{low.map((r) => <Pref key={r[0]} row={r} />)}</ul>
        <p className="hint">小さな県では、高知が20人全員（100%）で進出、和歌山が15人／18人（83.3%）、奈良が9人／14人（64.3%）でした。人数が少ないため、率だけで強弱を判断できません。</p>
      </section>

      <section className="section card prose">
        <h2>ノミネートが集中している地域</h2>
        <ul className="yosen-list">{top5.map((r) => <Pref key={r[0]} row={r} />)}</ul>
        <p>上位5都府県で、全体の{top5Share.toFixed(1)}%です。人数が多い都府県でも、進出率はさまざまです。東京は73.8%（全国平均より低い）、大阪は81.4%、福岡は81.8%（どちらも平均より高い）でした。</p>
      </section>

      <section className="section card prose">
        <h2>ブロックごとに見ると</h2>
        <p>
          本選は、全国10ブロックで行われます。都道府県の数字を、ブロックごとに足し合わせました（私たちの計算です。元の投稿には、ブロックごとの合計は書かれていません）。神15の枠は、<a href="https://link-f.biz/archives/25125" target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日）の「上位N位まで」の表によります。
        </p>
        <ul className="yosen-list">
          {blocks.map((b) => (
            <li key={b.name} className="yosen-block">
              <span className="yosen-block__name">{b.name}</span>
              <span className="yosen-block__num">進出{b.advanced}人／ノミネート{b.nominees}人</span>
              <span className="yosen-block__rate">{b.rate.toFixed(1)}%</span>
              <span className="yosen-block__slot">神15の枠 {b.slots}（枠1つあたり 約{Math.round(b.perSlot)}人）</span>
            </li>
          ))}
        </ul>
        <p className="hint">
          「枠1つあたり」は、進出した人数を神15の枠の数で割った目安です。同じ人数でも、票の集まり方や、本選の部門（全国共通の5部門）の分かれ方で、実際の競争の強さは変わります。この数字だけで、入りやすさは判断できません。
        </p>
        <ul>
          <li>進出率が高いのは、関西（81.0%）、東海・九州北（どちらも80.9%）。低いのは、九州南・沖縄（69.3%）と北陸・甲信越（71.0%）です。</li>
          <li>神15の枠1つあたりの進出者数は、北関東（589人）・南関東（733人）・九州北（677人）で多く、枠が1つしかないためです。東京は約532人、関西は約567人と、枠の数が多い分、1枠あたりは少なめです。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>読み解き：私たちの見立て</h2>
        <p>ここからは、数字を見た私たちの見立てです。結果を断定するものではありません。</p>
        <ul>
          <li><strong>「50人の壁」の高さは、地域で違うかもしれません。</strong>進出率が低い県（沖縄、栃木、石川など）では、ノミネートした人に対して、投票する人の数が足りなかった可能性があります。ただし、ユーザーの数やノミネートの顔ぶれなど、確かめられないことが多く、理由は分かりません。</li>
          <li><strong>人数が多いことは、進出率の低さとは結びつきません。</strong>東京は平均より低めでしたが、大阪・福岡・愛知は平均より高く、規模の大きさだけでは説明できません。</li>
          <li><strong>本選では、進んだ人どうしの競争になります。</strong>7,634人が残り、次の目標は、ブロック代表（100人）や日本代表（200人）の称号です（<Link href="/feature">特集1</Link>）。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>全都道府県の数字</h2>
        <ul className="yosen-list">
          {YOSEN.map((r) => <Pref key={r[0]} row={r} />)}
        </ul>
      </section>

      <section className="section card prose">
        <h2>この数字の読み方・注意</h2>
        <ul>
          <li>この数字は、有志が集めたもので、公式の発表ではありません。集計の方法は、元の投稿をご覧ください。</li>
          <li>全国平均には、辞退や退店で進出しなかった人も含まれます（集計した人の説明）。</li>
          <li>青森・山形・鳥取・島根は、元の投稿の表に載っていないため、この特集でも載せていません（合計は、載っている43都道府県で、全国の数字と一致しています）。</li>
          <li>このサイトに載っている出場者の数は、このサイトで確認できた一部で、ここでの全国の数字とは別のものです。</li>
          <li>この特集は有志による非公式のまとめで、公式の見解ではありません。</li>
        </ul>
        <p>
          <Link href="/feature">特集1 ›</Link>　<Link href="/feature/history">特集2 ›</Link>
        </p>
      </section>
    </>
  );
}
