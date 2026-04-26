#!/usr/bin/env node
/**
 * Fetch blog post photos from Unsplash, upload to Supabase storage,
 * and update blog JSON files for hu-orthodontics (ZH locale).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ZH_BLOG_DIR = path.join(ROOT, 'content', 'hu-orthodontics', 'zh', 'blog');

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

// Curated Unsplash photos for hu-orthodontics blog posts
const BLOG_PHOTOS = {
  'adult-orthodontics-guide': {
    url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1000&q=80&fit=crop',
    desc: 'Adult woman smiling confidently',
  },
  'invisalign-complete-guide': {
    url: 'https://plus.unsplash.com/premium_photo-1667511022655-00c97e29a32a?w=1000&q=80&fit=crop',
    desc: 'Clear aligner / Invisalign tray',
  },
  'orthodontic-retainers-guide': {
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1000&q=80&fit=crop',
    desc: 'Dental retainer closeup',
  },
  'what-is-abo-certification': {
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1000&q=80&fit=crop',
    desc: 'Professional dentist in clinic',
  },
  'orthodontic-emergency-guide': {
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1000&q=80&fit=crop',
    desc: 'Dental examination closeup',
  },
  'teen-orthodontics-parents-guide': {
    url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=1000&q=80&fit=crop',
    desc: 'Happy teenager smiling with braces',
  },
  'cost-of-orthodontics': {
    url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000&q=80&fit=crop',
    desc: 'Financial planning documents',
  },
  // Also update existing posts that have no images
  'braces-vs-invisalign': {
    url: 'https://images.unsplash.com/photo-1633951450008-8ad6dd373874?w=1000&q=80&fit=crop',
    desc: 'Orthodontic braces closeup',
  },
  'when-to-start-orthodontics': {
    url: 'https://images.unsplash.com/photo-1600170311833-c2cf5280ce49?w=1000&q=80&fit=crop',
    desc: 'Child at dental visit',
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
  const storagePath = `hu-orthodontics/blog/${filename}`;
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
  console.log('Fetching hu-orthodontics blog photos from Unsplash → Supabase...\n');
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

  // Update blog JSON files
  console.log('\nUpdating ZH blog files...');
  for (const [slug, publicUrl] of Object.entries(urlMap)) {
    const filePath = path.join(ZH_BLOG_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${slug}.json not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.image = publicUrl;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✓ ${slug}.json updated`);
  }

  console.log(`\nDone! ${success} blog photos uploaded, ${fail} failures.`);
  console.log('Run next: node scripts/sync-content-to-db.mjs');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
