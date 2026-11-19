// Shared artwork for the app icons (browser favicon + iOS home-screen icon):
// a Spanish hand fan (abanico) with alternating red / yellow pleats and a
// wooden handle on a pale yellow background. Rendered by `ImageResponse`
// from `next/og`, drawn in a 100×100 SVG coordinate space.

const RED = '#AA151B';
const YELLOW = '#E0B000';
const WOOD = '#6B4423';
const BACKGROUND = '#FDF3D2';

// Fan pivot and radius; the pleats span the upper half-circle (180° → 360°).
const CX = 50;
const CY = 63;
const R = 40;
const PLEATS = 6;

function point(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return `${(CX + R * Math.cos(rad)).toFixed(2)} ${(CY + R * Math.sin(rad)).toFixed(2)}`;
}

const pleats = Array.from({ length: PLEATS }, (_, i) => {
  const from = 180 + (180 / PLEATS) * i;
  const to = from + 180 / PLEATS;
  return {
    d: `M${CX} ${CY} L${point(from)} A${R} ${R} 0 0 1 ${point(to)} Z`,
    fill: i % 2 === 0 ? RED : YELLOW,
  };
});

export function FanIcon({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: BACKGROUND,
        // iOS rounds the home-screen icon itself; the favicon rounds its own corners.
        borderRadius: rounded ? Math.round(size * 0.22) : 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        {pleats.map((p) => (
          <path key={p.d} d={p.d} fill={p.fill} />
        ))}
        <rect x="45" y="61" width="10" height="16" rx="3" fill={WOOD} />
      </svg>
    </div>
  );
}
