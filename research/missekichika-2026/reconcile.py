"""候補（grokメモの確認済み33人＋自前調査のゆず／要確認11人）と公式一覧を照合し、Excel を作る。
使い方:
  python3 -I reconcile.py OFFICIAL_2026.json OUT.xlsx [確認日]
OFFICIAL_2026.json は official_list.py の出力。2026年の一覧が未公開なら rows が空になり、
その場合は候補だけで Excel を作る（照合は「公式未公開」）。

照合ルール
- 一致は 駅ちかの女の子ID（プロフィールURLの末尾の数字）で取る。IDがない候補は 都道府県＋源氏名＋店名 で取る。
- 確認済みで、公式にいない → 不一致。ただし根拠かプロフィールが開けなかった行は「URL死活」に分ける。
- 要確認11人・ゆず以外の追加候補は、公式にいた場合だけ拾う（人数には公式一覧として入る）。
- 公式にだけいる人 → 公式のみ。
- 1人が複数部門に出ていたら、部門ごとに1行。人数は女の子IDで重複を除いて数える。
"""
import csv, json, re, sys, unicodedata, collections
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

HERE = Path(__file__).parent
CAND = HERE / "candidates"
OFFICIAL, OUT = sys.argv[1], sys.argv[2]
DATE = sys.argv[3] if len(sys.argv) > 3 else "2026-11-06"

AREA_OF = {}
for area, prefs in {
    "北海道・東北": "北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県",
    "関東": "東京都 神奈川県 埼玉県 千葉県 茨城県 栃木県 群馬県",
    "中部": "新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県",
    "関西": "大阪府 京都府 兵庫県 奈良県 和歌山県 滋賀県",
    "中国・四国": "鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県",
    "九州・沖縄": "福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県",
}.items():
    for p in prefs.split(): AREA_OF[p] = area
# 2025年の公式一覧で確かめた対応（三重・山梨は中部）。鳥取・島根は2025年の一覧に該当者がなく未確認。

COLS = ["大会段階", "大会エリア", "都道府県", "公開名（源氏名）", "所属店舗", "部門",
        "公式プロフィールURL", "出場根拠URL", "確認日", "確認状況", "照合", "根拠の投稿日時", "根拠メモ", "出典"]


