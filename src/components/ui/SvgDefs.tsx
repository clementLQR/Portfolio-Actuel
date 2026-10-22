/**
 * Filtres SVG partagés par tout le décor, rendus une seule fois dans l'App.
 * - grain-dissolve : le bord adouci d'une forme se « dissout » en points (tramage rétro)
 * - grain-overlay : grain fin incrusté dans une forme pleine
 */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <filter id="grain-dissolve" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {/* Bruit placé dans le canal alpha */}
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.33 0.33 0.33 0 0" result="noiseAlpha" />
          {/* alpha = opacité de la forme − bruit + 0,5, puis seuil net : un tramage */}
          <feComposite in="SourceAlpha" in2="noiseAlpha" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0.5" result="mixed" />
          <feComponentTransfer in="mixed" result="mask">
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>

        <filter id="grain-overlay" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          {/* Grain discret : le bruit n'est appliqué qu'à 30 % */}
          <feComponentTransfer in="mono" result="soft">
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feComposite in="soft" in2="SourceGraphic" operator="in" result="grain" />
          <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
        </filter>
      </defs>
    </svg>
  );
}
