import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import { Locale } from '@/lib/types';

interface CaseStudyPreview {
  id: string;
  category: string;
  condition: string;
  image?: string;
  summary: string;
}

export interface CaseStudiesPreviewSectionProps {
  locale: Locale;
  badge?: string;
  title: string;
  subtitle?: string;
  cases: CaseStudyPreview[];
  moreLink?: {
    text: string;
    url: string;
  };
}

export default function CaseStudiesPreviewSection({
  locale,
  badge,
  title,
  subtitle,
  cases,
  moreLink,
}: CaseStudiesPreviewSectionProps) {
  const getLocalizedUrl = (url: string) => {
    if (!url.startsWith('/')) return url;
    if (url.startsWith(`/${locale}/`) || url === `/${locale}`) return url;
    return `/${locale}${url}`;
  };

  return (
    <section className="section-padding bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          {badge && (
            <Badge
              variant="primary"
              className="mb-4 bg-transparent border-transparent shadow-none px-0 py-0 rounded-none"
            >
              {badge}
            </Badge>
          )}
          <h2 className="text-heading font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.slice(0, 3).map((study) => (
            <Link
              key={study.id}
              href={getLocalizedUrl(`/case-studies#${study.id}`)}
              className="group"
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                {study.image && (
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <Image
                      src={study.image}
                      alt={study.condition}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <Badge variant="secondary" size="sm">
                      {study.condition}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1">
                    {study.summary}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {moreLink && (
          <div className="text-center mt-12">
            <Link
              href={getLocalizedUrl(moreLink.url)}
              className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2 group"
            >
              {moreLink.text}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
