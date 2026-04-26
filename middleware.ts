// ============================================
// MIDDLEWARE - i18n Routing & Site Detection
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

// Read site-specific default locale from _sites.json + domain mapping
// This runs at edge, so we use a simple sync lookup
import sitesData from './content/_sites.json';
import domainsData from './content/_site-domains.json';

function normalizeDomain(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .toLowerCase();
}

function getSiteDefaultLocale(host: string): string {
  const normalizedHost = normalizeDomain(host);
  const sites = (sitesData as any).sites || [];
  const domains = (domainsData as any).domains || [];

  // Check domain mapping first
  const domainEntry = domains.find(
    (d: any) => d.enabled && normalizeDomain(String(d.domain || '')) === normalizedHost
  );
  if (domainEntry) {
    const site = sites.find(
      (s: any) => s.id === domainEntry.siteId && s.enabled
    );
    if (site?.defaultLocale) return site.defaultLocale;
  }

  // Environment default site (works for both localhost and production fallback)
  const envSiteId = process.env.NEXT_PUBLIC_DEFAULT_SITE;
  if (envSiteId) {
    const site = sites.find(
      (s: any) => s.id === envSiteId && s.enabled
    );
    if (site?.defaultLocale) return site.defaultLocale;
  }

  // Match host directly against site.domain as a secondary fallback.
  const hostSite = sites.find(
    (s: any) => s.enabled && normalizeDomain(String(s.domain || '')) === normalizedHost
  );
  if (hostSite?.defaultLocale) return hostSite.defaultLocale;

  // Final fallback: first enabled site's default locale.
  const firstEnabledSite = sites.find((s: any) => s.enabled);
  if (firstEnabledSite?.defaultLocale) {
    return firstEnabledSite.defaultLocale;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin routes: require auth cookie (verify in API/routes)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Skip middleware for static files, API routes, and admin
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/apple-icon/') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect to site-specific default locale
  const host = request.headers.get('host') || '';
  const siteLocale = getSiteDefaultLocale(host);
  const newUrl = new URL(`/${siteLocale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded media)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|uploads).*)',
  ],
};
