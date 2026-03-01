import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Multi-Site Business Template',
  description: 'Multi-site, multi-language template with booking and admin CMS',
  icons: {
    icon: '/icon',
    shortcut: '/icon',
    apple: '/icon',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
