import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryCard } from "@/components/CategoryCard";
import { site } from "@/lib/data";
import { summarizeCategories, type CategorySummary } from "@/lib/categories";

export const metadata: Metadata = { title: "特集：部門図鑑" };

/** 見せ方のためのグループ分け（部門名そのものは原文のまま。似た名前を統合しない） */
const GROUPS: { id: string; title: string; lead: string; test: RegExp }[] = [
  { id: "local", title: "ご当地・地名つき", lead: "地名や「地元」が入った部門。その土地ならではの名前です。", test: /(北海道|道産子|札幌|東北|宮城|仙台|福島|茨城|栃木|宇都宮|群馬|埼玉|千葉|東京|神奈川|横浜|川崎|新潟|石川|金沢|長野|岐阜|静岡|浜松|愛知|名古屋|三重|滋賀|京都|大阪|兵庫|神戸|奈良|和歌山|岡山|広島|山口|徳島|香川|愛媛|松山|高知|福岡|博多|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄|関西|関東|九州|四国|地元|地方都市|県|府)/ },
  { id: "body", title: "カラダ自慢系", lead: "スタイルや魅力を前面に出した部門。いちばん数が多いグループです。", test: /(巨乳|おっぱい|爆乳|美乳|貧乳|微乳|スタイル|ボディ|美尻|お尻|ぽっちゃり|ムチ|くびれ|脚|美脚|ヒップ)/ },
  { id: "chara", title: "キャラ・属性系", lead: "人妻、ロリ、アイドル、ギャルなど、キャラクターで選ぶ部門。", test: /(人妻|熟女|若妻|ロリ|アイドル|ギャル|学生|女子|素人|コスプレ|清楚|ニューヒロイン|新人|癒し|ドS|ドM|M|S|天然|妹|お姉さん|OL|ナース)/ },
  { id: "service", title: "サービス・ジャンル系", lead: "お店のジャンルや得意分野で分かれた部門。", test: /(ソープ|デリヘル|ヘルス|エステ|アロマ|マッサージ|M性感|性感|オナクラ|手コキ|キャバ|回春|SPA|テクニシャン|前立腺|潮吹き|くじら|フェラ|フェチ|泡姫)/ },
  { id: "shop", title: "お店・推し系", lead: "店長の推しや、お店の看板などを示す部門。", test: /(店長|一押し|イチオシ|オススメ|看板|有名店|エース|No\.?1|ナンバー|ランカー|人気|レア|顔出し|隠れ|大食い|ギャンブル|ルックス|極嬢)/ },
];

function classify(all: CategorySummary[]) {
  const used = new Set<string>();
  const out = GROUPS.map((g) => {
    const items = all.filter((c) => !used.has(c.name) && g.test.test(c.name));
    items.forEach((c) => used.add(c.name));
    return { ...g, items: items.sort((a, b) => b.storeCount - a.storeCount || a.name.localeCompare(b.name, "ja")) };
  });
  const others = all.filter((c) => !used.has(c.name));
  return { groups: out, others };
}

export default function ZukanPage() {
  const everything = summarizeCategories(site);
  const total = everything.length;
  const all = everything.filter((c) => c.storeCount > 0);
  const top = [...all].sort((a, b) => b.storeCount - a.storeCount || b.prefectureCount - a.prefectureCount || a.name.localeCompare(b.name, "ja")).slice(0, 15);
  const { groups, others } = classify(all);
  const rare = all.filter((c) => c.storeCount === 1).sort((a, b) => a.name.localeCompare(b.name, "ja"));
  const rareShown = rare.slice(0, 36);

  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集", href: "/feature" }, { label: "部門図鑑" }]} />
      <h1>特集：部門図鑑</h1>
      <p className="hint">このサイトで見つかった {total} の部門を、タイプ別に眺める特集です。数字は「このサイトで確認できた範囲」で、公式の統計ではありません。</p>

      <section className="section card prose">
        <h2>まず、数の多い部門TOP15</h2>
        <p>部門ごとに「その部門名が見つかった店舗の数」で並べました。同じ部門名のお店が多いほど、上に来ます。</p>
        <ul className="cat-grid">
          {top.map((c, i) => (
            <li key={c.name}>
              <p className="hint hint--tight">{i + 1}位</p>
              <CategoryCard row={c} />
            </li>
          ))}
        </ul>
      </section>

      {groups.map((g) => (
        <section key={g.id} className="section card prose" id={g.id}>
          <h2>{g.title}（{g.items.length}部門）</h2>
          <p>{g.lead}</p>
          <ul className="cat-grid">
            {g.items.slice(0, 12).map((c) => (
              <li key={c.name}>
                <CategoryCard row={c} />
              </li>
            ))}
          </ul>
          {g.items.length > 12 && (
            <p className="hint">ほか {g.items.length - 12} 部門は、<Link href="/categories">部門一覧</Link>から探せます。</p>
          )}
        </section>
      ))}

      <section className="section card prose" id="rare">
        <h2>1店しか見つかっていない部門</h2>
        <p>
          このサイトで、まだ1店しか見つかっていない部門が {rare.length} あります（一部を表示）。公式に珍しいという意味ではなく、「見つかった範囲では1店」ということです。
        </p>
        <ul className="cat-grid">
          {rareShown.map((c) => (
            <li key={c.name}>
              <CategoryCard row={c} />
            </li>
          ))}
        </ul>
        {rare.length > rareShown.length && <p className="hint">ほか {rare.length - rareShown.length} 部門は、<Link href="/categories">部門一覧</Link>から。</p>}
      </section>

      <section className="section card prose">
        <h2>読み方の注意</h2>
        <ul>
          <li>部門名は、お店の告知や在籍ページのバッジの表記そのままです。似た名前を、まとめたり言い換えたりしていません。</li>
          <li>タイプ別の分け方は、読みやすくするための目安です（言葉に含まれる単語で分けています）。分類できなかった {others.length} 部門は、この特集には出していません。</li>
          <li>店舗数・都道府県数は、このサイトで確認できた情報の数です。全国の実際の数ではありません。</li>
          <li>気になる部門は、カードから部門ページ（店舗の一覧）へ進めます。</li>
        </ul>
        <p>
          <Link href="/categories">部門一覧を見る ›</Link>　<Link href="/feature">特集：まず200人、そして15万票へ ›</Link>
        </p>
      </section>
    </>
  );
}
