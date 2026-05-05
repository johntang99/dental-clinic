import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRequestSiteId, loadAllItems, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { ServicesPage, Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import ServicesSection from '@/components/sections/ServicesSection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';
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


const trustIconMap = {
  Award,
  Users,
  Shield,
} as const;

function normalizeMarkdown(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\|\s+\|(?=(?:-+:?|:?-+|[A-Za-z0-9"']))/g, '|\n|')
    .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
    .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');
}

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

  if (!content) {
    notFound();
  }

  const { hero, overview, servicesList, faq, cta } = content;
  const serviceDetailFiles = await loadAllItems<{
    slug: string;
    benefits?: string[];
    whatToExpect?: string;
    sections?: Array<{
      type: string;
      items?: Array<{ title?: string; description?: string } | string>;
      content?: string;
      steps?: Array<{ title?: string; description?: string }>;
    }>;
  }>(siteId, locale, 'services');
  const serviceDetailMap = new Map(
    serviceDetailFiles.map((d) => [d.slug, d])
  );
  const rawServices = servicesList?.items || [];
  const services = rawServices.map((s: any) => {
    const detail = s.id ? serviceDetailMap.get(s.id) : null;
    if (!detail) return s;

    // Extract benefits from sections[type=advantages].items
    let benefits = s.benefits || detail.benefits;
    if (!benefits && detail.sections) {
      const advSection = detail.sections.find((sec) => sec.type === 'advantages');
      if (advSection?.items) {
        benefits = advSection.items
          .map((item) => (typeof item === 'string' ? item : item.title))
          .filter(Boolean)
          .slice(0, 4);
      }
    }

    // Extract whatToExpect from sections[type=intro].content
    let whatToExpect = s.whatToExpect || detail.whatToExpect;
    if (!whatToExpect && detail.sections) {
      const introSection = detail.sections.find((sec) => sec.type === 'intro');
      if (introSection?.content) {
        whatToExpect = introSection.content.slice(0, 200);
      }
    }

    return { ...s, benefits, whatToExpect };
  });
  const categories = (content as any).categories || [];
  const layoutVariant = (content as any).layoutVariant || 'category-detail-alternating';
  const sortedCategories = [...categories].sort((a: any, b: any) => {
    const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  const servicesByCategory = sortedCategories.map((category: any) => ({
    ...category,
    services: services.filter((s: any) => s.category === category.id),
  }));
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

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <HeroSection
          variant={(hero.variant as HeroVariant) || 'split-photo-right'}
          tagline={hero.title}
          description={hero.subtitle}
          image={hero.backgroundImage || undefined}
          gallery={Array.isArray((hero as any).gallery) ? (hero as any).gallery : undefined}
          photoOverlayOpacity={
            typeof (hero as any).photoOverlayOpacity === 'number'
              ? (hero as any).photoOverlayOpacity
              : 0.2
          }
          photoContentPosition={
            (hero as any).photoContentPosition === 'center' ||
            (hero as any).photoContentPosition === 'center-below' ||
            (hero as any).photoContentPosition === 'left' ||
            (hero as any).photoContentPosition === 'left-below' ||
            (hero as any).photoContentPosition === 'lower'
              ? (hero as any).photoContentPosition
              : 'left-below'
          }
        />
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

      {/* Services by Category */}
      {isEnabled('services') && categories.length > 0 && services.length > 0 && (
        <div style={sectionStyle('services')}>
          {/* Section Header */}
          <section className="pt-16 lg:pt-24 pb-8 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto text-center">
                <Badge variant="primary" className="mb-4">
                  {servicesBadge}
                </Badge>
                <h2 className="text-heading font-bold text-gray-900 mb-4">
                  {content.servicesList?.title || servicesTitleFallback}
                </h2>
                {content.servicesList?.subtitle && (
                  <p className="text-gray-600 max-w-2xl mx-auto">{content.servicesList.subtitle}</p>
                )}
              </div>
            </div>
          </section>

          {/* Category Sections with alternating backgrounds */}
          {servicesByCategory
            .filter((categoryGroup: any) => categoryGroup.services.length > 0)
            .map((categoryGroup: any, categoryIndex: number) => {
              const categoryImage =
                categoryGroup.image ||
                categoryGroup.services.find((s: any) => Boolean(s.image))?.image;
              const imageOnRight = categoryIndex % 2 === 0;
              const isEven = categoryIndex % 2 === 0;

              return (
                <section
                  key={categoryGroup.id}
                  id={categoryGroup.id}
                  className={`py-16 lg:py-20 scroll-mt-20 ${
                    isEven
                      ? 'bg-white'
                      : 'bg-gradient-to-b from-gray-100 to-gray-200/60'
                  }`}
                >
                  <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                      {/* Category Header — image + description zig-zag */}
                      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-12">
                        <div className={imageOnRight ? 'lg:order-1' : 'lg:order-2'}>
                          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-5">
                            <Icon name={categoryGroup.icon as any} size="sm" />
                            <span>{categoryGroup.name}</span>
                          </div>
                          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                            {categoryGroup.name}
                          </h3>
                          {categoryGroup.subtitle && (
                            <p className="text-base font-medium text-primary/80 mb-4">
                              {categoryGroup.subtitle}
                            </p>
                          )}
                          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                              }}
                            >
                              {normalizeMarkdown(String(categoryGroup.description || ''))}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className={imageOnRight ? 'lg:order-2' : 'lg:order-1'}>
                          {categoryImage ? (
                            <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                              <Image
                                src={categoryImage}
                                alt={categoryGroup.name}
                                width={1200}
                                height={780}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          ) : (
                            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-white aspect-[16/10] flex items-center justify-center">
                              <Icon name={categoryGroup.icon as any} className="text-primary" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Service Cards */}
                      <div className="grid gap-4">
                        {categoryGroup.services.map((service: any) => {
                          const benefits = Array.isArray(service.benefits) ? service.benefits : [];
                          const whatToExpect = typeof service.whatToExpect === 'string' ? service.whatToExpect : '';
                          const hasBenefits = benefits.length > 0;
                          const hasWhatToExpect = whatToExpect.length > 0;
                          const hasDetails = hasBenefits || hasWhatToExpect;
                          const cardBg = isEven
                            ? 'bg-gray-50/70 border-gray-100 hover:bg-white'
                            : 'bg-white border-gray-100';

                          return (
                            <div
                              key={service.id}
                              className={`${cardBg} border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300`}
                            >
                              <div className={`grid ${hasDetails ? 'lg:grid-cols-3' : ''} gap-6`}>
                                {/* Column 1: Title & Description */}
                                <div className="lg:col-span-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Icon name={service.icon as any} className="text-primary" size="sm" />
                                    </div>
                                    <Link href={`/${locale}${service.link}`} className="group">
                                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                                        {service.title}
                                      </h4>
                                    </Link>
                                  </div>
                                  {service.image ? (
                                    <div className="flex gap-3">
                                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5">
                                        <Image
                                          src={service.image}
                                          alt={service.title}
                                          width={96}
                                          height={96}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <p className="text-gray-600 text-sm leading-relaxed">
                                        {service.shortDescription}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                      {service.shortDescription}
                                    </p>
                                  )}
                                </div>

                                {/* Column 2: Key Benefits */}
                                {hasBenefits && (
                                  <div className="lg:border-l lg:border-gray-200 lg:pl-6">
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                      {locale === 'en' ? 'Key Benefits' : '主要优势'}
                                    </h5>
                                    <div className="space-y-2">
                                      {benefits.slice(0, 4).map((benefit: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2">
                                          <Icon name="Check" className="text-primary mt-0.5 flex-shrink-0" size="sm" />
                                          <span className="text-sm text-gray-700">{benefit}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Column 3: What to Expect + CTA */}
                                {hasWhatToExpect && (
                                  <div className="lg:border-l lg:border-gray-200 lg:pl-6 flex flex-col">
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                      {locale === 'en' ? 'What to Expect' : '服务简介'}
                                    </h5>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3 flex-1">
                                      {whatToExpect}
                                    </p>
                                    <Link
                                      href={`/${locale}${service.link}`}
                                      className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary-dark transition-colors group"
                                    >
                                      <span>{locale === 'en' ? 'Learn More' : '了解更多'}</span>
                                      <Icon name="ChevronRight" size="sm" className="group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                  </div>
                                )}

                                {/* Fallback link when no details */}
                                {!hasDetails && (
                                  <div className="flex items-center">
                                    <Link
                                      href={`/${locale}${service.link}`}
                                      className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary-dark transition-colors group"
                                    >
                                      <span>{locale === 'en' ? 'Learn More' : '了解更多'}</span>
                                      <Icon name="ChevronRight" size="sm" className="group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
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
