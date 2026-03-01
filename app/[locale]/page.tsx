import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent, loadSiteInfo, loadContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import type { SiteInfo } from '@/lib/types';
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
    variant: 'centered' | 'split-photo-right' | 'split-photo-left' | 'overlap' | 'photo-background' | 'video-background';
    businessName?: string;
    clinicName?: string;
    tagline: string;
    description: string;
    primaryCta?: { text: string; link: string };
    secondaryCta?: { text: string; link: string };
    image?: string;
    video?: string;
    floatingTags?: string[];
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
  cta?: any;
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}

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
  
  // Load homepage content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<HomePageContent>('home', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('home.layout', locale, siteId);
  const servicesPageData = await loadPageContent<{ categories?: Array<{ id: string; image?: string }> }>('services', locale, siteId);

  if (!content) {
    notFound();
  }

  // Merge category images from services.json into home services
  if (content.services?.services && servicesPageData?.categories) {
    const categoryImageMap = new Map(
      servicesPageData.categories
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
  const defaultSections = [
    'hero',
    'credentials',
    'testimonials',
    'howItWorks',
    'conditions',
    'services',
    'blog',
    'gallery',
    'firstVisit',
    'whyChooseUs',
    'cta',
  ];
  const layoutSections =
    layout?.sections?.map((section) => section.id).filter(Boolean) || defaultSections;

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
            primaryCta={hero.primaryCta}
            secondaryCta={hero.secondaryCta}
            image={hero.image}
            video={hero.video}
            floatingTags={hero.floatingTags}
            stats={hero.stats}
            priority
          />
        );
      case 'credentials':
        return hero.credentials && hero.credentials.length > 0 ? (
          <CredentialsSection credentials={hero.credentials} />
        ) : null;
      case 'testimonials':
        return content.testimonials ? (
          <TestimonialsSection {...content.testimonials} />
        ) : null;
      case 'howItWorks':
        return content.howItWorks ? <HowItWorksSection {...content.howItWorks} /> : null;
      case 'conditions':
        return content.conditions ? <ConditionsSection {...content.conditions} /> : null;
      case 'services':
        return content.services ? <ServicesSection {...content.services} /> : null;
      case 'blog':
        return content.blog ? <BlogPreviewSection locale={locale} {...content.blog} /> : null;
      case 'gallery':
        return content.gallery ? <GalleryPreviewSection {...content.gallery} /> : null;
      case 'firstVisit':
        return content.firstVisit ? <FirstVisitSection {...content.firstVisit} /> : null;
      case 'whyChooseUs':
        return content.whyChooseUs ? <WhyChooseUsSection {...content.whyChooseUs} /> : null;
      case 'cta':
        return content.cta ? <CTASection {...content.cta} /> : null;
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
