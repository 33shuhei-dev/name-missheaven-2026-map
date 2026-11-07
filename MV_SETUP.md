# MV（動画）について

応援曲「Vote Vote Vote」のリリックビデオは、サイト内の公開ファイルを使います（外部URLの設定は不要です）。

- 動画：`public/vote-vote-vote-lyric-mv.mp4`（縦型 720x1280・約34MB）
- ポスター画像：`public/vote-vote-vote-poster.jpg`
- 表示：トップのステージの中（`components/VoteAudioPlayer.tsx`）。自動再生はしない。`preload="none"`。
- 差し替えるときは、同じファイル名で `public/` に置き換える。
