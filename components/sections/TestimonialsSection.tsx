import { Badge } from '@/components/ui';
import { Testimonial } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Star, ArrowRight } from 'lucide-react';

export interface TestimonialsSectionProps {
  variant?: 'carousel' | 'grid' | 'masonry' | 'slider-vertical' | 'featured-single';
  badge?: string;
  title: string;
  subtitle?: string;
  testimonials: Array<{
    quote: string;
    name: string;
    condition: string;
  }>;
  moreLink?: {
    text: string;
    url: string;
  };
  className?: string;
}

export default function TestimonialsSection({
  variant = 'grid',
  badge,
  title,
  subtitle,
  testimonials,
  moreLink,
  className,
}: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) return null;

  const limited = testimonials.slice(0, 6);
  const single = testimonials[0];

  return (
    <section className={cn('py-20 px-4', variant === 'masonry' ? 'bg-gray-900' : 'bg-gradient-to-b from-white to-gray-50', className)}>
      <div className="container-custom max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {badge && (
            <span className={cn(
              'inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4',
              variant === 'masonry' ? 'bg-white/10 text-white/80' : 'bg-primary/10 text-primary'
            )}>
              {badge}
            </span>
          )}
          <h2 className={cn('text-heading font-bold mb-4', variant === 'masonry' ? 'text-white' : '')}>{title}</h2>
          {subtitle && <p className={cn('text-subheading', variant === 'masonry' ? 'text-gray-400' : 'text-gray-600')}>{subtitle}</p>}
        </div>

        {variant === 'featured-single' && single ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-10 border-2 border-gray-200 shadow-lg">
              <div className="flex gap-1 mb-6 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5" style={{ fill: 'var(--secondary-light)', color: 'var(--secondary-light)' }} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-8 leading-relaxed text-subheading text-center">
                &ldquo;{single.quote}&rdquo;
              </p>
              <div className="border-t border-gray-200 pt-4 text-center">
                <p className="font-semibold text-gray-900">{single.name}</p>
                <p className="text-sm text-primary">{single.condition}</p>
              </div>
            </div>
          </div>
        ) : variant === 'masonry' ? (
          /* Masonry: dark background, staggered cards, editorial feel */
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            {limited.map((testimonial, index) => {
              const isHighlight = index === 0 || index === 3;
              return (
                <div
                  key={index}
                  className={cn(
                    'break-inside-avoid mb-5 rounded-2xl p-7 transition-all duration-300',
                    isHighlight
                      ? 'bg-primary/90 text-white hover:bg-primary'
                      : 'bg-white/[0.07] backdrop-blur-sm border border-white/10 hover:bg-white/[0.12]'
                  )}
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        style={{
                          fill: isHighlight ? 'rgba(255,255,255,0.9)' : 'var(--secondary-light)',
                          color: isHighlight ? 'rgba(255,255,255,0.9)' : 'var(--secondary-light)',
                        }}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    'leading-relaxed mb-5',
                    isHighlight ? 'text-white/95 text-base' : 'text-gray-300 text-sm',
                  )}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className={cn(
                    'pt-4',
                    isHighlight ? 'border-t border-white/20' : 'border-t border-white/10'
                  )}>
                    <p className={cn('font-semibold text-sm', isHighlight ? 'text-white' : 'text-gray-200')}>
                      {testimonial.name}
                    </p>
                    <p className={cn('text-xs mt-0.5', isHighlight ? 'text-white/70' : 'text-gray-500')}>
                      {testimonial.condition}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={cn(
              variant === 'slider-vertical' && 'max-w-3xl mx-auto space-y-6',
              (variant === 'grid' || variant === 'carousel') && 'grid md:grid-cols-3 gap-8'
            )}
          >
            {limited.map((testimonial, index) => (
              <div
                key={index}
                className={cn(
                  'bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-primary hover:shadow-xl transition-all',
                  variant === 'slider-vertical' && 'w-full'
                )}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" style={{ fill: 'var(--secondary-light)', color: 'var(--secondary-light)' }} />
                  ))}
                </div>

                <p className="text-gray-700 italic mb-6 leading-relaxed text-subheading">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.condition}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* More Link */}
        {moreLink && (
          <div className="text-center mt-10">
            <a
              href={moreLink.url}
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold text-subheading group"
            >
              {moreLink.text}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
