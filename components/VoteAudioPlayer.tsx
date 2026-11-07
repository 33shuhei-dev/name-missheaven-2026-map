/**
 * トップのステージの中に置く、応援曲「Vote Vote Vote」のリリックビデオ（縦型）。
 * 自動再生はしない（閲覧者が再生ボタンを押したときだけ音が出る）。動画はサイト内の公開ファイルを使う。
 * 非公式・有志制作。
 */
export function VoteAudioPlayer() {
  return (
    <figure className="stage-mv">
      <div className="stage-mv__frame">
        <video
          className="stage-mv__video"
          controls
          playsInline
          preload="none"
          poster="/vote-vote-vote-poster.jpg"
          aria-label="応援曲 VOTE VOTE VOTE の歌詞付きミュージックビデオ"
        >
          <source src="/vote-vote-vote-lyric-mv.mp4" type="video/mp4" />
          お使いのブラウザは動画の再生に対応していません。
        </video>
      </div>
      <figcaption className="stage-mv__caption">
        <strong>VOTE VOTE VOTE</strong>
        <span>LYRIC MV · 3分47秒 · 再生すると音が出ます</span>
        <span>非公式・有志制作（@rego0701）</span>
      </figcaption>
    </figure>
  );
}
