import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { ServicesPage, Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import ServicesSection from '@/components/sections/ServicesSection';
import { Award, Users, Shield } from 'lucide-react';

interface ServicesPageProps {
  params: {
    locale: Locale;
  };
}

interface BlogListItem {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  category?: string;
  publishDate?: string;
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

interface HeaderMenuConfig {
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  };
}

const trustIconMap = {
  Award,
  Users,
  Shield,
} as const;

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ServicesPage>('services', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'services',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.overview?.introduction,
  });
}

export default async function ServicesPageComponent({ params }: ServicesPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ServicesPage>('services', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('services.layout', locale, siteId);
  const blogPosts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, overview, servicesList, faq, cta } = content;
  const services = servicesList?.items || [];
  const blogBySlug = new Map(blogPosts.map((post) => [post.slug, post]));
  const preferredSlugs = content.relatedReading?.preferredSlugs || [];
  const preferredPosts = preferredSlugs
    .map((slug) => blogBySlug.get(slug))
    .filter((post): post is BlogListItem => Boolean(post));
  const relatedPosts = preferredPosts.length
    ? preferredPosts
    : [...blogPosts]
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .slice(0, 3);
  const trustItemsDefault = [
    {
      icon: 'Award',
      title: locale === 'en' ? 'Proven Expertise' : '专业团队',
      description: locale === 'en' ? 'Proven, standards-based service quality' : '基于标准与经验的高质量服务',
    },
    {
      icon: 'Users',
      title: locale === 'en' ? 'Personalized Plans' : '个性化方案',
      description: locale === 'en' ? 'Tailored to your goals and preferences' : '根据您的目标与偏好定制',
    },
    {
      icon: 'Shield',
      title: locale === 'en' ? 'Reliable & Trusted' : '可靠可信',
      description: locale === 'en' ? 'Professional quality and clear process' : '高质量服务与清晰流程',
    },
  ];
  const trustItems = (content.trustBar?.items && content.trustBar.items.length > 0
    ? content.trustBar.items
    : trustItemsDefault
  ).map((item) => ({
    ...item,
    icon: trustIconMap[item.icon as keyof typeof trustIconMap] || Shield,
  }));
  const heroPlaceholder = content.heroPlaceholder || {
    emoji: '🧘',
    title: locale === 'en' ? 'Professional Services' : '专业服务',
    subtitle: locale === 'en' ? 'Customized plans tailored to your goals' : '根据您的目标定制方案',
  };
  const overviewTitle = overview.title || (locale === 'en' ? 'Benefits of Our Care Model' : '我们的服务优势');
  const servicesBadge = content.servicesList?.badge || (locale === 'en' ? 'OUR SERVICES' : '服务项目');
  const servicesTitleFallback = locale === 'en' ? 'Our Services' : '服务项目';
  const legacyLabels = content.legacyLabels || {};
  const faqSubtitle =
    faq.subtitle ||
    (locale === 'en'
      ? 'Common questions about services, safety, and expected outcomes'
      : '关于服务、安全与预期结果的常见问题');
  const relatedReading = content.relatedReading || {};
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const heroVariant = hero.variant || 'split-photo-right';
  const centeredHero = heroVariant === 'centered';
  const imageLeftHero = heroVariant === 'split-photo-left';
  const backgroundHero = heroVariant === 'photo-background' && Boolean(hero.backgroundImage);
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const heroTopPaddingClass = isTransparentMenu ? 'pt-30 md:pt-36' : 'pt-20 md:pt-24';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <section
          className={`relative ${heroTopPaddingClass} pb-16 md:pb-20 px-4 overflow-hidden ${
            backgroundHero
              ? 'bg-cover bg-center before:absolute before:inset-0 before:bg-white/75'
              : 'bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)]'
          }`}
          style={{
            ...(sectionStyle('hero') || {}),
            ...(backgroundHero ? { backgroundImage: `url(${hero.backgroundImage})` } : {}),
          }}
        >
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className={`grid gap-12 items-center ${centeredHero ? 'max-w-4xl mx-auto' : 'lg:grid-cols-2'}`}>
            {/* Left Column - Text Content */}
            <div className={`text-center ${centeredHero ? '' : 'lg:text-left'}`}>
              <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
                {hero.title}
              </h1>
              <p className="text-subheading text-gray-600 leading-relaxed mb-8">
                {hero.subtitle}
              </p>

              {/* Trust Bar */}
              <div className={`grid sm:grid-cols-3 gap-4 mt-8 ${centeredHero ? 'max-w-3xl mx-auto' : ''}`}>
                {trustItems.map((item) => {
                  const TrustIcon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex flex-col items-center sm:items-start gap-3 bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <TrustIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Hero Image */}
            {!centeredHero && (
            <div className={`hidden md:block w-full ${imageLeftHero ? 'lg:order-first' : ''}`}>
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                {hero.backgroundImage ? (
                  <Image
                    src={hero.backgroundImage}
                    alt={hero.title}
                    width={1200}
                    height={1200}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 relative p-8">
                    <div className="absolute top-8 left-8 w-20 h-20 bg-primary-50/20 rounded-full"></div>
                    <div className="absolute bottom-8 right-8 w-28 h-28 bg-secondary-50/20 rounded-full"></div>
                    <div className="absolute top-1/3 right-12 w-16 h-16 bg-primary-100/20 rounded-full"></div>

                    <div className="relative z-10 text-center">
                      <div className="text-8xl mb-6">{heroPlaceholder.emoji || '🧘'}</div>
                      <p className="text-gray-700 font-semibold text-subheading mb-2">
                        {heroPlaceholder.title}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {heroPlaceholder.subtitle}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
        </section>
      )}

      {/* Overview Section */}
      {isEnabled('overview') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('overview')}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed mb-12">
              {overview.introduction}
            </p>

            <div className="bg-gradient-to-br from-primary/5 to-backdrop-primary rounded-2xl p-8 lg:p-12">
              <h2 className="text-heading font-bold text-gray-900 mb-6">
                {overviewTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {overview.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Services Section - Variant-aware */}
      {isEnabled('services') && content.servicesList && services.length > 0 && (
        <div style={sectionStyle('services')}>
          <ServicesSection
            variant={content.servicesList.variant || 'detail-alternating'}
            badge={servicesBadge}
            title={
              content.servicesList.title ||
              servicesTitleFallback
            }
            subtitle={content.servicesList.subtitle || ''}
            services={services}
          />
        </div>
      )}

      {/* FAQ Section */}
      {isEnabled('faq') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('faq')}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {faq.title}
              </h2>
              <p className="text-gray-600">
                {faqSubtitle}
              </p>
            </div>

            <Accordion
              items={faq.faqs.map((item, index) => ({
                id: `faq-${index}`,
                title: item.question,
                content: item.answer,
              }))}
              allowMultiple
            />
          </div>
        </div>
        </section>
      )}

      {isEnabled('relatedReading') && relatedPosts.length > 0 && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('relatedReading')}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-heading font-bold text-gray-900">
                    {relatedReading.title || (locale === 'en' ? 'Related Reading' : '相关阅读')}
                  </h2>
                  <p className="text-gray-600">
                    {relatedReading.subtitle ||
                      (locale === 'en'
                        ? 'Explore practical guides related to these services.'
                        : '了解与本页服务相关的实用内容。')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="text-primary font-semibold hover:text-primary-dark"
                >
                  {relatedReading.viewAllText || (locale === 'en' ? 'View all' : '查看全部')}
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/${locale}/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <Badge variant="secondary" size="sm">
                          {post.category || relatedReading.defaultCategory || (locale === 'en' ? 'Guide' : '指南')}
                        </Badge>
                        <CardTitle className="text-base mt-3 line-clamp-2">
                          {post.title}
                        </CardTitle>
                        {post.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.subtitle}
            primaryCta={cta.primaryCta}
            secondaryCta={cta.secondaryCta}
            variant={cta.variant || 'centered'}
            className="py-16 lg:py-24"
          />
        </div>
      )}
    </main>
  );
}
