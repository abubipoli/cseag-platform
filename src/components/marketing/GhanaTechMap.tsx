// A Ghana silhouette filled with a glowing circuit-board pattern — original
// artwork, not a stock image. The outline traces Ghana's real border
// (public-domain boundary coordinates, not anyone's creative work); the
// circuit traces, nodes, and chips inside it are hand-authored SVG.
const GHANA_PATH =
  "M258.27,310.17 L164.20,345.29 L130.84,365.87 L76.78,383.27 L23.29,366.23 L26.02,342.56 L0.00,290.87 L15.65,223.12 L40.93,172.72 L25.01,87.35 L16.83,42.18 L18.24,8.14 L122.46,5.31 L148.97,9.68 L168.34,0.00 L196.09,4.78 L191.68,23.49 L216.72,54.43 L216.62,98.00 L222.33,145.27 L237.38,167.15 L224.12,221.20 L228.89,251.04 L244.88,289.10 L258.27,310.17 Z";

const TRACES = [
  "132,154 154,154 154,198 154,220",
  "176,110 242,110",
  "0,176 0,132 0,110",
  "22,308 0,308 0,330",
  "132,88 132,110 88,110",
  "66,88 132,88",
  "220,22 220,0 220,44",
  "0,264 0,198 44,198",
  "88,198 110,198 110,242",
  "154,352 154,308 154,242 88,242",
  "110,286 132,286",
  "154,66 154,22",
  "66,286 66,220",
  "198,330 154,330",
  "0,242 0,220",
  "22,198 22,154",
  "154,132 132,132 176,132",
  "44,110 44,44",
  "22,242 22,220",
  "132,66 132,132 88,132",
  "198,176 154,176 88,176 88,220",
  "110,308 88,308 88,352 154,352",
  "132,308 88,308 22,308 0,308",
  "198,44 198,66 258,66",
  "110,264 110,242",
  "66,154 132,154 132,198",
];

const NODES: [number, number][] = [
  [132, 154], [154, 220], [176, 110], [242, 110], [0, 176], [0, 110], [22, 308], [0, 330],
  [132, 88], [88, 110], [66, 88], [220, 22], [220, 44], [0, 264], [44, 198], [88, 198],
  [110, 242], [154, 352], [88, 242], [110, 286], [132, 286], [154, 66], [66, 286], [198, 330],
  [154, 330], [0, 242], [22, 198], [22, 154], [154, 132], [176, 132], [44, 110], [44, 44],
  [22, 242], [22, 220], [132, 66], [88, 132], [198, 176], [88, 220], [110, 308], [132, 308],
  [0, 308], [198, 44], [258, 66], [110, 264], [66, 154], [132, 198],
];

const CHIPS: [number, number, number, number][] = [
  [88, 154, 22, 13.2],
  [88, 110, 22, 13.2],
  [22, 176, 22, 13.2],
  [110, 198, 22, 13.2],
];

export function GhanaTechMap({ className }: { className?: string }) {
  return (
    <svg viewBox="-20 -20 300 425" className={className} role="img" aria-label="Map of Ghana rendered as a glowing circuit board">
      <defs>
        <clipPath id="ghana-shape">
          <path d={GHANA_PATH} />
        </clipPath>
        <radialGradient id="ghana-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <filter id="ghana-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect x="-20" y="-20" width="300" height="425" fill="#05060a" />
      <circle cx="130" cy="180" r="220" fill="url(#ghana-glow)" />

      <g clipPath="url(#ghana-shape)">
        <rect x="-20" y="-20" width="300" height="425" fill="#0a0c12" />
        <g stroke="#38bdf8" strokeWidth="4" fill="none" opacity="0.35" filter="url(#ghana-blur)">
          {TRACES.map((points, i) => (
            <polyline key={`glow-${i}`} points={points} />
          ))}
        </g>
        <g stroke="#38bdf8" strokeWidth="1.4" fill="none" opacity="0.85">
          {TRACES.map((points, i) => (
            <polyline key={`line-${i}`} points={points} />
          ))}
        </g>
        {CHIPS.map(([x, y, w, h], i) => (
          <rect key={`chip-${i}`} x={x} y={y} width={w} height={h} rx="1.5" fill="none" stroke="#6ee7ae" strokeWidth="1.2" opacity="0.9" />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={`node-${i}`} cx={x} cy={y} r={i % 5 === 0 ? 3 : 1.8} fill="#6ee7ae" opacity="0.9" />
        ))}
      </g>

      <path d={GHANA_PATH} fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
