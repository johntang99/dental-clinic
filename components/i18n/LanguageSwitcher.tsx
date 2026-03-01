'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Locale, switchLocale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: 'default' | 'topbar';
}

const languages: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'ES' },
  { code: 'ko', label: '한국' },
];

export default function LanguageSwitcher({ currentLocale, variant = 'default' }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    const newPath = switchLocale(pathname, newLocale);
    router.push(newPath);
  };

  if (variant === 'topbar') {
    return (
      <div className="flex items-center gap-1">
        {languages.map((lang, i) => (
          <span key={lang.code} className="flex items-center">
            <button
              onClick={() => handleLocaleChange(lang.code)}
              className={`text-sm transition-colors ${
                currentLocale === lang.code
                  ? 'text-white font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
            {i < languages.length - 1 && <span className="text-white/40 mx-1">|</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLocaleChange(lang.code)}
          className={`px-2.5 py-1.5 text-sm font-medium transition-colors ${
            currentLocale === lang.code
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
