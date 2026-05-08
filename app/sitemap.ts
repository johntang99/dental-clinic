import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import { getBaseUrlFromHost, resolveSeoLocalesForPage } from '@/lib/seo';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { locales, type Locale } from '@/lib/i18n';

const CONTENT_DIR = path.join(process.cwd(), 'content');

type JsonEntry = {
  slug: string;
  lastModified: Date;
};

async function listJsonEntries(dirPath: string): Promise<JsonEntry[]> {
  try {
    const files = await fs.readdir(dirPath);
    const entries = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          return {
            slug: file.replace(/\.json$/, ''),
            lastModified: stats.mtime,
          };
        })
    );
    return entries;
  } catch {
    return [];
  }
}

async function listPageSlugs(siteId: string, locale: Locale) {
  const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
  const entries = await listJsonEntries(pagesDir);
  const excluded = /-(copy|new)$/;
  return entries.filter(
    (entry) => entry.slug !== 'home' && !entry.slug.endsWith('.layout') && !excluded.test(entry.slug)
  );
}

async function listBlogSlugs(siteId: string, locale: Locale) {
  const blogDir = path.join(CONTENT_DIR, siteId, locale, 'blog');
  return listJsonEntries(blogDir);
}

async function listServiceSlugs(siteId: string, locale: Locale) {
  const servicesDir = path.join(CONTENT_DIR, siteId, locale, 'services');
  return listJsonEntries(servicesDir);
}

async function listLocalSeoSlugs(siteId: string, locale: Locale) {
  const localSeoDir = path.join(CONTENT_DIR, siteId, locale, 'local-seo');
  return listJsonEntries(localSeoDir);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());

  if (!site) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const activeLocales = await resolveSeoLocalesForPage({
    siteId: site.id,
    candidateLocales: siteLocales,
    slug: 'home',
  });

  for (const locale of activeLocales) {
    const homeFilePath = path.join(CONTENT_DIR, site.id, locale, 'pages', 'home.json');
    const homeLastModified = await fs
      .stat(homeFilePath)
      .then((stats) => stats.mtime)
      .catch(() => new Date());

    // Home
    entries.push({
      url: new URL(`/${locale}`, baseUrl).toString(),
      lastModified: homeLastModified,
    });

    // Pages
    const pageEntries = await listPageSlugs(site.id, locale);
    const pageSlugSet = new Set(pageEntries.map((entry) => entry.slug));
    for (const pageEntry of pageEntries) {
      entries.push({
        url: new URL(`/${locale}/${pageEntry.slug}`, baseUrl).toString(),
        lastModified: pageEntry.lastModified,
      });
    }

    // Blog posts
    const blogEntries = await listBlogSlugs(site.id, locale);
    for (const blogEntry of blogEntries) {
      entries.push({
        url: new URL(`/${locale}/blog/${blogEntry.slug}`, baseUrl).toString(),
        lastModified: blogEntry.lastModified,
      });
    }

    // Service detail pages
    const serviceEntries = await listServiceSlugs(site.id, locale);
    for (const serviceEntry of serviceEntries) {
      entries.push({
        url: new URL(`/${locale}/services/${serviceEntry.slug}`, baseUrl).toString(),
        lastModified: serviceEntry.lastModified,
      });
    }

    // Local SEO landing pages (e.g., /zh/flushing-invisalign)
    const localSeoEntries = await listLocalSeoSlugs(site.id, locale);
    for (const localSeoEntry of localSeoEntries) {
      if (pageSlugSet.has(localSeoEntry.slug)) continue;
      entries.push({
        url: new URL(`/${locale}/${localSeoEntry.slug}`, baseUrl).toString(),
        lastModified: localSeoEntry.lastModified,
      });
    }
  }

  return entries;
}
