import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeatureTabs } from "@/components/FeatureTabs";
import { HONSEN, HONSEN_DEPTS, HONSEN_TOTAL, honsenBlockTotal, honsenCells, honsenDeptTotals, iconSlots, ICON_RANK } from "@/lib/honsen";
import { YOSEN_BLOCKS } from "@/lib/yosen";

export const metadata: Metadata = { title: "特集4：本選は、49の小さな選挙だった 部門ごとの人数から読む" };

type Row = readonly string[];

function Table({ head, rows, dense = false }: { head: Row; rows: readonly Row[]; dense?: boolean }) {
  return (
    <div className="table-wrap">
      <table className={dense ? "feature-table feature-table--dense" : "feature-table"}>
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

/** 人数の色（対数）。多いほど金、少ないほど濃い紫。スマホでも数字が読めるよう、セルに色を付ける */
function heat(v: number): { bg: string; fg: string } {
  const lo = Math.log(14);
  const hi = Math.log(620);
  const t = Math.min(1, Math.max(0, (Math.log(v) - lo) / (hi - lo)));
  const a = [58, 22, 92];
  const b = [214, 59, 143];
  const c = [244, 198, 106];
  const mix = (x: number[], y: number[], u: number) => x.map((q, i) => Math.round(q + (y[i] - q) * u));
  const rgb = t < 0.55 ? mix(a, b, t / 0.55) : mix(b, c, (t - 0.55) / 0.45);
  return { bg: `rgb(${rgb.join(",")})`, fg: t > 0.72 ? "#3a2400" : "#fff" };
}

const SHORT_DEPTS = ["デリヘル", "ヘルス", "ソープ", "エステ", "人妻"] as const;

function HeatTable() {
  return (
    <div className="heat" role="table" aria-label="ブロック別・部門別の本選の人数">
      <div className="heat__row heat__row--head" role="row">
        <span role="columnheader" />
        {SHORT_DEPTS.map((d) => (
          <span key={d} role="columnheader">{d}</span>
        ))}
        <span role="columnheader">計</span>
      </div>
      {HONSEN.map((b) => (
        <div className="heat__row" role="row" key={b.block}>
          <span className="heat__name" role="rowheader">{b.block}</span>
          {b.counts.map((c, i) =>
            c === 0 ? (
              <span key={i} className="heat__cell heat__cell--none" role="cell">なし</span>
            ) : (
              <span key={i} className="heat__cell" role="cell" style={{ background: heat(c).bg, color: heat(c).fg }}>
                {c}
                {b.block === "九州北" && i === 0 ? <sup>※2</sup> : null}
              </span>
            ),
          )}
          <span className="heat__total" role="cell">
            {n(honsenBlockTotal(b.block))}
            {b.block === "東京" ? <sup>※1</sup> : null}
          </span>
        </div>
      ))}
      <p className="heat__legend">色が金に近いほど、人数が多い（紫が濃いほど少ない）。「ヘルス」は、ヘルス・ホテヘル部門です。</p>
    </div>
  );
}
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
  const slotOf = Object.fromEntries(YOSEN_BLOCKS.map((b) => [b.name, b.slots]));
  const chairs = HONSEN.map((b) => {
    const total = honsenBlockTotal(b.block);
    const sl = slotOf[b.block];
    return { block: b.block, total, sl, per: total / sl, rate: (sl / total) * 100 };
  }).sort((a, b) => b.per - a.per);
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
          <li><strong>神15への門は、さらに狭くなります。</strong>神15は、ブロックの総合票（部門を混ぜた票）で決まる、と私たちは認識しています。全国で15人は、7,594人の約0.2%（約506人に1人）です。最も狭い南関東は、730人に1脚です。</li>
          <li><strong>人数が少ない＝楽、とは限りません。</strong>順位は票で決まるので、票の量が分からない今は、「入りやすさの目安」までしか言えません。</li>
        </ol>
      </section>

      <section className="section card prose">
        <h2>部門ごとの人数が分かった</h2>
        <p>
          <a href={SRC_URL} target="_blank" rel="noopener noreferrer nofollow ugc">@hiropyon_0405</a> さんの集計（2026年11月24日 12:06の投稿。公式の発表ではありません）で、ブロック本選の「各ブロックの部門者数」が出ました。総数は{n(HONSEN_TOTAL)}人です。
        </p>
        <HeatTable />
        <p className="hint">
          ※1 東京の計は、投稿では「1951人」でしたが、部門の合計は1,591人です。※2 九州北のデリヘルは、投稿では「672人」（九州北の計と同じ数字）でしたが、計から他の4部門を引くと175人です。この2か所を直すと、10ブロックの合計が、投稿の総数（{n(HONSEN_TOTAL)}人）とぴったり一致します。ただし、元の投稿の訂正は確認していないため、補正は私たちの推定です。
        </p>
        <Table
          dense
          head={["部門", "人数", "割合"]}
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
        <h3>大きい選挙（上位6）</h3>
        <Table dense head={["選挙", "人数"]} rows={narrow.map((c) => [`${c.block}・${c.dept}`, `${n(c.n)}人`])} />
        <h3>小さい選挙（下位6）</h3>
        <Table dense head={["選挙", "人数"]} rows={wide.map((c) => [`${c.block}・${c.dept}`, `${n(c.n)}人`])} />
      </section>

      <section className="section card prose">
        <h2>順位アイコンの「狭き門」と「広き門」</h2>
        <p>
          順位アイコンの対象は、各部門の10位以内です。1つの選挙の人数が{ICON_RANK}人以上なら、枠は{ICON_RANK}人です。つまり、<strong>「10 ÷ 人数」が、アイコンの圏内に入る割合の目安</strong>になります。49の選挙の枠を足すと、{n(iconTotal)}人で、全体の{pct(iconTotal, HONSEN_TOTAL)}%です。
        </p>
        <Table
          dense
          head={["部門", "人数", "枠", "圏内"]}
          rows={deptRows.map((r) => [r.d, `${n(r.total)}人`, `${r.slots}人`, `${r.rate.toFixed(1)}%`])}
        />
        <p className="hint">「枠」は、その部門のアイコンの人数（選挙の数×10人。ヘルス・ホテヘルは選挙が9つ）。「圏内」は、枠÷人数です。言いかえると、デリヘル・ソープは約25人に1人、人妻は約13人に1人、ヘルス・ホテヘルは約9人に1人、エステは約5〜6人に1人です。</p>
        <h3>狭き門（圏内に入る割合が低い）</h3>
        <Table dense head={["選挙", "人数", "10位以内"]} rows={narrow.map((c) => [`${c.block}・${c.dept}`, `${n(c.n)}人`, `${pct(iconSlots(c.n), c.n)}%`])} />
        <h3>広き門（圏内に入る割合が高い）</h3>
        <Table dense head={["選挙", "人数", "10位以内"]} rows={wide.map((c) => [`${c.block}・${c.dept}`, `${n(c.n)}人`, `${Math.round((iconSlots(c.n) / c.n) * 100)}%`])} />
        <ul>
          <li>エステは、全国の約5〜6人に1人が圏内です。デリヘル・ソープは、約25人に1人です。</li>
          <li>小さい部門（北関東・九州南・沖縄のヘルス・ホテヘル、エステなど）は、半分以上が圏内に入る計算です。</li>
        </ul>
        <p className="hint">注意：この割合は、人数だけから出した「入りやすさの目安」です。10位に入るために必要な票の数は、部門によって違うはずで、今は分かりません。人数が少ない部門は、票も少ないかもしれません。</p>
      </section>

      <section className="section card prose" id="kami15">
        <h2>神15への狭き門</h2>
        <p>
          神15は、ブロックごとの「総合」の票（部門を混ぜた票）で決まる、と私たちは認識しています。ヘブンnaviの記事では、称号の表に「神15＝ブロック本選上位入賞者15名」とあり、神15の人数は「ブロックごとに上位N位まで」と書かれていて、部門ごとの枠はありません。副賞の案内にも、「ブロック総合『1位〜10位』」とあります。ただし、「部門を問わない」とまで書いた文は、確認できていません。そのため、ここでは、<strong>部門に関係なく、ブロックの全員で椅子を争う</strong>ものとして、数えます。
        </p>
        <h3>3つの門</h3>
        <Table
          dense
          head={["門", "人数", "割合", "目安"]}
          rows={[
            ["本選の名簿", `${n(HONSEN_TOTAL)}人`, "100%", "―"],
            [`アイコン圏（各部門${ICON_RANK}位）`, `${n(iconTotal)}人`, `${pct(iconTotal, HONSEN_TOTAL)}%`, `約${Math.round(HONSEN_TOTAL / iconTotal)}人に1人`],
            ["神15（総合票）", "15人", `${pct(15, HONSEN_TOTAL, 2)}%`, `約${Math.round(HONSEN_TOTAL / 15)}人に1人`],
          ]}
        />
        <h3>ブロックごとの、椅子1脚あたり</h3>
        <Table
          dense
          head={["ブロック", "名簿", "椅子", "1脚", "割合"]}
          rows={chairs.map((c) => [c.block, n(c.total), `${c.sl}`, n(Math.round(c.per)), `${c.rate.toFixed(2)}%`])}
        />
        <ul>
          <li>いちばん狭いのは、南関東（730人に1脚、0.14%）、九州北（672人）、北関東（588人）です。いちばん広いのは、九州南・沖縄（276人に1脚、0.36%）です。</li>
          <li>順位アイコンの「広き門」は、神15には<strong>通じません</strong>。たとえば、北関東のエステは15人で、10位以内に入りやすい部門ですが、神15は、北関東の588人全員で、1つの椅子を争います。神15にとっては、部門の中の順位より、ブロック全体の総合順位が全てです。</li>
          <li>椅子が1脚のブロックは6つで、総合1位だけが神15に入ります。</li>
        </ul>
        <p className="hint">表の単位は、名簿は人、椅子は脚、「1脚」は椅子1脚あたりの名簿の人数、「割合」は椅子に座れる割合（椅子÷名簿）です。この割合は、名簿の人数だけから出した目安です。票を入れる人の数がブロックごとに違うので、これだけで、取りやすさは決められません。また、名簿が同じでも、票は一部の人気の人に集まるので、実際の差は、人数の割合よりずっと大きくなります。</p>
      </section>

      <section className="section card prose">
        <h2>ブロックごとの「色」</h2>
        <p>部門の構成は、ブロックごとに大きく違います。最も多い部門の割合です。</p>
        <Table
          dense
          head={["ブロック", "最多の部門", "割合", "部門数"]}
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
            ["ブロックごとの部門の「色」の違い", "神15が部門を問わないと明記した文（記事の表現からは、ブロックの総合順位で決まると読める）"],
            ["小さな選挙の大きさの差（14〜620人）", "人数の少ない部門が、本当に楽なのかどうか"],
          ]}
        />
      </section>

      <section className="section card prose" id="check">
        <h2>答え合わせ：結果が出たら、ここを見る</h2>
        <p>ブロック本選の結果は、12月2日（水）12:00から発表されます（ヘブンnaviの日程表）。「私の憧れの人気姫」の順位発表も、同じ日です。神15・グランプリの発表は、12月19日（土）21:00からの動画配信です。</p>
        <Table
          head={["見るところ", "分かること"]}
          rows={[
            ["各部門の10位の得票数（出れば）", "人数の多い部門ほど、10位のラインは高いのか。人数と票の関係が見える"],
            ["部門1位の得票数", "小さな部門の1位は、大きな部門の1位に比べて、票が少ないのか"],
            ["神15の15人が、どの部門か", "人数の割合（デリヘル33%・ソープ32.5%・人妻17%・ヘルス・ホテヘル11%・エステ7%）と比べて、偏りが大きければ、部門による有利・不利がある"],
            ["椅子が1脚のブロック（6つ）の総合1位が、どの部門か", "総合票で決まるなら、1位は、人数の多い部門から出やすいのか。それとも、部門の人数と関係なく出るのか"],
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
          <li>神15が、ブロックの総合票（部門を混ぜた票）で決まるという点は、記事の表現（「神15＝ブロック本選上位入賞者」「ブロック総合1位〜10位」）にもとづく私たちの認識で、「部門を問わない」と明記した文は確認できていません。</li>
          <li>順位アイコンを「ブロック×部門ごとの10位以内」と数えたのは、私たちの解釈です（記事には「各部門10位以内」とだけ書かれています）。同順位の扱いなどで、実際と違う可能性があります。</li>
          <li>結果発表の日程：<a href={NAVI} target="_blank" rel="noopener noreferrer nofollow ugc">ヘブンnaviの記事</a>の日程表（12月2日（水）12:00〜ブロック本選の結果発表、12月19日（土）21:00〜グランプリ発表）。</li>
          <li>この特集は、有志による非公式の考察で、公式の見解や、結果の予測ではありません。</li>
        </ul>
        <p>
          <Link href="/feature">特集1 ›</Link>　<Link href="/feature/history">特集2 ›</Link>　<Link href="/feature/yosen">特集3 ›</Link>
        </p>
      </section>
    </>
  );
}
