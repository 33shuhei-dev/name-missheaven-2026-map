import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("特集ページ（200人と15万票）", () => {
  const src = readFileSync("app/feature/page.tsx", "utf8");
  it("200人は称号の条件で神15の条件ではないこと、仮定の計算であることを書いている", () => {
    expect(src).toContain("称号の条件で、神15の条件ではありません");
    expect(src).toContain("同じ倍率だったと仮定した計算");
    expect(src).toContain("神15のボーダーではありません");
  });
  it("本選の終了日は11月23日", () => {
    expect(src).toContain("終了は11月23日");
    expect(src).not.toContain("11月24日");
  });
  it("未確認の点を明記している", () => {
    expect(src).toContain("本文を直接確認できていません");
  });
  it("トップとフッターからリンクしている", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain('href="/feature"');
    expect(readFileSync("components/SiteFooter.tsx", "utf8")).toContain('href="/feature"');
  });
});

describe("特集への入口", () => {
  it("トップにバナー、ヘッダーに目立つ「特集」リンクがある", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("feature-banner");
    expect(readFileSync("components/SiteHeader.tsx", "utf8")).toContain("site-nav__feature");
  });
});

describe("応援曲の動画", () => {
  it("トップのステージの中に動画があり、自動再生しない（非公式・有志制作の表記つき）", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("<VoteAudioPlayer />");
    const src = readFileSync("components/VoteAudioPlayer.tsx", "utf8");
    expect(src).toContain("/vote-vote-vote-lyric-mv.mp4");
    expect(src).toContain("非公式・有志制作");
    expect(src).not.toContain("autoPlay");
    expect(src).toContain('preload="none"');
  });
});

describe("特集：総選挙の歴史", () => {
  it("確認できたことだけを載せ、わからなかったことを明記している", () => {
    const src = readFileSync("app/feature/history/page.tsx", "utf8");
    expect(src).toContain("わからなかったこと");
    expect(src).toContain("確認できていない");
    expect(src).toContain("媒体の記事のみ");
    expect(src).toContain("運営者の確認による11/23(月) 23:59");
    expect(src).toContain("近年の大会では、投票参加者数や得票数の記録更新が報じられています");
    expect(src).not.toContain("規模は年々大きくなっています");
    expect(src).toContain("歩み：歴代グランプリと、応援のかたちの変化");
    expect(src).toContain("2026年の戦略：歴史から何が言えるか");
    expect(src).toContain("結果を予測するものではなく、保証もしません");
    expect(src).toContain("2026年の神15の枠の配分は、公式には確認できていません");
    expect(src).toContain("公式の発表とは言い切れません");
    expect(src).toContain("https://link-f.biz/archives/25125");
    expect(src).not.toContain("北関東3 ※");
    expect(src).toContain("12月19日（土）21:00");
  });
});

describe("特集の入口（特集1・特集2）", () => {
  it("どちらの特集ページにも、特集1・特集2の切り替えがある", () => {
    expect(readFileSync("app/feature/page.tsx", "utf8")).toContain("<FeatureTabs current={1} />");
    expect(readFileSync("app/feature/history/page.tsx", "utf8")).toContain("<FeatureTabs current={2} />");
    const tabs = readFileSync("components/FeatureTabs.tsx", "utf8");
    expect(tabs).toContain('href: "/feature"');
    expect(tabs).toContain('href: "/feature/history"');
  });
  it("トップに、特集1・特集2の入口がある", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("FEATURES.map");
  });
});

describe("特集3：予選の結果", () => {
  it("都道府県の数字が、投稿の全国合計（7634人／9908人）と一致する", async () => {
    const { YOSEN, YOSEN_TOTAL } = await import("@/lib/yosen");
    expect(YOSEN.reduce((s, r) => s + r[1], 0)).toBe(YOSEN_TOTAL.advanced);
    expect(YOSEN.reduce((s, r) => s + r[2], 0)).toBe(YOSEN_TOTAL.nominees);
    expect(YOSEN.every((r) => r[1] <= r[2])).toBe(true);
  });
  it("公式の発表ではなく有志の集計であること、出典、見立ての断りを書いている", () => {
    const src = readFileSync("app/feature/yosen/page.tsx", "utf8");
    expect(src).toContain("公式の発表ではなく、有志の集計");
    expect(src).toContain("@hiropyon_0405");
    expect(src).toContain("私たちの見立て");
    expect(src).toContain("青森・山形・鳥取・島根は、元の投稿の表に載っていない");
  });
});

