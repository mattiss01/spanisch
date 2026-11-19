// Shared artwork for the app icons (browser favicon + iOS home-screen icon):
// the Spanish civil flag (red / yellow / red in 1:2:1 bands, 3:2 ratio)
// centred on a white background. Rendered by `ImageResponse` from `next/og`.

const RED = '#AA151B';
const YELLOW = '#F1BF00';

export function FlagIcon({ size, rounded }: { size: number; rounded: boolean }) {
  const flagW = Math.round(size * 0.72);
  const flagH = Math.round((flagW * 2) / 3);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        // iOS rounds the home-screen icon itself; the favicon rounds its own corners.
        borderRadius: rounded ? Math.round(size * 0.22) : 0,
      }}
    >
      <div
        style={{
          width: flagW,
          height: flagH,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: Math.max(2, Math.round(size * 0.05)),
          overflow: 'hidden',
          boxShadow: size >= 64 ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        <div style={{ flex: 1, background: RED }} />
        <div style={{ flex: 2, background: YELLOW }} />
        <div style={{ flex: 1, background: RED }} />
      </div>
    </div>
  );
}
