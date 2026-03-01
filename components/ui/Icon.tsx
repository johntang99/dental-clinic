import { forwardRef } from 'react';
import { icons, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof icons | (string & {});
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', className, ...props }, ref) => {
    const aliasMap: Record<string, keyof typeof icons> = {
      Certificate: 'BadgeCheck',
      ShirtIcon: 'Shirt',
      Grid: 'LayoutGrid',
    };
    // Convert kebab-case or lowercase to PascalCase (e.g., "shield-check" → "ShieldCheck", "sparkles" → "Sparkles")
    const toPascal = (s: string) =>
      s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const pascalName = toPascal(name as string);
    const resolvedName = (aliasMap[pascalName] || pascalName) as keyof typeof icons;
    const LucideIcon = icons[resolvedName];
    
    if (!LucideIcon) {
      console.warn(`Icon "${name}" not found in lucide-react`);
      return null;
    }
    
    // Convert size shortcuts to pixel values
    const sizeMap = {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    };
    
    const iconSize = typeof size === 'string' ? sizeMap[size] : size;
    
    return (
      <LucideIcon
        ref={ref}
        size={iconSize}
        className={cn('inline-block', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export default Icon;
