import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, Accordion } from '@/components/ui';
import CTASection from '@/components/sections/CTASection';

interface InsurancePageData {
  hero: {
    title: string;
    subtitle: string;
  };
  howInsuranceWorks: {
    title: string;
    body: string;
  };
  networkInfo: {
    title: string;
    body: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

interface InsuranceListData {
  insurances: Array<{
    id: string;
    name: string;
    icon: string;
    acceptanceLevel: string;
    coverage: string;
    description: string;
  }>;
  financing: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    interestRate?: string;
    terms?: string;
  }>;
  membershipPlan: {
    name: string;
    price: string;
    description: string;
    includes: string[];
  };
}

interface InsurancePageProps {
  params: { locale: Locale };
}

interface HeaderMenuConfig {
  menu?: { variant?: 'default' | 'centered' | 'transparent' | 'stacked' };
}

export async function generateMetadata({ params }: InsurancePageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<InsurancePageData>('insurance', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'insurance',
    title: content?.hero?.title,
    description: content?.hero?.subtitle,
  });
}

export default async function InsurancePage({ params }: InsurancePageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<InsurancePageData>('insurance', locale, siteId);
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');

  // Load insurance list from the insurance directory
  const lists = await loadAllItems<InsuranceListData>(siteId, locale, 'insurance');
  const listData = lists[0] || null;

  if (!content) {
    notFound();
  }

  const { hero, howInsuranceWorks, networkInfo, faqs } = content;
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';
  const heroTopPaddingClass = isTransparentMenu ? 'pt-30 md:pt-36' : 'pt-16 md:pt-20';

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className={`relative bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)] ${heroTopPaddingClass} pb-16 md:pb-20 px-4`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="primary" className="mb-6">Insurance & Payment</Badge>
          <h1 className="text-display font-bold text-gray-900 mb-6">{hero.title}</h1>
          <p className="text-subheading text-[var(--brand)] font-medium">{hero.subtitle}</p>
        </div>
      </section>

      {/* How Insurance Works + Network Info */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name="shield-check" className="text-primary" />
                </div>
                <CardTitle className="text-xl">{howInsuranceWorks.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {howInsuranceWorks.body.split('\n\n').map((p, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name="globe" className="text-primary" />
                </div>
                <CardTitle className="text-xl">{networkInfo.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {networkInfo.body.split('\n\n').map((p, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Accepted Insurance Providers */}
      {listData?.insurances && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-heading font-bold text-gray-900 mb-4">Accepted Insurance Plans</h2>
                <p className="text-gray-600">We are in-network with most major PPO dental plans</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {listData.insurances.map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <Icon name={ins.icon as any} className="text-green-600" size="sm" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{ins.name}</h4>
                    <p className="text-xs text-gray-500">{ins.coverage}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 text-center mt-6">
                Don't see your plan? Call us — we may still accept it.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Membership Plan */}
      {listData?.membershipPlan && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[var(--backdrop-secondary)] to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="ring-2 ring-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-1">{listData.membershipPlan.name}</h3>
                  <p className="text-white/80">{listData.membershipPlan.description}</p>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-primary">{listData.membershipPlan.price}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {listData.membershipPlan.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Icon name="check" className="text-green-500 flex-shrink-0" size="sm" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="block text-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Learn More
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Financing Options */}
      {listData?.financing && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-heading font-bold text-gray-900 mb-4">Flexible Financing</h2>
                <p className="text-gray-600">Make dental care affordable with monthly payment options</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {listData.financing.map((option) => (
                  <Card key={option.id}>
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                        <Icon name={option.icon as any} className="text-secondary" />
                      </div>
                      <CardTitle className="text-lg">{option.name}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {option.interestRate && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Rate:</strong> {option.interestRate}
                        </p>
                      )}
                      {option.terms && (
                        <p className="text-sm text-gray-600">
                          <strong>Terms:</strong> {option.terms}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-heading font-bold text-gray-900 mb-10 text-center">
              Common Questions
            </h2>
            <Accordion
              items={faqs.map((faq, i) => ({
                id: `faq-${i}`,
                title: faq.question,
                content: faq.answer,
              }))}
              allowMultiple
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Questions About Your Coverage?"
        subtitle="Call us and we'll verify your benefits before your visit — no surprises."
        primaryCta={{ text: "Contact Us", link: "/contact" }}
        secondaryCta={{ text: "Call (845) 555-0180", link: "tel:+18455550180" }}
        variant="centered"
        className="py-16"
      />
    </main>
  );
}
