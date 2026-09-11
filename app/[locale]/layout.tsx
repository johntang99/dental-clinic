import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locales, type Locale } from '@/lib/i18n';
import { getDefaultSite, getSiteById } from '@/lib/sites';
import {
  getRequestSiteId,
  loadContent,
  loadFooter,
  loadSeo,
  loadTheme,
  loadSiteInfo,
  loadAllItems,
} from '@/lib/content';
import type { FooterSection, SeoConfig, SiteInfo } from '@/lib/types';

/** Shape the Physician block reads from content/<site>/<locale>/doctors/*. */
type DoctorContent = {
  name?: string;
  nameEN?: string;
  title?: string;
  role?: string;
  image?: string;
  bio?: string;
  featured?: boolean;
  order?: number;
  languages?: string[];
  credentials?: { credential?: string }[];
  certifications?: string[];
};
import Header, { type HeaderConfig } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBaseUrlFromHost, resolveSeoLocalesForPage } from '@/lib/seo';
import { getSiteDisplayName } from '@/lib/siteInfo';
import {
  buildLocalBusinessSchema,
  buildPhysicianSchema,
  pruneSchema,
  type SiteInfoForSchema,
} from '@/lib/structured-data';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  const locale = params.locale as Locale;

  if (!site) {
    return {
      metadataBase: baseUrl,
      title: 'Business Website',
      description: 'Multi-site business website',
      icons: {
        icon: '/icon',
        shortcut: '/icon',
        apple: '/icon',
      },
    };
  }

  const [siteInfo, seo, headerForOg] = await Promise.all([
    loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale) as Promise<SeoConfig | null>,
    loadContent<HeaderConfig>(site.id, locale, 'header.json'),
  ]);
  // Without og:image every share of this page is a grey box. Prefer a real
  // configured image; fall back to the site's own logo rather than nothing.
  const ogImage = seo?.ogImage || headerForOg?.menu?.logo?.image?.src || undefined;
  const titleBase = getSiteDisplayName(siteInfo, site.name);
  const description =
    seo?.description ||
    siteInfo?.description ||
    'Professional services, scheduling, and customer support.';
  const titleDefault = seo?.title || titleBase;
  const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const activeLocales = await resolveSeoLocalesForPage({
    siteId: site.id,
    candidateLocales: siteLocales,
    slug: 'home',
  });
  const xDefaultLocale = activeLocales.includes(site.defaultLocale)
    ? site.defaultLocale
    : activeLocales[0] || locale;
  const isIndexableLocale = activeLocales.includes(locale);
  const canonicalUrl = new URL(`/${isIndexableLocale ? locale : xDefaultLocale}`, baseUrl).toString();
  const languageAlternates = activeLocales.reduce<Record<string, string>>((acc, entry) => {
    acc[entry] = new URL(`/${entry}`, baseUrl).toString();
    return acc;
  }, {});

  return {
    metadataBase: baseUrl,
    title: {
      default: titleDefault,
      template: `%s | ${titleBase}`,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...languageAlternates,
        'x-default': new URL(`/${xDefaultLocale}`, baseUrl).toString(),
      },
    },
    robots: isIndexableLocale
      ? undefined
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
    openGraph: {
      title: titleDefault,
      description,
      url: canonicalUrl,
      siteName: titleBase,
      locale,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: {
      icon: '/icon',
      shortcut: '/icon',
      apple: '/icon',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  const host = headers().get('host');
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  
  if (!site) {
    return <div>No site configured</div>;
  }
  const siteLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const activeLocales = await resolveSeoLocalesForPage({
    siteId: site.id,
    candidateLocales: siteLocales,
    slug: 'home',
  });
  if (!activeLocales.includes(locale as Locale)) {
    notFound();
  }
  
  // Load theme
  const theme = await loadTheme(site.id);
  
  // Load site info for header/footer
  const [siteInfo, seo, footer, headerConfig, doctors] = await Promise.all([
    loadSiteInfo(site.id, locale as Locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale as Locale) as Promise<SeoConfig | null>,
    loadFooter<FooterSection>(site.id, locale as Locale),
    loadContent<HeaderConfig>(site.id, locale as Locale, 'header.json'),
    // Lead practitioner, for the Physician block below. Optional: sites with no
    // doctors directory simply emit no Person markup.
    loadAllItems<DoctorContent>(site.id, locale as Locale, 'doctors'),
  ]);
  const baseUrl = getBaseUrlFromHost(host);

  const doctorList = doctors ?? [];
  const leadDoctor =
    doctorList.find((d) => d?.featured) ??
    [...doctorList].sort((a, b) => (a?.order ?? 99) - (b?.order ?? 99))[0];
  const physicianSchema =
    siteInfo && leadDoctor
      ? buildPhysicianSchema({
          doctor: leadDoctor,
          url: new URL(`/${locale}/about`, baseUrl).toString(),
          clinicName: getSiteDisplayName(siteInfo, site.name),
          info: siteInfo as SiteInfoForSchema,
        })
      : null;
  
  // Generate inline style for theme variables
  const themeStyle = theme ? `
    :root {
      /* Typography */
      --text-display: ${theme.typography.display};
      --text-heading: ${theme.typography.heading};
      --text-subheading: ${theme.typography.subheading};
      --text-body: ${theme.typography.body};
      --text-small: ${theme.typography.small};
      --font-display: ${theme.typography.fonts?.display || 'var(--font-body-default)'};
      --font-heading: ${theme.typography.fonts?.heading || 'var(--font-body-default)'};
      --font-subheading: ${theme.typography.fonts?.subheading || 'var(--font-body-default)'};
      --font-body: ${theme.typography.fonts?.body || 'var(--font-body-default)'};
      --font-small: ${theme.typography.fonts?.small || 'var(--font-body-default)'};
      
      /* Primary Colors */
      --primary: ${theme.colors.primary.DEFAULT};
      --primary-dark: ${theme.colors.primary.dark};
      --primary-light: ${theme.colors.primary.light};
      --primary-50: ${theme.colors.primary['50']};
      --primary-100: ${theme.colors.primary['100']};
      
      /* Secondary Colors */
      --secondary: ${theme.colors.secondary.DEFAULT};
      --secondary-dark: ${theme.colors.secondary.dark};
      --secondary-light: ${theme.colors.secondary.light};
      --secondary-50: ${theme.colors.secondary['50']};
      
      /* Backdrop Colors */
      --backdrop-primary: ${theme.colors.backdrop.primary};
      --backdrop-secondary: ${theme.colors.backdrop.secondary};
    }
  ` : '';
  
  return (
    <>
      {/* Inject theme CSS variables */}
      {theme && (
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      )}

      {siteInfo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              pruneSchema(
                buildLocalBusinessSchema({
                  info: siteInfo as SiteInfoForSchema,
                  name: getSiteDisplayName(siteInfo, site.name),
                  url: new URL(`/${locale}`, baseUrl).toString(),
                  logo: headerConfig?.menu?.logo?.image?.src,
                })
              )
            ),
          }}
        />
      )}

      {/* The practitioner, separately: credentials and languages are what an
          assistant needs to recommend a specific doctor rather than a clinic. */}
      {physicianSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pruneSchema(physicianSchema)) }}
        />
      )}
      
      <div className="min-h-screen flex flex-col relative">
        <Header
          locale={locale as Locale}
          siteId={site.id}
          siteInfo={siteInfo ?? undefined}
          variant={headerConfig?.menu?.variant || siteInfo?.headerVariant || 'default'}
          headerConfig={headerConfig ?? undefined}
        />
        <main id="main-content" tabIndex={-1} className="flex-grow">
          {children}
        </main>
        <Footer
          locale={locale as Locale}
          siteId={site.id}
          footer={footer ?? undefined}
        />
      </div>
    </>
  );
}
