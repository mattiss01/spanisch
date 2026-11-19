import { ImageResponse } from 'next/og';
import { FlagIcon } from '@/lib/flag-icon';

// Browser-tab favicon (also used by Android / desktop shortcuts).
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<FlagIcon size={size.width} rounded />, { ...size });
}
