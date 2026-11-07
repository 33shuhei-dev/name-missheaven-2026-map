/** 応援曲「Vote Vote Vote」のリリックビデオ（非公式・有志制作）。自動再生はしない。 */
export function AnthemVideo() {
  return (
    <section className="section anthem card" aria-labelledby="anthem-heading">
      <h2 id="anthem-heading">応援曲「Vote Vote Vote」リリックビデオ</h2>
      <video
        className="anthem__video"
        controls
        playsInline
        preload="none"
        poster="/vote-vote-vote-poster.jpg"
      >
        <source src="/vote-vote-vote-lyric-mv.mp4" type="video/mp4" />
        お使いのブラウザは動画の再生に対応していません。
      </video>
      <p className="hint hint--tight">
        ミスヘブン総選挙2026の応援曲を、歌詞だけで見せる縦型の動画です（3分47秒・音が出ます）。非公式・有志制作（@rego0701）。
      </p>
    </section>
  );
}
