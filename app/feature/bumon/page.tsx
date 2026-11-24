import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";
import { HONSEN, HONSEN_DEPTS, HONSEN_TOTAL, honsenBlockTotal, honsenCells, honsenDeptTotals, iconSlots, ICON_RANK } from "@/lib/honsen";

export const metadata: Metadata = { title: "特集4：本選は、49の小さな選挙だった 部門ごとの人数から読む" };

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

export default function BumonPage() {
  const dept = honsenDeptTotals();
  const cells = honsenCells();
  const bySize = [...cells].sort((a, b) => b.n - a.n);
  const sizes = bySize.map((c) => c.n);
  const median = [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
  const top10Share = (bySize.slice(0, 10).reduce((s, c) => s + c.n, 0) / HONSEN_TOTAL) * 100;
  const iconTotal = cells.reduce((s, c) => s + iconSlots(c.n), 0);
  const deptRows = HONSEN_DEPTS.map((d, i) => {
    const cs = cells.filter((c) => c.dept === d);
    const slots = cs.reduce((s, c) => s + iconSlots(c.n), 0);
    return { d, blocks: cs.length, total: dept[i], slots, rate: (slots / dept[i]) * 100 };
  });
  const narrow = bySize.slice(0, 6);
  const wide = [...cells].sort((a, b) => a.n - b.n).slice(0, 6);

  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集" }]} />
      <FeatureTabs current={4} />
      <h1>特集4：本選は、49の小さな選挙だった</h1>
      <p className="hint">部門ごとの人数が出たことで、何が分かるのか。順位アイコンの「狭き門」と「広き門」を、数字で読みます。結果の発表の前に、答え合わせの見どころまで整理した、考察の特集です（予測ではありません）。</p>

      <section className="section card prose">
        <h2>30秒で読む</h2>
        <ol>
          <li><strong>本選は、10ブロック×5部門の「小さな選挙」の集まりです。</strong>人数が0の部門（北陸・甲信越のヘルス・ホテヘル）を除くと、49あります。</li>
          <li><strong>小さな選挙の大きさは、14人から620人まで、約44倍違います。</strong>最も大きい東京のデリヘル（620人）と、最も小さい九州南・沖縄のエステ（14人）です。</li>
          <li><strong>「各部門10位以内」の順位アイコンは、計算上490人（全体の6.5%）です。</strong>ただし、入りやすさは部門で大きく違います。東京のデリヘルは1.6%、九州南・沖縄のエステは71%です。</li>
          <li><strong>人数が少ない＝楽、とは限りません。</strong>順位は票で決まるので、票の量が分からない今は、「入りやすさの目安」までしか言えません。</li>
        </ol>
      </section>

      <section className="section card prose">
        <h2>部門ごとの人数が分かった</h2>
        <p>
          <a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405</a> さんの集計（2026年11月24日 12:06の投稿。公式の発表ではありません）で、ブロック本選の「各ブロックの部門者数」が出ました。総数は{n(HONSEN_TOTAL)}人です。
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
          ※1 東京の計は、投稿では「1951人」でしたが、部門の合計は1,591人です。※2 九州北のデリヘルは、投稿では「672人」（九州北の計と同じ数字）でしたが、計から他の4部門を引くと175人です。この2か所を直すと、10ブロックの合計が、投稿の総数（{n(HONSEN_TOTAL)}人）とぴったり一致します。ただし、元の投稿の訂正は確認していないため、補正は私たちの推定です。
        </p>
        <Table
          head={["部門", "全国の人数", "割合"]}
          rows={HONSEN_DEPTS.map((d, i) => [d, `${n(dept[i])}人`, `${pct(dept[i], HONSEN_TOTAL)}%`])}
        />
        <p>デリヘル（{pct(dept[0], HONSEN_TOTAL)}%）とソープ（{pct(dept[2], HONSEN_TOTAL)}%）で、約3分の2です。</p>
      </section>

      <section className="section card prose">
        <h2>本選は、49の小さな選挙</h2>
        <p>
          ヘブンnaviの記事（<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">2026年11月10日</a>。媒体の記事で、公式の発表とは言い切れません）によると、本選は、ブロックごとのランキングで、全国共通の5部門があります。順位アイコンは「各部門10位以内」に付きます。そこで、ブロック×部門ごとに、1つの小さな選挙があると考えます（私たちの見立てです）。
        </p>
        <ul>
          <li>小さな選挙の数は、49です（10ブロック×5部門−部門なし1）。</li>
          <li>大きさは、最小14人、最大620人で、約44倍の差があります。中央値は{n(median)}人です。</li>
          <li>100人以上の選挙は29、200人以上は{bySize.filter((c) => c.n >= 200).length}です。</li>
          <li>大きい10の選挙だけで、全体の{top10Share.toFixed(1)}%を占めます。</li>
        </ul>
        <h3>大きい選挙・小さい選挙</h3>
        <Table
          head={["大きい選挙（上位6）", "人数", "小さい選挙（下位6）", "人数"]}
          rows={narrow.map((c, i) => [`${c.block}・${c.dept}`, `${n(c.n)}人`, `${wide[i].block}・${wide[i].dept}`, `${n(wide[i].n)}人`])}
        />
      </section>

      <section className="section card prose">
        <h2>順位アイコンの「狭き門」と「広き門」</h2>
        <p>
          順位アイコンの対象は、各部門の10位以内です。1つの選挙の人数が{ICON_RANK}人以上なら、枠は{ICON_RANK}人です。つまり、<strong>「10 ÷ 人数」が、アイコンの圏内に入る割合の目安</strong>になります。49の選挙の枠を足すと、{n(iconTotal)}人で、全体の{pct(iconTotal, HONSEN_TOTAL)}%です。
        </p>
        <Table
          head={["部門", "選挙の数", "人数", "アイコンの枠", "圏内の割合", "言いかえると"]}
          rows={deptRows.map((r) => [r.d, `${r.blocks}`, `${n(r.total)}人`, `${r.slots}人`, `${r.rate.toFixed(1)}%`, `約${(100 / r.rate).toFixed(0)}人に1人`])}
        />
        <h3>いちばん狭い門、いちばん広い門</h3>
        <Table
          head={["狭き門（10位以内の割合）", "広き門（10位以内の割合）"]}
          rows={narrow.map((c, i) => [`${c.block}・${c.dept}（${n(c.n)}人）：${pct(iconSlots(c.n), c.n)}%`, `${wide[i].block}・${wide[i].dept}（${wide[i].n}人）：${Math.round((iconSlots(wide[i].n) / wide[i].n) * 100)}%`])}
        />
        <ul>
          <li>エステは、全国の約5〜6人に1人が圏内です。デリヘル・ソープは、約25人に1人です。</li>
          <li>小さい部門（北関東・九州南・沖縄のヘルス・ホテヘル、エステなど）は、半分以上が圏内に入る計算です。</li>
        </ul>
        <p className="hint">注意：この割合は、人数だけから出した「入りやすさの目安」です。10位に入るために必要な票の数は、部門によって違うはずで、今は分かりません。人数が少ない部門は、票も少ないかもしれません。</p>
      </section>

      <section className="section card prose">
        <h2>ブロックごとの「色」</h2>
        <p>部門の構成は、ブロックごとに大きく違います。最も多い部門の割合です。</p>
        <Table
          head={["ブロック", "最も多い部門", "割合", "部門の数"]}
          rows={HONSEN.map((b) => {
            const t = honsenBlockTotal(b.block);
            const m = Math.max(...b.counts);
            return [b.block, HONSEN_DEPTS[b.counts.indexOf(m)], `${pct(m, t)}%`, `${b.counts.filter((c) => c > 0).length}`];
          })}
        />
        <ul>
          <li>北関東（ソープ56.1%）、南関東（ソープ47.8%）、九州北（ソープ44.6%）は、ソープが半分近くです。</li>
          <li>九州南・沖縄（デリヘル47.8%）、北陸・甲信越（デリヘル45.5%）は、デリヘルが多いです。</li>
          <li>東海は、ヘルス・ホテヘルが23.6%で、全国（{pct(dept[1], HONSEN_TOTAL)}%）の2倍以上です。</li>
          <li>北陸・甲信越は、ヘルス・ホテヘルが「部門なし」でした（0人なのか、部門が開かれなかったのかは、分かりません）。</li>
        </ul>
        <p>部門は、掲載店の業種・ジャンルで決まり、キャスト単位では選べないと、記事に書かれています。ブロックごとの「色」の違いは、各地の業種の構成の違いが、そのまま出ているのだと考えられます（見立て）。</p>
      </section>

      <section className="section card prose">
        <h2>部門の人数で、分かること・分からないこと</h2>
        <Table
          head={["分かること", "分からないこと"]}
          rows={[
            ["本選の名簿の構成（どの部門・どのブロックが大きいか）", "部門ごとの票の量、投票した人の数"],
            ["順位アイコンの圏内に入る割合の目安（10÷人数）", "10位に入るために必要な票の数"],
            ["ブロックごとの部門の「色」の違い", "神15が部門を問わないのか（ブロックの総合順位で決まると考えるのが自然だが、確認できていない）"],
            ["小さな選挙の大きさの差（14〜620人）", "人数の少ない部門が、本当に楽なのかどうか"],
          ]}
        />
      </section>

      <section className="section card prose" id="check">
        <h2>答え合わせ：結果が出たら、ここを見る</h2>
        <p>ブロック本選の結果は、過去2年とも、12月3日の12:00に発表されました（2026年の日時は、まだ確認できていません）。神15・グランプリの発表は、12月19日（土）21:00の動画配信です。</p>
        <Table
          head={["見るところ", "分かること"]}
          rows={[
            ["各部門の10位の得票数（出れば）", "人数の多い部門ほど、10位のラインは高いのか。人数と票の関係が見える"],
            ["部門1位の得票数", "小さな部門の1位は、大きな部門の1位に比べて、票が少ないのか"],
            ["神15の15人が、どの部門か", "人数の割合（デリヘル33%・ソープ32.5%・人妻17%・ヘルス・ホテヘル11%・エステ7%）と比べて、偏りが大きければ、部門による有利・不利がある"],
            ["小さな部門の1位が、ブロックの総合でも上位に入るか", "部門を混ぜた順位でも、小さな選挙の1位に、チャンスがあるのか"],
          ]}
        />
        <p>発表のあとに、この表に結果を書き足した「答え合わせ版」を出す予定です。</p>
      </section>

      <section className="section card prose">
        <h2>出典・注意</h2>
        <ul>
          <li>本選の部門者数：<a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405</a> さんの集計（2026年11月24日）。公式の発表ではありません。東京の計と九州北のデリヘルは、私たちが補正しました（上の注記）。</li>
          <li>部門・順位アイコン・神15の枠：<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>（2026年11月10日）。媒体の記事で、公式の発表とは言い切れません。</li>
          <li>順位アイコンを「ブロック×部門ごとの10位以内」と数えたのは、私たちの解釈です（記事には「各部門10位以内」とだけ書かれています）。同順位の扱いなどで、実際と違う可能性があります。</li>
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
