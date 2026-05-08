import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getRequestSiteId,
  loadAllItems,
  loadItemBySlug,
  loadSiteInfo,
} from '@/lib/content';
import { buildPageMetadata, getBaseUrlFromRequest } from '@/lib/seo';
import { getSiteDisplayName } from '@/lib/siteInfo';
import type { Locale, SiteInfo } from '@/lib/types';

interface LocalSeoLocation {
  id: string;
  name: string;
  cityState: string;
  clinicName: string;
  address: string;
  phone: string;
  addressMapUrl?: string;
  mapsEmbedUrl?: string;
}

interface LocalSeoFaqItem {
  question: string;
  answer: string;
}

interface LocalSeoCta {
  primaryText?: string;
  primaryLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
}

interface LocalSeoPageData {
  slug: string;
  pageType: 'core-location' | 'service-location' | 'condition-location' | 'resource-location';
  topicType?: 'service' | 'condition' | 'resource' | 'core';
  topicSlug?: string;
  topicName?: string;
  title: string;
  description: string;
  intro: string;
  highlights?: string[];
  treatmentSummary?: string;
  serviceDetailLink?: string;
  siblingSlug?: string;
  relatedServiceSlugs?: string[];
  relatedConditionSlugs?: string[];
  location: LocalSeoLocation;
  faq?: LocalSeoFaqItem[];
  cta?: LocalSeoCta;
}

interface LocalSeoPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

function pickPagesBySlug(
  pageMap: Map<string, LocalSeoPageData>,
  slugs: string[] | undefined
): LocalSeoPageData[] {
  if (!Array.isArray(slugs) || !slugs.length) return [];
  return slugs
    .map((slug) => pageMap.get(slug))
    .filter((page): page is LocalSeoPageData => Boolean(page));
}

function normalizePhoneLink(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  return `tel:+1${digits.replace(/[^\d]/g, '')}`;
}

export async function generateMetadata({ params }: LocalSeoPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  const page = await loadItemBySlug<LocalSeoPageData>(siteId, locale, 'local-seo', slug);

  if (!page) {
    return buildPageMetadata({
      siteId,
      locale,
      slug: 'home',
      title: locale === 'zh' ? '页面未找到' : 'Page Not Found',
      description: locale === 'zh' ? '您访问的页面不存在。' : 'The page you are looking for does not exist.',
    });
  }

  return buildPageMetadata({
    siteId,
    locale,
    slug: page.slug,
    title: page.title,
    description: page.description,
    canonicalPath: `/${locale}/${page.slug}`,
  });
}