describe("特集3：ブロック別のまとめ", () => {
  it("ブロックの分け方が、都道府県を重複なく、すべてを含み、合計が全国と一致する", async () => {
    const { YOSEN, YOSEN_TOTAL, YOSEN_BLOCKS, blockTotals } = await import("@/lib/yosen");
    const all = YOSEN_BLOCKS.flatMap((b) => [...b.prefs]);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(YOSEN.map((r) => r[0]).sort());
    const t = blockTotals();
    expect(t.reduce((s, b) => s + b.advanced, 0)).toBe(YOSEN_TOTAL.advanced);
    expect(t.reduce((s, b) => s + b.nominees, 0)).toBe(YOSEN_TOTAL.nominees);
    expect(YOSEN_BLOCKS.reduce((s, b) => s + b.slots, 0)).toBe(15);
    expect(t.find((b) => b.name === "関西")!.advanced).toBe(1133);
  });
});

describe("特集3：本文の数字が計算と一致する", () => {
  it("進出率の最低・最高が、本文の記載と一致する", async () => {
    const { blockTotals } = await import("@/lib/yosen");
    const src = readFileSync("app/feature/yosen/page.tsx", "utf8");
    const t = blockTotals().sort((a, b) => a.rate - b.rate);
    expect(src).toContain(`${t[0].name}（${t[0].rate.toFixed(1)}%）`);
    expect(src).toContain(`${t[1].name}（${t[1].rate.toFixed(1)}%）`);
  });
});

describe("特集3：なぜ多いのか・激戦の戦い方", () => {
  it("事実・試算・見立てを分け、旧ルールとの比較は目安と断っている", () => {
    const src = readFileSync("app/feature/yosen/page.tsx", "utf8");
    expect(src).toContain("なぜ7,634人も本選に進めたのか");
    expect(src).toContain("試算：旧ルールなら、何人だったか");
    expect(src).toContain("あくまで目安です");
    expect(src).toContain("運営の意図は、どう説明されているか");
    expect(src).toContain("運営自身の言葉ではありません");
    expect(src).toContain("さらなる激戦をどう戦うか");
    expect(src).toContain("結果を保証するものではありません");
  });
  it("試算の数字が正しい（9,908人の10%≈991人、7,634÷991≈7.7倍）", async () => {
    const { YOSEN_TOTAL } = await import("@/lib/yosen");
    const old = Math.round(YOSEN_TOTAL.nominees * 0.1);
    expect(old).toBe(991);
    expect((YOSEN_TOTAL.advanced / old).toFixed(1)).toBe("7.7");
    expect(Math.round(YOSEN_TOTAL.advanced / 15)).toBe(509);
  });
});

describe("無限投票（遊び）", () => {
  const game = readFileSync("components/MugenVote.tsx", "utf8");
  it("本物の投票ではないことと、何も送信しないことを明記している", () => {
    expect(game).toContain("本物の投票ではありません");
    expect(game).toContain("何も送信されません");
    expect(game).toContain("非公式");
    expect(game).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon/);
  });
  it("実績は15個で、称号の条件（50/100/200人）と特集の数字（7,634人・15万票）に対応している", () => {
    expect((game.match(/\{ id: "a\d+"/g) ?? []).length).toBe(15);
    expect(game).toContain("50人：都道府県代表");
    expect(game).toContain("100人：ブロック代表");
    expect(game).toContain("200人：日本代表");
    expect(game).toContain("7634");
    expect(game).toContain("150000");
  });
  it("倍率は最大3倍（制度と同じ）で、フッターからリンクされ、検索には出ない設定のまま", () => {
    expect(game).toMatch(/id: "rate"[^}]*max: 2/);
    expect(readFileSync("components/SiteFooter.tsx", "utf8")).toContain('href="/game"');
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("index: false");
  });
});

