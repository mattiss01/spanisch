import { ImageResponse } from 'next/og';
import { FlagIcon } from '@/lib/flag-icon';

// Home-screen icon for iOS ("Add to Home Screen").
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<FlagIcon size={size.width} rounded={false} />, { ...size });
}
