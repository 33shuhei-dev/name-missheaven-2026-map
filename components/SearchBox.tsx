/**
 * 検索フォーム（JavaScriptなしでも /search へ送信できる通常のGETフォーム）。
 */
export function SearchBox({
  pref,
  placeholder = "推しの名前・店舗・部門・地域",
  defaultValue,
}: {
  pref?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <form className="search-box" action="/search" method="get" role="search">
      <label className="visually-hidden" htmlFor={pref ? `search-box-q-${pref}` : "search-box-q"}>
        検索語
      </label>
      <input
        id={pref ? `search-box-q-${pref}` : "search-box-q"}
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
