import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Playfair_Display } from 'next/font/google';
import { locales, defaultLocale } from '@/lib/i18n';
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

function getLocaleFromPath(): string {
  try {
    const headersList = headers();
    const pathname = headersList.get('x-invoke-path') || headersList.get('x-next-url') || '';
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && locales.includes(firstSegment as any)) {
      return firstSegment;
    }
  } catch {}
  return defaultLocale;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getLocaleFromPath();
  return (
    <html lang={lang} suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
