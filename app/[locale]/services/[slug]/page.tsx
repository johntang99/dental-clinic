import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/types';
import { getRequestSiteId, loadAllItems, loadItemBySlug, loadContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Badge, Card, CardHeader, CardTitle, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';

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
        Home
      </Link>
      <Icon name="ChevronRight" size="sm" />
      <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
        Services
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
        <Badge variant="primary">Popular Service</Badge>
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

      {/* Main Content */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Full Description */}
            {service.fullDescription && (
              <div className="mb-12">
                {service.fullDescription.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-5 last:mb-0 text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Benefits */}
            {service.benefits && service.benefits.length > 0 && (
              <div className="mb-12">
                <h2 className="text-heading font-bold text-gray-900 mb-6">Key Benefits</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {service.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-xl"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name="Check" className="text-primary" size="sm" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What to Expect */}
            {service.whatToExpect && (
              <div className="mb-12">
                <h2 className="text-heading font-bold text-gray-900 mb-6">What to Expect</h2>
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed text-lg">{service.whatToExpect}</p>
                </div>
              </div>
            )}

            {/* FAQ */}
            {service.faq && service.faq.length > 0 && (
              <div className="mb-12">
                <h2 className="text-heading font-bold text-gray-900 mb-6">
                  Frequently Asked Questions
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

      {/* Other Services */}
      {otherServices.length > 0 && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[var(--backdrop-secondary)] to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">
                Explore Other Services
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
                  View All Services
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
