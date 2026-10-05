# Claude Codeへの実装引き継ぎ

サイトv1は非公式の観測データ探索サイト。全国公式構造・全出場者の完全一覧と表現しない。

## ファイルの用途

- nationwide_dataset_v1.json: envelope.recordsが全観測。県不明も削除せず「地域未判明」で探索。
- nationwide_dataset_confirmed_v1.json: confirmedだけの安全な初期フィルタ。
- map_47prefectures_v1.json: envelope.prefecturesはJIS順の47県。県コードは2桁文字列。
- sources_v1.json: URL別の役割・対象ID・取得状況。転載を独立証拠に数えない。
- coverage CSV/構造MD/未解決MD/ログ/検証: 管理者向け。元Phase1.5は変更していない。

## 主なフィールド

|field|定義|
|---|---|
|id|安定した観測ID。既存146件のIDは維持|
|prefecture|掲載店舗・地域と部門観測を接続する県。弱い県候補はfieldConfidenceを必ず参照|
|listingArea|情報源に書かれた掲載・営業地域。県別UIの地域階層に利用できる|
|area|既存互換用。v1ではlistingAreaと同値|
|formalElectionArea|正式選挙エリア。未確認はnull。本版全件null|
|storePrefecture / storeCity|住所または店舗地域の情報。選挙区を生成しない|
|categoryOriginal|掲載原文。句読点・表記差も維持|
|categoryNormalized|検索補助のみ。原文を上書きしない|
|storeName / entrantName / entrantNames|自然に判明した店舗・人物。nullを補完しない|
|sourceUrl / regionSourceUrl|部門と地域の根拠を別々に追跡|
|sourceType|official/store/entrant_diary/entrant_social/other|
|confidence|この観測の地域×部門接続の総合判定|
|categoryConfidence / regionConfidence / fieldConfidence|個別の事実の強度。総合confidenceと同一とは限らない|
|checkedAt|その観測の確認日時。新旧混在。サイト公開日ではない|
|phase1FinalEvidence|今回確認した情報源、役割、本文／索引／転載の区別|
|isNewDiscovery|旧調査の意味を保持。今回差分はisNewSincePhase15|

## confidenceと地図status

confirmed: 一次性の高い根拠で掲載県・地域と2026部門の関係を確認。正式選挙エリアの証明とは別。
probable: 有力候補。申込一覧の正式ノミネート留保や関係不一致などを明示。
unverified: 元本文、年度、地域関係等が不足。検索索引・転載だけをconfirmedにしない。

地図statusはconfirmed（県にconfirmed観測あり）、candidate（probable/unverifiedのみ）、searched_no_evidence（調査済みだが部門未発見）。最後は不存在ではない。

## UI要件

都道府県→掲載地域→部門→店舗→人物を、存在する範囲だけ表示。47県は常に地図に出す。0件県は「調査済み・現在未発見」。候補を表示するときはprobable/unverifiedの状態バッジと根拠・留保を付け、confirmedと同じ断定表現にしない。県不明は別の一覧へ。nullは未判明として表示し空文字や推測地名に置換しない。

mapのrecordCountは観測数、divisionCountは県内原文のdistinct数で出場者総数ではない。storeCountは原文店舗名のdistinct数、entrantCountは店舗名×人物名のdistinct数（実人物の完全重複排除ではない）。複数部門の同一人物は店舗名×人物名でまとめて表示可能だが同姓同名の別人を自動統合しない。

listingAreasには弱い地域候補もある。各レコードのfieldConfidenceとnotesを併記する。部門名中の地名を県へ配賦しない。店舗住所からformalElectionAreaを作らない。絵文字・装飾・似た部門名を自動統合しない。出典の全文・画像を複製せずリンクと必要最小限の事実を表示する。

Phase1データを初期版として固定し、次は全国地図・検索・状態フィルタ・出典表示を実装する。今後は具体的な新情報や修正依頼に基づく差分更新とする。

