/**
 * JSON-LD builders, driven entirely by each site's own content.
 *
 * Search engines and AI assistants read structured data to decide whether they
 * can answer a question *about* a clinic rather than just linking to it. The
 * LocalBusiness block used to carry only name/address/phone/url, which leaves
 * out the three properties that actually get used: where the clinic is (geo),
 * when it is open (openingHoursSpecification), and which profiles are the same
 * entity (sameAs).
 *
 * Everything here reads from content/<site>/<locale>/site.json — nothing is
 * hardcoded per tenant, so every site gains the same markup as its data fills in.
 */
import type { SiteInfo } from './types';

/** The fields site.json carries that SiteInfo does not yet declare. */
type SiteInfoExtras = {
  lat?: number;
  lng?: number;
  hours?: Record<string, string>;
  locations?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
    hours?: Record<string, string>;
    isPrimary?: boolean;
    addressMapUrl?: string;
  }[];
  businessNameEN?: string;
};

export type SiteInfoForSchema = SiteInfo & SiteInfoExtras;

const DAY_ORDER = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
] as const;

/**
 * "10:00 AM - 6:00 PM" → { opens: '10:00', closes: '18:00' }.
 *
 * Returns null for anything that isn't a range — closed days are written many
 * ways across locales ("休息", "Closed", "") and a day we can't parse is simply
 * omitted rather than guessed, because a wrong opening time sends patients to a
 * locked door.
 */
export function parseHourRange(value: string | undefined): { opens: string; closes: string } | null {
  if (!value) return null;
  const m = value.match(
    /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—~至到]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i
  );
  if (!m) return null;
  const to24 = (h: string, min: string | undefined, mer: string | undefined): string => {
    let hour = parseInt(h, 10);
    if (mer) {
      const upper = mer.toUpperCase();
      if (upper === 'PM' && hour !== 12) hour += 12;
      if (upper === 'AM' && hour === 12) hour = 0;
    }
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return '';
    return `${String(hour).padStart(2, '0')}:${min ?? '00'}`;
  };
  // A missing meridiem on the closing time inherits the opening one, so
  // "10:00 AM - 6:00" still resolves to an evening close rather than 06:00.
  const opens = to24(m[1], m[2], m[3]);
  const closes = to24(m[4], m[5], m[6] || (parseInt(m[4], 10) < parseInt(m[1], 10) ? 'PM' : m[3]));
  if (!opens || !closes) return null;
  return { opens, closes };
}

/** Collapse a day→hours map into OpeningHoursSpecification entries. */
export function buildOpeningHours(hours: Record<string, string> | undefined) {
  if (!hours) return undefined;
  const byRange = new Map<string, string[]>();
  for (const [key, label] of DAY_ORDER) {
    const range = parseHourRange(hours[key]);
    if (!range) continue; // closed, or unparseable — omit rather than guess
    const k = `${range.opens}|${range.closes}`;
    byRange.set(k, [...(byRange.get(k) ?? []), label]);
  }
  if (byRange.size === 0) return undefined;
  return Array.from(byRange.entries()).map(([k, days]) => {
    const [opens, closes] = k.split('|');
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days.length === 1 ? days[0] : days,
      opens,
      closes,
    };
  });
}

/** Every profile that is demonstrably the same entity. */
export function buildSameAs(info: SiteInfoForSchema): string[] | undefined {
  const urls = [
    info.social?.facebook,
    info.social?.instagram,
    info.social?.youtube,
    (info.social as { yelp?: string } | undefined)?.yelp,
    (info.social as { google?: string } | undefined)?.google,
  ]
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => /^https?:\/\//i.test(u));
  return urls.length ? Array.from(new Set(urls)) : undefined;
}

/**
 * The clinic itself. `Dentist` is a LocalBusiness subtype, so this stays valid
 * everywhere LocalBusiness was accepted while telling Google what kind of
 * business it is.
 */
