'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, SiteConfig } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui';
import { CONTENT_TEMPLATES } from '@/lib/admin/templates';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
}

interface ContentEditorProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
  initialFilePath?: string;
  fileFilter?: 'all' | 'blog' | 'siteSettings';
  titleOverride?: string;
  basePath?: string;
}

const SECTION_VARIANT_OPTIONS: Record<string, string[]> = {
  hero: [
    'centered',
    'split-photo-right',
    'split-photo-left',
    'photo-background',
    'overlap',
    'video-background',
    'gallery-background',
  ],
  testimonials: ['carousel', 'grid', 'masonry', 'slider-vertical', 'featured-single'],
  howItWorks: ['horizontal', 'vertical', 'cards', 'vertical-image-right'],
  conditions: ['grid-cards', 'categories-tabs', 'list-detailed', 'icon-grid', 'category-detail-alternating'],
  services: ['grid-cards-2x', 'grid-cards-3x', 'featured-large', 'list-horizontal', 'accordion', 'tabs', 'detail-alternating', 'detail-image-right'],
  servicesList: ['grid-cards-2x', 'grid-cards-3x', 'featured-large', 'list-horizontal', 'accordion', 'tabs', 'detail-alternating', 'detail-image-right'],
  overview: ['centered', 'left'],
  blog: ['cards-grid', 'featured-side', 'list-detailed', 'carousel'],
  gallery: ['grid-masonry', 'grid-uniform', 'carousel', 'lightbox-grid'],
  cta: ['centered', 'split', 'banner', 'card-elevated'],
  profile: ['split', 'stacked'],
  credentials: ['list', 'grid'],
  specializations: ['grid-2', 'grid-3', 'list'],
  philosophy: ['cards', 'timeline'],
  journey: ['prose', 'card'],
  affiliations: ['compact', 'detailed'],
  continuingEducation: ['compact', 'detailed'],
  clinic: ['split', 'cards'],
  introduction: ['centered', 'left'],
  hours: ['grid', 'list'],
  form: ['single-column', 'two-column', 'multi-step', 'modal', 'inline-minimal'],
  map: ['shown', 'hidden'],
  faq: ['accordion', 'simple', 'card'],
  individualTreatments: ['grid-3', 'grid-2', 'list'],
  packages: ['grid-3', 'grid-2', 'list'],
  insurance: ['split', 'stacked'],
  policies: ['grid', 'list'],
  statistics: ['horizontal-row', 'grid-2x2', 'vertical-cards', 'inline-badges'],
};

const toTitleCase = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (match) => match.toUpperCase());

const SITE_SETTINGS_PATHS = new Set([
  'navigation.json',
  'header.json',
  'footer.json',
  'seo.json',
  'theme.json',
  'site.json',
]);