describe("無限投票：追加要素", () => {
  const game = readFileSync("components/MugenVote.tsx", "utf8");
  it("金の流れ星・ひとこと・記録カード・発表ごっこ・効果音（初期オフ）・隠し要素がある", () => {
    expect(game).toContain("金の流れ星");
    expect(game).toContain("記録カードを作る");
    expect(game).toContain("発表ごっこ");
    expect(game).toContain("ひみつの贈り物");
    expect(game).toMatch(/sound: false/);
  });
  it("カードは遊びと明記し、通信せず、「ミスヘブン」の語を使わない", () => {
    expect(game).toContain("非公式のお遊び／本物の投票ではありません");
    expect(game).not.toContain("ミスヘブン");
    expect(game).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon/);
  });
  it("全国ツアーのブロックは、特集3と同じ10ブロック", async () => {
    const { YOSEN_BLOCKS } = await import("@/lib/yosen");
    expect(YOSEN_BLOCKS.length).toBe(10);
    expect(game).toContain("YOSEN_BLOCKS");
  });
});

describe("無限投票：ページを移っても記録が残る", () => {
  it("サイト内の移動（アンマウント）とタブを隠したときにも保存する", () => {
    const game = readFileSync("components/MugenVote.tsx", "utf8");
    expect(game).toContain("save(); // サイト内で別のページへ移ったとき");
    expect(game).toContain('"visibilitychange"');
  });
});

describe("ゲームの枠（サイト内の入口）", () => {
  it("ヘッダー・トップ・フッターから、特集とは別の「ゲーム」としてリンクしている", () => {
    expect(readFileSync("components/SiteHeader.tsx", "utf8")).toContain('href="/game" className="site-nav__game"');
    const home = readFileSync("app/page.tsx", "utf8");
    expect(home).toContain("game-corner");
    expect(home).toContain("本物の投票ではありません");
    expect(readFileSync("components/SiteFooter.tsx", "utf8")).toContain("ゲーム：無限投票");
  });
});

describe("無限投票：音楽（2曲を小音量で順番に）", () => {
  const game = readFileSync("components/MugenVote.tsx", "utf8");
  it("小音量で、1曲ごとに次の曲へ進み、ボタンで止められ、最初のタップから流れる（自動再生はしない）", () => {
    const v = Number(/BGM_VOLUME = ([0-9.]+)/.exec(game)?.[1]);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(0.2);
    expect(game).toContain('addEventListener("ended"');
    expect(game).toContain("音楽：");
    expect(game).toContain("次の曲");
    expect(game).not.toContain("autoplay");
    expect(game).toContain("startMusic();");
  });
  it("曲の一覧と音声ファイル（AACとOpus）が揃っている", () => {
    for (const b of ["bgm-1", "bgm-2"]) {
      expect(game).toContain(`/game/${b}`);
      expect(readFileSync(`public/game/${b}.m4a`).length).toBeGreaterThan(100000);
      expect(readFileSync(`public/game/${b}.ogg`).length).toBeGreaterThan(100000);
    }
    expect(game).toContain("何度でも（Suno／運営者の制作）");
    expect(game).not.toContain("TRACKSIDE");
  });
  it("公開する音声ファイルに、歌詞や制作IDなどのメタデータが入っていない", () => {
    for (const f of ["bgm-1.m4a", "bgm-2.m4a"]) {
      const txt = readFileSync(`public/game/${f}`).toString("latin1");
      expect(txt).not.toContain("made with suno");
      expect(txt).not.toContain("[Verse");
    }
  });
});

