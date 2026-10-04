/**
 * 検索フォーム（JavaScriptなしでも /search へ送信できる通常のGETフォーム）。
 */
export function SearchBox({
  pref,
  placeholder = "部門・出場者・店舗・地域",
  defaultValue,
}: {
  pref?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <form className="search-box" action="/search" method="get" role="search">
      <label className="visually-hidden" htmlFor="search-box-q">
        検索語
      </label>
      <input
        id="search-box-q"
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        enterKeyHint="search"
      />
      {pref && <input type="hidden" name="pref" value={pref} />}
      <button type="submit">検索</button>
    </form>
  );
}
