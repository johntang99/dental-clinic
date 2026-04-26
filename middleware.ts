// ============================================
// MIDDLEWARE - i18n Routing & Site Detection
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

// Read site-specific default locale from _sites.json + domain mapping
// This runs at edge, so we use a simple sync lookup
import sitesData from './content/_sites.json';
import domainsData from './content/_site-domains.json';

type RuntimeEnv = 'dev' | 'staging' | 'prod';

const localeCache = new Map<string, { locale: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function getRuntimeEnv(): RuntimeEnv {
  const runtime = (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || '').toLowerCase();
  if (runtime === 'staging') return 'staging';
  if (runtime === 'prod' || runtime === 'production') return 'prod';
  return 'dev';
}

function resolveSupabaseUrl() {
  const env = getRuntimeEnv();
  if (env === 'staging') {
    return (
      process.env.SUPABASE_STAGING_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  }
  if (env === 'prod') {
    return (
      process.env.SUPABASE_PROD_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_PROD_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  }
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function resolveServiceRoleKey() {
  const env = getRuntimeEnv();
  if (env === 'staging') {
    return process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (env === 'prod') {
    return process.env.SUPABASE_PROD_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function parseDefaultLocale(payload: unknown): string | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const row = payload[0] as { default_locale?: string };
  return typeof row?.default_locale === 'string' ? row.default_locale : null;
}

async function fetchSiteLocaleById(
  supabaseUrl: string,
  serviceRoleKey: string,
  siteId: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&id=eq.${encodeURIComponent(
    siteId
  )}&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchSiteLocaleByDomain(
  supabaseUrl: string,
  serviceRoleKey: string,
  normalizedHost: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&domain=eq.${encodeURIComponent(
    normalizedHost
  )}&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchFirstEnabledSiteLocale(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&limit=1&order=created_at.asc`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchSiteIdByAliasDomain(
  supabaseUrl: string,
  serviceRoleKey: string,
  normalizedHost: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/site_domains?select=site_id&enabled=eq.true&domain=eq.${encodeURIComponent(
    normalizedHost
  )}&order=is_primary.desc&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as Array<{ site_id?: string }>;
  const siteId = data?.[0]?.site_id;
  return typeof siteId === 'string' ? siteId : null;
}

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

async function getSiteDefaultLocaleFromDb(host: string): Promise<string | null> {
  const normalizedHost = normalizeDomain(host);
  if (!normalizedHost) return null;

  const cached = localeCache.get(normalizedHost);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.locale;
  }

  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    // 1) Match explicit domain alias mapping (Admin > Sites > Domain Aliases)
    const matchedSiteId = await fetchSiteIdByAliasDomain(
      supabaseUrl,
      serviceRoleKey,
      normalizedHost
    );
    if (matchedSiteId) {
      const locale = await fetchSiteLocaleById(supabaseUrl, serviceRoleKey, matchedSiteId);
      if (locale) {
        localeCache.set(normalizedHost, { locale, expiresAt: now + CACHE_TTL_MS });
        return locale;
      }
    }

    // 2) Match sites.domain directly
    const domainLocale = await fetchSiteLocaleByDomain(supabaseUrl, serviceRoleKey, normalizedHost);
    if (domainLocale) {
      localeCache.set(normalizedHost, { locale: domainLocale, expiresAt: now + CACHE_TTL_MS });
      return domainLocale;
    }

    // 3) Environment-selected default site
    const envSiteId = process.env.NEXT_PUBLIC_DEFAULT_SITE;
    if (envSiteId) {
      const envLocale = await fetchSiteLocaleById(supabaseUrl, serviceRoleKey, envSiteId);
      if (envLocale) {
        localeCache.set(normalizedHost, { locale: envLocale, expiresAt: now + CACHE_TTL_MS });
        return envLocale;
      }
    }

    // 4) First enabled site fallback
    const firstLocale = await fetchFirstEnabledSiteLocale(supabaseUrl, serviceRoleKey);
    if (firstLocale) {
      localeCache.set(normalizedHost, { locale: firstLocale, expiresAt: now + CACHE_TTL_MS });
      return firstLocale;
    }
  } catch (error) {
    console.error('middleware DB locale lookup failed:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
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

  // Redirect to site-specific default locale.
  // DB is the source of truth so Admin "Sites" updates apply without redeploy.
  const host = request.headers.get('host') || '';
  const dbLocale = await getSiteDefaultLocaleFromDb(host);
  const siteLocale = dbLocale || getSiteDefaultLocale(host);
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
