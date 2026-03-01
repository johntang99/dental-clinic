import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardContent, Icon } from '@/components/ui';

interface EmergencyPageData {
  hero: {
    title: string;
    subtitle: string;
    phoneDisplay: string;
  };
  whatQualifies: {
    title: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  firstAid: {
    title: string;
    scenarios: Array<{
      condition: string;
      steps: string[];
    }>;
  };
  whenToGoER: {
    title: string;
    description: string;
    items: string[];
  };
  process: {
    title: string;
    steps: Array<{
      number: number;
      title: string;
      description: string;
    }>;
  };
  afterHours: {
    title: string;
    description: string;
  };
}

interface EmergencyPageProps {
  params: { locale: Locale };
}

interface HeaderMenuConfig {
  menu?: { variant?: 'default' | 'centered' | 'transparent' | 'stacked' };
}

export async function generateMetadata({ params }: EmergencyPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<EmergencyPageData>('emergency', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'emergency',
    title: content?.hero?.title,
    description: content?.hero?.subtitle,
  });
}

export default async function EmergencyPage({ params }: EmergencyPageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<EmergencyPageData>('emergency', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');

  if (!content) {
    notFound();
  }

  const { hero, whatQualifies, firstAid, whenToGoER, process, afterHours } = content;
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const heroTopPaddingClass = isTransparentMenu ? 'pt-30 md:pt-36' : 'pt-16 md:pt-20';

  return (
    <main className="min-h-screen">
      {/* Hero — Emergency Banner */}
      <section
        className={`relative bg-gradient-to-br from-red-600 to-red-800 ${heroTopPaddingClass} pb-16 md:pb-20 px-4`}
      >
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-white font-medium text-sm">Urgent Care Available</span>
          </div>
          <h1 className="text-display font-bold text-white mb-4">{hero.title}</h1>
          <p className="text-xl text-white/90 mb-8">{hero.subtitle}</p>
          <a
            href={`tel:+1${hero.phoneDisplay.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-3 bg-white text-red-700 px-8 py-4 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Icon name="phone" size="md" />
            {hero.phoneDisplay}
          </a>
        </div>
      </section>

      {/* What Qualifies */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {whatQualifies.title}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatQualifies.items.map((item, i) => (
                <Card key={i} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <Icon name={item.icon as any} className="text-red-600" size="sm" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* First Aid */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {firstAid.title}
            </h2>
            <div className="space-y-6">
              {firstAid.scenarios.map((scenario, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Icon name="alert-triangle" className="text-amber-500" size="sm" />
                      {scenario.condition}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {scenario.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                            {j + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* When to Go to ER */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Icon name="alert-triangle" className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{whenToGoER.title}</h3>
                <p className="text-gray-700 mb-4">{whenToGoER.description}</p>
                <ul className="space-y-2">
                  {whenToGoER.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <Icon name="chevron-right" className="text-amber-600" size="sm" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Handle Emergencies */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              {process.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {process.steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* After Hours */}
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Icon name="moon" className="text-white/60 mx-auto mb-4" size="lg" />
            <h3 className="text-2xl font-bold text-white mb-4">{afterHours.title}</h3>
            <p className="text-gray-300 leading-relaxed">{afterHours.description}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
