import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";
import { HONSEN, HONSEN_DEPTS, HONSEN_TOTAL, honsenBlockTotal, honsenDeptTotals } from "@/lib/honsen";
import { YOSEN_BLOCKS, blockTotals } from "@/lib/yosen";

export const metadata: Metadata = { title: "特集4：神15の椅子は、部門に関係ある？ 本選7,594人の顔ぶれ" };

type Row = readonly string[];

function Table({ head, rows }: { head: Row; rows: readonly Row[] }) {
  return (
    <div className="table-wrap">
      <table className="feature-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join("|")}>
              {r.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const n = (v: number) => v.toLocaleString("ja-JP");
const pct = (a: number, b: number, d = 1) => ((a / b) * 100).toFixed(d);
const NAVI = "https://link-f.biz/archives/25125";
const SRC_URL = "https://x.com/hiropyon_0405";

export default function Kami15Page() {
  const dept = honsenDeptTotals();
  const slots = Object.fromEntries(YOSEN_BLOCKS.map((b) => [b.name, b.slots]));
  const yosen = Object.fromEntries(blockTotals().map((b) => [b.name, b.advanced]));
  const perChair = HONSEN.map((b) => {
    const total = honsenBlockTotal(b.block);
    const s = slots[b.block];
    return { block: b.block, total, slots: s, per: total / s, entrantShare: (total / HONSEN_TOTAL) * 100, slotShare: (s / 15) * 100 };
  });
  const byPer = [...perChair].sort((a, b) => b.per - a.per);

  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集" }]} />
      <FeatureTabs current={4} />
      <h1>特集4：神15の椅子は、部門に関係ある？</h1>
      <p className="hint">本選に出る7,594人の顔ぶれを、部門とブロックで読む。結果の発表の前に、「何を見れば答え合わせになるか」まで整理した、考察の特集です（予測ではありません）。</p>

      <section className="section card prose">
        <h2>30秒で読む</h2>
        <ol>
          <li><strong>神15の椅子は、ブロックごとの数で決まっていて、部門ごとの枠はありません。</strong>部門に関係なく、ブロックの総合順位で決まる可能性が高い、というのが私たちの見立てです（「部門を問わない」と書いた文は、確認できていません）。</li>
          <li><strong>本選は7,594人。</strong>デリヘルとソープが、それぞれ約3分の1で、合わせて65.5%です。</li>
          <li><strong>ブロックごとに、部門の顔ぶれが大きく違います。</strong>北関東はソープが56%、東海はヘルス・ホテヘルが24%です。</li>
          <li><strong>地域も部門も、キャスト個人が自由に選べるものではありません。</strong>しかも、出場者の数だけでは、地域の激しさは決められません（票を入れる人の数が分からないため）。</li>
        </ol>
      </section>

      <section className="section card prose">
        <h2>神15は、部門に関係あるのか</h2>
        <p>ヘブンnaviの記事（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">2026年11月10日</a>。媒体の記事で、公式の発表とは言い切れません）から、確認できたことと、できなかったことを分けます。</p>
        <Table
          head={["確認できたこと（記事に書かれている）", "ここから言えること"]}
          rows={[
            ["神15は「ブロックごと」に、上位N位までと定められている（東京3、北海道・東北2、東海2、関西2、ほか6ブロックは各1）", "枠は、ブロック単位だけ。部門ごとの枠は、記載がない"],
            ["本選の部門は、全国共通の5部門。部門は、掲載店の業種・ジャンルで決まり、キャスト単位では選べない", "出場者は、5部門のどれかに入る。自分で選べない"],
            ["順位アイコンは「各部門10位以内」に付く", "部門ごとの順位は、別にある"],
            ["副賞（ギフト券）は「ブロック本選の総合順位10位以内」", "部門を混ぜた「総合順位」が、ブロックごとにある"],
          ]}
        />
        <p>
          <strong>見立て：</strong>神15の枠は、ブロックごとの数字だけが決められていて、部門ごとの数字がありません。もし神15が部門ごとに選ばれるなら、1つのブロックに、最低でも5部門ぶんの枠が必要です。実際の枠は、1ブロックあたり1〜3です。このため、神15は、ブロックの総合順位（部門を混ぜた順位）の上位から選ばれる、と考えるのが自然です。</p>
        <p><strong>確認できていないこと：</strong>「部門を問わず」と書いた文、「総合順位」の定義、神15と総合順位の関係の説明です。確かめる方法は、結果の発表（下の「答え合わせ」）で、神15の15人の部門を見ることです。</p>
      </section>

      <section className="section card prose">
        <h2>本選7,594人の顔ぶれ（ブロック×部門）</h2>
        <p>
          <a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405</a> さんの集計（2026年11月24日 12:06の投稿。公式の発表ではありません）をもとにした表です。名簿の人数で、投票の結果ではありません。
        </p>
        <Table
          head={["ブロック", ...HONSEN_DEPTS, "計"]}
          rows={HONSEN.map((b) => [
            b.block,
            ...b.counts.map((c, i) => (b.block === "九州北" && i === 0 ? `${n(c)}※2` : b.block === "北陸・甲信越" && i === 1 ? "部門なし" : n(c))),
            b.block === "東京" ? `${n(honsenBlockTotal(b.block))}※1` : n(honsenBlockTotal(b.block)),
          ])}
        />
        <p className="hint">
          ※1 東京の計は、投稿では「1951人」でしたが、部門の合計は1,591人です。※2 九州北のデリヘルは、投稿では「672人」（九州北の計と同じ数字）でしたが、計から他の4部門を引くと175人です。この2か所を直すと、10ブロックの合計が、投稿の総数（7,594人）とぴったり一致します。ただし、元の投稿の訂正は確認していないため、補正は私たちの推定です。
        </p>
        <h3>全国の部門の割合</h3>
        <Table
          head={["部門", "人数", "割合"]}
          rows={HONSEN_DEPTS.map((d, i) => [d, `${n(dept[i])}人`, `${pct(dept[i], HONSEN_TOTAL)}%`])}
        />
        <p>デリヘル（{pct(dept[0], HONSEN_TOTAL)}%）とソープ（{pct(dept[2], HONSEN_TOTAL)}%）で約3分の2を占め、エステは{pct(dept[3], HONSEN_TOTAL)}%です。</p>
        <p className="hint">予選通過の7,634人（<Link href="/feature/yosen">特集3</Link>）より、本選の名簿は40人（0.5%）少ない数字です。どのブロックも1%未満の差で、理由（辞退、退店、集計時点の違いなど）は分かりません。</p>
      </section>

      <section className="section card prose">
        <h2>ブロックごとに、部門の顔ぶれは違う</h2>
        <Table
          head={["ブロック", ...HONSEN_DEPTS]}
          rows={HONSEN.map((b) => {
            const t = honsenBlockTotal(b.block);
            return [b.block, ...b.counts.map((c) => `${pct(c, t)}%`)];
          })}
        />
        <ul>
          <li><strong>ソープが多いブロック：</strong>北関東（56.1%）、南関東（47.8%）、九州北（44.6%）。</li>
          <li><strong>デリヘルが多いブロック：</strong>九州南・沖縄（47.8%）、北陸・甲信越（45.5%）、東京（39.0%）。</li>
          <li><strong>ヘルス・ホテヘルが目立つブロック：</strong>東海（23.6%）。全国の10.9%の2倍以上です。北陸・甲信越は「部門なし」でした。</li>
          <li><strong>エステが少ないブロック：</strong>北関東（15人）、九州南・沖縄（14人）、南関東（30人）。</li>
        </ul>
        <p>神15が、部門を問わず総合順位で決まるなら、「どの部門が多いブロックか」は、そのまま、競争の中身の違いになります。</p>
      </section>

      <section className="section card prose">
        <h2>椅子取り、本選の数字で</h2>
        <p>神15の椅子（ブロックごとの枠）に対して、本選の名簿が何人いるかです。</p>
        <Table
          head={["ブロック", "本選の名簿", "椅子", "1脚あたり", "名簿の割合", "椅子の割合"]}
          rows={byPer.map((r) => [r.block, `${n(r.total)}人`, `${r.slots}脚`, `約${n(Math.round(r.per))}人`, `${r.entrantShare.toFixed(1)}%`, `${r.slotShare.toFixed(1)}%`])}
        />
        <ul>
          <li>1脚あたりが多い順は、南関東（730人）、九州北（672人）、北関東（588人）…で、予選のときと同じ順番です。全国では、約506人に1脚です。</li>
          <li>名簿の割合に比べて、椅子の割合が大きいのは、九州南・沖縄（名簿3.6%に対して椅子6.7%）、北海道・東北、北陸・甲信越です。小さいのは、南関東（名簿9.6%に対して椅子6.7%）、九州北、北関東です。</li>
          <li>予選で通過した人数（{n(Object.values(yosen).reduce((s, v) => s + v, 0))}人）と、本選の名簿（{n(HONSEN_TOTAL)}人）の差は、ブロックごとに1〜8人です。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>「どの地域から出るか」は戦略になるのか</h2>
        <p>2つに分けて考えます。</p>
        <ol>
          <li>
            <strong>自分で選べるのか。</strong>部門は、掲載店の業種・ジャンルで決まり、キャスト単位では選べないと、記事に書かれています。地域（都道府県）も、同じく、所属する店の所在地に紐づくと考えられます（記事には、地域の決まり方の説明はありません）。つまり、出場者個人が、年ごとに自由に選べるものではなく、「戦略」というより、「与えられた条件」です。
          </li>
          <li>
            <strong>出場者の数で、激しさは決められるのか。</strong>決められません。理由は、票を入れる人（ユーザー）の数が、地域ごとに違うからです。大きな都市のブロックは、出場者が多い分、票を入れる人も多いはずです。必要なのは「出場者1人あたりの票の量」で、これは、ブロックごとのユーザー数や得票数が公開されないと、分かりません。
          </li>
        </ol>
        <p>そこで、この特集の「1脚あたり」は、あくまで「名簿の数と椅子の数の比」です。票の取りやすさや、入りやすさは、これだけでは言えません。</p>
      </section>

      <section className="section card prose" id="check">
        <h2>答え合わせ：結果が出たら、ここを見る</h2>
        <p>結果が出る日程は、次のとおりです。ブロック本選の結果は、過去2年とも12月3日の12:00に発表されました（2026年の日時は、まだ確認できていません）。神15・グランプリの発表は、12月19日（土）21:00の動画配信です。</p>
        <Table
          head={["見るところ", "分かること"]}
          rows={[
            ["神15の15人が、どの部門か", "人数の割合（デリヘル33%・ソープ32.5%・人妻17%・ヘルス・ホテヘル11%・エステ7%）と比べて、偏りが大きければ、部門による有利・不利がある"],
            ["椅子が1つのブロック（6つ）の総合1位の部門", "そのブロックで最も多い部門から出るか、少ない部門から出るか"],
            ["総合順位の上位に、複数の部門が混ざっているか", "部門を混ぜた順位でも、どの部門にもチャンスがあるのか"],
            ["椅子1脚あたりの名簿が多いブロックの結果", "南関東・九州北・北関東で、激戦と言われた通りの結果になるか"],
            ["得票数が公開されるか", "出されれば、「1人あたりの票の量」が分かり、地域の激しさを票で比べられる"],
          ]}
        />
        <p>発表のあとに、この表に結果を書き足した「答え合わせ版」を出す予定です。</p>
      </section>

      <section className="section card prose">
        <h2>出典・注意</h2>
        <ul>
          <li>本選の部門者数：<a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405</a> さんの集計（2026年11月24日）。公式の発表ではありません。東京の計と九州北のデリヘルは、私たちが補正しました（上の注記）。</li>
          <li>神15の枠、部門の決まり方、順位アイコン、副賞：<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日）。媒体の記事で、公式の発表とは言い切れません。</li>
          <li>ブロック本選結果の日程：過去の公式FAQの告知（2024年・2025年はどちらも12月3日12:00）。2026年は未確認です。</li>
          <li>この特集は、有志による非公式の考察で、公式の見解や、結果の予測ではありません。</li>
        </ul>
        <p>
          <Link href="/feature">特集1 ›</Link>　<Link href="/feature/history">特集2 ›</Link>　<Link href="/feature/yosen">特集3 ›</Link>
        </p>
      </section>
    </>
  );
}
