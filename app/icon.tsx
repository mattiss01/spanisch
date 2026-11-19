import { ImageResponse } from 'next/og';
import { FanIcon } from '@/lib/app-icon';

// Browser-tab favicon (also used by Android / desktop shortcuts).
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<FanIcon size={size.width} rounded />, { ...size });
}
