import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Button, Badge, Icon } from '@/components/ui';
import { HeroVariant, heroVariantConfig, getSectionClasses } from '@/lib/section-variants';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  variant?: HeroVariant;
  businessName?: string;
  clinicName?: string;
  tagline: string;
  description: string;
  badgeText?: string;
  primaryCta?: {
    text: string;
    link: string;
  };
  secondaryCta?: {
    text: string;
    link: string;
  };
  image?: string;
  video?: string;
  gallery?: string[];
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
  trustBadges?: string[];
  className?: string;
  priority?: boolean;
}

export default function HeroSection({
  variant = 'centered',
  businessName,
  clinicName: legacyName,
  tagline,
  description,
  badgeText,
  primaryCta,
  secondaryCta,
  image,
  video,
  gallery,
  floatingTags,
  stats,
  credentials,
  trustBadges,
  className,
  priority,
}: HeroSectionProps) {
  const config = heroVariantConfig[variant];
  const sectionClasses = getSectionClasses(config);
  const displayName = businessName || legacyName || '';
  const backdropGradientStyle = {
    backgroundImage:
      'linear-gradient(135deg, var(--backdrop-primary), var(--backdrop-secondary), var(--backdrop-primary))',
  };
  
  // Render based on variant
  switch (variant) {
    case 'split-photo-right':
      return (
        <>
          <section
            className={cn('py-20 md:py-28', className)}
            style={backdropGradientStyle}
          >
            <div className="container-custom">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content - Left */}
                <div className="space-y-6 max-w-xl">
                  <HeroContent
                    businessName={displayName}
                    tagline={tagline}
                    description={description}
                    badgeText={badgeText}
                    primaryCta={primaryCta}
                    secondaryCta={secondaryCta}
                    floatingTags={floatingTags}
                    trustBadges={trustBadges}
                    align="left"
                  />
                </div>
                
                {/* Image - Right */}
                {image && (
                  <div className="relative w-full max-w-xl mx-auto lg:mx-0">
                    <div className="rounded-2xl bg-white/80 shadow-2xl overflow-hidden">
                      <Image
                        src={image}
                        alt={displayName}
                        width={1200}
                        height={1200}
                        className="w-full h-auto object-contain"
                        priority={priority}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {stats && <HeroStats stats={stats} style="bar" />}
        </>
      );
    
    case 'split-photo-left':
      return (
        <section
          className={cn(sectionClasses, className)}
          style={backdropGradientStyle}
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image - Left */}
            {image && (
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl order-2 md:order-1">
                <Image
                  src={image}
                  alt={displayName}
                  fill
                  className="object-cover"
                  priority={priority}
                />
              </div>
            )}
            
            {/* Text Content - Right */}
            <div className="space-y-6 order-1 md:order-2">
              <HeroContent
                businessName={displayName}
                tagline={tagline}
                description={description}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                floatingTags={floatingTags}
                trustBadges={trustBadges}
                align="left"
              />
            </div>
          </div>
          
          {stats && <HeroStats stats={stats} />}
        </section>
      );
    
    case 'overlap':
      return (
        <section className={cn('relative min-h-[600px] md:min-h-[700px]', className)}>
          {/* Background Image */}
          {image && (
            <div className="absolute inset-0 z-0">
              <Image
                src={image}
                alt={displayName}
                fill
                className="object-cover"
                priority={priority}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
            </div>
          )}
          
          {/* Overlapping Content */}
          <div className="relative z-10 container-custom py-20 md:py-32">
            <div className="max-w-2xl">
              <div className="bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl">
                <HeroContent
                  businessName={displayName}
                  tagline={tagline}
                  description={description}
                  primaryCta={primaryCta}
                  secondaryCta={secondaryCta}
                  floatingTags={floatingTags}
                  trustBadges={trustBadges}
                  align="left"
                />
              </div>
            </div>
          </div>
          
          {stats && (
            <div className="relative z-10 container-custom -mt-16">
              <HeroStats stats={stats} elevated />
            </div>
          )}
        </section>
      );
    
    case 'photo-background':
      return (
        <>
          <section className={cn('relative min-h-[600px] md:min-h-[700px] pb-16', className)}>
            {/* Background Image */}
            {image && (
              <>
                <div className="absolute inset-0 z-0">
                  <Image
                    src={image}
                    alt={displayName}
                    fill
                    className="object-cover"
                    priority={priority}
                  />
                </div>
                <div className="absolute inset-0 z-0 bg-black/50" />
              </>
            )}
            
            {/* Content */}
            <div className="relative z-10 container-custom py-20 md:py-32 flex items-center min-h-[600px]">
              <div className="max-w-3xl mx-auto text-white">
                <HeroContent
                  businessName={displayName}
                  tagline={tagline}
                  description={description}
                  primaryCta={primaryCta}
                  secondaryCta={secondaryCta}
                  floatingTags={floatingTags}
                  trustBadges={trustBadges}
                  align="center"
                  theme="dark"
                />
              </div>
            </div>
          </section>
          
          {/* Stats Bar - 1/3 Overlap */}
          {stats && (
            <div className="relative -mt-12 z-20">
              <div className="container-custom">
                <HeroStats stats={stats} elevated />
              </div>
            </div>
          )}
        </>
      );
    
    case 'video-background':
      return (
        <section className={cn('relative min-h-[600px] md:min-h-[700px] overflow-hidden', className)}>
          {/* Video Background */}
          {video && (
            <>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src={video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 z-0 bg-black/40" />
            </>
          )}
          
          {/* Content */}
          <div className="relative z-10 container-custom py-20 md:py-32 flex items-center min-h-[600px]">
            <div className="max-w-3xl mx-auto text-white">
              <HeroContent
                businessName={displayName}
                tagline={tagline}
                description={description}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                floatingTags={floatingTags}
                trustBadges={trustBadges}
                align="center"
                theme="dark"
              />
            </div>
          </div>
          
          {stats && (
            <div className="relative z-10 container-custom -mt-16">
              <HeroStats stats={stats} elevated />
            </div>
          )}
        </section>
      );
    
    case 'smile-draw':
      return (
        <>
          <section
            className={cn('relative py-20 md:py-28 overflow-hidden', className)}
            style={backdropGradientStyle}
          >
            {/* Parallax floating elements (Style C) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {/* Decorative ring - top right */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border-[3px] border-primary/10 animate-spin-slow" />
              <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full border-[2px] border-primary/5 animate-pulse-glow" />

              {/* Floating particles */}
              <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full bg-primary/20 animate-drift" />
              <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-primary/15 animate-drift animate-delay-200" />
              <div className="absolute top-[60%] left-[5%] w-2.5 h-2.5 rounded-full bg-primary/10 animate-drift animate-delay-400" />
              <div className="absolute top-[45%] right-[8%] w-2 h-2 rounded-full bg-primary/20 animate-drift animate-delay-600" />
              <div className="absolute bottom-[20%] left-[15%] w-3 h-3 rounded-full bg-primary/15 animate-drift animate-delay-300" />
              <div className="absolute bottom-[30%] right-[20%] w-2 h-2 rounded-full bg-primary/10 animate-drift animate-delay-500" />

              {/* Floating tooth shapes */}
              <div className="absolute top-[20%] left-[12%] animate-float-slow animate-delay-100">
                <svg width="28" height="32" viewBox="0 0 28 32" fill="none" className="text-primary/10">
                  <path d="M14 2C8 2 4 6 4 10c0 3 1 5 2 8l3 10c0.5 1.5 1.5 2 2.5 2h5c1 0 2-0.5 2.5-2l3-10c1-3 2-5 2-8 0-4-4-8-10-8z" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute top-[35%] right-[10%] animate-float-medium animate-delay-300">
                <svg width="22" height="26" viewBox="0 0 28 32" fill="none" className="text-primary/8">
                  <path d="M14 2C8 2 4 6 4 10c0 3 1 5 2 8l3 10c0.5 1.5 1.5 2 2.5 2h5c1 0 2-0.5 2.5-2l3-10c1-3 2-5 2-8 0-4-4-8-10-8z" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute bottom-[25%] left-[6%] animate-float-fast animate-delay-500">
                <svg width="18" height="22" viewBox="0 0 28 32" fill="none" className="text-primary/6">
                  <path d="M14 2C8 2 4 6 4 10c0 3 1 5 2 8l3 10c0.5 1.5 1.5 2 2.5 2h5c1 0 2-0.5 2.5-2l3-10c1-3 2-5 2-8 0-4-4-8-10-8z" fill="currentColor"/>
                </svg>
              </div>
            </div>

            <div className="container-custom relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content - Left (slides in from left) */}
                <div className="space-y-6 max-w-xl">
                  {/* Badge with shimmer */}
                  {badgeText && (
                    <div className="animate-slide-left">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary relative overflow-hidden">
                        {badgeText}
                        <span className="absolute inset-0 animate-shimmer" />
                      </span>
                    </div>
                  )}

                  <h1 className="text-display font-bold text-gray-900 animate-slide-left animate-delay-100">
                    {displayName}
                  </h1>

                  <p className="text-heading text-primary animate-slide-left animate-delay-200">
                    {tagline}
                  </p>

                  <p className="text-lg text-gray-700 animate-slide-left animate-delay-300">
                    {description}
                  </p>

                  {/* CTAs */}
                  {(primaryCta || secondaryCta) && (
                    <div className="flex gap-4 flex-wrap animate-slide-left animate-delay-400">
                      {primaryCta && (
                        <a href={primaryCta.link} className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 px-8 py-4 text-lg shadow-lg hover:shadow-xl bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5">
                          {primaryCta.text}
                        </a>
                      )}
                      {secondaryCta && (
                        <a href={secondaryCta.link} className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white">
                          {secondaryCta.text}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Floating Tags */}
                  {floatingTags && floatingTags.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {floatingTags.map((tag, i) => (
                        <span key={i} className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary animate-slide-up', `animate-delay-${(i + 5) * 100}`)}>
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: Image with smile draw overlay */}
                <div className="relative animate-slide-right animate-delay-200">
                  {/* Smile curve SVG animation (Style B) */}
                  <div className="absolute -top-8 -left-8 -right-8 -bottom-8 z-10 pointer-events-none">
                    <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
                      {/* Smile curve that draws itself */}
                      <path
                        d="M 120 320 Q 250 400 380 320"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        className="animate-smile-draw"
                      />
                      {/* Tooth icons that pop in along the curve */}
                      {[
                        { x: 145, y: 305, delay: '1.2s', size: 10 },
                        { x: 175, y: 318, delay: '1.4s', size: 11 },
                        { x: 210, y: 328, delay: '1.6s', size: 12 },
                        { x: 250, y: 332, delay: '1.8s', size: 12 },
                        { x: 290, y: 328, delay: '2.0s', size: 12 },
                        { x: 325, y: 318, delay: '2.2s', size: 11 },
                        { x: 355, y: 305, delay: '2.4s', size: 10 },
                      ].map((tooth, i) => (
                        <g key={i} style={{ animationDelay: tooth.delay }} className="animate-tooth-pop">
                          <path
                            d={`M ${tooth.x} ${tooth.y - tooth.size} C ${tooth.x - tooth.size * 0.6} ${tooth.y - tooth.size} ${tooth.x - tooth.size * 0.7} ${tooth.y - tooth.size * 0.3} ${tooth.x - tooth.size * 0.5} ${tooth.y + tooth.size * 0.2} L ${tooth.x - tooth.size * 0.15} ${tooth.y + tooth.size} C ${tooth.x - tooth.size * 0.05} ${tooth.y + tooth.size * 1.1} ${tooth.x + tooth.size * 0.05} ${tooth.y + tooth.size * 1.1} ${tooth.x + tooth.size * 0.15} ${tooth.y + tooth.size} L ${tooth.x + tooth.size * 0.5} ${tooth.y + tooth.size * 0.2} C ${tooth.x + tooth.size * 0.7} ${tooth.y - tooth.size * 0.3} ${tooth.x + tooth.size * 0.6} ${tooth.y - tooth.size} ${tooth.x} ${tooth.y - tooth.size} Z`}
                            fill="var(--primary)"
                            fillOpacity="0.15"
                            stroke="var(--primary)"
                            strokeWidth="1"
                            strokeOpacity="0.3"
                          />
                        </g>
                      ))}
                      {/* Sparkle dots that appear after teeth */}
                      {[
                        { x: 130, y: 290, delay: '2.6s' },
                        { x: 370, y: 290, delay: '2.7s' },
                        { x: 250, y: 350, delay: '2.8s' },
                      ].map((sparkle, i) => (
                        <circle
                          key={`s${i}`}
                          cx={sparkle.x}
                          cy={sparkle.y}
                          r="3"
                          fill="var(--primary)"
                          fillOpacity="0.4"
                          style={{ animationDelay: sparkle.delay }}
                          className="animate-tooth-pop"
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Doctor image */}
                  {image && (
                    <div className="relative w-full max-w-xl mx-auto">
                      {/* Decorative rings behind image */}
                      <div className="absolute -inset-4 rounded-2xl border-2 border-primary/10 animate-pulse-glow" />
                      <div className="absolute -inset-8 rounded-3xl border border-primary/5 animate-spin-slow" style={{ animationDuration: '30s' }} />

                      <div className="relative rounded-2xl bg-white/80 shadow-2xl overflow-hidden">
                        <Image
                          src={image}
                          alt={displayName}
                          width={1200}
                          height={1200}
                          className="w-full h-auto object-contain"
                          priority={priority}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom wave divider */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="w-full h-[40px] md:h-[60px]">
                <path d="M0 30 Q 360 60 720 30 Q 1080 0 1440 30 L 1440 60 L 0 60 Z" fill="white" />
              </svg>
            </div>
          </section>

          {/* Stats with count-reveal animation */}
          {stats && (
            <section className="bg-primary py-10 md:py-12">
              <div className="container-custom max-w-6xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="flex justify-center mb-3">
                        <div className={cn('w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-slide-up', `animate-delay-${index * 100}`)}>
                          <Icon name={(stat.icon || 'Award') as any} className="text-white" size="lg" />
                        </div>
                      </div>
                      <div className={cn('text-3xl md:text-4xl font-bold text-white mb-2 animate-count-reveal', `animate-delay-${index * 100 + 200}`)}>
                        {stat.number}
                      </div>
                      <div className={cn('text-xs md:text-sm text-white/90 font-medium animate-slide-up', `animate-delay-${index * 100 + 300}`)}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      );

    case 'centered':
    default:
      return (
        <section
          className={cn(sectionClasses, className)}
          style={backdropGradientStyle}
        >
          <div className="max-w-4xl mx-auto">
            <HeroContent
              businessName={displayName}
              tagline={tagline}
              description={description}
              primaryCta={primaryCta}
              secondaryCta={secondaryCta}
              floatingTags={floatingTags}
              trustBadges={trustBadges}
              align="center"
            />
          </div>
          
          {stats && <HeroStats stats={stats} />}
        </section>
      );
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface HeroContentProps {
  businessName: string;
  tagline: string;
  description: string;
  badgeText?: string;
  primaryCta?: { text: string; link: string };
  secondaryCta?: { text: string; link: string };
  floatingTags?: string[];
  trustBadges?: string[];
  align: 'left' | 'center';
  theme?: 'light' | 'dark';
}

function HeroContent({
  businessName,
  tagline,
  description,
  badgeText,
  primaryCta,
  secondaryCta,
  floatingTags,
  trustBadges,
  align,
  theme = 'light',
}: HeroContentProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const taglineColor = theme === 'dark' ? 'text-white' : 'text-primary';
  const descColor = theme === 'dark' ? 'text-white/90' : 'text-gray-700';
  
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {/* Badge */}
      {badgeText && (
        <div className={cn('mb-4', align === 'center' ? 'flex justify-center' : '')}>
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
            theme === 'dark'
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary'
          )}>
            {badgeText}
          </span>
        </div>
      )}
      {/* Business Name */}
      <h1 className={cn('text-display font-bold mb-4 animate-fade-in', textColor)}>
        {businessName}
      </h1>
      
      {/* Tagline */}
      <p className={cn('text-heading mb-6 animate-fade-in animate-delay-100', taglineColor)}>
        {tagline}
      </p>
      
      {/* Description */}
      <p className={cn('text-lg mb-8 max-w-2xl animate-fade-in animate-delay-200', descColor, align === 'center' && 'mx-auto')}>
        {description}
      </p>
      
      {/* CTAs */}
      {(primaryCta || secondaryCta) && (
        <div className={cn('flex gap-4 mb-8 animate-fade-in animate-delay-300', align === 'center' ? 'justify-center flex-wrap' : 'flex-wrap')}>
          {primaryCta && (
            <a 
              href={primaryCta.link}
              className={cn(
                'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 px-8 py-4 text-lg shadow-lg hover:shadow-xl',
                theme === 'dark' 
                  ? 'bg-white text-primary hover:bg-gray-100 border-2 border-white' 
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              {primaryCta.text}
            </a>
          )}
          {secondaryCta && (
            <a 
              href={secondaryCta.link}
              className={cn(
                'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 px-8 py-4 text-lg shadow-lg hover:shadow-xl',
                theme === 'dark' 
                  ? 'border-2 border-white text-white hover:bg-white hover:text-primary bg-white/10 backdrop-blur-sm' 
                  : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
              )}
            >
              {secondaryCta.text}
            </a>
          )}
        </div>
      )}
      
      {/* Floating Tags */}
      {floatingTags && floatingTags.length > 0 && (
        <div className={cn('flex gap-3 mb-6 animate-fade-in animate-delay-300', align === 'center' ? 'justify-center flex-wrap' : 'flex-wrap')}>
          {floatingTags.map((tag, index) => (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                theme === 'dark'
                  ? 'bg-white/20 text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <CheckCircle2 className={cn(
                'h-4 w-4',
                theme === 'dark'
                  ? 'text-white'
                  : 'text-primary'
              )} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface HeroStatsProps {
  stats: Array<{
    icon?: string;
    number: string;
    label: string;
  }>;
  elevated?: boolean;
  style?: 'card' | 'bar';
}

function HeroStats({ stats, elevated, style = 'card' }: HeroStatsProps) {
  // Map icon names from stats to actual icon components
  const getIconName = (iconName?: string) => {
    if (!iconName) return 'Award';
    // Map common icon names
    const iconMap: Record<string, string> = {
      'Award': 'Award',
      'Heart': 'Heart',
      'Star': 'Star',
      'Sparkles': 'Sparkles',
      'Users': 'Users',
      'Trophy': 'Trophy',
      'Target': 'Target',
      'CheckCircle': 'CheckCircle',
    };
    return iconMap[iconName] || 'Award';
  };

  const content = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon 
                name={getIconName(stat.icon) as any} 
                className="text-white" 
                size="lg"
              />
            </div>
          </div>
          
          {/* Number */}
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">
            {stat.number}
          </div>
          
          {/* Label */}
          <div className="text-xs md:text-sm text-white/90 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );

  if (style === 'bar') {
    return (
      <section className="bg-primary py-10 md:py-12">
        <div className="container-custom max-w-6xl">
          {content}
        </div>
      </section>
    );
  }

  return (
    <div className={cn(
      elevated 
        ? 'bg-primary rounded-2xl shadow-2xl p-6 md:p-8' 
        : 'mt-16'
    )}>
      {content}
    </div>
  );
}

// Export Credentials as separate component
export interface CredentialsSectionProps {
  credentials: Array<{
    icon: string;
    text: string;
  }>;
}

export function CredentialsSection({ credentials }: CredentialsSectionProps) {
  // Map icon names
  const getIconName = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'Certificate': 'Award',
      'Award': 'Award',
      'Shield': 'Shield',
      'ShieldCheck': 'ShieldCheck',
      'Users': 'Users',
      'TrendingUp': 'TrendingUp',
      'CheckCircle': 'CheckCircle',
      'UserCheck': 'UserCheck',
    };
    return iconMap[iconName] || 'CheckCircle';
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {credentials.map((credential, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon 
                  name={getIconName(credential.icon) as any} 
                  className="text-primary" 
                  size="md"
                />
              </div>
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">
                {credential.text}
              </span>
            </div>
          ))}
        </div>
    </div>
    </section>
  );
}
