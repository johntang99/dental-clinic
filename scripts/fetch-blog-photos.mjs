#!/usr/bin/env node
/**
 * Fetch blog post photos from Unsplash, upload to Supabase storage,
 * and update blog JSON files in both EN and ZH locales.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN_BLOG_DIR = path.join(ROOT, 'content', 'alex-dental', 'en', 'blog');
const ZH_BLOG_DIR = path.join(ROOT, 'content', 'alex-dental', 'zh', 'blog');

// Load env
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*"?([^"\\n]+)"?`));
  return match ? match[1] : process.env[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const BUCKET = getEnv('SUPABASE_STORAGE_BUCKET') || 'dental-media';

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

// Curated Unsplash photos for each blog post
const BLOG_PHOTOS = {
  'what-to-expect-first-dental-visit': {
    url: 'https://plus.unsplash.com/premium_photo-1661580492041-8a2239a88fef?w=1000&q=80&fit=crop',
    desc: 'Friendly dental visit - child high-fiving dentist',
  },
  'how-to-overcome-dental-anxiety': {
    url: 'https://plus.unsplash.com/premium_photo-1661766569022-1b7f918ac3f3?w=1000&q=80&fit=crop',
    desc: 'Calm patient in dental chair',
  },
  'dental-implants-vs-bridges': {
    url: 'https://plus.unsplash.com/premium_photo-1702598533345-57ecc9b1992d?w=1000&q=80&fit=crop',
    desc: 'Dental implant model closeup',
  },
  'invisalign-vs-braces': {
    url: 'https://plus.unsplash.com/premium_photo-1667511022655-00c97e29a32a?w=1000&q=80&fit=crop',
    desc: 'Dentist showing clear aligners to patient',
  },
  'foods-that-damage-teeth': {
    url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1000&q=80&fit=crop',
    desc: 'Assorted foods on a table',
  },
  'childrens-dental-health-guide': {
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1000&q=80&fit=crop',
    desc: 'Child at dentist smiling',
  },
};

async function downloadPhoto(photoUrl) {
  const res = await fetch(photoUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) throw new Error(`File too small (${buffer.length} bytes)`);
  return buffer;
}

async function uploadToSupabase(buffer, filename) {
  const storagePath = `alex-dental/blog/${filename}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
      'Cache-Control': 'public, max-age=31536000',
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function main() {
  console.log('Fetching blog photos from Unsplash → Supabase...\n');
  const ts = Date.now();
  const urlMap = {};
  let success = 0;
  let fail = 0;

  for (const [slug, config] of Object.entries(BLOG_PHOTOS)) {
    console.log(`[${slug}] ${config.desc}`);
    try {
      const buffer = await downloadPhoto(config.url);
      console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);
      const filename = `${ts}-${slug}.jpg`;
      const publicUrl = await uploadToSupabase(buffer, filename);
      console.log(`  ✓ ${publicUrl}`);
      urlMap[slug] = publicUrl;
      success++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      fail++;
    }
  }

  // Update blog JSON files in both locales
  for (const [label, dir] of [['EN', EN_BLOG_DIR], ['ZH', ZH_BLOG_DIR]]) {
    console.log(`\nUpdating ${label} blog files...`);
    for (const [slug, publicUrl] of Object.entries(urlMap)) {
      const filePath = path.join(dir, `${slug}.json`);
      if (!fs.existsSync(filePath)) {
        console.log(`  SKIP: ${label}/${slug}.json not found`);
        continue;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      data.image = publicUrl;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  ✓ ${label}/${slug}.json updated`);
    }
  }

  console.log(`\nDone! ${success} blog photos uploaded, ${fail} failures.`);
  console.log('Run next: node scripts/sync-content-to-db.mjs');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
