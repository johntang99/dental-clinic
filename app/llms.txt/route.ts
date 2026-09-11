/**
 * /llms.txt — a plain-language map of the site for AI assistants.
 *
 * The emerging convention (llmstxt.org): where robots.txt says what a crawler
 * may fetch, llms.txt says what the site is and which pages carry the answers,
 * in the order a human would want them. Assistants that read it cite the right
 * page instead of guessing from navigation.
 *
 * Built per request from the site's own content, so every tenant on this
 * platform gets its own correct file with nothing hardcoded.
 */
import { headers } from 'next/headers';
import { getBaseUrlFromHost, resolveSeoLocalesForPage } from '@/lib/seo';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { loadAllItems, loadContent, loadSiteInfo } from '@/lib/content';
import { getSiteDisplayName } from '@/lib/siteInfo';
import { locales, type Locale } from '@/lib/i18n';
import type { SiteInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

type NamedItem = { slug?: string; title?: string; name?: string };

export async function GET(): Promise<Response> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  if (!site) return new Response('', { status: 404 });

  const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const activeLocales = await resolveSeoLocalesForPage({
    siteId: site.id,
    candidateLocales: siteLocales,
    slug: 'home',
  });
  const locale = (activeLocales[0] || site.defaultLocale || 'en') as Locale;

  const [siteInfo, services, doctors] = await Promise.all([
    loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>,
    loadAllItems<NamedItem>(site.id, locale, 'services'),
    loadAllItems<NamedItem & { featured?: boolean; title?: string }>(site.id, locale, 'doctors'),
  ]);

  const name = getSiteDisplayName(siteInfo, site.name);
  const url = (path: string) => new URL(`/${locale}${path}`, baseUrl).toString();
  const info = siteInfo as (SiteInfo & { locations?: { name?: string; address?: string; city?: string; phone?: string }[] }) | null;

  const lines: string[] = [`# ${name}`];
  if (info?.description) lines.push('', `> ${info.description.replace(/\s*\n\s*/g, ' ').trim()}`);

  // Where they are and how to reach them — the questions assistants are asked
  // most, answered before any link.
  const contact: string[] = [];
  if (info?.phone) contact.push(`- Phone: ${info.phone}`);
  if (info?.email) contact.push(`- Email: ${info.email}`);
  const places = info?.locations?.length
    ? info.locations
    : info?.address
      ? [{ name: undefined, address: info.address, city: [info.city, info.state, info.zip].filter(Boolean).join(' '), phone: info.phone }]
      : [];
  for (const p of places) {
    const where = [p.address, p.city].filter(Boolean).join(', ');
    if (where) contact.push(`- ${p.name ? `${p.name}: ` : 'Location: '}${where}${p.phone ? ` · ${p.phone}` : ''}`);
  }
  if (contact.length) lines.push('', '## Contact', ...contact);

  const pages = [
    `- [Home](${url('')})`,
    `- [About](${url('/about')})`,
    `- [Services](${url('/services')})`,
    `- [Book an appointment](${url('/book')})`,
  ];
  lines.push('', '## Key pages', ...pages);

  const named = (items: NamedItem[]) =>
    items.filter((i) => i?.slug && (i.title || i.name)).slice(0, 25);

  const svc = named(services);
  if (svc.length) {
    lines.push('', '## Services');
    for (const s of svc) lines.push(`- [${s.title || s.name}](${url(`/services/${s.slug}`)})`);
  }

  const docs = named(doctors);
  if (docs.length) {
    lines.push('', '## Practitioners');
    for (const d of docs) {
      const title = (d as { title?: string }).title;
      lines.push(`- ${d.name || d.title}${title && d.name ? `, ${title}` : ''}`);
    }
  }

  lines.push('', `## Site`, `- Sitemap: ${new URL('/sitemap.xml', baseUrl).toString()}`);
  if (activeLocales.length > 1) lines.push(`- Languages: ${activeLocales.join(', ')}`);

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