describe("特集4：本選は49の小さな選挙", () => {
  it("ブロックごとの部門の合計が、全国の総数（7,594人）と一致し、予選の通過者を超えない", async () => {
    const { HONSEN, HONSEN_TOTAL, honsenBlockTotal, honsenDeptTotals } = await import("@/lib/honsen");
    const { YOSEN_BLOCKS, blockTotals } = await import("@/lib/yosen");
    expect(HONSEN.reduce((s, b) => s + honsenBlockTotal(b.block), 0)).toBe(HONSEN_TOTAL);
    expect(honsenDeptTotals().reduce((s, v) => s + v, 0)).toBe(HONSEN_TOTAL);
    expect(HONSEN.map((b) => b.block).sort()).toEqual(YOSEN_BLOCKS.map((b) => b.name).sort());
    for (const b of blockTotals()) expect(honsenBlockTotal(b.name)).toBeLessThanOrEqual(b.advanced);
    expect(honsenBlockTotal("東京")).toBe(1591);
    expect(HONSEN.find((b) => b.block === "九州北")!.counts[0]).toBe(175);
  });
  it("小さな選挙は49、最小14人・最大620人、アイコン枠は490人（全体の6.5%）で、本文の数字と一致する", async () => {
    const { honsenCells, iconSlots, HONSEN_TOTAL } = await import("@/lib/honsen");
    const cells = honsenCells();
    expect(cells.length).toBe(49);
    expect(Math.min(...cells.map((c) => c.n))).toBe(14);
    expect(Math.max(...cells.map((c) => c.n))).toBe(620);
    const icons = cells.reduce((s, c) => s + iconSlots(c.n), 0);
    expect(icons).toBe(490);
    expect(((icons / HONSEN_TOTAL) * 100).toFixed(1)).toBe("6.5");
    const src = readFileSync("app/feature/bumon/page.tsx", "utf8");
    for (const s of ["49の小さな選挙", "約44倍", "490人（全体の6.5%）", "東京のデリヘルは1.6%", "九州南・沖縄のエステは71%"]) expect(src).toContain(s);
  });
  it("ページは、補正の理由・公式でないこと・解釈であることを書き、特集の一覧に載っている", () => {
    const src = readFileSync("app/feature/bumon/page.tsx", "utf8");
    expect(src).toContain("公式の発表ではありません");
    expect(src).toContain("私たちの推定");
    expect(src).toContain("私たちの解釈");
    expect(src).toContain("<FeatureTabs current={4} />");
    expect(readFileSync("components/FeatureTabs.tsx", "utf8")).toContain('href: "/feature/bumon"');
  });
});

describe("特集4：神15への狭き門", () => {
  it("本文の数字（約506人に1人・南関東730人に1脚・九州南・沖縄276人に1脚）が計算と一致する", async () => {
    const { HONSEN_TOTAL, honsenBlockTotal } = await import("@/lib/honsen");
    const { YOSEN_BLOCKS } = await import("@/lib/yosen");
    const src = readFileSync("app/feature/bumon/page.tsx", "utf8");
    expect(Math.round(HONSEN_TOTAL / 15)).toBe(506);
    const per = (b: string) => honsenBlockTotal(b) / YOSEN_BLOCKS.find((x) => x.name === b)!.slots;
    expect(Math.round(per("南関東"))).toBe(730);
    expect(Math.round(per("九州南・沖縄"))).toBe(276);
    expect(((1 / per("南関東")) * 100).toFixed(2)).toBe("0.14");
    expect(((1 / per("九州南・沖縄")) * 100).toFixed(2)).toBe("0.36");
    for (const s of ["約506人に1人", "730人に1脚", "276人に1脚", "神15への狭き門", "「部門を問わない」とまで書いた文は、確認できていません", "椅子が1脚のブロックは6つ"]) expect(src).toContain(s);
    expect(YOSEN_BLOCKS.filter((b) => b.slots === 1).length).toBe(6);
  });
});

