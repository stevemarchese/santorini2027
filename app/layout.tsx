import type { Metadata } from 'next';
import { GeistSans } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://santorini2027.com'),
  title: 'Santorini 2027',
  description: 'Join us in Santorini — July 2027',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="overflow-hidden bg-navy">{children}</body>
    </html>
  );
}
