import type { Metadata } from 'next';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import {
  addLocaleToPathname,
  defaultLocale,
  locales,
  type Locale,
  removeLocaleFromPathname,
} from '@/lib/i18n';
import { getSiteById } from '@/lib/sites';
import { loadSeo, loadSiteInfo } from '@/lib/content';
import type { SeoConfig, SiteInfo } from '@/lib/types';
import { getSiteDisplayName } from '@/lib/siteInfo';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export function getBaseUrlFromHost(host?: string | null): URL {
  const trimmed = (host || '').trim();
  if (!trimmed) {
    return new URL('http://localhost:3004');
  }

  const isLocal =
    trimmed.includes('localhost') ||
    trimmed.endsWith('.local') ||
    trimmed.startsWith('127.0.0.1') ||
    trimmed.endsWith(':3000') ||
    trimmed.endsWith(':3003') ||
    trimmed.endsWith(':3004');
  const protocol = isLocal ? 'http' : 'https';
  return new URL(`${protocol}://${trimmed}`);
}

export function getBaseUrlFromRequest(): URL {
  const host = headers().get('host');
  return getBaseUrlFromHost(host);
}

function getPageSeo(seo: SeoConfig | null, slug?: string) {
  if (!seo) return null;
  if (!slug || slug === 'home') {
    return seo.home || seo.pages?.home || null;
  }
  return seo.pages?.[slug] || null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeSlug(slug?: string): string {
  if (!slug || slug === 'home') return 'home';
  return slug.replace(/^\/+|\/+$/g, '');
}

export async function resolveSeoLocalesForPage({
  siteId,
  candidateLocales,
  slug,
}: {
  siteId: string;
  candidateLocales: Locale[];
  slug?: string;
}): Promise<Locale[]> {
  const uniqueCandidates = Array.from(new Set(candidateLocales));
  if (!uniqueCandidates.length) return [];

  // Keep locales that have concrete locale content files; this avoids emitting alternates
  // for placeholders (for example, a locale folder with only partial scaffolding).
  const withContentChecks = await Promise.all(
    uniqueCandidates.map(async (entry) => {
      const localeRoot = path.join(CONTENT_DIR, siteId, entry);
      const hasSiteJson = await fileExists(path.join(localeRoot, 'site.json'));
      const hasHomePage = await fileExists(path.join(localeRoot, 'pages', 'home.json'));
      return { locale: entry, hasContent: hasSiteJson || hasHomePage };
    })
  );
  const localesWithContent = withContentChecks
    .filter((result) => result.hasContent)
    .map((result) => result.locale);
  const baseLocales = localesWithContent.length ? localesWithContent : uniqueCandidates;

  const pageSlug = normalizeSlug(slug);
  if (!pageSlug) return baseLocales;

  const pageChecks = await Promise.all(
    baseLocales.map(async (entry) => {
      const pagePath = path.join(CONTENT_DIR, siteId, entry, 'pages', `${pageSlug}.json`);
      return { locale: entry, hasPage: await fileExists(pagePath) };
    })
  );
  const localesWithPage = pageChecks.filter((result) => result.hasPage).map((result) => result.locale);
  return localesWithPage.length ? localesWithPage : baseLocales;
}

export async function buildPageMetadata({
  siteId,
  locale,
  slug,
  title,
  description,
  canonicalPath,
  pathWithoutLocale,
}: {
  siteId: string;
  locale: Locale;
  slug?: string;
  title?: string;
  description?: string;
  canonicalPath?: string;
  pathWithoutLocale?: string;
}): Promise<Metadata> {
  const baseUrl = getBaseUrlFromRequest();
  const [site, seo, siteInfo] = await Promise.all([
    getSiteById(siteId),
    loadSeo(siteId, locale) as Promise<SeoConfig | null>,
    loadSiteInfo(siteId, locale) as Promise<SiteInfo | null>,
  ]);

  const pageSeo = getPageSeo(seo, slug);
  const fallbackTitle = getSiteDisplayName(siteInfo, 'Business');
  const resolvedTitle = title || pageSeo?.title || seo?.title || fallbackTitle;
  const resolvedDescription =
    description ||
    pageSeo?.description ||
    seo?.description ||
    siteInfo?.description ||
    '';

  const resolvedPathWithoutLocale =
    pathWithoutLocale ??
    (canonicalPath ? removeLocaleFromPathname(canonicalPath) : null) ??
    (slug && slug !== 'home' ? `/${slug}` : '/');
  const siteLocales = (site?.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const activeLocales = await resolveSeoLocalesForPage({
    siteId,
    candidateLocales: siteLocales,
    slug,
  });
  const preferredDefaultLocale = (site?.defaultLocale as Locale | undefined) || defaultLocale;
  const xDefaultLocale = activeLocales.includes(preferredDefaultLocale)
    ? preferredDefaultLocale
    : activeLocales[0] || locale;
  const isIndexableLocale = activeLocales.includes(locale);
  const canonicalLocale = isIndexableLocale ? locale : xDefaultLocale;
  const canonicalPathname = addLocaleToPathname(resolvedPathWithoutLocale, canonicalLocale);
  const canonical = new URL(canonicalPathname, baseUrl).toString();
  const languageAlternates = activeLocales.reduce<Record<string, string>>((acc, entry) => {
    acc[entry] = new URL(addLocaleToPathname(resolvedPathWithoutLocale, entry), baseUrl).toString();
    return acc;
  }, {});
  const xDefault = new URL(addLocaleToPathname(resolvedPathWithoutLocale, xDefaultLocale), baseUrl).toString();

  return {
    title: resolvedTitle,
    description: resolvedDescription || undefined,
    alternates: {
      canonical,
      languages: {
        ...languageAlternates,
        'x-default': xDefault,
      },
    },
    robots: isIndexableLocale
      ? undefined
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription || undefined,
      url: canonical,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription || undefined,
      images: seo?.ogImage ? [seo.ogImage] : undefined,
    },
  };
}