describe("特集5：楽しかったなら、勝ち。", () => {
  const a = readFileSync("app/feature/shuppan/page.tsx", "utf8");
  it("楽しい気持ちも同じ重さで入れ、気持ちの地図・しんどかった声・うれしかった声・もらったもの・理由・言いかえ・ふりかえり・現実・お守り・締めがある", () => {
    for (const s of ["7日間、どんな日でしたか", "7日間の、気持ちの地図", "しんどかった声", "うれしかった声", "7日間で、もらったもの", "あなたのせいじゃない、4つの理由", "気持ちが軽くなる、言いかえ", "<SelfCheck />", "ひとりでは、上位は難しい。それは、現実です", "お守り①", "お守り②", "どんな結果でも、楽しかったなら、勝ち", "楽しんでいい。楽しい気持ちは、あなたの力になる", "<FeatureTabs current={5} />"]) expect(a).toContain(s);
    expect(readFileSync("components/FeatureTabs.tsx", "utf8")).toContain("楽しかったなら、勝ち。");
  });
  it("「ひとりでは、上位は難しい」の節に、力の図・ひとりとみんなの比較・強い一文・役割分担の例がある", () => {
    const sec = a.slice(a.indexOf('id="genjitsu"'), a.indexOf('id="freeze"'));
    for (const s of ["順位は、あなたひとりの力の点数では、ありません。", "数字に見える力", "ひとりで、全部", "みんなで、分ける", "「努力が足りなかった」ということには、", "役割分担の例", "あくまで「例」です"]) expect(sec).toContain(s);
    expect(sec).toContain("お店のスタッフ");
  });
  it("文字だらけを避けるため、各節に要点（keypoint）があり、長い補足は、たたんである（details）", () => {
    expect((a.match(/className="keypoint/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect((a.match(/<details className="fold">/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(a).toContain("気持ちの曲線");
    expect(a).toContain("イメージの図です。数値ではありません");
  });
  it("しんどかった声は8つ、うれしかった声は4つ。個別の投稿・URLは載せない", () => {
    const tsurai = a.slice(a.indexOf("const TSURAI"), a.indexOf("] as const;", a.indexOf("const TSURAI")));
    const ureshii = a.slice(a.indexOf("const URESHII"), a.indexOf("] as const;", a.indexOf("const URESHII")));
    expect((tsurai.match(/\{ t: "/g) ?? []).length).toBe(8);
    expect((ureshii.match(/\{ t: "/g) ?? []).length).toBe(4);
    for (const s of ["相互投票の摩擦", "応援する側の負担", "凍結への警戒", "燃え尽きへの注意", "限界の声"]) expect(tsurai).toContain(s);
    const voices = a.slice(a.indexOf('id="map"'), a.indexOf('id="moratta"'));
    expect(voices).not.toMatch(/x\.com\/|twitter\.com\/|status\//);
    expect(voices).toContain("個別の投稿は、本人を守るために、載せません");
  });
  it("「ミスヘブン」の語を使わない。応援する側の特集（特集6）へ案内している", () => {
    expect(a).not.toContain("ミスヘブン");
    expect(a).toContain("/feature/ouen");
  });
  it("運営者の案内は「運営者より」と明記し、ゆず係へリンクする。規約をすり抜ける方法は書かない", () => {
    expect(a).toContain("<strong>運営者より</strong>");
    expect(a).toContain("ご本人の了承があるものに限ります");
    expect(a).toContain("https://yuzu-gakari.vercel.app/");
    expect(a).toContain("ルールをすり抜ける方法は、書きません");
  });
  it("結果発表は12月2日（水）12:00。コピーして使う文例と、相談窓口（ホットライン）の案内は載せない", () => {
    expect(a).toContain("12月2日（水）12:00");
    expect(a).not.toContain("12月3日");
    expect(a).not.toMatch(/CopyBlock|TEMPLATES|投稿の文例|ホットライン/);
    expect(readFileSync("components/SelfCheck.tsx", "utf8")).not.toContain("ホットライン");
  });
  it("ふりかえりチェックは、うれしかったこと・しんどかったことの両方を持ち、診断ではないと明記し、通信も保存もしない", () => {
    const sc = readFileSync("components/SelfCheck.tsx", "utf8");
    expect(sc).toContain("うれしかったこと");
    expect(sc).toContain("しんどかったこと");
    expect(sc).toContain("診断ではありません");
    expect(sc).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|localStorage/);
    expect(readFileSync("components/PrepChecklist.tsx", "utf8")).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon/);
  });
});

describe("特集4：日程の訂正とスマホ対応", () => {
  const b = readFileSync("app/feature/bumon/page.tsx", "utf8");
  it("結果発表は12月2日（水）12:00。12月3日の記述は残っていない", () => {
    expect(b).toContain("12月2日（水）12:00");
    expect(b).not.toContain("12月3日");
  });
  it("ブロック×部門は、スマホの幅に収まる色付きの表で、数字の表は途中で折り返さない", () => {
    expect(b).toContain("<HeatTable />");
    expect(b).toContain("feature-table--dense");
    expect(readFileSync("app/globals.css", "utf8")).toContain(".heat__row");
  });
});

describe("特集1：スマホで数字の途中で折り返さない", () => {
  it("数字だけのセルは、折り返さない設定になっている", () => {
    const src = readFileSync("app/feature/page.tsx", "utf8");
    expect(src).toContain("const NUMERIC =");
    expect(src).toContain('className={NUMERIC.test(c.trim()) ? "nowrap" : undefined}');
  });
});

describe("特集6：応援も、がんばりだった。（応援する側）", () => {
  const o = readFileSync("app/feature/ouen/page.tsx", "utf8");
  it("気持ちの地図・しんどかった声・届いていた声・理由・ふりかえり・届く応援・守る応援・つくる応援・締めがある", () => {
    for (const s of ["応援した7日間、どんな日でしたか", "応援した7日間の、気持ちの地図", "しんどかった声", "推しに、届いていた声", "あなたのせいじゃない、4つの理由", "<SelfCheck", "推しに全票か、広げるか", "「人数」と「票数」は、同じ人が、両方に貢献できます", "届く応援のかたち", "守る応援：やらないこと", "つくる応援", "応援も、がんばりだった", "<FeatureTabs current={6} />"]) expect(o).toContain(s);
    expect(readFileSync("components/FeatureTabs.tsx", "utf8")).toContain('href: "/feature/ouen"');
  });
  it("応援する側の声が少ないことを明記し、個別の投稿・URLは載せない。文例・ホットラインは載せない", () => {
    expect(o).toContain("応援する側の声は、調査で見つかった投稿が、出場者より少なく");
    const voices = o.slice(o.indexOf('id="map"'), o.indexOf('id="shotai"'));
    expect(voices).not.toMatch(/x\.com\/|twitter\.com\/|status\//);
    expect(o).not.toMatch(/CopyBlock|ホットライン|ミスヘブン/);
  });
  it("票のルールは公式FAQ・ヘブンnaviの内容（1日10回、最大50票、持ち越しなし、称号は人数）。12月2日（水）12:00", () => {
    for (const s of ["同じキャストへは、1日10回まで", "最大50票", "持ち越せません", "「投票した人の数」で決まります"]) expect(o).toContain(s);
    expect(o).toContain("12月2日（水）12:00");
    expect(o).not.toContain("12月3日");
  });
  it("「運営者より」と明記し、守る応援・つくる応援の線引き（本人の了承・載せないもの・削除）がある", () => {
    expect(o).toContain("<strong>運営者より</strong>");
    for (const s of ["本人の了承を、取る", "載せないものを、決める", "削除の依頼に、すぐ応じる", "詮索しない", "写真を、勝手に使わない"]) expect(o).toContain(s);
  });
  it("応援者向けのふりかえりチェックは、うれしい・しんどいの両方を、4つずつ持つ", () => {
    const g = o.slice(o.indexOf("good={["), o.indexOf("]}", o.indexOf("good={[")));
    const t = o.slice(o.indexOf("tired={["), o.indexOf("]}", o.indexOf("tired={[")));
    expect((g.match(/"/g) ?? []).length / 2).toBe(4);
    expect((t.match(/"/g) ?? []).length / 2).toBe(4);
  });
});

