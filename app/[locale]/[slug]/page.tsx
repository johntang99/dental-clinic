import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  useServiceRichTemplate?: boolean;
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

interface ServiceDetailSectionItem {
  title?: string;
  description?: string;
}

interface ServiceDetailSectionStep {
  number?: number;
  title?: string;
  description?: string;
}

interface ServiceDetailSection {
  type?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  content2?: string;
  items?: Array<string | ServiceDetailSectionItem>;
  steps?: ServiceDetailSectionStep[];
}

interface ServiceDetailData {
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  benefits?: string[];
  whatToExpect?: string;
  sections?: ServiceDetailSection[];
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

function normalizeMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\|\s+\|(?=(?:-+:?|:?-+|[A-Za-z0-9"']))/g, '|\n|')
    .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
    .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');
}

function pickSectionByType(
  sections: ServiceDetailSection[] | undefined,
  type: string
): ServiceDetailSection | undefined {
  if (!Array.isArray(sections)) return undefined;
  return sections.find((section) => section.type === type);
}

function toDisplayItems(items: Array<string | ServiceDetailSectionItem> | undefined): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      if (title && description) return `${title}：${description}`;
      return title || description;
    })
    .filter(Boolean);
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

  const shouldUseRichServiceTemplate = Boolean(
    page.pageType === 'service-location' &&
      page.topicType === 'service' &&
      page.useServiceRichTemplate === true &&
      typeof page.topicSlug === 'string' &&
      page.topicSlug.trim()
  );

  const serviceDetail = shouldUseRichServiceTemplate
    ? await loadItemBySlug<ServiceDetailData>(siteId, locale, 'services', page.topicSlug as string)
    : null;

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

  const serviceSchema = serviceDetail
    ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${page.location.name}${serviceDetail.title}`,
        description: page.description,
        provider: {
          '@type': 'Dentist',
          name: businessName,
        },
        areaServed: page.location.cityState,
        url: canonicalUrl,
      }
    : null;

  const ctaPrimaryText = page.cta?.primaryText || '预约免费咨询';
  const ctaPrimaryLink = page.cta?.primaryLink || `/${locale}/book`;
  const ctaSecondaryText = page.cta?.secondaryText || page.location.phone;
  const ctaSecondaryLink = page.cta?.secondaryLink || normalizePhoneLink(page.location.phone);
  const highlights = Array.isArray(page.highlights) ? page.highlights : [];
  const introSection = pickSectionByType(serviceDetail?.sections, 'intro');
  const candidatesSection = pickSectionByType(serviceDetail?.sections, 'candidates');
  const advantagesSection = pickSectionByType(serviceDetail?.sections, 'advantages');
  const processSection = pickSectionByType(serviceDetail?.sections, 'process');
  const whyUsSection = pickSectionByType(serviceDetail?.sections, 'whyUs');

  const richIntroPrimary =
    (serviceDetail?.fullDescription || serviceDetail?.shortDescription || introSection?.content || page.intro).trim();
  const richIntroSecondary = (introSection?.content2 || '').trim();
  const candidateItems = toDisplayItems(candidatesSection?.items);
  const advantageItems =
    Array.isArray(serviceDetail?.benefits) && serviceDetail.benefits.length > 0
      ? serviceDetail.benefits
      : toDisplayItems(advantagesSection?.items);
  const processSteps = Array.isArray(processSection?.steps) ? processSection.steps : [];
  const whyUsItems = toDisplayItems(whyUsSection?.items);
  const showRichServiceBlocks =
    Boolean(serviceDetail) &&
    (candidateItems.length > 0 || advantageItems.length > 0 || processSteps.length > 0 || whyUsItems.length > 0);

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
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
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
                {serviceDetail ? (locale === 'zh' ? '服务介绍' : 'Service Overview') : locale === 'zh' ? '页面简介' : 'Overview'}
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {normalizeMarkdown(richIntroPrimary)}
                </ReactMarkdown>
              </div>

              {serviceDetail?.subtitle && (
                <p className="mt-4 text-sm font-medium text-primary">
                  {serviceDetail.subtitle}
                </p>
              )}

              {richIntroSecondary && (
                <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizeMarkdown(richIntroSecondary)}
                  </ReactMarkdown>
                </div>
              )}

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
                {serviceDetail && (
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {locale === 'zh'
                      ? `${page.location.name}页面已结合主服务内容与本地就诊信息，方便患者直接预约本门诊。`
                      : 'This page combines detailed service content with local clinic logistics.'}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {showRichServiceBlocks && (
        <section className="pb-12 lg:pb-16">
          <div className="container mx-auto px-4 max-w-5xl grid gap-6 lg:grid-cols-2">
            {candidateItems.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {locale === 'zh' ? '适合人群与情况' : 'Who It Helps'}
                </h2>
                <ul className="space-y-2">
                  {candidateItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-primary mt-1">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {advantageItems.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {locale === 'zh' ? '核心优势' : 'Key Advantages'}
                </h2>
                <ul className="space-y-2">
                  {advantageItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-primary mt-1">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {processSteps.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {locale === 'zh' ? '治疗流程' : 'Treatment Process'}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {processSteps.map((step, index) => (
                    <div key={`${step.title || 'step'}-${index}`} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                        {locale === 'zh' ? `步骤 ${step.number ?? index + 1}` : `Step ${step.number ?? index + 1}`}
                      </p>
                      {step.title && <h3 className="text-base font-semibold text-gray-900 mt-1">{step.title}</h3>}
                      {step.description && <p className="text-sm text-gray-700 mt-2">{step.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {whyUsItems.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {locale === 'zh' ? '为什么选择我们' : 'Why Choose Us'}
                </h2>
                <ul className="grid gap-2 md:grid-cols-2">
                  {whyUsItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-primary mt-1">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

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
