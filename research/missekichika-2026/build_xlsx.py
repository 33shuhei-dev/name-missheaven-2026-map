"""ミス駅ちか総選挙2026 地方予選 出場者調査 (確認日 2026-11-06) の Excel を作る。
使い方: python3 research/missekichika-2026/build_xlsx.py
"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).with_name("missekichika2026_entrants_2026-11-06.xlsx")
D = "2026-11-06"
COLS = ["大会段階", "大会エリア", "都道府県", "公開名（源氏名）", "所属店舗", "部門",
        "公式プロフィールURL", "出場根拠URL", "確認日", "確認状況", "備考"]

entrants = [
    ["地方予選", "関東", "神奈川県", "ゆず", "abc NEO（厚木・デリヘル／駅ちか店舗ID 970）",
     "公開根拠未確認",
     "https://ranking-deli.jp/kanagawa/area44/style2/970/3300004/",
     "https://ranking-deli.jp/kanagawa/area44/style2/970/3300004/maildiary/page2/",
     D, "本人・店舗の公開告知",
     "駅ちか掲載の本人写メ日記 2026/10/23 15:07「次回18時〜20時30分」に"
     "「今年ね！ミス駅♡か🚉✨️でることになった！いまさっき、きまった！…本命はミスヘブンで💜」。"
     "日記の個別URLはなく、一覧ページ（2026-11-06時点でpage2）に掲載。新しい日記が増えるとpage3以降に移る。"
     "部門の記載はない。ほかの『総選挙』の日記（11/2〜11/3の『地方予選ラストDay』『全国戦も確定』など）は"
     "ミスヘブン総選挙についてのもので、駅ちかの根拠には使っていない。"
     "大会エリアは、神奈川県が関東エリアに入ることから付けた。"],
]

stores = [  # 店舗単位（参加人数だけの告知など）。氏名確認人数には加えない
]

status_rows = [
    ["公式特設ページ", "https://ranking-deli.jp/missekichika/", "開幕前の告知のみ（『まもなく開幕』）。出場者一覧・エリア別・部門別・店舗別の入口はない", D],
    ["エリア別ページ（6）", "https://ranking-deli.jp/missekichika/{hokkaido_tohoku,kanto,chubu,kansai,chugoku_shikoku,kyushu_okinawa}/",
     "HTTP 200 だが中身は『2025 エリア決勝』のまま。2026年の一覧は未公開", D],
    ["部門別ページ（9）", "https://ranking-deli.jp/missekichika/category{1,2,3,4,6,7,8,9}/ と /menesth/",
     "中身は2025年のまま（category5 は 404）。対応: 1デリヘル 2ヘルス/ソープ 3人妻/熟女 4お姉さん 6ロリ 7おっぱい 8風俗エステ 9ギャル/キレカワ、menesth＝メンズエステ", D],
    ["エリア×部門", "https://ranking-deli.jp/missekichika/kanto/category1/ など", "中身は2025年のまま", D],
    ["/missekichika/list/", "https://ranking-deli.jp/missekichika/list/", "2023年の『全国おすすめ店』。今回は使わない", D],
    ["/missekichika/2026/", "https://ranking-deli.jp/missekichika/2026/", "404", D],
    ["女の子ページの参加表示", "https://ranking-deli.jp/kanagawa/area44/style2/970/3300004/", "2026年の総選挙のバッジ・投票ボタンはまだない（ゆずのページで確認）", D],
    ["写メ日記の全国検索", "https://ranking-deli.jp/kanagawa/maildiary/", "都道府県ごとの一覧はタグ絞り込みだけで、本文を検索できない。『総選挙』のタグもない", D],
    ["一般のWeb検索", "-", "2026年の本人・店舗の告知はほとんど検索に出てこない（日記やXの投稿は検索の対象になっていない）", D],
]

quota = [  # 公式資料 p.3「各エリアの予選通過人数」
    ["北海道・東北", 240, "8部門×30名", 75], ["関東", 400, "8部門×50名", 100],
    ["中部", 320, "8部門×40名", 100], ["関西", 360, "8部門×45名", 150],
    ["中国・四国", 240, "8部門×30名", 75], ["九州・沖縄", 400, "8部門×50名", 300],
]

resume = [
    ["2026-11-11（水）12:00以降", "https://ranking-deli.jp/missekichika/ と 6エリア×9部門のページ（上の『公式公開状況』のURL）",
     "地方予選の開幕。出場者一覧が出たら、表示件数・ページ送りを最後まで確かめ、件数を数えて照合する。"
     "女の子ページの投票ボタンと部門表示も確かめる。ゆずの部門はここで決める"],
    ["2026-11-11〜11-25", "各店舗の /news/ と女の子ページの /maildiary/",
     "店舗告知（『◯名エントリー』など）は『店舗単位』シートに入れる。氏名が分かった人数には加えない"],
    ["2026-11-27（金）12:00以降", "同じエリア・部門のページ",
     "予選の結果発表。決勝に進んだ人は『決勝進出者』シートに分けて記録する（目安は風俗1,960名＋メンズエステ800名）"],
]


def sheet(ws, header, rows, widths):
    ws.append(header)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="B0122B")
        c.alignment = Alignment(wrap_text=True, vertical="center")
    for r in rows:
        ws.append(r)
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "A2"


wb = Workbook()
ws = wb.active
ws.title = "出場者"
sheet(ws, COLS, entrants, [10, 12, 10, 16, 28, 16, 44, 44, 12, 18, 80])
dv = DataValidation(type="list", formula1='"公式一覧,本人・店舗の公開告知,要確認"', allow_blank=True)
ws.add_data_validation(dv); dv.add("J2:J5000")

sheet(wb.create_sheet("決勝進出者"), COLS, [], [10, 12, 10, 16, 28, 16, 44, 44, 12, 18, 60])
wb["決勝進出者"].append(["（予選結果発表は 2026-11-27 12:00。確認日時点では対象者なし）"])

sheet(wb.create_sheet("店舗単位"),
      ["大会エリア", "都道府県", "所属店舗", "公表された参加人数", "根拠URL", "確認日", "備考"],
      stores or [["（確認日時点で、参加人数だけを公表した店舗告知は見つかっていない）"]],
      [12, 10, 30, 14, 50, 12, 60])

sheet(wb.create_sheet("公式公開状況"), ["対象", "URL", "状態", "確認日"], status_rows, [22, 60, 80, 12])

q = wb.create_sheet("予選通過枠（参考）")
sheet(q, ["エリア", "風俗 通過人数", "内訳", "メンズエステ 通過人数"], quota, [14, 14, 16, 20])
q.append(["合計", 1960, "", 800])
q.append(["出典: https://reiz.media/ekichika/MISSEKICHIKA2026.pdf p.3（全国決勝に進む人数。地方予選の出場者数ではない。地方予選の出場者総数を公式が出した資料は、確認日時点で見つかっていない）"])

sheet(wb.create_sheet("再開手順"), ["いつ", "どこを見る", "やること"], resume, [24, 60, 80])
wb.save(OUT)
print(OUT)
