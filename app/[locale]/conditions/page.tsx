import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Tabs } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import { Shield, Heart, Sparkles } from 'lucide-react';

interface ConditionsPageData {
  layoutVariant?: 'categories-tabs' | 'category-detail-alternating';
  hero: {
    variant?: 'centered' | 'split-photo-right' | 'split-photo-left' | 'photo-background';
    title: string;
    subtitle: string;
    backgroundImage?: string;
  };
  introduction: {
    text: string;
    note: string;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    subtitle?: string;
    description: string;
    image?: string;
    order?: number;
  }>;
  conditions: Array<{
    id: string;
    category: string;
    icon: string;
    image?: string;
    title: string;
    description: string;
    symptoms: string[];
    tcmApproach: string;
    treatmentMethods: string[];
    featured?: boolean;
  }>;
  cta: {
    variant?: 'centered' | 'split' | 'banner' | 'card-elevated';
    title: string;
    description: string;
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };
}

interface ConditionsPageProps {
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

function normalizeMarkdown(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\|\s+\|(?=(?:-+:?|:?-+|[A-Za-z0-9"']))/g, '|\n|')
    .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
    .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');
}

export async function generateMetadata({ params }: ConditionsPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ConditionsPageData>('conditions', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'conditions',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function ConditionsPage({ params }: ConditionsPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<ConditionsPageData>('conditions', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('conditions.layout', locale, siteId);
  const blogPosts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, introduction, categories, conditions, cta } = content;
  const conditionsLayoutVariant = content.layoutVariant || 'categories-tabs';
  const sortedCategories = [...categories].sort((a, b) => {
    const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  const blogBySlug = new Map(blogPosts.map((post) => [post.slug, post]));
  const preferredSlugs = [
    'digestive-balance-tcm',
    'seasonal-allergy-support',
    'sleep-restoration-tips',
  ];
  const preferredPosts = preferredSlugs
    .map((slug) => blogBySlug.get(slug))
    .filter((post): post is BlogListItem => Boolean(post));
  const relatedPosts = preferredPosts.length
    ? preferredPosts
    : [...blogPosts]
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .slice(0, 3);
  const reassuranceItems = [
    {
      icon: Shield,
      text: locale === 'en' ? 'Safe, trusted care' : '安全、可信赖',
    },
    {
      icon: Heart,
      text: locale === 'en' ? 'Customer-first approach' : '以客户为先',
    },
    {
      icon: Sparkles,
      text: locale === 'en' ? 'Personalized plans' : '个性化方案',
    },
  ];

  // Group conditions by category
  const conditionsByCategory = sortedCategories.map(category => ({
    ...category,
    conditions: conditions.filter(c => c.category === category.id)
  }));
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
  const renderConditionDetailCard = (condition: ConditionsPageData['conditions'][number]) => (
    <div
      key={condition.id}
      id={condition.id}
      className="bg-white border border-gray-100 rounded-xl p-6 shadow-md hover:border-primary/30 hover:shadow-xl transition-all"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Title and Description */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name={condition.icon as any} className="text-primary" size="sm" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {condition.title}
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            {condition.description}
          </p>
        </div>

        {/* Symptoms */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {locale === 'en' ? 'Common Symptoms' : '常见症状'}
          </h4>
          <div className="space-y-2">
            {condition.symptoms.map((symptom, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Icon name="Check" className="text-primary mt-0.5 flex-shrink-0" size="sm" />
                <span className="text-sm text-gray-600">{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Approach */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {locale === 'en' ? 'Our Approach' : '我们的方案'}
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            {condition.tcmApproach}
          </p>
          <div className="flex flex-wrap gap-2">
            {condition.treatmentMethods.map((method, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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

              {/* Reassurance Row */}
              <div className={`grid sm:grid-cols-3 gap-4 mt-8 ${centeredHero ? 'max-w-3xl mx-auto' : ''}`}>
                {reassuranceItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="flex flex-col items-center sm:items-start gap-3 bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 text-center sm:text-left">
                        {item.text}
                      </span>
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
                    priority
                  />
                ) : (
                  <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 relative p-8">
                    <div className="absolute top-10 left-10 w-24 h-24 bg-primary-50/20 rounded-full"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary-50/20 rounded-full"></div>
                    <div className="absolute top-1/2 right-16 w-20 h-20 bg-primary-100/20 rounded-full"></div>

                    <div className="relative z-10 text-center">
                      <div className="text-8xl mb-6">✨</div>
                      <p className="text-gray-700 font-semibold text-subheading mb-2">
                        {locale === 'en' ? 'Comprehensive Support' : '全面支持'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {locale === 'en' ? 'Structured plans focused on long-term results' : '以长期效果为目标的系统化方案'}
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

      {/* Introduction */}
      {isEnabled('introduction') && (
        <section className="py-12 lg:py-16 bg-white" style={sectionStyle('introduction')}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {introduction.text}
            </p>
            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6">
              <p className="text-gray-700 font-medium flex items-start gap-3">
                <Icon name="Info" className="text-primary mt-0.5 flex-shrink-0" />
                {introduction.note}
              </p>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Featured Conditions */}
      {isEnabled('featured') && (
        <section
          className="py-12 lg:py-16 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('featured')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">
                {locale === 'en' ? 'Most Common' : '最常见'}
              </Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'Frequently Treated Conditions' : '常见治疗病症'}
              </h2>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'These are some of the conditions we see most often with excellent results'
                  : '以下是我们最常见且疗效良好的病症。'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conditions.filter(c => c.featured).map((condition) => (
                <Card key={condition.id} variant="default" hover padding="none" className="h-full overflow-hidden">
                  {condition.image ? (
                    <div className="relative w-full aspect-[4/3] bg-gray-200">
                      <Image
                        src={condition.image}
                        alt={condition.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-primary/5 flex items-center justify-center">
                      <Icon name={condition.icon as any} className="text-primary" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3">
                      <Badge variant="secondary" size="sm">
                        {categories.find(cat => cat.id === condition.category)?.name}
                      </Badge>
                    </div>
                    <h3 className="text-subheading font-bold text-gray-900 mb-2">
                      {condition.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-4">
                      {condition.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {condition.symptoms.slice(0, 4).map((symptom, idx) => (
                        <Badge key={idx} variant="primary" size="sm">
                          {symptom}
                        </Badge>
                      ))}
                      {condition.symptoms.length > 4 && (
                        <Badge variant="primary" size="sm">
                          +{condition.symptoms.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* All Conditions by Category */}
      {isEnabled('categories') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('categories')}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'All Conditions by Category' : '按分类查看全部病症'}
              </h2>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'Browse conditions organized by health category'
                  : '按健康分类浏览病症'}
              </p>
            </div>

            {conditionsLayoutVariant === 'category-detail-alternating' ? (
              <div className="pt-6 space-y-24">
                {conditionsByCategory
                  .filter(
                    (categoryGroup) =>
                      categoryGroup.id !== 'all' && categoryGroup.conditions.length > 0
                  )
                  .map((categoryGroup, categoryIndex) => {
                    const categoryImage =
                      categoryGroup.image ||
                      categoryGroup.conditions.find((condition) => Boolean(condition.image))?.image;
                    const imageOnRight = categoryIndex % 2 === 0;
                    return (
                      <div key={categoryGroup.id} className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                          <div className={imageOnRight ? 'lg:order-1' : 'lg:order-2'}>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-4">
                              <Icon name={categoryGroup.icon as any} size="sm" />
                              <span>{categoryGroup.name}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">
                              {categoryGroup.name}
                            </h3>
                            {categoryGroup.subtitle && (
                              <p className="text-base font-semibold text-gray-800 mb-3">
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
                            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-gradient-to-br from-gray-50 to-white">
                              {categoryImage ? (
                                <Image
                                  src={categoryImage}
                                  alt={categoryGroup.name}
                                  width={1200}
                                  height={780}
                                  className="w-full h-auto object-cover"
                                />
                              ) : (
                                <div className="aspect-[16/9] w-full flex items-center justify-center">
                                  <Icon name={categoryGroup.icon as any} className="text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {categoryGroup.conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Tabs
                defaultValue="all"
                variant="pills"
                items={[
                  {
                    value: 'all',
                    label: locale === 'en' ? 'All Conditions' : '全部病症',
                    content: (
                      <div className="pt-8">
                        <div className="grid gap-6">
                          {conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    ),
                  },
                  ...sortedCategories.map(category => ({
                    value: category.id,
                    label: category.name,
                    icon: category.icon as any,
                    content: (
                      <div className="pt-8">
                        <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-transparent rounded-xl">
                          {category.subtitle && (
                            <p className="text-sm font-semibold text-gray-900 mb-1">{category.subtitle}</p>
                          )}
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                              }}
                            >
                              {normalizeMarkdown(String(category.description || ''))}
                            </ReactMarkdown>
                          </div>
                        </div>

                        <div className="grid gap-6">
                          {conditionsByCategory
                            .find(cat => cat.id === category.id)
                            ?.conditions.map((condition) => renderConditionDetailCard(condition))}
                        </div>
                      </div>
                    ),
                  })),
                ]}
              />
            )}
          </div>
        </div>
        </section>
      )}

      {/* Related Reading */}
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
                    {locale === 'en' ? 'Related Reading' : '相关阅读'}
                  </h2>
                  <p className="text-gray-600">
                    {locale === 'en'
                      ? 'Learn more about common needs and practical support options.'
                      : '了解常见需求与可行的支持方案。'}
                  </p>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="text-primary font-semibold hover:text-primary-dark"
                >
                  {locale === 'en' ? 'View all' : '查看全部'}
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/${locale}/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <Badge variant="secondary" size="sm">
                          {post.category || (locale === 'en' ? 'Wellness' : '健康')}
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

      {isEnabled('cta') && (
        <div style={sectionStyle('cta')}>
          <CTASection
            title={cta.title}
            subtitle={cta.description}
            primaryCta={cta.primaryCta}
            secondaryCta={cta.secondaryCta}
            variant={cta.variant || 'centered'}
            className="py-16"
          />
        </div>
      )}
    </main>
  );
}
