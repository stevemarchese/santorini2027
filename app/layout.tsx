import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Santorini 2027',
  description: 'Join us in Santorini — July 2027',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden bg-navy">{children}</body>
    </html>
  );
}