export function buildLocalBusinessSchema(args: {
  info: SiteInfoForSchema;
  name: string;
  url: string;
  type?: string;
  logo?: string;
}) {
  const { info, name, url } = args;
  const geo =
    typeof info.lat === 'number' && typeof info.lng === 'number'
      ? { '@type': 'GeoCoordinates', latitude: info.lat, longitude: info.lng }
      : undefined;

  // Additional sites are their own LocalBusiness nodes — a second address on
  // one node would make both unusable.
  const branches = (info.locations ?? [])
    .filter((l) => !l.isPrimary && l.address)
    .map((l) => {
      const [locality, regionZip] = String(l.city ?? '').split(',').map((s) => s.trim());
      const [region, postalCode] = (regionZip ?? '').split(/\s+/);
      return {
        '@type': args.type || 'Dentist',
        name: l.name || `${name} — ${locality || ''}`.trim(),
        parentOrganization: { '@type': 'Organization', name },
        telephone: l.phone || info.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: l.address,
          addressLocality: locality || info.city,
          addressRegion: region || info.state,
          postalCode: postalCode || undefined,
          addressCountry: 'US',
        },
        openingHoursSpecification: buildOpeningHours(l.hours),
        hasMap: l.addressMapUrl || undefined,
      };
    });

  const primary = {
    '@context': 'https://schema.org',
    '@type': args.type || 'Dentist',
    name,
    url,
    description: info.description,
    telephone: info.phone,
    email: info.email,
    image: args.logo || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: info.address,
      addressLocality: info.city,
      addressRegion: info.state,
      postalCode: info.zip,
      addressCountry: 'US',
    },
    geo,
    hasMap: info.addressMapUrl || undefined,
    openingHoursSpecification: buildOpeningHours(info.hours),
    sameAs: buildSameAs(info),
  };

  return branches.length ? [primary, ...branches] : primary;
}

/**
 * The practitioner. `knowsLanguage` is the highest-value property on a
 * bilingual clinic: it is how an assistant answers "是否有中文医生?" with a name
 * instead of a shrug. `hasCredential` is what separates a qualified specialist
 * from a directory listing on YMYL queries.
 */
export function buildPhysicianSchema(args: {
  doctor: {
    name?: string;
    nameEN?: string;
    title?: string;
    role?: string;
    image?: string;
    bio?: string;
    languages?: string[];
    credentials?: { credential?: string }[];
    certifications?: string[];
  };
  url: string;
  clinicName: string;
  info: SiteInfoForSchema;
}) {
  const { doctor, url, clinicName, info } = args;
  if (!doctor?.name) return null;

  const credentials = [
    ...(doctor.credentials ?? []).map((c) => c?.credential).filter(Boolean),
    ...(doctor.certifications ?? []),
  ].filter((c): c is string => !!c);

  // Map the language labels content uses onto BCP-47 tags, which is what
  // consumers actually match on. Unrecognised labels pass through verbatim.
  const LANG: Record<string, string> = {
    '中文': 'zh', '普通话': 'zh-Hans', '国语': 'zh-Hans', '粤语': 'yue',
    '英语': 'en', '英文': 'en', 'English': 'en', 'Mandarin': 'zh-Hans',
    'Cantonese': 'yue', 'Spanish': 'es', 'Korean': 'ko',
  };
  const knowsLanguage = (doctor.languages ?? []).map((l) => LANG[l] ?? l);

  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.nameEN ? `${doctor.name} (${doctor.nameEN})` : doctor.name,
    url,
    image: doctor.image || undefined,
    jobTitle: doctor.role || doctor.title || undefined,
    description: doctor.bio ? String(doctor.bio).split('\n')[0] : undefined,
    hasCredential: credentials.length ? credentials : undefined,
    knowsLanguage: knowsLanguage.length ? knowsLanguage : undefined,
    medicalSpecialty: 'Dentistry',
    worksFor: {
      '@type': 'Dentist',
      name: clinicName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: info.address,
        addressLocality: info.city,
        addressRegion: info.state,
        postalCode: info.zip,
        addressCountry: 'US',
      },
    },
  };
}

/** FAQ blocks already written into page content, exposed to machines. */
export function buildFaqSchema(items: { question?: string; answer?: string }[] | undefined) {
  const qa = (items ?? []).filter((i) => i?.question && i?.answer);
  // Google needs three or more pairs before an FAQ page is eligible, and fewer
  // than that is not worth the markup.
  if (qa.length < 3) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };
}

/** Strip undefined so the emitted JSON-LD carries no empty keys. */
export function pruneSchema<T>(value: T): T {
  if (Array.isArray(value)) return value.map(pruneSchema) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue;
      const cleaned = pruneSchema(v);
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      out[k] = cleaned;
    }
    return out as T;
  }
  return value;
}
