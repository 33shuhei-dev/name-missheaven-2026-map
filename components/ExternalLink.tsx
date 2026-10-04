import { displayHost, safeExternalUrl } from "@/lib/links";

/**
 * 外部リンク。安全なURL（http/https）のときだけ描画し、それ以外は何も表示しない。
 * 別タブで開き、参照元情報を渡さない。
 */
export function ExternalLink({ href, label }: { href: string | undefined; label: string }) {
  const url = safeExternalUrl(href);
  if (!url) return null;
  return (
    <a className="ext-link" href={url} target="_blank" rel="noopener noreferrer nofollow ugc">
      <span className="ext-link__label">{label}</span>
      <span className="ext-link__host">{displayHost(url)} ↗</span>
    </a>
  );
}
