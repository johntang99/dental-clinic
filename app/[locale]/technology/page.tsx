import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface TechnologyPageData {
  hero: {
    title: string;
    subtitle: string;
    variant?: string;
    backgroundImage?: string;
  };
  whyItMatters: {
    title: string;
    description: string;
  };
}

interface TechnologyListData {
  technologies: Array<{
    id: string;
    icon: string;
    name: string;
    benefit: string;
    description: string;
    featured?: boolean;
  }>;
}

interface TechnologyPageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params }: TechnologyPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<TechnologyPageData>('technology', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'technology',
    title: content?.hero?.title,
    description: content?.hero?.subtitle,
  });
}

export default async function TechnologyPage({ params }: TechnologyPageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<TechnologyPageData>('technology', locale, siteId);

  // Load technology list
  const lists = await loadAllItems<TechnologyListData>(siteId, locale, 'technology');
  const listData = lists[0] || null;

  if (!content) {
    notFound();
  }

  const { hero, whyItMatters } = content;
  const technologies = listData?.technologies || [];
  const featuredTech = technologies.filter((t) => t.featured);
  const otherTech = technologies.filter((t) => !t.featured);
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <HeroSection
        variant={(hero.variant as HeroVariant) || 'centered'}
        tagline={hero.title}
        description={hero.subtitle}
        badgeText="Our Technology"
        image={hero.backgroundImage || undefined}
      />

      {/* Why It Matters */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-heading font-bold text-gray-900 mb-6">{whyItMatters.title}</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{whyItMatters.description}</p>
          </div>
        </div>
      </section>

      {/* Featured Technologies */}
      {featuredTech.length > 0 && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[var(--backdrop-secondary)] to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="secondary" className="mb-4">Featured</Badge>
                <h2 className="text-heading font-bold text-gray-900">Key Technologies</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredTech.map((tech) => (
                  <Card key={tech.id} className="ring-1 ring-primary/10">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon name={tech.icon as any} className="text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-1">{tech.name}</CardTitle>
                          <Badge variant="primary" size="sm">{tech.benefit}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{tech.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Additional Technologies */}
      {otherTech.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
                More Technology We Use
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {otherTech.map((tech) => (
                  <div key={tech.id} className="text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Icon name={tech.icon as any} className="text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{tech.name}</h4>
                    <p className="text-sm text-primary font-medium mb-2">{tech.benefit}</p>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection
        title="Experience the Difference"
        subtitle="See our technology in action — schedule a visit and experience modern dental care."
        primaryCta={{ text: "Book Appointment", link: "/contact" }}
        secondaryCta={{ text: "Call (845) 555-0180", link: "tel:+18455550180" }}
        variant="centered"
        className="py-16"
      />
    </main>
  );
}
