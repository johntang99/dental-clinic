import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBaseUrlFromHost, resolveSeoLocalesForPage } from '@/lib/seo';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { locales, type Locale } from '@/lib/i18n';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  const disallowPaths = ['/admin', '/api'];

  if (site) {
    const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
    const activeLocales = await resolveSeoLocalesForPage({
      siteId: site.id,
      candidateLocales: siteLocales,
      slug: 'home',
    });

    for (const locale of locales) {
      if (!activeLocales.includes(locale)) {
        disallowPaths.push(`/${locale}`);
      }
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: Array.from(new Set(disallowPaths)),
      },
    ],
    sitemap: new URL('/sitemap.xml', baseUrl).toString(),
  };
}
