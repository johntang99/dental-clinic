import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { getRequestSiteId, loadPageContent, loadSiteInfo } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale, SiteInfo } from '@/lib/types';
import { getSiteDisplayName } from '@/lib/siteInfo';
import { resolveMediaUrl } from '@/lib/media-url';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';
import { CheckCircle2, MapPin, Clock } from 'lucide-react';

interface AboutPageData {
  hero: {
    variant?: 'centered' | 'split-photo-right' | 'split-photo-left' | 'photo-background';
    title: string;
    subtitle: string;
    description?: string;
    backgroundImage?: string;
  };
  profile: {
    variant?: 'split' | 'stacked';
    name: string;
    title: string;
    image: string;
    bio: string;
    quote: string;
    signature?: string;
  };
  credentials: {
    variant?: 'list' | 'grid';
    title: string;
    items: Array<{
      icon: string;
      credential: string;
      institution: string;
      year: string;
      location: string;
    }>;
  };
  specializations: {
    variant?: 'grid-2' | 'grid-3' | 'list';
    title: string;
    description: string;
    areas: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  philosophy: {
    variant?: 'cards' | 'timeline';
    title: string;
    introduction: string;
    principles: Array<{
      title: string;
      description: string;
    }>;
  };
  journey: {
    variant?: 'prose' | 'card';
    title: string;
    story: string;
  };
  affiliations: {
    variant?: 'compact' | 'detailed';
    title: string;
    organizations: Array<{
      name: string;
      role: string;
    }>;
  };
  continuingEducation: {
    variant?: 'compact' | 'detailed';
    title: string;
    description: string;
    items: string[];
  };
  clinic: {
    variant?: 'split' | 'cards';
    title: string;
    description: string | string[];
    features?: string[];
    values: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    environment: string;
  };
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

interface AboutPageProps {
  params: {
    locale: Locale;
  };
}

interface ContactHoursSchedule {
  day: string;
  time: string;
  isOpen: boolean;
  note?: string;
}

interface ContactPageData {
  hours?: {
    title?: string;
    schedule: ContactHoursSchedule[];
    note?: string;
  };
}

interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}


function isSparseAboutContent(content: AboutPageData | null): boolean {
  if (!content) return true;

  const hasProfileBio = Boolean(content.profile?.bio?.trim());
  const hasCredentials = Array.isArray(content.credentials?.items) && content.credentials.items.length > 0;
  const hasSpecializations =
    Array.isArray(content.specializations?.areas) && content.specializations.areas.length > 0;
  const hasPhilosophy =
    Array.isArray(content.philosophy?.principles) && content.philosophy.principles.length > 0;
  const hasJourney = Boolean(content.journey?.story?.trim());
  const hasAffiliations =
    Array.isArray(content.affiliations?.organizations) && content.affiliations.organizations.length > 0;
  const hasContinuingEducation =
    Array.isArray(content.continuingEducation?.items) && content.continuingEducation.items.length > 0;
  const hasBusinessValues = Array.isArray(content.clinic?.values) && content.clinic.values.length > 0;

  return !(
    hasProfileBio &&
    hasCredentials &&
    hasSpecializations &&
    hasPhilosophy &&
    hasJourney &&
    hasAffiliations &&
    hasContinuingEducation &&
    hasBusinessValues
  );
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<AboutPageData>('about', locale, siteId);
  const title = content?.hero?.title;
  const description = content?.hero?.description || content?.hero?.subtitle;

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'about',
    title,
    description,
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  let content = await loadPageContent<AboutPageData>('about', locale, siteId);
  if (isSparseAboutContent(content)) {
    try {
      const localPath = path.join(
        process.cwd(),
        'content',
        siteId,
        locale,
        'pages',
        'about.json'
      );
      const raw = await fs.readFile(localPath, 'utf-8');
      const localContent = JSON.parse(raw) as AboutPageData;
      if (!isSparseAboutContent(localContent)) {
        content = localContent;
      }
    } catch {
      // Ignore local fallback read errors; keep DB content.
    }
  }
  const layout = await loadPageContent<PageLayoutConfig>('about.layout', locale, siteId);
  const contactContent = await loadPageContent<ContactPageData>('contact', locale, siteId);
  const siteInfo = await loadSiteInfo(siteId, locale) as SiteInfo | null;
  
  if (!content) {
    notFound();
  }

  const hero = content.hero || {
    variant: 'split-photo-right',
    title: locale === 'en' ? 'About Us' : '关于我们',
    subtitle: '',
    description: '',
    backgroundImage: '',
  };
  const profile = content.profile || {
    variant: 'split',
    name: getSiteDisplayName(siteInfo, 'Our Team'),
    title: siteInfo?.tagline || '',
    image: '',
    bio: '',
    quote: '',
    signature: '',
  };
  const credentials = content.credentials || {
    variant: 'list',
    title: locale === 'en' ? 'Credentials' : '资质',
    items: [],
  };
  const specializations = content.specializations || {
    variant: 'grid-2',
    title: locale === 'en' ? 'Specializations' : '专业领域',
    description: '',
    areas: [],
  };
  const philosophy = content.philosophy || {
    variant: 'cards',
    title: locale === 'en' ? 'Philosophy' : '理念',
    introduction: '',
    principles: [],
  };
  const journey = content.journey || {
    variant: 'prose',
    title: locale === 'en' ? 'Journey' : '经历',
    story: '',
  };
  const affiliations = content.affiliations || {
    variant: 'compact',
    title: locale === 'en' ? 'Affiliations' : '协会会员',
    organizations: [],
  };
  const continuingEducation = content.continuingEducation || {
    variant: 'compact',
    title: locale === 'en' ? 'Continuing Education' : '继续教育',
    description: '',
    items: [],
  };
  const businessSection = content.clinic || {
    variant: 'split',
    title: locale === 'en' ? 'About Our Business' : '关于我们',
    description: '',
    features: [],
    values: [],
    environment: '',
  };
  const cta = {
    variant: content.cta?.variant || 'centered',
    title: content.cta?.title || (locale === 'en' ? 'Ready to get started?' : '准备好开始了吗？'),
    description: content.cta?.description || '',
    primaryCta: {
      text: content.cta?.primaryCta?.text || (locale === 'en' ? 'Get Started' : '立即开始'),
      link: content.cta?.primaryCta?.link || `/${locale}/book`,
    },
    secondaryCta: {
      text: content.cta?.secondaryCta?.text || (locale === 'en' ? 'Contact Us' : '联系我们'),
      link: content.cta?.secondaryCta?.link || 'tel:+18453811106',
    },
  };
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;
  const resolvedHeroBackgroundImage = resolveMediaUrl(hero.backgroundImage);
  const resolvedProfileImage = resolveMediaUrl(profile.image);
  const profileVariant = profile.variant || 'split';
  const credentialsVariant = credentials.variant || 'list';
  const specializationsVariant = specializations.variant || 'grid-2';
  const philosophyVariant = philosophy.variant || 'cards';
  const journeyVariant = journey.variant || 'prose';
  const affiliationsVariant = affiliations.variant || 'compact';
  const continuingEducationVariant = continuingEducation.variant || 'compact';
  const businessSectionVariant = businessSection.variant || 'split';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {isEnabled('hero') && (
        <HeroSection
          variant={(hero.variant as HeroVariant) || 'split-photo-right'}
          tagline={hero.title}
          description={hero.subtitle}
          image={resolvedHeroBackgroundImage || undefined}
          priority
        />
      )}

      {/* Profile Section */}
      {isEnabled('profile') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('profile')}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className={profileVariant === 'stacked' ? 'space-y-10' : 'grid lg:grid-cols-5 gap-12 items-start'}>
              {/* Photo */}
              <div className={profileVariant === 'stacked' ? 'max-w-md mx-auto' : 'lg:col-span-2'}>
                <div className="sticky top-8">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl mb-6 bg-gray-100">
                    {resolvedProfileImage ? (
                      <Image
                        src={resolvedProfileImage}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Icon name="User" size="xl" className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-heading font-bold text-gray-900 mb-2">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 mb-6">{profile.title}</p>
                    <div className="flex gap-4 justify-center">
                      <Button asChild size="sm">
                        <Link href={cta.primaryCta.link}>Get Started</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={cta.secondaryCta.link}>Contact Us</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Content */}
              <div className={profileVariant === 'stacked' ? 'max-w-3xl mx-auto space-y-8 text-center' : 'lg:col-span-3 space-y-8'}>
                <div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {profile.bio}
                  </p>
                  
                  {/* Quote */}
                  <div className="bg-gradient-to-br from-primary/5 to-backdrop-primary border-l-4 border-primary rounded-r-2xl p-8">
                    <blockquote className="text-xl italic text-gray-800 mb-4">
                      "{profile.quote}"
                    </blockquote>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{profile.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Credentials */}
      {isEnabled('credentials') && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('credentials')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Qualifications</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {credentials.title}
              </h2>
            </div>

            <div className={credentialsVariant === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'grid gap-4'}>
              {credentials.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon as any} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.credential}
                      </h3>
                      <p className="text-gray-700 mb-2">{item.institution}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size="sm" />
                          {item.year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" size="sm" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Specializations */}
      {isEnabled('specializations') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('specializations')}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Expertise</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {specializations.title}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {specializations.description}
              </p>
            </div>

            <div
              className={
                specializationsVariant === 'grid-3'
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : specializationsVariant === 'list'
                    ? 'grid gap-4'
                    : 'grid md:grid-cols-2 gap-6'
              }
            >
              {specializations.areas.map((area, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon name={area.icon as any} className="text-primary" />
                    </div>
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Philosophy */}
      {isEnabled('philosophy') && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-backdrop-primary"
          style={sectionStyle('philosophy')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Philosophy</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {philosophy.title}
              </h2>
              <p className="text-lg text-gray-700">
                {philosophy.introduction}
              </p>
            </div>

            <div className={philosophyVariant === 'timeline' ? 'space-y-4' : 'grid md:grid-cols-2 gap-6'}>
              {philosophy.principles.map((principle, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-sm ${
                    philosophyVariant === 'timeline' ? 'border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 pt-0.5">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Journey Story */}
      {isEnabled('journey') && (
        <section className="py-16 lg:py-24 bg-white" style={sectionStyle('journey')}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">My Story</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {journey.title}
              </h2>
            </div>

            <div className={journeyVariant === 'card' ? 'bg-white rounded-2xl p-8 shadow-sm border border-gray-100' : 'prose prose-lg max-w-none'}>
              {journey.story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      {/* Affiliations & Continuing Ed */}
      {isEnabled('affiliationsEducation') && (
        <section
          className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white"
          style={sectionStyle('affiliationsEducation')}
        >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className={affiliationsVariant === 'detailed' || continuingEducationVariant === 'detailed' ? 'grid md:grid-cols-2 gap-12' : 'grid md:grid-cols-2 gap-8'}>
              {/* Affiliations */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-6">
                  {affiliations.title}
                </h2>
                <div className="space-y-4">
                  {affiliations.organizations.map((org, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-lg p-4 border border-gray-100 ${
                        affiliationsVariant === 'detailed' ? 'shadow-sm' : ''
                      }`}
                    >
                      <p className="font-semibold text-gray-900 mb-1">
                        {org.name}
                      </p>
                      <p className="text-sm text-gray-600">{org.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continuing Education */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-4">
                  {continuingEducation.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {continuingEducation.description}
                </p>
                <ul className={continuingEducationVariant === 'detailed' ? 'space-y-4' : 'space-y-3'}>
                  {continuingEducation.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* About the Business */}
      {isEnabled('clinic') && (
        <section className="py-20 px-4 bg-gray-50" style={sectionStyle('clinic')}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">{businessSection.title}</h2>

          {/* Description */}
          <div className="max-w-3xl mx-auto mb-12">
            {(Array.isArray(businessSection.description)
              ? businessSection.description
              : businessSection.description.split('\n\n')
            ).map((paragraph, idx) => (
              <p key={idx} className="text-subheading text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className={businessSectionVariant === 'cards' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid lg:grid-cols-2 gap-8'}>
            {/* Features List */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
              <h3 className="text-subheading font-bold text-gray-900 mb-6">
                {locale === 'en' ? 'Business Features' : '业务特色'}
              </h3>
              <ul className="space-y-3">
                {(businessSection.features && businessSection.features.length > 0
                  ? businessSection.features
                  : businessSection.values.map(value => value.title)
                ).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location & Hours */}
            <div className={`space-y-6 ${businessSectionVariant === 'cards' ? 'md:col-span-2 lg:col-span-2' : ''}`}>
              {/* Location Card */}
              <div className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] border-2 border-gray-200 rounded-xl p-8">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Location' : '地址'}
                  </h3>
                </div>
                <p className="text-gray-700 mb-2">{siteInfo?.address}</p>
                <p className="text-gray-700 mb-4">
                  {siteInfo?.city}, {siteInfo?.state} {siteInfo?.zip}
                </p>
                {siteInfo?.addressMapUrl && (
                  <a
                    href={siteInfo.addressMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:text-primary-dark font-semibold text-small"
                  >
                    {locale === 'en' ? 'Get Directions' : '获取路线'} →
                  </a>
                )}
              </div>

              {/* Hours Card */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
                <div className="flex items-start gap-3 mb-4">
                  <Clock className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Office Hours' : '营业时间'}
                  </h3>
                </div>
                <div className="space-y-2">
                  {(contactContent?.hours?.schedule || []).map((hour, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span className="font-medium">{hour.day}</span>
                      <span>{hour.time}</span>
                    </div>
                  ))}
                </div>
              </div>
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
