#!/usr/bin/env node
/**
 * Client Onboarding Pipeline (Pipeline B)
 *
 * Clones the dental master template, customizes content for a new client,
 * generates unique copy via Claude API, and pushes everything to Supabase.
 *
 * Usage:
 *   node scripts/onboard-client.mjs <client-id>
 *   node scripts/onboard-client.mjs bright-smile-dental --skip-ai
 *   node scripts/onboard-client.mjs bright-smile-dental --dry-run
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── Parse arguments ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const clientId = args.find((a) => !a.startsWith('--'));
const SKIP_AI = args.includes('--skip-ai');
const DRY_RUN = args.includes('--dry-run');

if (!clientId) {
  console.error('Usage: node scripts/onboard-client.mjs <client-id> [--skip-ai] [--dry-run]');
  process.exit(1);
}

// ── Load intake ──────────────────────────────────────────────────────
const intakePath = path.join(__dirname, 'intake', `${clientId}.json`);
if (!fs.existsSync(intakePath)) {
  console.error(`Intake file not found: ${intakePath}`);
  process.exit(1);
}
const intake = JSON.parse(fs.readFileSync(intakePath, 'utf-8'));
const TEMPLATE_ID = intake.templateSiteId || 'alex-dental';
const SITE_ID = intake.clientId;
const LOCALES = intake.locales?.supported || ['en'];
const DEFAULT_LOCALE = intake.locales?.default || 'en';

// ── Load environment ─────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return match ? match[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const ANTHROPIC_API_KEY = getEnv('ANTHROPIC_API_KEY');
const STORAGE_BUCKET = getEnv('SUPABASE_STORAGE_BUCKET') || getEnv('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') || '';

if (!KEY) { console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found'); process.exit(1); }
if (!SKIP_AI && !ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not found (use --skip-ai to skip AI steps)');
  process.exit(1);
}

const supaHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

// ── Supabase REST helpers ────────────────────────────────────────────
async function upsert(table, rows, onConflict) {
  if (DRY_RUN) { console.log(`  [DRY-RUN] Would upsert ${rows.length} rows to ${table}`); return rows; }
  const url = onConflict
    ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, { method: 'POST', headers: supaHeaders, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`Upsert ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function fetchRows(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Fetch ${table} failed (${res.status})`);
  return res.json();
}

async function deleteRows(table, filters) {
  if (DRY_RUN) { console.log(`  [DRY-RUN] Would delete from ${table}`); return; }
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE', headers: supaHeaders,
  });
  if (!res.ok) throw new Error(`Delete ${table} failed (${res.status}): ${await res.text()}`);
}

async function deleteRowsLike(table, filters, likeFilters) {
  if (DRY_RUN) { console.log(`  [DRY-RUN] Would delete from ${table} (like)`); return; }
  const params = [
    ...Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`),
    ...Object.entries(likeFilters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`),
  ].join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE', headers: supaHeaders,
  });
  if (!res.ok) throw new Error(`Delete ${table} failed (${res.status}): ${await res.text()}`);
}

// ── Supabase Storage helpers ─────────────────────────────────────────
const storageHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function listStorageFiles(prefix) {
  if (!STORAGE_BUCKET) return [];
  const files = [];
  const queue = [prefix];
  while (queue.length > 0) {
    const currentPrefix = queue.shift();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${STORAGE_BUCKET}`, {
      method: 'POST',
      headers: { ...storageHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: currentPrefix, limit: 1000, offset: 0 }),
    });
    if (!res.ok) break;
    const items = await res.json();
    for (const item of items) {
      const fullPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
      if (item.id) {
        files.push(fullPath);
      } else {
        queue.push(fullPath);
      }
    }
  }
  return files;
}

async function copyStorageFile(fromPath, toPath) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
    method: 'POST',
    headers: { ...storageHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: STORAGE_BUCKET, sourceKey: fromPath, destinationKey: toPath }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes('already exists')) return true;
    return false;
  }
  return true;
}

// ── Step runner ──────────────────────────────────────────────────────
async function runStep(name, fn) {
  const start = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'='.repeat(60)}\n`);
  await fn();
  console.log(`\n  [${name}] completed in ${Date.now() - start}ms`);
}

// ── Service category mapping ─────────────────────────────────────────
const SERVICE_CATEGORIES = {
  general: ['cleanings-and-exams', 'fillings', 'root-canal', 'extractions', 'gum-disease-treatment', 'oral-cancer-screening'],
  cosmetic: ['teeth-whitening', 'veneers', 'bonding', 'smile-makeover'],
  restorative: ['dental-implants', 'crowns-and-bridges', 'dentures', 'full-arch-implants'],
  orthodontics: ['invisalign'],
  pediatric: ['pediatric-dentistry'],
  comfort: ['sedation-dentistry'],
};
const ALL_SERVICE_SLUGS = Object.values(SERVICE_CATEGORIES).flat();

// ── Color utilities ──────────────────────────────────────────────────
function hexToHsl(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function darken(hex, percent) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - percent));
}

function lighten(hex, percent) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + percent));
}

// ── Deep string replace ──────────────────────────────────────────────
function deepReplace(obj, replacements) {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [search, replace] of replacements) {
      result = result.replaceAll(search, replace);
    }
    return result;
  }
  if (Array.isArray(obj)) return obj.map((item) => deepReplace(item, replacements));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = deepReplace(val, replacements);
    }
    return out;
  }
  return obj;
}

// ── Template interpolation ───────────────────────────────────────────
function interpolateTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// ── Slugify ──────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase()
    .replace(/^(dr\.?\s+)/i, 'dr-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Phone to tel link ────────────────────────────────────────────────
function phoneToTel(phone) {
  return 'tel:+1' + phone.replace(/[^0-9]/g, '');
}

// ══════════════════════════════════════════════════════════════════════
//  O1: CLONE
// ══════════════════════════════════════════════════════════════════════
async function stepClone() {
  // Check if site already exists
  const existing = await fetchRows('sites', { id: SITE_ID });
  if (existing.length > 0) {
    console.log(`  Site "${SITE_ID}" already exists — skipping site creation.`);
    console.log('  Re-cloning content from template...');
  } else {
    // Create site
    console.log(`  Creating site: ${SITE_ID}`);
    await upsert('sites', [{
      id: SITE_ID,
      name: intake.business.name,
      domain: intake.domains?.production || '',
      enabled: true,
      default_locale: DEFAULT_LOCALE,
      supported_locales: LOCALES,
    }], 'id');
  }

  // Clone content entries from template
  console.log(`  Fetching template content from "${TEMPLATE_ID}"...`);
  const templateEntries = await fetchRows('content_entries', { site_id: TEMPLATE_ID });
  console.log(`  Template has ${templateEntries.length} content entries`);

  // Batch upsert with new site_id
  const cloned = templateEntries.map((e) => ({
    site_id: SITE_ID,
    locale: e.locale,
    path: e.path,
    data: e.data,
    updated_by: 'onboard-script',
  }));

  const BATCH = 50;
  for (let i = 0; i < cloned.length; i += BATCH) {
    const batch = cloned.slice(i, i + BATCH);
    await upsert('content_entries', batch, 'site_id,locale,path');
  }
  console.log(`  Cloned ${cloned.length} entries to "${SITE_ID}"`);

  // Register domain aliases
  const domainRows = [];
  if (intake.domains?.production) {
    domainRows.push({ site_id: SITE_ID, domain: intake.domains.production, environment: 'prod', enabled: true });
  }
  if (intake.domains?.dev) {
    domainRows.push({ site_id: SITE_ID, domain: intake.domains.dev, environment: 'dev', enabled: true });
  }
  if (domainRows.length > 0) {
    await upsert('site_domains', domainRows, 'site_id,domain,environment');
    console.log(`  Registered ${domainRows.length} domain alias(es)`);
  }

  // Clone media assets DB records (remap URLs to new site namespace)
  const templateMedia = await fetchRows('media_assets', { site_id: TEMPLATE_ID });
  if (templateMedia.length > 0) {
    const mediaBatchSize = 100;
    for (let i = 0; i < templateMedia.length; i += mediaBatchSize) {
      const batch = templateMedia.slice(i, i + mediaBatchSize);
      const clonedMedia = batch.map((item) => ({
        site_id: SITE_ID,
        path: item.path,
        url: (item.url || '')
          .replace(`/uploads/${TEMPLATE_ID}/`, `/uploads/${SITE_ID}/`)
          .replace(`/${TEMPLATE_ID}/`, `/${SITE_ID}/`),
        updated_at: new Date().toISOString(),
      }));
      await upsert('media_assets', clonedMedia, 'site_id,path');
    }
    console.log(`  Cloned ${templateMedia.length} media asset records`);
  } else {
    console.log('  No media assets to clone');
  }

  // Copy files in Supabase Storage bucket
  if (STORAGE_BUCKET) {
    const storageFiles = await listStorageFiles(TEMPLATE_ID);
    if (storageFiles.length > 0) {
      let copied = 0;
      const CONCURRENCY = 5;
      for (let i = 0; i < storageFiles.length; i += CONCURRENCY) {
        const batch = storageFiles.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map((filePath) => {
            const destPath = filePath.replace(`${TEMPLATE_ID}/`, `${SITE_ID}/`);
            return copyStorageFile(filePath, destPath);
          })
        );
        copied += results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
      console.log(`  Copied ${copied}/${storageFiles.length} storage bucket files`);
    } else {
      console.log('  No storage bucket files to copy');
    }
  }

  // Copy file-based uploads and content directories
  const copyDirIfExists = async (src, dest) => {
    try {
      await fsPromises.access(src);
    } catch {
      return false; // source doesn't exist
    }
    await fsPromises.mkdir(path.dirname(dest), { recursive: true });
    await fsPromises.cp(src, dest, { recursive: true, errorOnExist: false });
    return true;
  };

  const uploadsRoot = path.join(ROOT, 'public', 'uploads');
  const copiedUploads = await copyDirIfExists(
    path.join(uploadsRoot, TEMPLATE_ID),
    path.join(uploadsRoot, SITE_ID)
  );
  if (copiedUploads) console.log(`  Copied uploads/${TEMPLATE_ID}/ → uploads/${SITE_ID}/`);

  const contentSrcDir = path.join(CONTENT_DIR, TEMPLATE_ID);
  const copiedContent = await copyDirIfExists(
    contentSrcDir,
    path.join(CONTENT_DIR, SITE_ID)
  );
  if (copiedContent) console.log(`  Copied content/${TEMPLATE_ID}/ → content/${SITE_ID}/`);

  // Update local _sites.json and _site-domains.json
  const sitesFile = path.join(CONTENT_DIR, '_sites.json');
  const sitesData = JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
  if (!sitesData.sites.find((s) => s.id === SITE_ID)) {
    sitesData.sites.push({
      id: SITE_ID,
      name: intake.business.name,
      domain: intake.domains?.production || '',
      enabled: true,
      defaultLocale: DEFAULT_LOCALE,
      supportedLocales: LOCALES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fs.writeFileSync(sitesFile, JSON.stringify(sitesData, null, 2) + '\n');
    console.log('  Updated _sites.json');
  }

  const domainsFile = path.join(CONTENT_DIR, '_site-domains.json');
  const domainsData = JSON.parse(fs.readFileSync(domainsFile, 'utf-8'));
  for (const dr of domainRows) {
    if (!domainsData.domains.find((d) => d.siteId === dr.site_id && d.domain === dr.domain)) {
      domainsData.domains.push({ siteId: dr.site_id, domain: dr.domain, environment: dr.environment, enabled: true });
    }
  }
  fs.writeFileSync(domainsFile, JSON.stringify(domainsData, null, 2) + '\n');
  console.log('  Updated _site-domains.json');
}

// ══════════════════════════════════════════════════════════════════════
//  O2: BRAND
// ══════════════════════════════════════════════════════════════════════
async function stepBrand() {
  const variantsPath = path.join(__dirname, 'onboard', 'brand-variants.json');
  const variants = JSON.parse(fs.readFileSync(variantsPath, 'utf-8'));
  const variantName = intake.brand?.variant || 'teal-gold';
  const base = JSON.parse(JSON.stringify(variants[variantName] || variants['teal-gold']));

  console.log(`  Base variant: ${variantName}`);

  // Apply color overrides
  if (intake.brand?.primaryColor) {
    const pc = intake.brand.primaryColor;
    base.colors.primary.DEFAULT = pc;
    base.colors.primary.dark = darken(pc, 12);
    base.colors.primary.light = lighten(pc, 18);
    base.colors.primary['50'] = lighten(pc, 42);
    base.colors.primary['100'] = lighten(pc, 32);
    console.log(`  Primary color override: ${pc}`);
  }
  if (intake.brand?.secondaryColor) {
    const sc = intake.brand.secondaryColor;
    base.colors.secondary.DEFAULT = sc;
    base.colors.secondary.dark = darken(sc, 12);
    base.colors.secondary.light = lighten(sc, 18);
    base.colors.secondary['50'] = lighten(sc, 42);
    console.log(`  Secondary color override: ${sc}`);
  }

  // Apply font overrides
  if (intake.brand?.fonts?.display) {
    const f = intake.brand.fonts.display;
    base.typography.fonts.display = `'${f}', Georgia, serif`;
    base.typography.fonts.heading = `'${f}', Georgia, serif`;
    console.log(`  Display font override: ${f}`);
  }
  if (intake.brand?.fonts?.body) {
    const f = intake.brand.fonts.body;
    base.typography.fonts.body = `'${f}', -apple-system, sans-serif`;
    base.typography.fonts.small = `'${f}', -apple-system, sans-serif`;
    console.log(`  Body font override: ${f}`);
  }

  // Upsert theme.json (stored under 'en' locale in DB)
  await upsert('content_entries', [{
    site_id: SITE_ID,
    locale: 'en',
    path: 'theme.json',
    data: base,
    updated_by: 'onboard-script',
  }], 'site_id,locale,path');

  console.log('  Theme generated and saved');
}

// ══════════════════════════════════════════════════════════════════════
//  O3: SERVICE PRUNING
// ══════════════════════════════════════════════════════════════════════
async function stepPruneServices() {
  const enabledSlugs = intake.services?.enabled || ALL_SERVICE_SLUGS;
  const disabledSlugs = ALL_SERVICE_SLUGS.filter((s) => !enabledSlugs.includes(s));

  if (disabledSlugs.length === 0) {
    console.log('  All services enabled — no pruning needed.');
    return;
  }

  console.log(`  Services: ${enabledSlugs.length} enabled, ${disabledSlugs.length} to remove`);
  console.log(`  Removing: ${disabledSlugs.join(', ')}`);

  for (const locale of LOCALES) {
    // 1. Delete disabled service content entries
    for (const slug of disabledSlugs) {
      await deleteRows('content_entries', { site_id: SITE_ID, locale, path: `services/${slug}.json` });
    }

    // 2. Update navigation.json
    const navRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'navigation.json' });
    if (navRows[0]?.data) {
      const nav = navRows[0].data;
      const servicesMenu = nav.primary?.find((item) => item.label === 'Services' || item.children?.some((c) => c.url?.includes('/services/')));
      if (servicesMenu?.children) {
        servicesMenu.children = servicesMenu.children.filter((child) => {
          // Keep category headers if they still have enabled services
          if (child.url?.includes('#')) {
            const categoryId = child.url.split('#')[1];
            const catSlugs = SERVICE_CATEGORIES[categoryId] || [];
            return catSlugs.some((s) => enabledSlugs.includes(s));
          }
          // Keep service links only if enabled
          const slug = child.url?.split('/services/')[1];
          return !slug || enabledSlugs.includes(slug);
        });
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'navigation.json', data: nav, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // 3. Update pages/services.json
    const svcRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/services.json' });
    if (svcRows[0]?.data) {
      const svc = svcRows[0].data;
      if (svc.servicesList?.items) {
        svc.servicesList.items = svc.servicesList.items.filter((item) => enabledSlugs.includes(item.id || item.slug));
      }
      if (svc.categories) {
        svc.categories = svc.categories.filter((cat) => {
          const catSlugs = SERVICE_CATEGORIES[cat.id] || [];
          return catSlugs.some((s) => enabledSlugs.includes(s));
        });
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/services.json', data: svc, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // 4. Update pages/home.json services section
    const homeRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/home.json' });
    if (homeRows[0]?.data) {
      const home = homeRows[0].data;
      if (home.services?.services) {
        home.services.services = home.services.services.filter((s) => {
          const catSlugs = SERVICE_CATEGORIES[s.id] || [];
          return catSlugs.length === 0 || catSlugs.some((slug) => enabledSlugs.includes(slug));
        });
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/home.json', data: home, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // 5. Update footer.json service links
    const footerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'footer.json' });
    if (footerRows[0]?.data) {
      const footer = footerRows[0].data;
      if (footer.services) {
        footer.services = footer.services.filter((s) => {
          if (s.url === '/services' || s.url === '/emergency') return true;
          const slug = s.url?.split('/services/')[1];
          return !slug || enabledSlugs.includes(slug);
        });
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'footer.json', data: footer, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    console.log(`  [${locale}] Pruned navigation, services hub, home, footer`);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  O4A: DETERMINISTIC CONTENT REPLACEMENT
// ══════════════════════════════════════════════════════════════════════
async function stepDeterministicReplace() {
  // Build replacement pairs
  const biz = intake.business;
  const loc = intake.location;
  const replacements = [
    ['Alex Dental Clinic', biz.name],
    ['Alex Dental', biz.name.replace(/ Clinic$/, '').replace(/ Practice$/, '')],
    ['alex-dental.com', intake.domains?.production || `${SITE_ID}.com`],
    ['(845) 555-0180', loc.phone],
    ['+18455550180', loc.phone.replace(/[^0-9]/g, '')],
    ['tel:+18455550180', phoneToTel(loc.phone)],
    ['info@alex-dental.com', loc.email],
    ['mailto:info@alex-dental.com', `mailto:${loc.email}`],
    ['appointments@alex-dental.com', loc.emailAppointments || loc.email],
    ['85 Crystal Run Road', loc.address],
    ['85 Crystal Run Road, Middletown, NY 10940', `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`],
    ['Middletown, NY 10940', `${loc.city}, ${loc.state} ${loc.zip}`],
    ['Middletown, NY', `${loc.city}, ${loc.state}`],
    ['Middletown', loc.city],
    ['NY 10940', `${loc.state} ${loc.zip}`],
    ['10940', loc.zip],
  ];

  console.log(`  Applying ${replacements.length} replacement pairs across all content entries...`);

  // Fetch all content entries for new site
  const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });
  console.log(`  Processing ${allEntries.length} content entries`);

  const updated = [];
  for (const entry of allEntries) {
    if (entry.path === 'theme.json') continue; // Skip theme (already handled in O2)
    const newData = deepReplace(entry.data, replacements);
    if (JSON.stringify(newData) !== JSON.stringify(entry.data)) {
      updated.push({ site_id: SITE_ID, locale: entry.locale, path: entry.path, data: newData, updated_by: 'onboard-script' });
    }
  }

  // Batch upsert changes
  const BATCH = 50;
  for (let i = 0; i < updated.length; i += BATCH) {
    await upsert('content_entries', updated.slice(i, i + BATCH), 'site_id,locale,path');
  }
  console.log(`  Deep-replaced ${updated.length} entries`);

  // ── Structural updates for specific files ──────────────────────────
  for (const locale of LOCALES) {
    // site.json — full rebuild
    const siteRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'site.json' });
    if (siteRows[0]?.data) {
      const site = siteRows[0].data;
      Object.assign(site, {
        id: SITE_ID,
        businessName: biz.name,
        tagline: biz.tagline || site.tagline,
        description: biz.description || site.description,
        address: loc.address,
        addressFull: `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}`,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        lat: loc.lat,
        lng: loc.lng,
        phone: loc.phone,
        phoneEmergency: loc.phoneEmergency || loc.phone,
        email: loc.email,
        emailAppointments: loc.emailAppointments || loc.email,
        addressMapUrl: loc.addressMapUrl || site.addressMapUrl,
        mapsEmbedUrl: loc.mapsEmbedUrl || site.mapsEmbedUrl,
        hours: intake.hours,
        social: intake.social || site.social,
        booking: intake.booking || site.booking,
        display: intake.display || site.display,
        insurance: intake.insurance || site.insurance,
      });
      if (intake.business.ownerCredentials) {
        site.credentials = {
          ...site.credentials,
          specializations: biz.ownerSpecializations || site.credentials?.specializations,
        };
      }
      // Update languages to match supported locales
      const langLabels = { en: 'English', zh: '中文', es: 'Español', ko: '한국어' };
      const langFlags = { en: 'US', zh: 'CN', es: 'MX', ko: 'KR' };
      site.languages = LOCALES.map((code) => ({
        code, label: langLabels[code] || code, flag: langFlags[code] || '', enabled: true,
      }));
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'site.json', data: site, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // header.json — update logo, CTA, announcement
    const headerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'header.json' });
    if (headerRows[0]?.data) {
      const header = headerRows[0].data;
      header.logoText = biz.name.replace(/ Clinic$/, '').replace(/ Practice$/, '');
      if (header.ctaSecondary) {
        header.ctaSecondary.url = phoneToTel(loc.phone);
      }
      if (header.announcementBar && intake.display?.emergencyBannerText) {
        header.announcementBar.text = intake.display.emergencyBannerText;
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'header.json', data: header, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // footer.json — update brand, contact, hours
    const footerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'footer.json' });
    if (footerRows[0]?.data) {
      const footer = footerRows[0].data;
      footer.brand = {
        name: biz.name,
        logoText: biz.name.replace(/ Clinic$/, '').replace(/ Practice$/, ''),
        description: biz.description || footer.brand?.description,
      };
      footer.contact = {
        phone: loc.phone,
        phoneLink: phoneToTel(loc.phone),
        email: loc.email,
        emailLink: `mailto:${loc.email}`,
        addressLines: [loc.address, `${loc.city}, ${loc.state} ${loc.zip}`],
      };
      // Rebuild hours array
      const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayAbbr = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
      footer.hours = daysOrder
        .filter((d) => intake.hours[d])
        .map((d) => `${dayAbbr[d]}: ${intake.hours[d]}`);
      footer.copyright = `© ${new Date().getFullYear()} ${biz.name}. All rights reserved.`;
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'footer.json', data: footer, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // doctors/ — delete template doctors, create from intake
    for (const slug of ['dr-alex-chen', 'dr-sarah-kim']) {
      await deleteRows('content_entries', { site_id: SITE_ID, locale, path: `doctors/${slug}.json` });
    }

    // Create owner doctor file
    const ownerSlug = slugify(biz.ownerName);
    const ownerDoc = {
      name: biz.ownerName,
      title: biz.ownerTitle,
      role: 'Lead Dentist',
      slug: ownerSlug,
      image: '/images/doctors/placeholder.jpg',
      order: 1,
      quote: '',
      featured: true,
      languages: biz.ownerLanguages || ['English'],
      credentials: biz.ownerCredentials || [],
      certifications: biz.ownerCertifications || [],
      specializations: biz.ownerSpecializations || [],
      bio: biz.ownerBio || '',
    };
    await upsert('content_entries', [{ site_id: SITE_ID, locale, path: `doctors/${ownerSlug}.json`, data: ownerDoc, updated_by: 'onboard-script' }], 'site_id,locale,path');

    // Create team member doctor files
    if (biz.teamMembers) {
      for (let i = 0; i < biz.teamMembers.length; i++) {
        const member = biz.teamMembers[i];
        const memberSlug = slugify(member.name);
        const memberDoc = {
          name: member.name,
          title: member.title,
          role: member.role || 'Associate Dentist',
          slug: memberSlug,
          image: '/images/doctors/placeholder.jpg',
          order: i + 2,
          quote: '',
          featured: true,
          languages: member.languages || ['English'],
          credentials: member.credentials || [],
          certifications: member.certifications || [],
          specializations: member.specializations || [],
          bio: member.bio || '',
        };
        await upsert('content_entries', [{ site_id: SITE_ID, locale, path: `doctors/${memberSlug}.json`, data: memberDoc, updated_by: 'onboard-script' }], 'site_id,locale,path');
      }
    }

    console.log(`  [${locale}] Updated site.json, header.json, footer.json, doctors/`);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  O4B + O5: AI CONTENT + SEO GENERATION
// ══════════════════════════════════════════════════════════════════════
async function stepAiContent() {
  if (SKIP_AI) {
    console.log('  Skipping AI content generation (--skip-ai flag)');
    return;
  }

  const biz = intake.business;
  const loc = intake.location;
  const tone = intake.contentTone || {};

  // ── Generate content via Claude ────────────────────────────────────
  console.log('  Generating content via Claude API...');
  const contentPrompt = fs.readFileSync(path.join(__dirname, 'onboard/prompts/dental/content.md'), 'utf-8');
  const teamDesc = biz.teamMembers?.map((m) => `- ${m.name}, ${m.title}, ${m.role}. Languages: ${(m.languages || []).join(', ')}. Specializations: ${(m.specializations || []).join(', ')}.`).join('\n') || 'No additional team members.';

  const contentInput = interpolateTemplate(contentPrompt, {
    businessName: biz.name,
    ownerName: biz.ownerName,
    ownerTitle: biz.ownerTitle,
    city: loc.city,
    state: loc.state,
    foundedYear: String(biz.foundedYear || ''),
    yearsExperience: biz.yearsExperience || '',
    languages: (biz.ownerLanguages || []).join(', '),
    uniqueSellingPoints: (tone.uniqueSellingPoints || []).map((u) => `- ${u}`).join('\n'),
    targetDemographic: tone.targetDemographic || '',
    voice: tone.voice || 'warm-professional',
    servicesList: (intake.services?.enabled || []).join(', '),
    ownerCredentials: JSON.stringify(biz.ownerCredentials || [], null, 2),
    ownerCertifications: (biz.ownerCertifications || []).join(', '),
    ownerSpecializations: (biz.ownerSpecializations || []).join(', '),
    teamMembers: teamDesc,
  });

  const contentResult = await callClaude(contentInput);
  const aiContent = parseJsonFromResponse(contentResult);
  console.log('  Content generated successfully');

  // ── Generate SEO via Claude ────────────────────────────────────────
  console.log('  Generating SEO metadata via Claude API...');
  const seoPrompt = fs.readFileSync(path.join(__dirname, 'onboard/prompts/dental/seo.md'), 'utf-8');
  const seoInput = interpolateTemplate(seoPrompt, {
    businessName: biz.name,
    city: loc.city,
    state: loc.state,
    phone: loc.phone,
    servicesList: (intake.services?.enabled || []).join(', '),
    languages: (biz.ownerLanguages || []).join(', '),
  });

  const seoResult = await callClaude(seoInput);
  const aiSeo = parseJsonFromResponse(seoResult);
  console.log('  SEO metadata generated successfully');

  // ── Merge AI content into DB entries ───────────────────────────────
  for (const locale of LOCALES) {
    // Update home page hero
    const homeRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/home.json' });
    if (homeRows[0]?.data && aiContent.hero) {
      const home = homeRows[0].data;
      if (aiContent.hero.tagline) home.hero.tagline = aiContent.hero.tagline;
      if (aiContent.hero.description) home.hero.description = aiContent.hero.description;
      if (intake.stats) home.hero.stats = intake.stats;
      if (aiContent.whyChooseUs && home.whyChooseUs) {
        home.whyChooseUs.features = aiContent.whyChooseUs;
      }
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/home.json', data: home, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // Update about page
    const aboutRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'pages/about.json' });
    if (aboutRows[0]?.data) {
      const about = aboutRows[0].data;
      if (aiContent.aboutStory && about.journey) about.journey.story = aiContent.aboutStory;
      if (aiContent.ownerBio && about.profile) about.profile.bio = aiContent.ownerBio;
      if (aiContent.ownerQuote && about.profile) about.profile.quote = aiContent.ownerQuote;
      await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'pages/about.json', data: about, updated_by: 'onboard-script' }], 'site_id,locale,path');
    }

    // Update doctor bios
    if (aiContent.ownerBio) {
      const ownerSlug = slugify(biz.ownerName);
      const docRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: `doctors/${ownerSlug}.json` });
      if (docRows[0]?.data) {
        const doc = docRows[0].data;
        doc.bio = aiContent.ownerBio;
        if (aiContent.ownerQuote) doc.quote = aiContent.ownerQuote;
        await upsert('content_entries', [{ site_id: SITE_ID, locale, path: `doctors/${ownerSlug}.json`, data: doc, updated_by: 'onboard-script' }], 'site_id,locale,path');
      }
    }
    if (aiContent.teamBios) {
      for (const tb of aiContent.teamBios) {
        const slug = tb.slug || slugify(tb.name || '');
        if (!slug) continue;
        const docRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: `doctors/${slug}.json` });
        if (docRows[0]?.data) {
          const doc = docRows[0].data;
          doc.bio = tb.bio;
          await upsert('content_entries', [{ site_id: SITE_ID, locale, path: `doctors/${slug}.json`, data: doc, updated_by: 'onboard-script' }], 'site_id,locale,path');
        }
      }
    }

    // Update testimonials
    if (aiContent.testimonials) {
      const testimonials = aiContent.testimonials.map((t, i) => ({
        id: `t${String(i + 1).padStart(3, '0')}`,
        date: new Date(Date.now() - (i * 30 + Math.random() * 60) * 86400000).toISOString().split('T')[0],
        text: t.text,
        rating: t.rating || 5,
        source: 'google',
        featured: i < 3,
        language: 'en',
        patientName: t.patientName,
        serviceCategory: t.serviceCategory || 'general',
      }));
      await upsert('content_entries', [{
        site_id: SITE_ID, locale, path: 'testimonials.json',
        data: { testimonials, displayCount: 6, showRatings: true },
        updated_by: 'onboard-script',
      }], 'site_id,locale,path');
    }

    // Update announcement bar
    if (aiContent.announcementBar) {
      const headerRows = await fetchRows('content_entries', { site_id: SITE_ID, locale, path: 'header.json' });
      if (headerRows[0]?.data) {
        const header = headerRows[0].data;
        if (header.announcementBar) header.announcementBar.text = aiContent.announcementBar;
        await upsert('content_entries', [{ site_id: SITE_ID, locale, path: 'header.json', data: header, updated_by: 'onboard-script' }], 'site_id,locale,path');
      }
    }

    // Update seo.json
    if (aiSeo) {
      await upsert('content_entries', [{
        site_id: SITE_ID, locale, path: 'seo.json', data: aiSeo, updated_by: 'onboard-script',
      }], 'site_id,locale,path');
    }

    console.log(`  [${locale}] Merged AI content + SEO`);
  }
}

// ── Claude API call helper ───────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API failed (${res.status}): ${body}`);
  }
  const result = await res.json();
  return result.content[0].text;
}

function parseJsonFromResponse(text) {
  // Try to extract JSON from possible markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try to find the outermost { ... }
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
    throw new Error(`Failed to parse AI response as JSON: ${e.message}\nResponse: ${text.substring(0, 200)}...`);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  O6: CLEANUP
// ══════════════════════════════════════════════════════════════════════
async function stepCleanup() {
  // Delete content for unsupported locales
  const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });
  const supportedSet = new Set(LOCALES);
  const unsupportedEntries = allEntries.filter((e) => !supportedSet.has(e.locale) && e.locale !== 'en');

  if (unsupportedEntries.length > 0) {
    const unsupportedLocales = [...new Set(unsupportedEntries.map((e) => e.locale))];
    console.log(`  Removing content for unsupported locales: ${unsupportedLocales.join(', ')}`);
    for (const locale of unsupportedLocales) {
      const entries = unsupportedEntries.filter((e) => e.locale === locale);
      for (const entry of entries) {
        await deleteRows('content_entries', { site_id: SITE_ID, locale, path: entry.path });
      }
      console.log(`  Deleted ${entries.length} entries for locale "${locale}"`);
    }
  } else {
    console.log('  No unsupported locale cleanup needed.');
  }

  // Final entry count
  const finalEntries = await fetchRows('content_entries', { site_id: SITE_ID });
  const countByLocale = {};
  for (const e of finalEntries) {
    countByLocale[e.locale] = (countByLocale[e.locale] || 0) + 1;
  }
  console.log(`  Final content entries: ${finalEntries.length} total`);
  for (const [locale, count] of Object.entries(countByLocale)) {
    console.log(`    ${locale}: ${count} entries`);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  O7: VERIFY
// ══════════════════════════════════════════════════════════════════════
async function stepVerify() {
  const errors = [];
  const warnings = [];

  const allEntries = await fetchRows('content_entries', { site_id: SITE_ID });

  // 1. Required paths
  const requiredPaths = [
    'site.json', 'header.json', 'footer.json', 'navigation.json', 'seo.json',
    'pages/home.json', 'pages/services.json', 'pages/about.json', 'pages/contact.json',
  ];
  for (const locale of LOCALES) {
    for (const p of requiredPaths) {
      const found = allEntries.find((e) => e.locale === locale && e.path === p);
      if (!found) errors.push(`Missing: ${locale}/${p}`);
    }
  }

  // 2. Template contamination check
  const templateTerms = ['Alex Dental', 'alex-dental.com', '(845) 555-0180', '85 Crystal Run'];
  const contaminated = [];
  for (const entry of allEntries) {
    const str = JSON.stringify(entry.data);
    for (const term of templateTerms) {
      if (str.includes(term)) {
        contaminated.push(`${entry.locale}/${entry.path} contains "${term}"`);
        break;
      }
    }
  }
  if (contaminated.length > 0) {
    warnings.push(`Template contamination in ${contaminated.length} entries:`);
    contaminated.forEach((c) => warnings.push(`  - ${c}`));
  }

  // 3. Service count
  const svcEntries = allEntries.filter((e) => e.locale === DEFAULT_LOCALE && e.path.startsWith('services/'));
  const expectedCount = intake.services?.enabled?.length || ALL_SERVICE_SLUGS.length;
  if (svcEntries.length !== expectedCount) {
    warnings.push(`Service count: expected ${expectedCount}, got ${svcEntries.length}`);
  }

  // 4. Domain check
  const domains = await fetchRows('site_domains', { site_id: SITE_ID });
  if (domains.length === 0) errors.push('No domain aliases registered');

  // Report
  console.log('  Verification Results:');
  console.log(`  Content entries: ${allEntries.length}`);
  console.log(`  Services: ${svcEntries.length}/${expectedCount}`);
  console.log(`  Domains: ${domains.length}`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n  ✓ All checks passed!');
  } else {
    if (errors.length > 0) {
      console.log(`\n  ERRORS (${errors.length}):`);
      errors.forEach((e) => console.log(`    [ERROR] ${e}`));
    }
    if (warnings.length > 0) {
      console.log(`\n  WARNINGS (${warnings.length}):`);
      warnings.forEach((w) => console.log(`    [WARN] ${w}`));
    }
  }

  return { errors, warnings };
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`${'='.repeat(60)}`);
  console.log(`  Client Onboarding Pipeline`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Client:   ${intake.business.name} (${SITE_ID})`);
  console.log(`  Template: ${TEMPLATE_ID}`);
  console.log(`  Locales:  ${LOCALES.join(', ')}`);
  console.log(`  Services: ${intake.services?.enabled?.length || 'all'}`);
  console.log(`  AI:       ${SKIP_AI ? 'SKIPPED' : 'enabled'}`);
  console.log(`  Dry run:  ${DRY_RUN ? 'YES' : 'no'}`);

  await runStep('O1: CLONE', stepClone);
  await runStep('O2: BRAND', stepBrand);
  await runStep('O3: SERVICE PRUNING', stepPruneServices);
  await runStep('O4: CONTENT REPLACEMENT', stepDeterministicReplace);
  await runStep('O4B+O5: AI CONTENT + SEO', stepAiContent);
  await runStep('O6: CLEANUP', stepCleanup);
  await runStep('O7: VERIFY', stepVerify);

  console.log(`\n${'='.repeat(60)}`);
  console.log('  ONBOARDING COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Site ID:     ${SITE_ID}`);
  console.log(`  Domain:      ${intake.domains?.production || 'not set'}`);
  console.log(`  Services:    ${intake.services?.enabled?.length || 'all'} active`);
  console.log(`  Locales:     ${LOCALES.join(', ')}`);
  console.log(`  Admin:       http://localhost:3004/admin/sites`);
  console.log(`${'='.repeat(60)}`);
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
