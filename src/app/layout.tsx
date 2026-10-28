import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rajyash Foundation — Feed Forward',
  description: 'Connecting restaurants with surplus food to families in need across Ahmedabad.',
  openGraph: {
    title: 'Rajyash Foundation — Feed Forward',
    description: 'Every meal saved is a life touched.',
    siteName: 'Rajyash Foundation',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
