import fs from 'fs/promises';
import path from 'path';
import { getDefaultFooter } from '../footer';
import { listContentEntries } from '@/lib/contentDb';

export interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

async function ensureSeoFile(siteId: string, locale: string) {
  const seoPath = path.join(CONTENT_DIR, siteId, locale, 'seo.json');
  try {
    await fs.access(seoPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(seoPath), { recursive: true });
      await fs.writeFile(
        seoPath,
        JSON.stringify(
          {
            title: '',
            description: '',
            ogImage: '',
            home: {
              title: '',
              description: '',
            },
            pages: {},
          },
          null,
          2
        )
      );
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

async function ensureFooterFile(siteId: string, locale: string) {
  const footerPath = path.join(CONTENT_DIR, siteId, locale, 'footer.json');
  try {
    await fs.access(footerPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(footerPath), { recursive: true });
      const footer = getDefaultFooter(locale as any);
      await fs.writeFile(footerPath, JSON.stringify(footer, null, 2));
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

async function ensureHeaderFile(siteId: string, locale: string) {
  const headerPath = path.join(CONTENT_DIR, siteId, locale, 'header.json');
  try {
    await fs.access(headerPath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(headerPath), { recursive: true });
      const payload = {
        topbar: {
          phone: '',
          phoneHref: '',
          address: '',
          addressHref: '',
          hours: '',
          badge: '',
        },
        menu: {
          logo: {
            emoji: '',
            text: '',
            subtext: '',
            image: {
              src: '',
              alt: '',
            },
          },
          items: [],
        },
        languages: [],
        cta: {
          text: '',
          link: '',
        },
      };
      await fs.writeFile(headerPath, JSON.stringify(payload, null, 2));
    } catch (writeError) {
      // ignore write failures (read-only environments)
    }
  }
}

export async function listContentFiles(
  siteId: string,
  locale: string
): Promise<ContentFileItem[]> {
  const items: ContentFileItem[] = [];
  await ensureSeoFile(siteId, locale);
  await ensureFooterFile(siteId, locale);
  await ensureHeaderFile(siteId, locale);

  const addItem = (item: ContentFileItem) => {
    if (!items.some((entry) => entry.path === item.path)) {
      items.push(item);
    }
  };

  const dbEntries = await listContentEntries(siteId, locale);
  if (dbEntries.length > 0) {
    dbEntries.forEach((entry) => {
      if (entry.path.startsWith('pages/') && entry.path.endsWith('.json')) {
        const slug = entry.path.replace('pages/', '').replace('.json', '');
        addItem({
          id: `page-${slug}`,
          label: `Page: ${titleCase(slug)}`,
          path: entry.path,
          scope: 'locale',
        });
        return;
      }

      if (entry.path.startsWith('blog/') && entry.path.endsWith('.json')) {
        const slug = entry.path.replace('blog/', '').replace('.json', '');
        const data = entry.data as Record<string, any>;
        const title = typeof data?.title === 'string' ? data.title : '';
        const publishDate =
          typeof data?.publishDate === 'string' ? data.publishDate : '';
        addItem({
          id: `blog-${slug}`,
          label: `Blog Post: ${title || titleCase(slug)}`,
          path: entry.path,
          scope: 'locale',
          publishDate: publishDate || undefined,
        });
        return;
      }

      if (entry.path.startsWith('services/') && entry.path.endsWith('.json')) {
        const slug = entry.path.replace('services/', '').replace('.json', '');
        const data = entry.data as Record<string, any>;
        const title = typeof data?.title === 'string' ? data.title : '';
        addItem({
          id: `service-${slug}`,
          label: `Service: ${title || titleCase(slug)}`,
          path: entry.path,
          scope: 'locale',
        });
        return;
      }

      if (entry.path === 'navigation.json') {
        addItem({ id: 'navigation', label: 'Navigation', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'header.json') {
        addItem({ id: 'header', label: 'Header', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'seo.json') {
        addItem({ id: 'seo', label: 'SEO', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'footer.json') {
        addItem({ id: 'footer', label: 'Footer', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'site.json') {
        addItem({ id: 'site', label: 'Site Info', path: entry.path, scope: 'locale' });
      }
      if (entry.path === 'theme.json') {
        addItem({ id: 'theme', label: 'Theme', path: entry.path, scope: 'site' });
      }
    });
  }

  const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
  try {
    const files = await fs.readdir(pagesDir);
    files
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const slug = file.replace('.json', '');
        addItem({
          id: `page-${slug}`,
          label: `Page: ${titleCase(slug)}`,
          path: `pages/${file}`,
          scope: 'locale',
        });
      });
  } catch (error) {
    // ignore missing pages directory
  }

  const blogDir = path.join(CONTENT_DIR, siteId, locale, 'blog');
  try {
    const files = await fs.readdir(blogDir);
    await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const slug = file.replace('.json', '');
          let title = '';
          let publishDate = '';
          try {
            const raw = await fs.readFile(path.join(blogDir, file), 'utf-8');
            const parsed = JSON.parse(raw);
            title = typeof parsed.title === 'string' ? parsed.title : '';
            publishDate =
              typeof parsed.publishDate === 'string' ? parsed.publishDate : '';
          } catch (error) {
            // ignore parse errors
          }
          addItem({
            id: `blog-${slug}`,
            label: `Blog Post: ${title || titleCase(slug)}`,
            path: `blog/${file}`,
            scope: 'locale',
            publishDate: publishDate || undefined,
          });
        })
    );
  } catch (error) {
    // ignore missing blog directory
  }

  const servicesDir = path.join(CONTENT_DIR, siteId, locale, 'services');
  try {
    const files = await fs.readdir(servicesDir);
    await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const slug = file.replace('.json', '');
          let title = '';
          try {
            const raw = await fs.readFile(path.join(servicesDir, file), 'utf-8');
            const parsed = JSON.parse(raw);
            title = typeof parsed.title === 'string' ? parsed.title : '';
          } catch (error) {
            // ignore parse errors
          }
          addItem({
            id: `service-${slug}`,
            label: `Service: ${title || titleCase(slug)}`,
            path: `services/${file}`,
            scope: 'locale',
          });
        })
    );
  } catch (error) {
    // ignore missing services directory
  }

  addItem({
    id: 'navigation',
    label: 'Navigation',
    path: 'navigation.json',
    scope: 'locale',
  });
  addItem({
    id: 'header',
    label: 'Header',
    path: 'header.json',
    scope: 'locale',
  });
  addItem({
    id: 'seo',
    label: 'SEO',
    path: 'seo.json',
    scope: 'locale',
  });
  addItem({
    id: 'footer',
    label: 'Footer',
    path: 'footer.json',
    scope: 'locale',
  });
  addItem({
    id: 'site',
    label: 'Site Info',
    path: 'site.json',
    scope: 'locale',
  });
  addItem({
    id: 'theme',
    label: 'Theme',
    path: 'theme.json',
    scope: 'site',
  });

  return items;
}

export function resolveContentPath(siteId: string, locale: string, filePath: string) {
  if (filePath === 'theme.json') {
    return path.join(CONTENT_DIR, siteId, 'theme.json');
  }

  if (filePath === 'navigation.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'navigation.json');
  }

  if (filePath === 'header.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'header.json');
  }

  if (filePath === 'site.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'site.json');
  }

  if (filePath === 'seo.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'seo.json');
  }

  if (filePath === 'footer.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'footer.json');
  }

  if (filePath.startsWith('pages/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  if (filePath.startsWith('blog/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  if (filePath.startsWith('services/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  return null;
}
