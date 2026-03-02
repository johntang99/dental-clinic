import type { Metadata } from 'next';
 import Link from 'next/link';
 import { notFound } from 'next/navigation';
import { getRequestSiteId, loadPageContent, loadSiteInfo } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale, SiteInfo } from '@/lib/types';
import CTASection from '@/components/sections/CTASection';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';
 
 import GalleryGrid, { GalleryCategory, GalleryImage } from '@/components/gallery/GalleryGrid';
 import { MapPin, Clock } from 'lucide-react';
 
 interface GalleryPageData {
   hero: {
    variant?: 'centered' | 'split-photo-right' | 'split-photo-left' | 'photo-background';
     title: string;
     subtitle: string;
     backgroundImage?: string;
   };
   introduction?: {
     text?: string;
   };
   categories: GalleryCategory[];
   images: GalleryImage[];
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
 
 interface GalleryPageProps {
   params: {
     locale: Locale;
   };
 }
 
interface PageLayoutConfig {
  sections: Array<{ id: string }>;
}


 export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
   const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<GalleryPageData>('gallery', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'gallery',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
 }
 
 export default async function GalleryPage({ params }: GalleryPageProps) {
   const { locale } = params;
 
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<GalleryPageData>('gallery', locale, siteId);
  const layout = await loadPageContent<PageLayoutConfig>('gallery.layout', locale, siteId);
  const contactContent = await loadPageContent<ContactPageData>('contact', locale, siteId);
  const siteInfo = await loadSiteInfo(siteId, locale) as SiteInfo | null;
 
   if (!content) {
     notFound();
   }
 
  const { hero, introduction, categories, images, cta } = content;
  const displayImages = images
    .filter((image) => Boolean(image?.src))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const displayCategories = categories;
  const layoutOrder = new Map<string, number>(
    layout?.sections?.map((section, index) => [section.id, index]) || []
  );
  const useLayout = layoutOrder.size > 0;
  const isEnabled = (sectionId: string) => !useLayout || layoutOrder.has(sectionId);
  const sectionStyle = (sectionId: string) =>
    useLayout ? { order: layoutOrder.get(sectionId) ?? 0 } : undefined;

   return (
    <main className="flex flex-col">
       {/* Hero Section */}
      {isEnabled('hero') && (
        <HeroSection
          variant={(hero.variant as HeroVariant) || 'split-photo-right'}
          tagline={hero.title}
          description={hero.subtitle}
          image={hero.backgroundImage || undefined}
        />
      )}
 
       {/* Gallery Grid */}
      {isEnabled('galleryGrid') && (
        <section
          className="py-16 px-4 bg-gradient-to-b from-white to-gray-50"
          style={sectionStyle('galleryGrid')}
        >
         <div className="container mx-auto max-w-7xl">
           <div className="text-center mb-8">
             <p className="text-small text-gray-600">
               {locale === 'en' ? 'Showing' : '当前显示'}{' '}
              <span className="font-semibold text-gray-900">{displayImages.length}</span>{' '}
               {locale === 'en' ? 'photos from our team and space' : '张团队与空间照片'}
             </p>
           </div>
          <GalleryGrid images={displayImages} categories={displayCategories} />
         </div>
        </section>
      )}
 
       {/* Visit Information */}
      {isEnabled('visitInfo') && (
        <section className="py-20 px-4 bg-gray-50" style={sectionStyle('visitInfo')}>
         <div className="container mx-auto max-w-5xl">
           <div className="text-center mb-12">
             <h2 className="text-heading font-bold text-gray-900 mb-4">
               {locale === 'en' ? 'Visit Information' : '到访信息'}
             </h2>
           </div>
 
           <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 md:p-12">
             <div className="grid md:grid-cols-2 gap-12 mb-8">
               <div>
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 rounded-lg bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] flex items-center justify-center">
                     <MapPin className="w-6 h-6 text-[var(--brand)]" />
                   </div>
                   <h3 className="text-subheading font-bold text-gray-900">
                     {locale === 'en' ? 'Location' : '地址'}
                   </h3>
                 </div>
                <p className="text-gray-700 mb-2 text-subheading">
                  {siteInfo?.address || (locale === 'en' ? 'Address coming soon' : '地址即将公布')}
                </p>
                <p className="text-gray-700 mb-4 text-subheading">
                  {siteInfo?.city && siteInfo?.state
                    ? `${siteInfo.city}, ${siteInfo.state} ${siteInfo.zip ?? ''}`
                    : (locale === 'en' ? 'Location details coming soon' : '地址信息即将更新')}
                </p>
                <div className="space-y-2">
                  {siteInfo?.phone && (
                    <a
                      href={`tel:${siteInfo.phone.replace(/[^\d+]/g, '')}`}
                      className="block text-[var(--brand)] hover:text-[var(--brand-2)] font-semibold"
                    >
                      {siteInfo.phone}
                    </a>
                  )}
                  {siteInfo?.addressMapUrl && (
                    <a
                      href={siteInfo.addressMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[var(--brand)] hover:text-[var(--brand-2)] font-semibold"
                    >
                      {locale === 'en' ? 'Get Directions' : '获取路线'}
                    </a>
                  )}
                </div>
               </div>
 
               <div>
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 rounded-lg bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] flex items-center justify-center">
                     <Clock className="w-6 h-6 text-[var(--brand)]" />
                   </div>
                   <h3 className="text-subheading font-bold text-gray-900">
                     {locale === 'en' ? 'Office Hours' : '营业时间'}
                   </h3>
                 </div>
                 <div className="space-y-3">
                   {contactContent?.hours?.schedule?.map((hour, idx) => (
                     <div
                       key={`${hour.day}-${idx}`}
                       className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-100 last:border-0"
                     >
                       <span className="font-medium">{hour.day}</span>
                       <span className="text-[var(--brand)] font-semibold">
                        {hour.isOpen ? hour.time : (locale === 'en' ? 'Closed' : '休息')}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
 
             <div className="pt-8 border-t border-gray-200">
               <h3 className="text-subheading font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'Accessibility Features' : '无障碍设施'}
               </h3>
               <div className="grid sm:grid-cols-3 gap-4">
                 {[
                  locale === 'en' ? 'Wheelchair accessible entrance' : '轮椅可通行入口',
                  locale === 'en' ? 'Convenient parking available' : '提供便捷停车',
                  locale === 'en' ? 'Multilingual support available' : '提供多语言支持',
                 ].map((feature) => (
                   <div key={feature} className="flex items-center gap-3 p-3 bg-[var(--primary-50)] rounded-lg">
                     <div className="w-6 h-6 rounded-full bg-[var(--brand)] flex items-center justify-center shrink-0">
                       <span className="text-white text-small">✓</span>
                     </div>
                     <span className="text-small text-gray-700">{feature}</span>
                   </div>
                 ))}
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
