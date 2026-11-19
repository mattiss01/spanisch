import { ImageResponse } from 'next/og';

// Home-screen icon for iOS ("Add to Home Screen"): the Spanish flag
// (civil version, no coat of arms) — red / yellow / red in 1:2:1 bands.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const RED = '#AA151B';
const YELLOW = '#F1BF00';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, background: RED }} />
        <div style={{ flex: 2, background: YELLOW }} />
        <div style={{ flex: 1, background: RED }} />
      </div>
    ),
    { ...size },
  );
}
