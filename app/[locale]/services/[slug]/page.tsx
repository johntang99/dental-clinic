import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/types';
import { getRequestSiteId, loadAllItems, loadItemBySlug, loadContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Badge, Card, CardHeader, CardTitle, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';

interface ServiceSection {
  type: 'intro' | 'candidates' | 'advantages' | 'process' | 'whyUs';
  title: string;
  subtitle?: string;
  content?: string;
  content2?: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  items?: any[];
  steps?: Array<{ number: number; title: string; description: string }>;
}

interface ServiceData {
  slug: string;
  title: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  shortDescription: string;
  fullDescription?: string;
  benefits?: string[];
  whatToExpect?: string;
  price?: string | null;
  durationMinutes?: number | null;
  featured?: boolean;
  sections?: ServiceSection[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  heroVariant?: 'centered' | 'split-photo-right' | 'split-photo-left' | 'photo-background';
  cta?: {
    title?: string;
    subtitle?: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
  };
}

interface ServiceDetailPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

interface HeaderMenuConfig {
  menu?: { variant?: 'default' | 'centered' | 'transparent' | 'stacked' };
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  const service = await loadItemBySlug<ServiceData>(siteId, locale, 'services', slug);

  if (!service) {
    return buildPageMetadata({
      siteId,
      locale,
      slug: 'services',
      title: 'Service Not Found',
    });
  }

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'services',
    title: service.title,
    description: service.shortDescription,
    canonicalPath: `/${locale}/services/${slug}`,
  });
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  const service = await loadItemBySlug<ServiceData>(siteId, locale, 'services', slug);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');

  if (!service) {
    notFound();
  }

  // Load all services for "Other Services" section
  const allServices = await loadAllItems<ServiceData>(siteId, locale, 'services');
  const otherServices = allServices
    .filter((s) => s.slug !== slug)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 6);

  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const heroTopPaddingClass = isTransparentMenu ? 'pt-30 md:pt-36' : 'pt-16 md:pt-20';
  const heroVariant = service.heroVariant || 'centered';
  const hasHeroImage = Boolean(service.image && !service.image.startsWith('/images/'));
  const isSplitHero = heroVariant === 'split-photo-right' || heroVariant === 'split-photo-left';
  const isPhotoBackground = heroVariant === 'photo-background' && hasHeroImage;

  const breadcrumb = (textColorClass = 'text-gray-500') => (
    <nav className={`flex items-center gap-2 text-sm ${textColorClass} mb-8`}>
      <Link href={`/${locale}`} className="hover:text-primary transition-colors">
        {locale === 'zh' ? '首页' : 'Home'}
      </Link>
      <Icon name="ChevronRight" size="sm" />
      <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
        {locale === 'zh' ? '正畸服务' : 'Services'}
      </Link>
      <Icon name="ChevronRight" size="sm" />
      <span className={isPhotoBackground ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
        {service.title}
      </span>
    </nav>
  );

  const quickBadges = (badgeVariant: 'secondary' | 'primary' = 'secondary') => (
    <div className="flex flex-wrap gap-3">
      {service.durationMinutes && (
        <Badge variant={badgeVariant} className="flex items-center gap-1.5">
          <Icon name="Clock" size="sm" />
          {service.durationMinutes} min
        </Badge>
      )}
      {service.price && (
        <Badge variant={badgeVariant} className="flex items-center gap-1.5">
          <Icon name="DollarSign" size="sm" />
          {service.price}
        </Badge>
      )}
      {service.featured && (
        <Badge variant="primary">{locale === 'zh' ? '热门服务' : 'Popular Service'}</Badge>
      )}
    </div>
  );

  const heroTextContent = (titleClass = 'text-gray-900', subtitleClass = 'text-[var(--brand)]') => (
    <>
      <div className="flex items-start gap-4 mb-6">
        {service.icon && (
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name={service.icon as any} className="text-primary" />
          </div>
        )}
        <div>
          <h1 className={`text-display font-bold ${titleClass} mb-2`}>{service.title}</h1>
          {service.subtitle && (
            <p className={`text-subheading ${subtitleClass} font-medium`}>{service.subtitle}</p>
          )}
        </div>
      </div>
      {quickBadges(isPhotoBackground ? 'primary' : 'secondary')}
    </>
  );

  const faqSchema = service.faq && service.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  return (
    <main className="min-h-screen">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* Hero */}
      {isPhotoBackground ? (
        <section className={`relative min-h-[400px] ${heroTopPaddingClass} pb-16 md:pb-20 px-4`}>
          <Image
            src={service.image!}
            alt={service.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="container mx-auto max-w-4xl relative z-10">
            {breadcrumb('text-gray-300')}
            {heroTextContent('text-white', 'text-white/80')}
          </div>
        </section>
      ) : isSplitHero && hasHeroImage ? (
        <section
          className={`relative bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)] ${heroTopPaddingClass} pb-16 md:pb-20 px-4`}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto max-w-6xl relative z-10">
            {breadcrumb()}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={heroVariant === 'split-photo-left' ? 'lg:order-2' : ''}>
                {heroTextContent()}
              </div>
              <div className={heroVariant === 'split-photo-left' ? 'lg:order-1' : ''}>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={service.image!}
                    alt={service.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Default centered hero */
        <section
          className={`relative bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)] ${heroTopPaddingClass} pb-16 md:pb-20 px-4`}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto max-w-4xl relative z-10">
            {breadcrumb()}
            {heroTextContent()}
          </div>
        </section>
      )}

      {/* Premium Structured Sections */}
      {service.sections && service.sections.length > 0 ? (
        <>
          {service.sections.map((section, sIdx) => {
            switch (section.type) {
              case 'intro': {
                const imgPos = section.imagePosition || 'right';
                const hasImg = Boolean(section.image);
                const textBlock = (
                  <div>
                    <h2 className="text-heading font-bold text-gray-900 mb-6">{section.title}</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">{section.content}</p>
                    {section.content2 && (
                      <p className="text-lg text-gray-600 leading-relaxed">{section.content2}</p>
                    )}
                  </div>
                );
                const imgBlock = hasImg ? (
                  <div className="rounded-2xl overflow-hidden shadow-xl">
                    <Image src={section.image!} alt={section.title} width={600} height={450} className="w-full h-auto object-cover" />
                  </div>
                ) : null;
                return (
                  <section key={sIdx} className={`py-16 lg:py-24 ${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="container mx-auto px-4">
                      <div className={hasImg ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'}>
                        {hasImg ? (
                          <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {imgPos === 'left' ? <>{imgBlock}{textBlock}</> : <>{textBlock}{imgBlock}</>}
                          </div>
                        ) : textBlock}
                      </div>
                    </div>
                  </section>
                );
              }

              case 'candidates':
                return (
                  <section key={sIdx} className={`py-16 lg:py-24 ${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="container mx-auto px-4">
                      <div className="max-w-6xl mx-auto">
                        <div className={`grid ${section.image ? 'lg:grid-cols-2 gap-12 items-center' : ''}`}>
                          {section.image && (
                            <div className="rounded-2xl overflow-hidden shadow-xl">
                              <Image src={section.image} alt={section.title} width={600} height={450} className="w-full h-auto object-cover" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-heading font-bold text-gray-900 mb-4">{section.title}</h2>
                            {section.content && (
                              <p className="text-lg text-gray-600 mb-8">{section.content}</p>
                            )}
                            {section.items && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                {section.items.map((item: string, i: number) => (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Icon name="Check" className="text-primary" size="sm" />
                                    </div>
                                    <span className="text-gray-700 font-medium">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                );

              case 'advantages':
                return (
                  <section key={sIdx} className="py-16 lg:py-24 bg-gradient-to-br from-[var(--backdrop-primary)] via-white to-[var(--backdrop-secondary)]">
                    <div className="container mx-auto px-4">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <h2 className="text-heading font-bold text-gray-900 mb-3">{section.title}</h2>
                          {section.subtitle && (
                            <p className="text-lg text-gray-600">{section.subtitle}</p>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {section.items?.map((item: any, i: number) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                <Icon name={item.icon as any || 'Check'} className="text-primary" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                              <p className="text-gray-600 leading-relaxed">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );

              case 'process':
                return (
                  <section key={sIdx} className="py-16 lg:py-24 text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark, #1a1a2e), var(--color-primary, #0d6e6e))' }}>
                    <div className="container mx-auto px-4">
                      <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-14">
                          <h2 className="text-heading font-bold text-white mb-3">{section.title}</h2>
                          {section.subtitle && (
                            <p className="text-lg text-gray-300">{section.subtitle}</p>
                          )}
                        </div>
                        <div className="relative">
                          {/* Connector line */}
                          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                          <div className="space-y-8 lg:space-y-0">
                            {section.steps?.map((step, i) => (
                              <div key={i} className={`lg:grid lg:grid-cols-2 lg:gap-12 ${i > 0 ? 'lg:mt-0' : ''}`}>
                                <div className={`${i % 2 === 0 ? 'lg:text-right lg:pr-12' : 'lg:col-start-2 lg:pl-12'} relative pb-8 lg:pb-16`}>
                                  {/* Step number bubble */}
                                  <div className={`hidden lg:flex absolute top-0 ${i % 2 === 0 ? '-right-6' : '-left-6'} w-12 h-12 rounded-full bg-primary text-white font-bold items-center justify-center text-lg z-10 shadow-lg`}>
                                    {step.number}
                                  </div>
                                  <div className="flex items-start gap-4 lg:block">
                                    <div className="lg:hidden w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                                      {step.number}
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                      <p className="text-gray-300 leading-relaxed">{step.description}</p>
                                    </div>
                                  </div>
                                </div>
                                {i % 2 === 0 && <div className="hidden lg:block" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                );

              case 'whyUs':
                return (
                  <section key={sIdx} className="py-16 lg:py-24 bg-white">
                    <div className="container mx-auto px-4">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <h2 className="text-heading font-bold text-gray-900 mb-3">{section.title}</h2>
                          {section.subtitle && (
                            <p className="text-lg text-gray-600">{section.subtitle}</p>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-8">
                          {section.items?.map((item: any, i: number) => (
                            <div key={i} className="flex gap-5 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon name={item.icon as any || 'Star'} className="text-primary" size="lg" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );

              default:
                return null;
            }
          })}

          {/* FAQ */}
          {service.faq && service.faq.length > 0 && (
            <section className="py-16 lg:py-24 bg-gray-50">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">
                    {locale === 'zh' ? '常见问题解答' : 'Frequently Asked Questions'}
                  </h2>
                  <Accordion
                    items={service.faq.map((item, i) => ({
                      id: `faq-${i}`,
                      title: item.question,
                      content: item.answer,
                    }))}
                    allowMultiple
                  />
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        /* Legacy flat layout for services without sections */
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {service.fullDescription && (
                <div className="mb-12">
                  {service.fullDescription.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed mb-5 last:mb-0 text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              {service.benefits && service.benefits.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-heading font-bold text-gray-900 mb-6">
                    {locale === 'zh' ? '主要优势' : 'Key Benefits'}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {service.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name="Check" className="text-primary" size="sm" />
                        </div>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {service.whatToExpect && (
                <div className="mb-12">
                  <h2 className="text-heading font-bold text-gray-900 mb-6">
                    {locale === 'zh' ? '治疗流程' : 'What to Expect'}
                  </h2>
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    {service.whatToExpect.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-gray-700 leading-relaxed text-lg mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {service.faq && service.faq.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-heading font-bold text-gray-900 mb-6">
                    {locale === 'zh' ? '常见问题解答' : 'Frequently Asked Questions'}
                  </h2>
                  <Accordion
                    items={service.faq.map((item, i) => ({
                      id: `faq-${i}`,
                      title: item.question,
                      content: item.answer,
                    }))}
                    allowMultiple
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Other Services */}
      {otherServices.length > 0 && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[var(--backdrop-secondary)] to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">
                {locale === 'zh' ? '其他正畸服务' : 'Explore Other Services'}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherServices.map((s) => (
                  <Link key={s.slug} href={`/${locale}/services/${s.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader>
                        {s.icon && (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                            <Icon name={s.icon as any} className="text-primary" />
                          </div>
                        )}
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {s.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">{s.shortDescription}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  href={`/${locale}/services`}
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                >
                  {locale === 'zh' ? '查看全部服务' : 'View All Services'}
                  <Icon name="ArrowRight" size="sm" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection
        title={service.cta?.title || "Ready to Get Started?"}
        subtitle={service.cta?.subtitle || "Schedule an appointment to learn more about this service and how it can help you."}
        primaryCta={service.cta?.primaryCta || { text: "Book Appointment", link: `/${locale}/contact` }}
        secondaryCta={service.cta?.secondaryCta || { text: "Call (845) 555-0180", link: "tel:+18455550180" }}
        variant="centered"
        className="py-16"
      />
    </main>
  );
}
