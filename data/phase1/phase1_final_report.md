# Phase1最終調査結果

|指標|開始|終了|差分|
|---|---:|---:|---:|
|recordCount|146|147|+1|
|uniqueCategoryOriginalCount|98|99|+1|
|prefectureUnknown|50|38|-12|
|listingAreaUnknown|41|37|-4|
|confirmedCount|31|31|+0|
|probableCount|39|42|+3|
|unverifiedCount|76|74|-2|
|prefecturesWithDivisionCandidates|15|21|+6|
|prefecturesWithConfirmed|7|7|+0|
|searchedNoEvidencePrefectures|32|26|-6|
|confirmedListingAreaCount|27|34|+7|
|weakDivisionSourceCount|68|69|+1|
|formalElectionConnections|0|0|+0|

## 調査と改善

保存済みPhase1.5 ZIPと添付reportの内容を照合して開始。既存全146観測・98原文部門を引き継ぎ、共通申込40件、県不明店舗群、本人日記・求人本文、公式導線を調査。部門0件の32県には都市・繁華街・店舗・一次掲載site検索という別経路を追加した。参加告知だけ、過去年の受賞だけのページを2026部門データへ混入させなかった。検索結果の県横断混在も証拠とは扱わなかった。

ナース2観測の掲載地域を解決しprobableに改善。熊本店の日記で部門原文を一次確認したが部門名は福岡県を冠しており、正式関係未確認を残してprobable。店舗住所・掲載地理の確証と部門確認を分離した。検索索引だけの県接続は候補に限定。原文違いの癒し部門／癒し系部門は統合しなかった。

## 最終カバレッジ

Counter({'searched_no_evidence': 26, 'candidate': 14, 'confirmed': 7})。県不明観測は地図へ配賦せず別枠に保持。地図の候補県数増加には既存候補の県接続も含み、confirmedの増加を意味しない。全47県で状態を表示できる。

## 残課題と終了理由

申込留保、原本文403、略称店舗、正式選挙区は残る。probable→confirmedは0件。これは調査を省略した結果ではなく、同一申込の留保・動的ノミネート・一次本文取得限界を確認した結果である。高レバレッジ群と県不明逆引き、0件32県の追加探索、公式導線検証、全成果物検証を終えたためPhase1を終了する。全国Web調査の反復ではなく、この版を固定してサイトv1制作を推奨する。今後は公開された具体的新情報に基づく差分更新。
