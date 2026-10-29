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
  metadataBase: new URL('https://rajyash.vercel.app'),
  title: 'Rajyash Foundation — Feed Forward',
  description: 'Connecting restaurants with surplus food to families in need across Ahmedabad. 3,65,000+ meals rescued.',
  openGraph: {
    title: 'Rajyash Foundation — Feed Forward',
    description: 'Every meal saved is a life touched. Join us in rescuing surplus food across Ahmedabad.',
    siteName: 'Rajyash Foundation',
    url: 'https://rajyash.vercel.app',
    type: 'website',
    images: [{ url: '/hero-bg.jpg', width: 1200, height: 630, alt: 'Rajyash Foundation — Feed Forward' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rajyash Foundation — Feed Forward',
    description: 'Every meal saved is a life touched.',
    images: ['/hero-bg.jpg'],
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
