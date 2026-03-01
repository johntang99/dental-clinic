#!/usr/bin/env node
/**
 * Sync all local JSON content files into Supabase content_entries table.
 * Also seeds the sites and site_domains tables.
 *
 * Usage:  node scripts/sync-content-to-db.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── Config ───────────────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://mmcmvmwcktqdeflcwfks.supabase.co';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  // Try reading from .env.local
  try {
    const envPath = path.join(ROOT, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n]+)"?/);
    if (match) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = match[1];
    }
  } catch {}
}

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

// ── Helpers ──────────────────────────────────────────────────────────
async function upsert(table, rows, onConflict) {
  const h = { ...headers };
  if (onConflict) {
    h.Prefer = `resolution=merge-duplicates,return=representation`;
  }
  const url = onConflict
    ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upsert ${table} failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ── 1. Seed sites table ──────────────────────────────────────────────
async function seedSites() {
  const sitesFile = path.join(CONTENT_DIR, '_sites.json');
  const raw = JSON.parse(fs.readFileSync(sitesFile, 'utf-8'));
  const rows = raw.sites.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    enabled: s.enabled ?? true,
    default_locale: s.defaultLocale || 'en',
    supported_locales: s.supportedLocales || ['en'],
  }));
  const result = await upsert('sites', rows, 'id');
  console.log(`✓ sites: ${result.length} row(s)`);
}

// ── 2. Seed site_domains table ───────────────────────────────────────
async function seedSiteDomains() {
  const domainsFile = path.join(CONTENT_DIR, '_site-domains.json');
  const raw = JSON.parse(fs.readFileSync(domainsFile, 'utf-8'));
  const rows = raw.domains.map((d) => ({
    site_id: d.siteId,
    domain: d.domain,
    environment: d.environment || 'prod',
    enabled: d.enabled ?? true,
  }));
  const result = await upsert('site_domains', rows, 'site_id,domain,environment');
  console.log(`✓ site_domains: ${result.length} row(s)`);
}

// ── 3. Sync content JSON files ───────────────────────────────────────
function collectContentFiles(siteId) {
  const entries = [];
  const siteDir = path.join(CONTENT_DIR, siteId);
  if (!fs.existsSync(siteDir)) return entries;

  const locales = fs.readdirSync(siteDir).filter((d) => {
    return fs.statSync(path.join(siteDir, d)).isDirectory();
  });

  for (const locale of locales) {
    const localeDir = path.join(siteDir, locale);
    walkDir(localeDir, '', siteId, locale, entries);
  }

  return entries;
}

function walkDir(dir, prefix, siteId, locale, entries) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const relativePath = prefix ? `${prefix}/${item}` : item;

    if (stat.isDirectory()) {
      walkDir(fullPath, relativePath, siteId, locale, entries);
    } else if (item.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        entries.push({
          site_id: siteId,
          locale,
          path: relativePath,
          data,
          updated_by: 'sync-script',
        });
      } catch (err) {
        console.warn(`  ⚠ Skipping ${relativePath}: ${err.message}`);
      }
    }
  }
}

async function syncContent() {
  // Discover site IDs (directories in content/ that don't start with _)
  const siteDirs = fs.readdirSync(CONTENT_DIR).filter((d) => {
    return !d.startsWith('_') && fs.statSync(path.join(CONTENT_DIR, d)).isDirectory();
  });

  let totalCount = 0;

  for (const siteId of siteDirs) {
    const entries = collectContentFiles(siteId);
    if (entries.length === 0) {
      console.log(`  → ${siteId}: no content files found`);
      continue;
    }

    // Upsert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      const result = await upsert('content_entries', batch, 'site_id,locale,path');
      totalCount += result.length;
    }

    console.log(`✓ content_entries [${siteId}]: ${entries.length} file(s) synced`);
  }

  return totalCount;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('Syncing content to Supabase…');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log('');

  await seedSites();
  await seedSiteDomains();
  const total = await syncContent();

  console.log('');
  console.log(`Done! ${total} content entries synced to database.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
