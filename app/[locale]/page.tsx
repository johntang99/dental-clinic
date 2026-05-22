import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent, loadSiteInfo, loadContent, loadAllItems } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import type { SiteInfo, BlogPost } from '@/lib/types';
import HeroSection, { CredentialsSection } from '@/components/sections/HeroSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import ConditionsSection from '@/components/sections/ConditionsSection';
import ServicesSection from '@/components/sections/ServicesSection';
import BlogPreviewSection from '@/components/sections/BlogPreviewSection';
import GalleryPreviewSection from '@/components/sections/GalleryPreviewSection';
import FirstVisitSection from '@/components/sections/FirstVisitSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import CTASection from '@/components/sections/CTASection';
import CaseStudiesPreviewSection from '@/components/sections/CaseStudiesPreviewSection';
import SeoHubLinksSection from '@/components/sections/SeoHubLinksSection';
import { getSiteDisplayName } from '@/lib/siteInfo';

interface PageProps {
  params: {
    locale: Locale;
  };
}

interface HomePageContent {
  topBar?: {
    badge?: {
      text: string;
      visible?: boolean;
    };
  };
  hero: {
    variant:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'overlap'
      | 'photo-background'
      | 'photo-screenwide-top'
      | 'video-background'
      | 'gallery-background'
      | 'gallery-screenwide-top'
      | 'smile-draw';
    businessName?: string;
    clinicName?: string;
    tagline: string;
    description: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
    image?: string;
    video?: string;
    gallery?: string[];
    floatingTags?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
    screenwideHeightDesktop?: number;
    stats?: Array<{
      icon?: string;
      number: string;
      label: string;
    }>;
    credentials?: Array<{
      icon: string;
      text: string;
    }>;
  };
  testimonials?: any;
  howItWorks?: any;
  conditions?: any;
  services?: any;
  blog?: any;
  gallery?: any;
  firstVisit?: any;
  whyChooseUs?: any;
  caseStudies?: any;
  seoHub?: {
    badge?: string;
    title: string;
    subtitle?: string;
    links: Array<{ text: string; url: string }>;
  };
  cta?: any;
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

const huOrthodonticsSeoHubDefault = {
  badge: '本地专题入口',
  title: '法拉盛 / 大颈牙齿矫正专题',
  subtitle: '快速进入牙齿矫正高需求页面：门诊入口、隐适美、牙套、费用与问题总览。',
  links: [
    { text: '法拉盛牙齿矫正', url: '/zh/flushing-orthodontist' },
    { text: '大颈牙齿矫正', url: '/zh/great-neck-orthodontist' },
    { text: '法拉盛隐适美', url: '/zh/flushing-invisalign' },
    { text: '大颈隐适美', url: '/zh/great-neck-invisalign' },
    { text: '法拉盛成人正畸', url: '/zh/flushing-adult-orthodontics' },
    { text: '大颈青少年正畸', url: '/zh/great-neck-teen-orthodontics' },
    { text: '法拉盛传统牙套', url: '/zh/flushing-traditional-braces' },
    { text: '大颈传统牙套', url: '/zh/great-neck-traditional-braces' },
    { text: '法拉盛正畸费用', url: '/zh/flushing-orthodontics-cost' },
    { text: '大颈正畸费用', url: '/zh/great-neck-orthodontics-cost' },
    { text: '法拉盛问题总览', url: '/zh/flushing-conditions' },
    { text: '大颈问题总览', url: '/zh/great-neck-conditions' },
  ],
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const [content, siteInfo] = await Promise.all([
    loadPageContent<HomePageContent>('home', locale, siteId),
    loadSiteInfo(siteId, locale as Locale) as Promise<SiteInfo | null>,
  ]);

  const businessName = getSiteDisplayName(siteInfo, 'Business');
  const location = siteInfo?.city && siteInfo?.state
    ? `${siteInfo.city}, ${siteInfo.state}`
    : '';
  const heroTagline = content?.hero?.tagline || '';
  const title = [heroTagline, location, businessName]
    .filter(Boolean)
    .join(' | ')
    .trim();

  const description =
    content?.hero?.description ||
    siteInfo?.description ||
    'Professional services tailored to your needs and goals.';

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'home',
    title: title || businessName,
    description,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = params;
  const getLocalizedUrl = (url?: string) => {
    if (!url || !url.startsWith('/')) return url;
    if (url === `/${locale}` || url.startsWith(`/${locale}/`)) return url;
    return `/${locale}${url}`;
  };
  const localizeCta = <T extends { text: string; link: string },>(cta?: T) =>
    cta ? { ...cta, link: getLocalizedUrl(cta.link) || cta.link } : undefined;
  
  // Load homepage content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<HomePageContent>('home', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('home.layout', locale, siteId);
  const servicesPageData = await loadPageContent<{ categories?: Array<{ id: string; image?: string }> }>('services', locale, siteId);
  const blogPosts = await loadAllItems<BlogPost>(siteId, locale, 'blog');
  const caseStudiesPage = await loadPageContent<{ caseStudies?: any[] }>('case-studies', locale, siteId);
  const testimonialsData = await loadContent<any[]>(siteId, locale as Locale, 'testimonials.json') || [];

  if (!content) {
    notFound();
  }

  // Ensure hu-orthodontics homepage keeps a stable local SEO hub set and order.
  if (siteId === 'hu-orthodontics' && locale === 'zh') {
    const currentSeoHub = content.seoHub;
    const existingLinks: Array<{ text: string; url: string }> = Array.isArray(currentSeoHub?.links)
      ? currentSeoHub.links
      : [];
    const existingByUrl = new Map(existingLinks.map((link) => [link.url, link]));
    const normalizedLinks = huOrthodonticsSeoHubDefault.links.map(
      (link) => existingByUrl.get(link.url) ?? link
    );
    content.seoHub = {
      ...huOrthodonticsSeoHubDefault,
      ...(currentSeoHub ?? {}),
      links: normalizedLinks,
    };
  }

  // Auto-populate blog posts on homepage from blog directory
  if (content.blog) {
    const publishedPosts = blogPosts
      .filter((p) => p.published !== false)
      .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));
    const homePosts =
      content.blog.posts && content.blog.posts.length > 0
        ? content.blog.posts
        : publishedPosts.slice(0, 3);
    content.blog = { ...content.blog, posts: homePosts };
  }

  // Merge category images from services.json into home services.
  if (content.services?.services) {
    const categoryImageMap = new Map(
      (servicesPageData?.categories || [])
        .filter((c) => c.image)
        .map((c) => [c.id, c.image])
    );
    content.services.services = content.services.services.map((service: any) => {
      if (!service.image && service.id && categoryImageMap.has(service.id)) {
        return { ...service, image: categoryImageMap.get(service.id) };
      }
      return service;
    });
  }

  const { hero } = content;
  const heroBusinessName = hero.businessName || hero.clinicName || 'Business';
  const localizedHeroPrimaryCta = localizeCta(hero.primaryCta);
  const localizedHeroSecondaryCta = localizeCta(hero.secondaryCta);
  const localizedSectionCtaPrimary = localizeCta(content.cta?.primaryCta);
  const localizedSectionCtaSecondary = localizeCta(content.cta?.secondaryCta);
  const defaultSections = [
    'hero',
    'credentials',
    'testimonials',
    'howItWorks',
    'conditions',
    'services',
    'seoHub',
    'blog',
    'gallery',
    'firstVisit',
    'whyChooseUs',
    'caseStudies',
    'cta',
  ];
  const layoutSections =
    layout?.sections?.map((section) => section.id).filter(Boolean) || defaultSections;
  if (content.seoHub && !layoutSections.includes('seoHub')) {
    const servicesIndex = layoutSections.indexOf('services');
    if (servicesIndex >= 0) {
      layoutSections.splice(servicesIndex + 1, 0, 'seoHub');
    } else {
      layoutSections.push('seoHub');
    }
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <HeroSection
            variant={hero.variant}
            businessName={heroBusinessName}
            tagline={hero.tagline}
            description={hero.description}
            badgeText={content.topBar?.badge?.visible ? content.topBar.badge.text : undefined}
            primaryCta={localizedHeroPrimaryCta}
            secondaryCta={localizedHeroSecondaryCta}
            image={hero.image}
            video={hero.video}
            gallery={Array.isArray(hero.gallery) ? hero.gallery : undefined}
            floatingTags={hero.floatingTags}
            stats={hero.stats}
            photoOverlayOpacity={
              typeof hero.photoOverlayOpacity === 'number' ? hero.photoOverlayOpacity : 0.2
            }
            photoContentPosition={
              hero.photoContentPosition === 'center' ||
              hero.photoContentPosition === 'center-below' ||
              hero.photoContentPosition === 'left' ||
              hero.photoContentPosition === 'left-below' ||
              hero.photoContentPosition === 'lower'
                ? hero.photoContentPosition
                : 'left-below'
            }
            screenwideHeightDesktop={
              typeof hero.screenwideHeightDesktop === 'number'
                ? hero.screenwideHeightDesktop
                : undefined
            }
            priority
          />
        );
      case 'credentials':
        return hero.credentials && hero.credentials.length > 0 ? (
          <CredentialsSection credentials={hero.credentials} />
        ) : null;
      case 'testimonials': {
        if (!content.testimonials) return null;
        // Auto-populate testimonials from testimonials.json if not inline
        const rawTestimonials = Array.isArray(testimonialsData) ? testimonialsData : (testimonialsData as any)?.testimonials || [];
        const testimonialsList = content.testimonials.testimonials?.length > 0
          ? content.testimonials.testimonials
          : rawTestimonials
              .filter((t: any) => t.language === locale || !t.language)
              .map((t: any) => ({ quote: t.text, name: t.patientName, condition: t.serviceCategory }));
        return (
          <TestimonialsSection
            {...content.testimonials}
            testimonials={testimonialsList}
          />
        );
      }
      case 'howItWorks':
        return content.howItWorks ? <HowItWorksSection {...content.howItWorks} /> : null;
      case 'conditions':
        return content.conditions ? <ConditionsSection {...content.conditions} /> : null;
      case 'services':
        return content.services ? <ServicesSection {...content.services} /> : null;
      case 'seoHub':
        return content.seoHub ? <SeoHubLinksSection {...content.seoHub} /> : null;
      case 'blog':
        return content.blog ? <BlogPreviewSection locale={locale} {...content.blog} /> : null;
      case 'gallery':
        return content.gallery ? <GalleryPreviewSection {...content.gallery} /> : null;
      case 'caseStudies':
        return content.caseStudies ? (
          <CaseStudiesPreviewSection
            locale={locale}
            {...content.caseStudies}
            cases={caseStudiesPage?.caseStudies?.filter((c: any) => c.image).slice(0, 3) || []}
          />
        ) : null;
      case 'firstVisit':
        return content.firstVisit ? <FirstVisitSection {...content.firstVisit} /> : null;
      case 'whyChooseUs':
        return content.whyChooseUs ? <WhyChooseUsSection {...content.whyChooseUs} /> : null;
      case 'cta':
        return content.cta ? (
          <CTASection
            {...content.cta}
            primaryCta={localizedSectionCtaPrimary}
            secondaryCta={localizedSectionCtaSecondary}
          />
        ) : null;
      default:
        return null;
    }
  };
  
  return (
    <main>
      {layoutSections.map((sectionId, index) => (
        <Fragment key={`${sectionId}-${index}`}>{renderSection(sectionId)}</Fragment>
      ))}
    </main>
  );
}