export default async function LocalSeoPage({ params }: LocalSeoPageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();

  const [page, allPages, siteInfo] = await Promise.all([
    loadItemBySlug<LocalSeoPageData>(siteId, locale, 'local-seo', slug),
    loadAllItems<LocalSeoPageData>(siteId, locale, 'local-seo'),
    loadSiteInfo(siteId, locale) as Promise<SiteInfo | null>,
  ]);

  if (!page) {
    notFound();
  }

  const pageMap = new Map(allPages.map((entry) => [entry.slug, entry]));
  const siblingPage = page.siblingSlug ? pageMap.get(page.siblingSlug) : null;
  const relatedServicePages = pickPagesBySlug(pageMap, page.relatedServiceSlugs);
  const relatedConditionPages = pickPagesBySlug(pageMap, page.relatedConditionSlugs);
  const coreLocationPages = allPages.filter(
    (entry) => entry.pageType === 'core-location' && entry.slug !== page.slug
  );

  const baseUrl = getBaseUrlFromRequest();
  const canonicalUrl = new URL(`/${locale}/${page.slug}`, baseUrl).toString();
  const businessName = getSiteDisplayName(siteInfo, '胡林正畸中心');

  const faqItems = Array.isArray(page.faq) ? page.faq : [];
  const faqSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null;

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: `${businessName} - ${page.location.clinicName}`,
    url: canonicalUrl,
    telephone: page.location.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: page.location.address,
      addressLocality: page.location.cityState.split(',')[0]?.trim() || '',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    medicalSpecialty: 'Orthodontics',
    availableLanguage: ['zh', 'en'],
  };

  const ctaPrimaryText = page.cta?.primaryText || '预约免费咨询';
  const ctaPrimaryLink = page.cta?.primaryLink || `/${locale}/book`;
  const ctaSecondaryText = page.cta?.secondaryText || page.location.phone;
  const ctaSecondaryLink = page.cta?.secondaryLink || normalizePhoneLink(page.location.phone);
  const highlights = Array.isArray(page.highlights) ? page.highlights : [];

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <section className="bg-gradient-to-br from-primary/10 via-white to-backdrop-primary py-16 lg:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {locale === 'zh' ? '首页' : 'Home'}
            </Link>
            <span className="mx-2">/</span>
            <span>{page.location.name}</span>
          </nav>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">{page.title}</h1>
          <p className="text-lg text-gray-700 mt-4 leading-relaxed">{page.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ctaPrimaryLink}
              className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              {ctaPrimaryText}
            </Link>
            <a
              href={ctaSecondaryLink}
              className="inline-flex items-center rounded-lg border border-primary/30 px-5 py-3 text-primary font-semibold hover:bg-primary/5 transition-colors"
            >
              {ctaSecondaryText}
            </a>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '页面简介' : 'Overview'}
              </h2>
              <p className="text-gray-700 leading-relaxed">{page.intro}</p>

              {page.treatmentSummary && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {locale === 'zh' ? '治疗重点' : 'Treatment Focus'}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{page.treatmentSummary}</p>
                </div>
              )}

              {highlights.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {locale === 'zh' ? '核心要点' : 'Key Highlights'}
                  </h3>
                  <ul className="space-y-2">
                    {highlights.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-primary mt-1">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {locale === 'zh' ? '门诊信息' : 'Clinic Info'}
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">{page.location.clinicName}</span>
                </p>
                <p>{page.location.address}</p>
                <p>{page.location.cityState}</p>
                <p>{page.location.phone}</p>
                {page.location.addressMapUrl && (
                  <a
                    href={page.location.addressMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-primary hover:text-primary/80 font-medium"
                  >
                    {locale === 'zh' ? '查看地图路线' : 'Get Directions'}
                  </a>
                )}
                {page.serviceDetailLink && (
                  <Link href={page.serviceDetailLink} className="block text-primary hover:text-primary/80 font-medium">
                    {locale === 'zh' ? '查看服务详情页' : 'View Service Detail'}
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="pb-12 lg:pb-16">
        <div className="container mx-auto px-4 max-w-5xl grid gap-6 lg:grid-cols-2">
          {relatedServicePages.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '相关服务页面' : 'Related Service Pages'}
              </h2>
              <ul className="space-y-3">
                {relatedServicePages.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/${locale}/${item.slug}`} className="text-primary hover:text-primary/80">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedConditionPages.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '相关问题页面' : 'Related Condition Pages'}
              </h2>
              <ul className="space-y-3">
                {relatedConditionPages.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/${locale}/${item.slug}`} className="text-primary hover:text-primary/80">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {siblingPage && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '另一个门诊对应页面' : 'Alternate Location Page'}
              </h2>
              <Link href={`/${locale}/${siblingPage.slug}`} className="text-primary hover:text-primary/80">
                {siblingPage.title}
              </Link>
            </div>
          )}

          {coreLocationPages.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '核心入口页面' : 'Core Location Hubs'}
              </h2>
              <ul className="space-y-3">
                {coreLocationPages.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/${locale}/${item.slug}`} className="text-primary hover:text-primary/80">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {faqItems.length > 0 && (
        <section className="pb-16 lg:pb-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                {locale === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
              </h2>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <details key={index} className="group rounded-xl border border-gray-100 p-4 open:bg-gray-50">
                    <summary className="cursor-pointer font-semibold text-gray-900">{item.question}</summary>
                    <p className="mt-3 text-gray-700 leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
