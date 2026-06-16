import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Spanisch Lernen',
  description: 'Interaktive Spanisch-Lernplattform für B1/B2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
