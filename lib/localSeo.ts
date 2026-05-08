export interface LocalSeoEntryBrief {
  slug: string;
  pageType?: string;
  locationId?: string;
  topicType?: string;
  topicSlug?: string;
}

export function buildPrimaryServiceSeoLinkMap(
  entries: LocalSeoEntryBrief[],
  locale: string,
  preferredLocationId = 'flushing'
): Map<string, string> {
  const map = new Map<string, string>();

  const servicePages = entries.filter(
    (entry) =>
      entry.pageType === 'service-location' &&
      entry.topicType === 'service' &&
      typeof entry.topicSlug === 'string' &&
      entry.topicSlug.trim().length > 0 &&
      typeof entry.slug === 'string' &&
      entry.slug.trim().length > 0
  );

  for (const entry of servicePages) {
    if (entry.locationId !== preferredLocationId) continue;
    const topicSlug = (entry.topicSlug || '').trim();
    if (!map.has(topicSlug)) {
      map.set(topicSlug, `/${locale}/${entry.slug}`);
    }
  }

  for (const entry of servicePages) {
    const topicSlug = (entry.topicSlug || '').trim();
    if (!topicSlug || map.has(topicSlug)) continue;
    map.set(topicSlug, `/${locale}/${entry.slug}`);
  }

  return map;
}
