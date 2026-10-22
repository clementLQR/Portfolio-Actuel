import "./Logo.scss";

/** Tête de la mascotte stylisée, en SVG simple */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="logo">
      <defs>
        <linearGradient id="logo-ear-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="logo__stop-warm" />
          <stop offset="1" className="logo__stop-detail" />
        </linearGradient>
        <linearGradient id="logo-ear-r" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="logo__stop-detail" />
          <stop offset="1" className="logo__stop-violet" />
        </linearGradient>
      </defs>
      <ellipse cx="9" cy="33" rx="7" ry="10" fill="url(#logo-ear-l)" />
      <ellipse cx="55" cy="33" rx="7" ry="10" fill="url(#logo-ear-r)" />
      <circle cx="32" cy="32" r="23" className="logo__shell" />
      <rect x="14.5" y="20.5" width="35" height="23" rx="11.5" className="logo__visor" />
      <ellipse cx="25.5" cy="32" rx="3.4" ry="5" className="logo__eye-warm" />
      <ellipse cx="38.5" cy="32" rx="3.4" ry="5" className="logo__eye" />
    </svg>
  );
}