def norm(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = re.sub(r"[【\[(（].*?[】\])）]", "", s)
    return re.sub(r"[\s・･◆☆★♡♥〜~\-－]", "", s).lower()


def gid(url):
    m = re.search(r"/(\d+)/?$", (url or "").split("#")[0])
    return m.group(1) if m else None


def load(csvname, checkname, source, counted):
    rows = list(csv.DictReader(open(CAND / csvname, encoding="utf-8")))
    checks = json.load(open(CAND / checkname, encoding="utf-8"))
    out = []
    for r, c in zip(rows, checks):
        assert c["row"]["公開名"] == r["公開名"], (csvname, r["公開名"])
        prof = r.get("駅ちかプロフィールURL") or ""
        ev = r.get("出場根拠の投稿URL") or r.get("投稿URL") or ""
        alive = (not prof or c["profile"].get("status") == 200) and c["diary"].get("found") is True
        out.append(dict(pref=r["都道府県"], name=r["公開名"], shop=r["所属店舗"], division=r.get("出場部門") or "",
                        profile=prof, evidence=ev, posted=r.get("投稿日時") or "", memo=r.get("根拠メモ") or "",
                        id=gid(prof), source=source, counted=counted, alive=alive,
                        check_note=f'プロフィール {c["profile"].get("status")}／日記 '
                                   f'{"確認" if c["diary"].get("found") else "見つからず"}'
                                   f'{"（一覧 page" + str(c["diary"].get("page")) + "）" if c["diary"].get("page") else ""}'))
    return out


cands = (load("grok_confirmed_2026-11-06.csv", "grok_confirmed_check.json", "grokメモ（確認済み）", True)
         + load("own_2026-11-06.csv", "own_check.json", "自前調査", True)
         + load("grok_pending_2026-11-06.csv", "grok_pending_check.json", "grokメモ（要確認）", False))
# 自前調査で根拠を確かめた補足
for c in cands:
    if c["name"] == "ふうか":
        c["memo"] += "／部門の日記を再確認: 2026-10-29 20:01「駅チカ総選挙 エントリー中 メンズエステ部門に参加してますっ」"
    if c["name"] == "ふみ":
        c["memo"] += "／本文に大会名なし。『11/11～投票開始』は駅ちかの日程（ミスヘブンの予選は11/3で終了）"
    if c["name"] == "める":
        c["memo"] += "／駅ちかのプロフィールは未特定（駅ちか掲載店か未確認）"

off = json.load(open(OFFICIAL, encoding="utf-8"))
orows = off.get("rows", []) if off.get("year") == "2026" else []
published = bool(orows)

by_id = collections.defaultdict(list)
by_key = collections.defaultdict(list)
for o in orows:
    by_id[o["girl_id"]].append(o)
    by_key[(o.get("pref"), norm(o.get("name")), norm(o.get("shop")))].append(o)

matched_ids = set()
recon = []
for c in cands:
    hits = by_id.get(c["id"], []) if c["id"] else by_key.get((c["pref"], norm(c["name"]), norm(c["shop"])), [])
    if not published: res = "公式未公開"
    elif hits: res = "一致"; matched_ids.update(h["girl_id"] for h in hits)
    elif not c["counted"]: res = "公式に不在（数えない）"
    elif not c["alive"]: res = "URL死活"
    else: res = "不一致"
    c["result"], c["hits"] = res, hits
    recon.append(c)

entr = []  # 出場者シート: 1人×部門で1行
for o in orows:
    c = next((c for c in cands if c["hits"] and o in c["hits"]), None)
    entr.append(["地方予選", o["area"], o.get("pref"), o.get("name"), o.get("shop"), o["category"],
                 o["girl_url"], o["list_url"], DATE, "公式一覧",
                 "一致（候補あり）" if c else "公式のみ", c["posted"] if c else "", c["memo"] if c else "", "公式一覧"])
for c in cands:
    if c["counted"] and not c["hits"]:
        entr.append(["地方予選", AREA_OF.get(c["pref"], ""), c["pref"], c["name"], c["shop"],
                     c["division"] or "公開根拠未確認", c["profile"], c["evidence"], DATE,
                     "本人・店舗の公開告知" if c["alive"] else "要確認", c["result"], c["posted"],
                     f'{c["memo"]}（{c["check_note"]}）', c["source"]])
entr.sort(key=lambda r: (list(AREA_OF.values()).index(r[1]) if r[1] in AREA_OF.values() else 99,
                         list(AREA_OF).index(r[2]) if r[2] in AREA_OF else 99, r[4] or "", r[3] or ""))


def person_key(r):
    i = gid(r[6])
    return i or (r[2], norm(r[3]), norm(r[4]))


people = {}
for r in entr: people.setdefault(person_key(r), r)
cnt_area = collections.Counter(r[1] for r in people.values())
cnt_pref = collections.Counter((r[1], r[2]) for r in people.values())
cnt_status = collections.Counter(r[9] for r in people.values())


def sheet(ws, header, rows, widths):
    ws.append(header)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="B0122B")
        c.alignment = Alignment(wrap_text=True, vertical="center")
    for r in rows: ws.append(r)
    for i, w in enumerate(widths): ws.column_dimensions[chr(65 + i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "A2"; ws.auto_filter.ref = ws.dimensions


wb = Workbook()
ws = wb.active; ws.title = "出場者"
sheet(ws, COLS, entr, [9, 11, 9, 14, 26, 14, 40, 44, 11, 16, 12, 16, 60, 14])
dv = DataValidation(type="list", formula1='"公式一覧,本人・店舗の公開告知,要確認"', allow_blank=True)
ws.add_data_validation(dv); dv.add("J2:J20000")

s = wb.create_sheet("集計")
s.append(["確認日", DATE]); s.append(["公式一覧（2026）", "公開済み" if published else "未公開（候補のみで作成）"])
s.append(["重複を除いた人数", len(people)])
for k in ("公式一覧", "本人・店舗の公開告知", "要確認"): s.append([f"　うち {k}", cnt_status.get(k, 0)])
s.append(["行数（人×部門）", len(entr)]); s.append([])
s.append(["大会エリア", "人数"])
for a in dict.fromkeys(AREA_OF.values()): s.append([a, cnt_area.get(a, 0)])
s.append([]); s.append(["大会エリア", "都道府県", "人数"])
for p, a in AREA_OF.items():
    if cnt_pref.get((a, p)): s.append([a, p, cnt_pref[(a, p)]])
s.append([]); s.append(["0人の都道府県", "、".join(p for p, a in AREA_OF.items() if not cnt_pref.get((a, p)))])
s.column_dimensions["A"].width = 22; s.column_dimensions["B"].width = 60

rc = collections.Counter(c["result"] for c in recon if c["counted"])
r2 = wb.create_sheet("照合結果")
sheet(r2, ["照合", "数える", "都道府県", "公開名", "所属店舗", "候補の部門", "公式の部門", "プロフィールURL", "根拠URL", "確認", "出典"],
      [[c["result"], "○" if c["counted"] else "×", c["pref"], c["name"], c["shop"], c["division"],
        "、".join(h["category"] for h in c["hits"]), c["profile"], c["evidence"], c["check_note"], c["source"]] for c in recon],
      [16, 6, 9, 14, 26, 12, 14, 40, 44, 26, 16])
r2.append([]); r2.append(["確認済み候補の照合内訳"] + [f"{k}: {v}" for k, v in rc.items()])
r2.append(["公式のみ（候補なし）", sum(1 for o in orows if o["girl_id"] not in matched_ids)])

pend = wb.create_sheet("要確認（数えない）")
sheet(pend, ["都道府県", "公開名", "所属店舗", "投稿URL", "投稿日時", "プロフィールURL", "根拠メモ", "再確認"],
      [[c["pref"], c["name"], c["shop"], c["evidence"], c["posted"], c["profile"], c["memo"], c["check_note"]]
       for c in cands if not c["counted"]], [9, 14, 26, 44, 16, 40, 50, 26])

fin = wb.create_sheet("決勝進出者")
sheet(fin, COLS, [], [9, 11, 9, 14, 26, 14, 40, 44, 11, 16, 12, 16, 60, 14])
fin.append(["（予選結果発表は 2026-11-27 12:00。確認日時点では対象者なし）"])

st = wb.create_sheet("店舗単位")
sheet(st, ["大会エリア", "都道府県", "所属店舗", "公表された参加人数", "根拠URL", "確認日", "備考"],
      [["（確認日時点で、参加人数だけを公表した店舗告知は見つかっていない）"]], [12, 10, 30, 14, 50, 12, 60])

op = wb.create_sheet("公式公開状況")
sheet(op, ["エリア", "部門", "URL", "HTTP", "ページタイトル", "2026公開", "件数"],
      [[p["area"], p["category"], p["url"], p["status"], p["title"], "○" if p["year_ok"] else "×", p["items"]]
       for p in off.get("pages", [])], [12, 14, 52, 6, 50, 8, 6])
op.append([]); op.append(["特設トップ https://ranking-deli.jp/missekichika/ は開幕前の告知のみ（確認日時点）。"
                          "店舗一覧は 2025年が /missekichika/2025/list/{area}/（参加店舗 約1,270）。2026年版は開幕後に確認"])

q = wb.create_sheet("予選通過枠（参考）")
sheet(q, ["エリア", "風俗 通過人数", "内訳", "メンズエステ 通過人数"],
      [["北海道・東北", 240, "8部門×30名", 75], ["関東", 400, "8部門×50名", 100], ["中部", 320, "8部門×40名", 100],
       ["関西", 360, "8部門×45名", 150], ["中国・四国", 240, "8部門×30名", 75], ["九州・沖縄", 400, "8部門×50名", 300],
       ["合計", 1960, "", 800]], [14, 14, 16, 20])
q.append(["出典: https://reiz.media/ekichika/MISSEKICHIKA2026.pdf p.3（全国決勝に進む人数。地方予選の出場者数ではない）"])

rs = wb.create_sheet("再開手順")
sheet(rs, ["いつ", "コマンド／どこを見る", "やること"], [
    ["2026-11-11（水）12:00以降", "python3 -I official_list.py off2026.json cache  →  python3 -I reconcile.py off2026.json 出力.xlsx 確認日",
     "54ページ（6エリア×風俗8部門＋メンズエステ）の title に 2026 が入ったら取得。件数・ページ送りを確認し、照合結果シートで 一致／不一致／URL死活／公式のみ を見る"],
    ["2026-11-11以降", "https://ranking-deli.jp/missekichika/list/ と /list/{area}/", "2026年の参加店舗一覧が出たら、店舗単位の記録に使う"],
    ["2026-11-27（金）12:00以降", "同じ54ページ（予選結果）", "決勝進出者を「決勝進出者」シートに分けて記録する"],
], [24, 70, 70])
wb.save(OUT)
print(f"公式2026: {'公開' if published else '未公開'} / 重複を除いた人数 {len(people)} / {dict(cnt_status)} / 照合 {dict(rc)}")
print("エリア別", dict(cnt_area))