export function ContentEditor({
  sites,
  selectedSiteId,
  selectedLocale,
  initialFilePath,
  fileFilter = 'all',
  titleOverride,
  basePath = '/admin/content',
}: ContentEditorProps) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [files, setFiles] = useState<ContentFileItem[]>([]);
  const [activeFile, setActiveFile] = useState<ContentFileItem | null>(null);
  const [content, setContent] = useState('');
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageFieldPath, setImageFieldPath] = useState<string[] | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState<Record<string, boolean>>({});
  const [seoPopulating, setSeoPopulating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [blogServiceOptions, setBlogServiceOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [blogConditionOptions, setBlogConditionOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const filesTitle =
    fileFilter === 'blog'
      ? 'Blog Posts'
      : fileFilter === 'siteSettings'
        ? 'Site Settings'
        : 'Files';

  const site = useMemo(
    () => sites.find((item) => item.id === siteId),
    [sites, siteId]
  );

  useEffect(() => {
    if (!site) return;
    if (!site.supportedLocales.includes(locale)) {
      setLocale(site.defaultLocale);
    }
  }, [site, locale]);

  useEffect(() => {
    if (!siteId || !locale) return;
    const params = new URLSearchParams({ siteId, locale });
    router.replace(`${basePath}?${params.toString()}`);
  }, [router, siteId, locale, basePath]);

  const loadFiles = async (preferredPath?: string) => {
    if (!siteId || !locale) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/content/files?siteId=${siteId}&locale=${locale}`
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load files');
      }
      const payload = await response.json();
      let nextFiles: ContentFileItem[] = payload.files || [];
      if (fileFilter === 'blog') {
        nextFiles = nextFiles.filter((file) => file.path.startsWith('blog/'));
        nextFiles = [...nextFiles].sort((a, b) =>
          (b.publishDate || '').localeCompare(a.publishDate || '')
        );
      } else if (fileFilter === 'siteSettings') {
        nextFiles = nextFiles.filter((file) => SITE_SETTINGS_PATHS.has(file.path));
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      } else {
        nextFiles = nextFiles.filter(
          (file) => !file.path.startsWith('blog/') && !SITE_SETTINGS_PATHS.has(file.path)
        );
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      }
      setFiles(nextFiles);
      if (preferredPath) {
        const matched = nextFiles.find((file) => file.path === preferredPath);
        setActiveFile(matched || nextFiles[0] || null);
      } else {
        setActiveFile(nextFiles[0] || null);
      }
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(initialFilePath);
  }, [siteId, locale, initialFilePath, fileFilter]);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setStatus(null);
    fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`
    )
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || 'Failed to load content');
        }
        return response.json();
      })
      .then((payload) => {
        const nextContent = payload.content || '';
        setContent(nextContent);
        try {
          setFormData(JSON.parse(nextContent));
        } catch (error) {
          setFormData(null);
        }
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setLoading(false));
  }, [activeFile, siteId, locale]);

  useEffect(() => {
    if (!activeFile) return;
    if (activeFile.path.startsWith('blog/')) {
      loadBlogLinkOptions();
    }
  }, [activeFile, siteId, locale]);

  const handleSave = async () => {
    setStatus(null);
    if (!activeFile) return;
    let parsedContent: Record<string, any>;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      setStatus('Invalid JSON. Please fix before saving.');
      return;
    }

    let contentToSave = content;
    if (
      activeFile.path === 'pages/services.json' &&
      parsedContent &&
      typeof parsedContent === 'object' &&
      Array.isArray(parsedContent.servicesList?.items)
    ) {
      // Keep servicesList.items as single source of truth.
      if ('services' in parsedContent) {
        delete parsedContent.services;
      }
      contentToSave = JSON.stringify(parsedContent, null, 2);
      setFormData(parsedContent);
      setContent(contentToSave);
    }

    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: activeFile.path,
        content: contentToSave,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Save failed');
      return;
    }

    const payload = await response.json();
    setStatus(payload.message || 'Saved');
  };

  const handleImport = async (
    mode: 'missing' | 'overwrite' = 'missing',
    options?: { dryRun?: boolean; force?: boolean }
  ) => {
    setStatus(null);
    setLoading(true);
    setImporting(true);
    try {
      const response = await fetch('/api/admin/content/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          locale,
          mode,
          dryRun: Boolean(options?.dryRun),
          force: Boolean(options?.force),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Import failed');
      }
      if (options?.dryRun) {
        return payload;
      }
      const skipped = payload.skipped || 0;
      const imported = payload.imported || 0;
      setStatus(payload.message || (skipped
        ? `Imported ${imported} items. Skipped ${skipped} existing DB entries.`
        : `Imported ${imported} items from JSON.`));
      await loadFiles(activeFile?.path);
      return payload;
    } catch (error: any) {
      setStatus(error?.message || 'Import failed');
      return null;
    } finally {
      setLoading(false);
      setImporting(false);
    }
  };

  const handleOverwriteImport = async () => {
    const dryRun = await handleImport('overwrite', { dryRun: true });
    if (!dryRun) return;

    const conflicts = Array.isArray(dryRun.conflicts) ? dryRun.conflicts : [];
    if (conflicts.length > 0) {
      const conflictPreview = conflicts
        .slice(0, 5)
        .map((item: any) => `${item.locale}:${item.path}`)
        .join('\n');
      const forceConfirmed = window.confirm(
        `Safety check found ${conflicts.length} newer DB entries.\n\n` +
          `${conflictPreview}${conflicts.length > 5 ? '\n...' : ''}\n\n` +
          'Abort by default. Continue with FORCE overwrite anyway?'
      );
      if (!forceConfirmed) {
        setStatus('Overwrite cancelled due to newer DB entries.');
        return;
      }
      await handleImport('overwrite', { force: true });
      return;
    }

    const confirmed = window.confirm(
      `Dry-run summary:\n` +
        `Create: ${dryRun.toCreate || 0}\n` +
        `Update: ${dryRun.toUpdate || 0}\n` +
        `Unchanged: ${dryRun.unchanged || 0}\n\n` +
        `${Array.isArray(dryRun.toUpdatePaths) && dryRun.toUpdatePaths.length > 0
          ? `Update paths:\n${dryRun.toUpdatePaths.slice(0, 8).join('\n')}${dryRun.toUpdatePaths.length > 8 ? '\n...' : ''}\n\n`
          : ''}` +
        `${Array.isArray(dryRun.toCreatePaths) && dryRun.toCreatePaths.length > 0
          ? `Create paths:\n${dryRun.toCreatePaths.slice(0, 8).join('\n')}${dryRun.toCreatePaths.length > 8 ? '\n...' : ''}\n\n`
          : ''}` +
        'Proceed with overwrite import?'
    );
    if (!confirmed) return;
    await handleImport('overwrite');
  };

  const handleCheckUpdateFromDb = async () => {
    const dryRun = await handleImport('overwrite', { dryRun: true });
    if (!dryRun) return;

    const updatePaths = Array.isArray(dryRun.toUpdatePaths) ? dryRun.toUpdatePaths : [];
    const createPaths = Array.isArray(dryRun.toCreatePaths) ? dryRun.toCreatePaths : [];
    const conflicts = Array.isArray(dryRun.conflicts) ? dryRun.conflicts : [];
    const conflictPaths = conflicts.map((item: any) => `${item.locale}:${item.path}`);

    const allDifferentPaths = Array.from(new Set([...updatePaths, ...createPaths, ...conflictPaths]));
    const preview = allDifferentPaths.slice(0, 20).join('\n');

    window.alert(
      `Check Update From DB\n\n` +
        `Different files: ${allDifferentPaths.length}\n` +
        `Create: ${createPaths.length}\n` +
        `Update: ${updatePaths.length}\n` +
        `DB newer conflicts: ${conflicts.length}\n\n` +
        `${allDifferentPaths.length > 0 ? `Paths:\n${preview}${allDifferentPaths.length > 20 ? '\n...' : ''}` : 'No differences found.'}`
    );

    setStatus(
      allDifferentPaths.length > 0
        ? `Found ${allDifferentPaths.length} files different from DB (create ${createPaths.length}, update ${updatePaths.length}, conflicts ${conflicts.length}).`
        : 'No differences between local JSON and DB.'
    );
  };

  const handleExport = async () => {
    setStatus(null);
    setLoading(true);
    setExporting(true);
    try {
      const response = await fetch('/api/admin/content/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, locale }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Export failed');
      }
      const details = [];
      if (typeof payload.backfilled === 'number') {
        details.push(`backfilled ${payload.backfilled}`);
      }
      if (typeof payload.backfillErrors === 'number' && payload.backfillErrors > 0) {
        details.push(`backfill errors ${payload.backfillErrors}`);
      }
      setStatus(
        `${payload.message || 'Export completed'}${details.length ? ` (${details.join(', ')})` : ''}`
      );
    } catch (error: any) {
      setStatus(error?.message || 'Export failed');
    } finally {
      setLoading(false);
      setExporting(false);
    }
  };

  const handleCreate = async () => {
    const isBlog = fileFilter === 'blog';
    const slug = window.prompt(
      isBlog ? 'New blog slug (example: my-post)' : 'New page slug (example: faq)'
    );
    if (!slug) return;
    const templateId =
      window.prompt(
        `Template: ${CONTENT_TEMPLATES.map((t) => t.id).join(', ')}`,
        CONTENT_TEMPLATES[0]?.id || 'basic'
      ) || CONTENT_TEMPLATES[0]?.id;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'create',
        slug,
        templateId,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Create failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleDuplicate = async () => {
    if (!activeFile) return;
    const isBlog = activeFile.path.startsWith('blog/');
    const slug = window.prompt(
      isBlog
        ? 'Duplicate blog slug (example: my-post-copy)'
        : 'Duplicate page slug (example: faq-copy)'
    );
    if (!slug) return;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'duplicate',
        path: activeFile.path,
        slug,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Duplicate failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setFormData(parsed);
      setStatus('Formatted');
    } catch (error) {
      setStatus('Invalid JSON. Unable to format.');
    }
  };

  const handleDelete = async () => {
    if (!activeFile) return;
    const confirmed = window.confirm(`Delete ${activeFile.path}? This cannot be undone.`);
    if (!confirmed) return;
    const response = await fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed');
      return;
    }
    await loadFiles();
  };

  const loadBlogLinkOptions = async () => {
    if (!siteId || !locale) return;
    try {
      const [servicesRes, conditionsRes] = await Promise.all([
        fetch(
          `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
            'pages/services.json'
          )}`
        ),
        fetch(
          `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
            'pages/conditions.json'
          )}`
        ),
      ]);
      const [servicesPayload, conditionsPayload] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : Promise.resolve(null),
        conditionsRes.ok ? conditionsRes.json() : Promise.resolve(null),
      ]);

      const servicesData = servicesPayload?.content
        ? JSON.parse(servicesPayload.content)
        : null;
      const conditionsData = conditionsPayload?.content
        ? JSON.parse(conditionsPayload.content)
        : null;

      const servicesOptions = Array.isArray(servicesData?.services)
        ? servicesData.services
            .map((service: any) => ({
              id: String(service?.id || ''),
              title: String(service?.title || service?.name || ''),
            }))
            .filter((item: any) => item.id && item.title)
        : [];
      const conditionsOptions = Array.isArray(conditionsData?.conditions)
        ? conditionsData.conditions
            .map((condition: any) => ({
              id: String(condition?.id || ''),
              title: String(condition?.title || condition?.name || ''),
            }))
            .filter((item: any) => item.id && item.title)
        : [];

      setBlogServiceOptions(servicesOptions);
      setBlogConditionOptions(conditionsOptions);
    } catch (error) {
      setBlogServiceOptions([]);
      setBlogConditionOptions([]);
    }
  };

  const getPreviewPath = () => {
    if (!activeFile) return `/${locale}`;
    if (activeFile.path.startsWith('pages/')) {
      const slug = activeFile.path.replace('pages/', '').replace('.json', '');
      if (slug === 'home') return `/${locale}`;
      return `/${locale}/${slug}`;
    }
    return `/${locale}`;
  };

  const updateFormValue = (path: string[], value: any) => {
    if (!formData) return;
    const next = { ...formData };
    let cursor: any = next;
    path.forEach((key, index) => {
      if (index === path.length - 1) {
        cursor[key] = value;
      } else {
        cursor[key] = cursor[key] ?? {};
        cursor = cursor[key];
      }
    });
    setFormData(next);
    setContent(JSON.stringify(next, null, 2));
  };

  const openImagePicker = (path: string[]) => {
    setImageFieldPath(path);
    setShowImagePicker(true);
  };

  const handleImageSelect = (url: string) => {
    if (!imageFieldPath) return;
    updateFormValue(imageFieldPath, url);
  };

  const toggleMarkdownPreview = (key: string) => {
    setMarkdownPreview((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const normalizeMarkdown = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
      .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

  const getPathValue = (path: string[]) =>
    path.reduce<any>((acc, key) => acc?.[key], formData);

  const renderColorField = (label: string, path: string[]) => {
    const value = String(getPathValue(path) || '');
    return (
      <div className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
        <div>
          <label className="block text-xs text-gray-500">{label}</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={value}
            onChange={(event) => updateFormValue(path, event.target.value)}
            placeholder="#000000"
          />
        </div>
        <input
          type="color"
          className="mt-6 h-10 w-10 rounded-md border border-gray-200"
          value={value || '#000000'}
          onChange={(event) => updateFormValue(path, event.target.value)}
          aria-label={`${label} color`}
        />
      </div>
    );
  };

  const isSeoFile = activeFile?.path === 'seo.json';
  const isBlogPostFile = activeFile?.path.startsWith('blog/');
  const isHeaderFile = activeFile?.path === 'header.json';
  const isThemeFile = activeFile?.path === 'theme.json';
  const isHomePageFile = activeFile?.path === 'pages/home.json';
  const isConditionsPageFile = activeFile?.path === 'pages/conditions.json';
  const allowCreateOrDuplicate = fileFilter !== 'siteSettings';
  const variantSections = formData
    ? Object.entries(SECTION_VARIANT_OPTIONS).filter(
        ([key]) =>
          formData[key] &&
          typeof formData[key] === 'object' &&
          !Array.isArray(formData[key])
      )
    : [];
  const galleryCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
        }))
        .filter((category: any) => category.id && category.name)
    : [];
  const caseStudyCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
        }))
        .filter((category: any) => category.id && category.name)
    : [];
  const categoryOrderValue = (category: any) => {
    const order = Number(category?.order);
    return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
  };
  const sortedConditionCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any, index: number) => ({ category, index }))
        .sort(
          (a, b) =>
            categoryOrderValue(a.category) - categoryOrderValue(b.category) ||
            a.index - b.index
        )
    : [];
  const conditionCategoryOptions = Array.isArray(formData?.categories)
    ? sortedConditionCategories
        .map(({ category }: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
        }))
        .filter((category: any) => category.id && category.name && category.id !== 'all')
    : [];
  const homePhotoFields = useMemo(() => {
    if (!isHomePageFile || !formData) return [] as Array<{ path: string[]; label: string }>;

    const fields: Array<{ path: string[]; label: string }> = [];
    const IMAGE_KEYS = new Set(['image', 'backgroundImage', 'beforeImage', 'afterImage', 'src']);
    const EXCLUDED_ROOT_KEYS = new Set(['menu', 'topBar', 'topbar']);
    const DISPLAY_KEYS = [
      'title',
      'name',
      'label',
      'condition',
      'businessName',
      'clinicName',
      'tagline',
      'text',
      'id',
      'slug',
    ];

    const getNodeDisplayLabel = (node: any, fallbackIndex?: number) => {
      if (!node || typeof node !== 'object') {
        return typeof fallbackIndex === 'number' ? `Item ${fallbackIndex + 1}` : '';
      }

      for (const key of DISPLAY_KEYS) {
        const value = node?.[key];
        if (typeof value === 'string' && value.trim()) {
          return key === 'id' || key === 'slug' ? toTitleCase(value) : value.trim();
        }
      }

      if (typeof fallbackIndex === 'number') {
        return `Item ${fallbackIndex + 1}`;
      }
      return '';
    };

    const collectFields = (node: any, path: string[] = [], contextHint = '') => {
      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          const itemHint = getNodeDisplayLabel(item, index);
          collectFields(item, [...path, String(index)], itemHint);
        });
        return;
      }

      if (!node || typeof node !== 'object') {
        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (path.length === 0 && EXCLUDED_ROOT_KEYS.has(key)) {
          return;
        }

        const nextPath = [...path, key];
        const isImageField = IMAGE_KEYS.has(key);

        if (isImageField && typeof value === 'string') {
          const sectionLabel = nextPath
            .filter((part) => !/^\d+$/.test(part))
            .map((part) => toTitleCase(part))
            .join(' > ');
          const localHint = getNodeDisplayLabel(node);
          const hint = localHint || contextHint;
          const label = hint ? `${sectionLabel} (${hint})` : sectionLabel;
          fields.push({ path: nextPath, label });
          return;
        }

        if (typeof value === 'object' && value !== null) {
          collectFields(value, nextPath, contextHint);
        }
      });
    };

    collectFields(formData);
    return fields;
  }, [isHomePageFile, formData]);

  const addSeoPage = () => {
    if (!formData) return;
    const slug = window.prompt('Page slug (example: services)');
    if (!slug) return;
    updateFormValue(['pages', slug], {
      title: '',
      description: '',
    });
  };

  const removeSeoPage = (slug: string) => {
    if (!formData) return;
    const next = { ...formData };
    if (next.pages && typeof next.pages === 'object') {
      const pages = { ...next.pages };
      delete pages[slug];
      next.pages = pages;
      setFormData(next);
      setContent(JSON.stringify(next, null, 2));
    }
  };

  const addGalleryImage = () => {
    if (!formData) return;
    const images = Array.isArray(formData.images) ? [...formData.images] : [];
    const maxOrder = images.reduce((max: number, image: any) => {
      const order = typeof image?.order === 'number' ? image.order : 0;
      return Math.max(max, order);
    }, 0);
    images.push({
      id: `gallery-${Date.now()}`,
      src: '',
      alt: '',
      title: '',
      category: '',
      description: '',
      featured: false,
      order: maxOrder + 1,
    });
    updateFormValue(['images'], images);
  };

  const removeGalleryImage = (index: number) => {
    if (!formData || !Array.isArray(formData.images)) return;
    const images = [...formData.images];
    images.splice(index, 1);
    updateFormValue(['images'], images);
  };

  const addHeaderMenuItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.menu?.items) ? [...formData.menu.items] : [];
    items.push({ text: '', url: '' });
    updateFormValue(['menu', 'items'], items);
  };

  const removeHeaderMenuItem = (index: number) => {
    if (!formData || !Array.isArray(formData.menu?.items)) return;
    const items = [...formData.menu.items];
    items.splice(index, 1);
    updateFormValue(['menu', 'items'], items);
  };

  const addHeaderLanguage = () => {
    if (!formData) return;
    const languages = Array.isArray(formData.languages) ? [...formData.languages] : [];
    languages.push({ label: '', locale: '', url: '' });
    updateFormValue(['languages'], languages);
  };

  const removeHeaderLanguage = (index: number) => {
    if (!formData || !Array.isArray(formData.languages)) return;
    const languages = [...formData.languages];
    languages.splice(index, 1);
    updateFormValue(['languages'], languages);
  };

  const toggleSelection = (path: string[], value: string) => {
    if (!formData) return;
    const current = Array.isArray(path.reduce<any>((acc, key) => acc?.[key], formData))
      ? (path.reduce<any>((acc, key) => acc?.[key], formData) as string[])
      : [];
    const exists = current.includes(value);
    const next = exists ? current.filter((item) => item !== value) : [...current, value];
    updateFormValue(path, next);
  };

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const addConditionCategory = () => {
    if (!formData) return;
    const categories = Array.isArray(formData.categories) ? [...formData.categories] : [];
    categories.push({
      id: `category-${categories.length + 1}`,
      icon: 'Activity',
      name: '',
      subtitle: '',
      description: '',
      image: '',
      order: categories.length + 1,
    });
    updateFormValue(['categories'], categories);
  };

  const removeConditionCategory = (index: number) => {
    if (!formData || !Array.isArray(formData.categories)) return;
    const categories = [...formData.categories];
    const target = categories[index];
    categories.splice(index, 1);
    const next: Record<string, any> = { ...formData, categories };

    if (target?.id && Array.isArray(formData.conditions)) {
      const fallbackCategory =
        categories.find((category: any) => category?.id && category.id !== 'all')?.id || '';
      next.conditions = formData.conditions.map((condition: any) => {
        if (condition?.category === target.id) {
          return {
            ...condition,
            category: fallbackCategory,
          };
        }
        return condition;
      });
    }

    setFormData(next);
    setContent(JSON.stringify(next, null, 2));
  };

  const addConditionItem = () => {
    if (!formData) return;
    const list = Array.isArray(formData.conditions) ? [...formData.conditions] : [];
    const firstCategory = conditionCategoryOptions[0]?.id || '';
    list.push({
      id: `condition-${list.length + 1}`,
      title: '',
      category: firstCategory,
      icon: 'Activity',
      image: '',
      description: '',
      symptoms: [],
      tcmApproach: '',
      treatmentMethods: [],
      featured: false,
    });
    updateFormValue(['conditions'], list);
  };

  const removeConditionItem = (index: number) => {
    if (!formData || !Array.isArray(formData.conditions)) return;
    const list = [...formData.conditions];
    list.splice(index, 1);
    updateFormValue(['conditions'], list);
  };

  const addServicesListItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.servicesList?.items) ? [...formData.servicesList.items] : [];
    items.push({
      id: `service-${items.length + 1}`,
      icon: 'Syringe',
      order: items.length + 1,
      title: '',
      shortDescription: '',
      fullDescription: '',
      benefits: [],
      whatToExpect: '',
      image: '',
      featured: false,
    });
    updateFormValue(['servicesList', 'items'], items);
  };

  const removeServicesListItem = (index: number) => {
    if (!formData || !Array.isArray(formData.servicesList?.items)) return;
    const items = [...formData.servicesList.items];
    items.splice(index, 1);
    updateFormValue(['servicesList', 'items'], items);
  };

  const addTrustBarItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.trustBar?.items) ? [...formData.trustBar.items] : [];
    items.push({
      icon: 'Shield',
      title: '',
      description: '',
    });
    updateFormValue(['trustBar', 'items'], items);
  };

  const removeTrustBarItem = (index: number) => {
    if (!formData || !Array.isArray(formData.trustBar?.items)) return;
    const items = [...formData.trustBar.items];
    items.splice(index, 1);
    updateFormValue(['trustBar', 'items'], items);
  };

  const addRelatedReadingSlug = () => {
    if (!formData) return;
    const slugs = Array.isArray(formData.relatedReading?.preferredSlugs)
      ? [...formData.relatedReading.preferredSlugs]
      : [];
    slugs.push('');
    updateFormValue(['relatedReading', 'preferredSlugs'], slugs);
  };

  const removeRelatedReadingSlug = (index: number) => {
    if (!formData || !Array.isArray(formData.relatedReading?.preferredSlugs)) return;
    const slugs = [...formData.relatedReading.preferredSlugs];
    slugs.splice(index, 1);
    updateFormValue(['relatedReading', 'preferredSlugs'], slugs);
  };

  const populateSeoFromHeroes = async () => {
    if (!formData) return;
    setSeoPopulating(true);
    setStatus(null);
    try {
      const pageFiles = files
        .filter((file) => file.path.startsWith('pages/'))
        .map((file) => ({
          path: file.path,
          slug: file.path.replace('pages/', '').replace('.json', ''),
        }));

      const results = await Promise.all(
        pageFiles.map(async (page) => {
          try {
            const response = await fetch(
              `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
                page.path
              )}`
            );
            if (!response.ok) {
              return null;
            }
            const payload = await response.json();
            const parsed = JSON.parse(payload.content || '{}');
            const hero = parsed?.hero;
            const title = hero?.title;
            const description = hero?.description || hero?.subtitle;
            if (!title && !description) {
              return null;
            }
            return { slug: page.slug, title, description };
          } catch (error) {
            return null;
          }
        })
      );

      const next = { ...formData };
      const pages = typeof next.pages === 'object' && next.pages ? { ...next.pages } : {};

      results.forEach((entry) => {
        if (!entry) return;
        if (entry.slug === 'home') {
          const currentHome = next.home || {};
          next.home = {
            title: currentHome.title || entry.title || '',
            description: currentHome.description || entry.description || '',
          };
          return;
        }

        const current = pages[entry.slug] || {};
        pages[entry.slug] = {
          title: current.title || entry.title || '',
          description: current.description || entry.description || '',
        };
      });

      next.pages = pages;
      setFormData(next);
      setContent(JSON.stringify(next, null, 2));
      setStatus('SEO populated from hero sections.');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to populate SEO.');
    } finally {
      setSeoPopulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {titleOverride || 'Content Editor'}
          </h1>
          <p className="text-sm text-gray-600">
            Select a site and locale to edit JSON content files.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500">Site</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
              }}
            >
              {sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Locale</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {(site?.supportedLocales || ['en']).map((item) => (
                <option key={item} value={item}>
                  {item === 'en' ? 'English' : item === 'zh' ? 'Chinese' : item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => handleImport('missing')}
              disabled={importing || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Import JSON'}
            </button>
            <button
              type="button"
              onClick={handleCheckUpdateFromDb}
              disabled={importing || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Check Update From DB
            </button>
            <button
              type="button"
              onClick={handleOverwriteImport}
              disabled={importing || loading}
              className="px-3 py-2 rounded-md border border-amber-200 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Overwrite Import'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            {filesTitle}
          </div>
          {loading && files.length === 0 ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeFile?.id === file.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{file.label}</div>
                  <div className="text-xs opacity-70">{file.path}</div>
                  {fileFilter === 'blog' && file.publishDate && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      {new Date(file.publishDate).toLocaleDateString(
                        locale === 'zh' ? 'zh-CN' : 'en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </div>
                  )}
                </button>
              ))}
              {files.length === 0 && (
                <div className="text-sm text-gray-500">
                  {fileFilter === 'blog'
                    ? 'No blog posts found for this locale.'
                    : 'No content files found for this locale.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {activeFile?.label || 'Select a file'}
              </div>
              <div className="text-xs text-gray-500">{activeFile?.path}</div>
            </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(getPreviewPath(), '_blank')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Preview
          </button>
          {allowCreateOrDuplicate && (
            <button
              type="button"
              onClick={handleCreate}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
            >
              {fileFilter === 'blog' ? 'New Post' : 'New Page'}
            </button>
          )}
          {allowCreateOrDuplicate && (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={!activeFile}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Duplicate
            </button>
          )}
          <button
            type="button"
            onClick={handleFormat}
            disabled={!activeFile}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Format
          </button>
          {activeFile &&
            (activeFile.path.startsWith('pages/') ||
              activeFile.path.startsWith('blog/')) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          <Button onClick={handleSave} disabled={!activeFile}>
            Save
          </Button>
        </div>
          </div>

          {status && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {status}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'form'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'json'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>

          {activeTab === 'form' ? (
            <div className="space-y-6 text-sm">
              {!formData && (
                <div className="text-sm text-gray-500">
                  Invalid JSON. Switch to JSON tab to fix.
                </div>
              )}

              {isSeoFile && formData && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      SEO
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={populateSeoFromHeroes}
                        disabled={seoPopulating}
                        className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {seoPopulating ? 'Populating…' : 'Auto-populate'}
                      </button>
                      <button
                        type="button"
                        onClick={addSeoPage}
                        className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Add Page SEO
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-500">Default Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.title || ''}
                        onChange={(event) => updateFormValue(['title'], event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Default Description</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.description || ''}
                        onChange={(event) =>
                          updateFormValue(['description'], event.target.value)
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500">Open Graph Image</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.ogImage || ''}
                          onChange={(event) =>
                            updateFormValue(['ogImage'], event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['ogImage'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Home Page SEO
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-gray-500">Home Title</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.home?.title || ''}
                          onChange={(event) =>
                            updateFormValue(['home', 'title'], event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Home Description</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.home?.description || ''}
                          onChange={(event) =>
                            updateFormValue(['home', 'description'], event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Page SEO
                    </div>
                    {formData.pages && typeof formData.pages === 'object' ? (
                      <div className="space-y-3">
                        {Object.entries(formData.pages as Record<string, any>).map(
                          ([slug, values]) => (
                            <div
                              key={slug}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-gray-700">
                                  {slug}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSeoPage(slug)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <label className="block text-xs text-gray-500">
                                    Title
                                  </label>
                                  <input
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                    value={values?.title || ''}
                                    onChange={(event) =>
                                      updateFormValue(
                                        ['pages', slug, 'title'],
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500">
                                    Description
                                  </label>
                                  <input
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                    value={values?.description || ''}
                                    onChange={(event) =>
                                      updateFormValue(
                                        ['pages', slug, 'description'],
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        )}
                        {Object.keys(formData.pages).length === 0 && (
                          <div className="text-xs text-gray-500">
                            No page-specific SEO entries yet.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No page-specific SEO entries yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isHeaderFile && formData && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Header
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Topbar
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-500">Phone</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.phone || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'phone'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Phone Href</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.phoneHref || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'phoneHref'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Address</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.address || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'address'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Address Href</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.addressHref || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'addressHref'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Hours</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.hours || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'hours'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Badge</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.topbar?.badge || ''}
                            onChange={(event) =>
                              updateFormValue(['topbar', 'badge'], event.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Logo
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500">Menu Variant</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.menu?.variant || 'default'}
                          onChange={(event) =>
                            updateFormValue(['menu', 'variant'], event.target.value)
                          }
                        >
                          <option value="default">Default</option>
                          <option value="centered">Centered</option>
                          <option value="transparent">Transparent</option>
                          <option value="stacked">Stacked</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500">Menu Font Weight</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.menu?.fontWeight || 'semibold'}
                          onChange={(event) =>
                            updateFormValue(['menu', 'fontWeight'], event.target.value)
                          }
                        >
                          <option value="regular">Regular</option>
                          <option value="semibold">Semibold</option>
                        </select>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="block text-xs text-gray-500">Emoji</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.menu?.logo?.emoji || ''}
                            onChange={(event) =>
                              updateFormValue(['menu', 'logo', 'emoji'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Text</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.menu?.logo?.text || ''}
                            onChange={(event) =>
                              updateFormValue(['menu', 'logo', 'text'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Subtext</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.menu?.logo?.subtext || ''}
                            onChange={(event) =>
                              updateFormValue(['menu', 'logo', 'subtext'], event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-500">Logo Image</label>
                          <div className="mt-1 flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={formData.menu?.logo?.image?.src || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['menu', 'logo', 'image', 'src'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => openImagePicker(['menu', 'logo', 'image', 'src'])}
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Logo Alt</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.menu?.logo?.image?.alt || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['menu', 'logo', 'image', 'alt'],
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          Menu Items
                        </div>
                        <button
                          type="button"
                          onClick={addHeaderMenuItem}
                          className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Add Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(Array.isArray(formData.menu?.items)
                          ? formData.menu.items
                          : []
                        ).map((item: any, index: number) => (
                          <div
                            key={`header-item-${index}`}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end"
                          >
                            <div>
                              <label className="block text-xs text-gray-500">Text</label>
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={item?.text || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['menu', 'items', `${index}`, 'text'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">URL</label>
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={item?.url || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['menu', 'items', `${index}`, 'url'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHeaderMenuItem(index)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {!Array.isArray(formData.menu?.items) ||
                        formData.menu.items.length === 0 ? (
                          <div className="text-xs text-gray-500">
                            No menu items yet.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          Languages
                        </div>
                        <button
                          type="button"
                          onClick={addHeaderLanguage}
                          className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Add Language
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(Array.isArray(formData.languages)
                          ? formData.languages
                          : []
                        ).map((item: any, index: number) => (
                          <div
                            key={`header-language-${index}`}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] items-end"
                          >
                            <div>
                              <label className="block text-xs text-gray-500">Label</label>
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={item?.label || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['languages', `${index}`, 'label'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Locale</label>
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={item?.locale || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['languages', `${index}`, 'locale'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">URL</label>
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={item?.url || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['languages', `${index}`, 'url'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHeaderLanguage(index)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {!Array.isArray(formData.languages) ||
                        formData.languages.length === 0 ? (
                          <div className="text-xs text-gray-500">
                            No languages yet.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        CTA
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-500">Text</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.cta?.text || ''}
                            onChange={(event) =>
                              updateFormValue(['cta', 'text'], event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Link</label>
                          <input
                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={formData.cta?.link || ''}
                            onChange={(event) =>
                              updateFormValue(['cta', 'link'], event.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isThemeFile && formData && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-6">
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    Theme
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Typography Sizes
                      </div>
                      {(['display', 'heading', 'subheading', 'body', 'small'] as const).map(
                        (key) => (
                          <div key={`type-${key}`}>
                            <label className="block text-xs text-gray-500">
                              {key}
                            </label>
                            <input
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={String(getPathValue(['typography', key]) || '')}
                              onChange={(event) =>
                                updateFormValue(['typography', key], event.target.value)
                              }
                              placeholder="e.g. 2rem"
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Typography Fonts
                      </div>
                      {(['display', 'heading', 'subheading', 'body', 'small'] as const).map(
                        (key) => (
                          <div key={`font-${key}`}>
                            <label className="block text-xs text-gray-500">
                              {key}
                            </label>
                            <input
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={String(
                                getPathValue(['typography', 'fonts', key]) || ''
                              )}
                              onChange={(event) =>
                                updateFormValue(
                                  ['typography', 'fonts', key],
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Inter, sans-serif"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Primary Colors
                      </div>
                      {renderColorField('Primary', ['colors', 'primary', 'DEFAULT'])}
                      {renderColorField('Primary Dark', ['colors', 'primary', 'dark'])}
                      {renderColorField('Primary Light', ['colors', 'primary', 'light'])}
                      {renderColorField('Primary 50', ['colors', 'primary', '50'])}
                      {renderColorField('Primary 100', ['colors', 'primary', '100'])}
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Secondary Colors
                      </div>
                      {renderColorField('Secondary', ['colors', 'secondary', 'DEFAULT'])}
                      {renderColorField('Secondary Dark', ['colors', 'secondary', 'dark'])}
                      {renderColorField('Secondary Light', ['colors', 'secondary', 'light'])}
                      {renderColorField('Secondary 50', ['colors', 'secondary', '50'])}
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Backdrop Colors
                      </div>
                      {renderColorField('Backdrop Primary', [
                        'colors',
                        'backdrop',
                        'primary',
                      ])}
                      {renderColorField('Backdrop Secondary', [
                        'colors',
                        'backdrop',
                        'secondary',
                      ])}
                    </div>
                  </div>
                </div>
              )}

              {formData && variantSections.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Section Variants
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {variantSections.map(([sectionKey, options]) => (
                      <div key={`variant-${sectionKey}`}>
                        <label className="block text-xs text-gray-500">
                          {toTitleCase(sectionKey)} Variant
                        </label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
                          value={String(getPathValue([sectionKey, 'variant']) || '')}
                          onChange={(event) =>
                            updateFormValue([sectionKey, 'variant'], event.target.value)
                          }
                        >
                          <option value="">Default</option>
                          {options.map((option) => (
                            <option key={`${sectionKey}-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isConditionsPageFile && formData && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Conditions Layout Variant
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Layout Variant</label>
                    <select
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
                      value={String(formData.layoutVariant || 'categories-tabs')}
                      onChange={(event) =>
                        updateFormValue(['layoutVariant'], event.target.value)
                      }
                    >
                      <option value="categories-tabs">categories-tabs</option>
                      <option value="category-detail-alternating">
                        category-detail-alternating
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {isHomePageFile && homePhotoFields.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Home Section Photos
                  </div>
                  <div className="space-y-3">
                    {homePhotoFields.map((field) => (
                      <div
                        key={field.path.join('.')}
                        className="grid gap-2 md:grid-cols-[220px_1fr_auto_auto] items-center"
                      >
                        <label className="text-xs text-gray-600">{field.label}</label>
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={String(getPathValue(field.path) || '')}
                          onChange={(event) =>
                            updateFormValue(field.path, event.target.value)
                          }
                          placeholder="/uploads/..."
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(field.path)}
                          className="px-3 py-2 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormValue(field.path, '')}
                          className="px-3 py-2 rounded-md border border-gray-200 text-xs"
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.hero && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Hero
                  </div>
                  {'title' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.title || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'title'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'subtitle' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Subtitle</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.subtitle || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'subtitle'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {('businessName' in formData.hero || 'clinicName' in formData.hero) && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Business Name</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.businessName || formData.hero.clinicName || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['hero', 'businessName' in formData.hero ? 'businessName' : 'clinicName'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {'tagline' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Tagline</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.tagline || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'tagline'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'description' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">
                        Description
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.description || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['hero', 'description'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {'backgroundImage' in formData.hero && (
                    <div>
                      <label className="block text-xs text-gray-500">
                        Background Image
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.hero.backgroundImage || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['hero', 'backgroundImage'],
                              event.target.value
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['hero', 'backgroundImage'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                  {'image' in formData.hero && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500">Image</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.hero.image || ''}
                          onChange={(event) =>
                            updateFormValue(['hero', 'image'], event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['hero', 'image'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData?.profile && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Profile
                  </div>
                  {'name' in formData.profile && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Name</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.profile.name || ''}
                        onChange={(event) =>
                          updateFormValue(['profile', 'name'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'title' in formData.profile && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.profile.title || ''}
                        onChange={(event) =>
                          updateFormValue(['profile', 'title'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'bio' in formData.profile && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Bio</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.profile.bio || ''}
                        onChange={(event) =>
                          updateFormValue(['profile', 'bio'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'quote' in formData.profile && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Quote</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.profile.quote || ''}
                        onChange={(event) =>
                          updateFormValue(['profile', 'quote'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'image' in formData.profile && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Profile Photo</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.profile.image || ''}
                          onChange={(event) =>
                            updateFormValue(['profile', 'image'], event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['profile', 'image'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                  {'signature' in formData.profile && (
                    <div>
                      <label className="block text-xs text-gray-500">Signature Image</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.profile.signature || ''}
                          onChange={(event) =>
                            updateFormValue(['profile', 'signature'], event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['profile', 'signature'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData?.introduction && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Introduction
                  </div>
                  {'text' in formData.introduction && (
                    <div>
                      <label className="block text-xs text-gray-500">Text</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.introduction.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['introduction', 'text'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(formData?.images) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Gallery Photos
                    </div>
                    <button
                      type="button"
                      onClick={addGalleryImage}
                      className="px-3 py-1 rounded-md border border-gray-200 text-xs"
                    >
                      Add Photo
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.images.map((image: any, index: number) => (
                      <div
                        key={image.id || index}
                        className="border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-semibold text-gray-500">
                            Photo {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs text-gray-500">Title</label>
                            <input
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={image.title || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['images', index, 'title'] as string[],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Category</label>
                            {galleryCategories.length > 0 ? (
                              <select
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
                                value={image.category || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['images', index, 'category'] as string[],
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">Select category</option>
                                {galleryCategories.map((category: any) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                value={image.category || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['images', index, 'category'] as string[],
                                    event.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Source</label>
                            <div className="mt-1 flex gap-2">
                              <input
                                readOnly
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                                value={image.src || ''}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  openImagePicker(['images', index, 'src'] as string[])
                                }
                                className="px-3 rounded-md border border-gray-200 text-xs"
                              >
                                Choose
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateFormValue(['images', index, 'src'] as string[], '')
                                }
                                className="px-3 rounded-md border border-gray-200 text-xs"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Alt</label>
                            <input
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={image.alt || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['images', index, 'alt'] as string[],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Order</label>
                            <input
                              type="number"
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={image.order ?? ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['images', index, 'order'] as string[],
                                  event.target.value === '' ? '' : Number(event.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input
                              type="checkbox"
                              checked={Boolean(image.featured)}
                              onChange={(event) =>
                                updateFormValue(
                                  ['images', index, 'featured'] as string[],
                                  event.target.checked
                                )
                              }
                            />
                            <span className="text-xs text-gray-600">Featured</span>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500">
                              Description
                            </label>
                            <textarea
                              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              value={image.description || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['images', index, 'description'] as string[],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.cta && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    CTA
                  </div>
                  {'title' in formData.cta && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.cta.title || ''}
                        onChange={(event) =>
                          updateFormValue(['cta', 'title'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'description' in formData.cta && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">
                        Description
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.cta.description || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'description'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {formData.cta?.primaryCta && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Primary CTA</div>
                      <input
                        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Text"
                        value={formData.cta.primaryCta.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'primaryCta', 'text'],
                            event.target.value
                          )
                        }
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Link"
                        value={formData.cta.primaryCta.link || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'primaryCta', 'link'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {formData.cta?.secondaryCta && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Secondary CTA</div>
                      <input
                        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Text"
                        value={formData.cta.secondaryCta.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'secondaryCta', 'text'],
                            event.target.value
                          )
                        }
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Link"
                        value={formData.cta.secondaryCta.link || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'secondaryCta', 'link'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(formData?.services) && !formData?.servicesList && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Services
                  </div>
                  <div className="space-y-4">
                    {formData.services.map((service: any, index: number) => (
                      <div key={service.id || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {service.title || `Service ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={service.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['services', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Short description"
                          value={service.shortDescription || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['services', String(index), 'shortDescription'],
                              event.target.value
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={service.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['services', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['services', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.servicesList && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Services List
                    </div>
                    <button
                      type="button"
                      onClick={addServicesListItem}
                      className="px-2 py-1 rounded border border-gray-200 text-xs"
                    >
                      Add Service
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Section Badge</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Section badge"
                        value={formData.servicesList.badge || ''}
                        onChange={(event) =>
                          updateFormValue(['servicesList', 'badge'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Section Variant</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Section variant"
                        value={formData.servicesList.variant || ''}
                        onChange={(event) =>
                          updateFormValue(['servicesList', 'variant'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Section Title</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Section title"
                        value={formData.servicesList.title || ''}
                        onChange={(event) =>
                          updateFormValue(['servicesList', 'title'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Section Subtitle</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Section subtitle"
                        value={formData.servicesList.subtitle || ''}
                        onChange={(event) =>
                          updateFormValue(['servicesList', 'subtitle'], event.target.value)
                        }
                      />
                    </div>
                  </div>
                  {Array.isArray(formData.servicesList.items) && (
                    <div className="space-y-4 mt-4">
                      {formData.servicesList.items.map((service: any, index: number) => (
                        <div key={service.id || index} className="border rounded-md p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">
                              {service.title || `Service ${index + 1}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeServicesListItem(index)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">ID (slug)</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="ID (slug)"
                                value={service.id || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'id'],
                                    toSlug(event.target.value)
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Icon</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Icon (e.g., Syringe)"
                                value={service.icon || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'icon'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Order</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                type="number"
                                placeholder="Order"
                                value={service.order ?? ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'order'],
                                    event.target.value === '' ? '' : Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Title</label>
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Title"
                              value={service.title || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['servicesList', 'items', String(index), 'title'],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Short Description</label>
                            <textarea
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Short description"
                              value={service.shortDescription || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['servicesList', 'items', String(index), 'shortDescription'],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs text-gray-500">Full Description (Markdown)</label>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleMarkdownPreview(`servicesList-${index}-fullDescription`)
                                }
                                className="text-xs text-gray-600 hover:text-gray-900"
                              >
                                {markdownPreview[`servicesList-${index}-fullDescription`]
                                  ? 'Edit'
                                  : 'Preview'}
                              </button>
                            </div>
                            {markdownPreview[`servicesList-${index}-fullDescription`] ? (
                              <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                                <ReactMarkdown
                                  components={{
                                    ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                    ol: (props) => (
                                      <ol className="list-decimal pl-5" {...props} />
                                    ),
                                  }}
                                >
                                  {normalizeMarkdown(String(service.fullDescription || ''))}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <textarea
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Full description (Markdown supported)"
                                value={service.fullDescription || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'fullDescription'],
                                    event.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">What to Expect</label>
                            <textarea
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="What to expect"
                              value={service.whatToExpect || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['servicesList', 'items', String(index), 'whatToExpect'],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Benefits</label>
                            <textarea
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Benefits (comma separated)"
                              value={Array.isArray(service.benefits) ? service.benefits.join(', ') : ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['servicesList', 'items', String(index), 'benefits'],
                                  event.target.value
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean)
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Price</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Price"
                                value={service.price || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'price'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Duration (min)"
                                type="number"
                                value={service.durationMinutes || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'durationMinutes'],
                                    parseInt(event.target.value) || 0
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Image</label>
                            <div className="flex gap-2">
                              <input
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Image"
                                value={service.image || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'image'],
                                    event.target.value
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  openImagePicker(['servicesList', 'items', String(index), 'image'])
                                }
                                className="px-3 rounded-md border border-gray-200 text-xs"
                              >
                                Choose
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Featured</label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={Boolean(service.featured)}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['servicesList', 'items', String(index), 'featured'],
                                    event.target.checked
                                  )
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-gray-700">Featured (for featured-large variant)</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData?.trustBar && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Trust Bar
                    </div>
                    <button
                      type="button"
                      onClick={addTrustBarItem}
                      className="px-2 py-1 rounded border border-gray-200 text-xs"
                    >
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Array.isArray(formData.trustBar.items) &&
                      formData.trustBar.items.map((item: any, index: number) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="flex justify-end mb-2">
                            <button
                              type="button"
                              onClick={() => removeTrustBarItem(index)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Icon</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Icon"
                                value={item.icon || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['trustBar', 'items', String(index), 'icon'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Title</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Title"
                                value={item.title || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['trustBar', 'items', String(index), 'title'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Description</label>
                              <input
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                                placeholder="Description"
                                value={item.description || ''}
                                onChange={(event) =>
                                  updateFormValue(
                                    ['trustBar', 'items', String(index), 'description'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {formData?.legacyLabels && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Legacy Labels
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Service Prefix</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Service prefix"
                        value={formData.legacyLabels.servicePrefix || ''}
                        onChange={(event) =>
                          updateFormValue(['legacyLabels', 'servicePrefix'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Key Benefits Title</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Key benefits title"
                        value={formData.legacyLabels.keyBenefitsTitle || ''}
                        onChange={(event) =>
                          updateFormValue(['legacyLabels', 'keyBenefitsTitle'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">What to Expect Title</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="What to expect title"
                        value={formData.legacyLabels.whatToExpectTitle || ''}
                        onChange={(event) =>
                          updateFormValue(['legacyLabels', 'whatToExpectTitle'], event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData?.relatedReading && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Related Reading
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Title"
                        value={formData.relatedReading.title || ''}
                        onChange={(event) =>
                          updateFormValue(['relatedReading', 'title'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">View All Text</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="View all text"
                        value={formData.relatedReading.viewAllText || ''}
                        onChange={(event) =>
                          updateFormValue(['relatedReading', 'viewAllText'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Default Category</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Default category"
                        value={formData.relatedReading.defaultCategory || ''}
                        onChange={(event) =>
                          updateFormValue(['relatedReading', 'defaultCategory'], event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
                      <input
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
                        placeholder="Subtitle"
                        value={formData.relatedReading.subtitle || ''}
                        onChange={(event) =>
                          updateFormValue(['relatedReading', 'subtitle'], event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase">Preferred Slugs</span>
                    <button
                      type="button"
                      onClick={addRelatedReadingSlug}
                      className="px-2 py-1 rounded border border-gray-200 text-xs"
                    >
                      Add Slug
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(formData.relatedReading.preferredSlugs) &&
                      formData.relatedReading.preferredSlugs.map((slug: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={slug || ''}
                            placeholder="blog-slug"
                            onChange={(event) =>
                              updateFormValue(
                                ['relatedReading', 'preferredSlugs', String(index)],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeRelatedReadingSlug(index)}
                            className="px-3 rounded-md border border-gray-200 text-xs text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {isConditionsPageFile && Array.isArray(formData?.categories) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Categories
                    </div>
                    <button
                      type="button"
                      onClick={addConditionCategory}
                      className="px-2 py-1 rounded border border-gray-200 text-xs"
                    >
                      Add Category
                    </button>
                  </div>
                  <div className="space-y-4">
                    {sortedConditionCategories.map(({ category, index }: any) => {
                      const isAllCategory = category?.id === 'all';
                      const markdownPreviewKey = `conditions-category-${index}-description`;
                      return (
                        <div key={category.id || index} className="border rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">
                              {category.name || `Category ${index + 1}`}
                            </div>
                            {!isAllCategory && (
                              <button
                                type="button"
                                onClick={() => removeConditionCategory(index)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Category Name"
                              value={category.name || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['categories', String(index), 'name'],
                                  event.target.value
                                )
                              }
                            />
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Category ID (slug)"
                              value={category.id || ''}
                              onChange={(event) => {
                                const raw = event.target.value;
                                updateFormValue(
                                  ['categories', String(index), 'id'],
                                  toSlug(raw)
                                );
                              }}
                              disabled={isAllCategory}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Icon (e.g., Activity)"
                              value={category.icon || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['categories', String(index), 'icon'],
                                  event.target.value
                                )
                              }
                            />
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Subtitle"
                              value={category.subtitle || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['categories', String(index), 'subtitle'],
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Image"
                              value={category.image || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['categories', String(index), 'image'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker(['categories', String(index), 'image'])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm mb-2"
                            type="number"
                            placeholder="Order"
                            value={category.order ?? ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['categories', String(index), 'order'],
                                event.target.value === ''
                                  ? ''
                                  : Number(event.target.value)
                              )
                            }
                          />
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Description (Markdown)</span>
                            <button
                              type="button"
                              onClick={() => toggleMarkdownPreview(markdownPreviewKey)}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              {markdownPreview[markdownPreviewKey] ? 'Edit' : 'Preview'}
                            </button>
                          </div>
                          {markdownPreview[markdownPreviewKey] ? (
                            <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                              <ReactMarkdown
                                components={{
                                  ul: (props) => <ul className="list-disc pl-5" {...props} />,
                                  ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                                }}
                              >
                                {normalizeMarkdown(String(category.description || ''))}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <textarea
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Description (Markdown supported)"
                              value={category.description || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['categories', String(index), 'description'],
                                  event.target.value
                                )
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.isArray(formData?.conditions) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Conditions
                    </div>
                    <button
                      type="button"
                      onClick={addConditionItem}
                      className="px-2 py-1 rounded border border-gray-200 text-xs"
                    >
                      Add Condition
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.conditions.map((condition: any, index: number) => (
                      <div key={condition.id || index} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-500">
                            {condition.title || `Condition ${index + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeConditionItem(index)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="ID (slug)"
                          value={condition.id || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'id'],
                              toSlug(event.target.value)
                            )
                          }
                        />
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={condition.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        {isConditionsPageFile && (
                          <select
                            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            value={condition.category || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['conditions', String(index), 'category'],
                                event.target.value
                              )
                            }
                          >
                            <option value="">Select category</option>
                            {conditionCategoryOptions.map((category: any) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Icon (e.g., Activity)"
                          value={condition.icon || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'icon'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Description"
                          value={condition.description || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'description'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Common Symptoms (comma separated)"
                          value={Array.isArray(condition.symptoms) ? condition.symptoms.join(', ') : ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'symptoms'],
                              event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="TCM Approach"
                          value={condition.tcmApproach || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'tcmApproach'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Treatment Methods (comma separated)"
                          value={
                            Array.isArray(condition.treatmentMethods)
                              ? condition.treatmentMethods.join(', ')
                              : ''
                          }
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'treatmentMethods'],
                              event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                        <label className="mb-2 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={Boolean(condition.featured)}
                            onChange={(event) =>
                              updateFormValue(
                                ['conditions', String(index), 'featured'],
                                event.target.checked
                              )
                            }
                          />
                          <span className="text-gray-700">Featured</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={condition.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['conditions', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['conditions', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(formData?.caseStudies) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Case Studies
                  </div>
                  <div className="space-y-4">
                    {formData.caseStudies.map((item: any, index: number) => (
                      <div key={item.id || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {item.condition || `Case ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Condition"
                          value={item.condition || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['caseStudies', String(index), 'condition'],
                              event.target.value
                            )
                          }
                        />
                      <div className="mb-2">
                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                        <select
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={item.category || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['caseStudies', String(index), 'category'],
                              event.target.value
                            )
                          }
                        >
                          <option value="">Select category</option>
                          {caseStudyCategories.map((category: any) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Summary (Markdown)</span>
                        <button
                          type="button"
                          onClick={() =>
                            toggleMarkdownPreview(`caseStudies-${index}-summary`)
                          }
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          {markdownPreview[`caseStudies-${index}-summary`]
                            ? 'Edit'
                            : 'Preview'}
                        </button>
                      </div>
                      {markdownPreview[`caseStudies-${index}-summary`] ? (
                        <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                          <ReactMarkdown
                            components={{
                              ul: (props) => <ul className="list-disc pl-5" {...props} />,
                              ol: (props) => (
                                <ol className="list-decimal pl-5" {...props} />
                              ),
                              li: (props) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {normalizeMarkdown(item.summary || '')}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Summary (Markdown supported)"
                          value={item.summary || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['caseStudies', String(index), 'summary'],
                              event.target.value
                            )
                          }
                        />
                      )}
                        <div className="grid gap-2 md:grid-cols-3">
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Image"
                              value={item.image || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'image'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker(['caseStudies', String(index), 'image'])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Before image"
                              value={item.beforeImage || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'beforeImage'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker([
                                  'caseStudies',
                                  String(index),
                                  'beforeImage',
                                ])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="After image"
                              value={item.afterImage || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'afterImage'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker([
                                  'caseStudies',
                                  String(index),
                                  'afterImage',
                                ])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.featuredPost && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Featured Post
                  </div>
                  <input
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Title"
                    value={formData.featuredPost.title || ''}
                    onChange={(event) =>
                      updateFormValue(['featuredPost', 'title'], event.target.value)
                    }
                  />
                  <textarea
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Excerpt"
                    value={formData.featuredPost.excerpt || ''}
                    onChange={(event) =>
                      updateFormValue(['featuredPost', 'excerpt'], event.target.value)
                    }
                  />
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Image"
                      value={formData.featuredPost.image || ''}
                      onChange={(event) =>
                        updateFormValue(['featuredPost', 'image'], event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker(['featuredPost', 'image'])}
                      className="px-3 rounded-md border border-gray-200 text-xs"
                    >
                      Choose
                    </button>
                  </div>
                </div>
              )}

              {Array.isArray(formData?.posts) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Blog Posts
                  </div>
                  <div className="space-y-4">
                    {formData.posts.map((post: any, index: number) => (
                      <div key={post.slug || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {post.title || `Post ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={post.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['posts', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Excerpt"
                          value={post.excerpt || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['posts', String(index), 'excerpt'],
                              event.target.value
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={post.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['posts', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['posts', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.slug && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Blog Article
                  </div>
                  <input
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Title"
                    value={formData.title || ''}
                    onChange={(event) => updateFormValue(['title'], event.target.value)}
                  />
                  <textarea
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Excerpt"
                    value={formData.excerpt || ''}
                    onChange={(event) => updateFormValue(['excerpt'], event.target.value)}
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Image"
                      value={formData.image || ''}
                      onChange={(event) => updateFormValue(['image'], event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker(['image'])}
                      className="px-3 rounded-md border border-gray-200 text-xs"
                    >
                      Choose
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Author"
                      value={formData.author || ''}
                      onChange={(event) => updateFormValue(['author'], event.target.value)}
                    />
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Publish Date (YYYY-MM-DD)"
                      value={formData.publishDate || ''}
                      onChange={(event) =>
                        updateFormValue(['publishDate'], event.target.value)
                      }
                    />
                  </div>
                  <input
                    className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Category"
                    value={formData.category || ''}
                    onChange={(event) => updateFormValue(['category'], event.target.value)}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      id="featured"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={Boolean(formData.featured)}
                      onChange={(event) =>
                        updateFormValue(['featured'], event.target.checked)
                      }
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Featured article
                    </label>
                  </div>
                  {isBlogPostFile && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-md border border-gray-200 p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Related Services
                        </div>
                        {blogServiceOptions.length === 0 && (
                          <p className="text-xs text-gray-500">No services found.</p>
                        )}
                        <div className="space-y-2">
                          {blogServiceOptions.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={Array.isArray(formData.relatedServices)
                                  ? formData.relatedServices.includes(service.id)
                                  : false}
                                onChange={() =>
                                  toggleSelection(['relatedServices'], service.id)
                                }
                              />
                              {service.title}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Related Conditions
                        </div>
                        {blogConditionOptions.length === 0 && (
                          <p className="text-xs text-gray-500">No conditions found.</p>
                        )}
                        <div className="space-y-2">
                          {blogConditionOptions.map((condition) => (
                            <label
                              key={condition.id}
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={Array.isArray(formData.relatedConditions)
                                  ? formData.relatedConditions.includes(condition.id)
                                  : false}
                                onChange={() =>
                                  toggleSelection(['relatedConditions'], condition.id)
                                }
                              />
                              {condition.title}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Body (Markdown)</span>
                      <button
                        type="button"
                        onClick={() => toggleMarkdownPreview('blog-article-body')}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        {markdownPreview['blog-article-body'] ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                    {markdownPreview['blog-article-body'] ? (
                      <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                        <ReactMarkdown
                          components={{
                            ul: (props) => <ul className="list-disc pl-5" {...props} />,
                            ol: (props) => (
                              <ol className="list-decimal pl-5" {...props} />
                            ),
                            li: (props) => <li className="mb-1" {...props} />,
                          }}
                        >
                          {normalizeMarkdown(formData.contentMarkdown || '')}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        className="w-full min-h-[220px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Write the article body in Markdown"
                        value={formData.contentMarkdown || ''}
                        onChange={(event) =>
                          updateFormValue(['contentMarkdown'], event.target.value)
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {formData && !formData.hero && !formData.introduction && !formData.cta && (
                <div className="text-sm text-gray-500">
                  No schema panels available for this file yet. Use the JSON tab.
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full min-h-[520px] rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-800"
              value={content}
              onChange={(event) => {
                const next = event.target.value;
                setContent(next);
                try {
                  setFormData(JSON.parse(next));
                } catch (error) {
                  setFormData(null);
                }
              }}
              placeholder="Select a file to begin editing."
            />
          )}
        </div>
      </div>
      <ImagePickerModal
        open={showImagePicker}
        siteId={siteId}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
