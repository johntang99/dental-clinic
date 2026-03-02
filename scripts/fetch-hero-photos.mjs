#!/usr/bin/env node
/**
 * Fetch hero photos from Unsplash for all main pages,
 * upload to Supabase storage, and update page JSON files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'content', 'alex-dental', 'en', 'pages');

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

// Curated Unsplash photos for each page hero — all unique, all landscape-oriented
const PAGE_PHOTOS = {
  'home': {
    url: 'https://plus.unsplash.com/premium_photo-1661306466576-d28b469a8a2a?w=1400&q=80&fit=crop',
    desc: 'Handsome male dentist posing in modern dental clinic',
  },
  'services': {
    url: 'https://plus.unsplash.com/premium_photo-1702598629799-7316a13fa5d5?w=1400&q=80&fit=crop',
    desc: 'Dental team helpers in clinic',
  },
  'about': {
    url: 'https://plus.unsplash.com/premium_photo-1667511013870-b0dff8be22c4?w=1400&q=80&fit=crop',
    desc: 'Female dentist portrait working in dental clinic',
  },
  'technology': {
    url: 'https://images.unsplash.com/photo-1770321119305-f191c09c5801?w=1400&q=80&fit=crop',
    desc: 'Dental equipment with monitor and tools',
  },
  'new-patients': {
    url: 'https://plus.unsplash.com/premium_photo-1661580492041-8a2239a88fef?w=1400&q=80&fit=crop',
    desc: 'Child giving high five to dentist, welcoming atmosphere',
  },
  'case-studies': {
    url: 'https://plus.unsplash.com/premium_photo-1702598533345-57ecc9b1992d?w=1400&q=80&fit=crop',
    desc: 'Veneers and dental implants in clinic closeup',
  },
  'insurance': {
    url: 'https://plus.unsplash.com/premium_photo-1682095297340-3909168db218?w=1400&q=80&fit=crop',
    desc: 'Happy family smiling portrait',
  },
  'gallery': {
    url: 'https://plus.unsplash.com/premium_photo-1675686363422-7d7ab88ee530?w=1400&q=80&fit=crop',
    desc: 'Modern dental office with chair and equipment',
  },
  'blog': {
    url: 'https://plus.unsplash.com/premium_photo-1743025737329-26de62946f33?w=1400&q=80&fit=crop',
    desc: 'Woman with bright smile',
  },
  'contact': {
    url: 'https://plus.unsplash.com/premium_photo-1675686363504-ba2df7786f16?w=1400&q=80&fit=crop',
    desc: 'Modern dental clinic reception area',
  },
};

async function downloadPhoto(photoUrl, pageName) {
  console.log(`  Downloading...`);
  const res = await fetch(photoUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) throw new Error(`File too small (${buffer.length} bytes)`);
  console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

async function uploadToSupabase(buffer, filename) {
  const storagePath = `alex-dental/heroes/${filename}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
  console.log(`  Uploading: ${storagePath}...`);
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

function updatePageJson(pageName, imageUrl) {
  const filePath = path.join(PAGES_DIR, `${pageName}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP: ${pageName}.json not found`);
    return false;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!data.hero) {
    console.log(`  SKIP: no hero section in ${pageName}.json`);
    return false;
  }
  data.hero.backgroundImage = imageUrl;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  Updated: ${pageName}.json`);
  return true;
}

async function main() {
  console.log('Fetching hero photos from Unsplash → Supabase...\n');
  let success = 0, fail = 0;

  for (const [pageName, config] of Object.entries(PAGE_PHOTOS)) {
    console.log(`[${pageName}] ${config.desc}`);
    try {
      const buffer = await downloadPhoto(config.url, pageName);
      const ts = Date.now();
      const filename = `${ts}-hero-${pageName}.jpg`;
      const publicUrl = await uploadToSupabase(buffer, filename);
      console.log(`  ✓ ${publicUrl}`);
      if (updatePageJson(pageName, publicUrl)) success++;
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone! ${success} hero images updated, ${fail} failures.`);
  console.log('Run next: node scripts/sync-content-to-db.mjs');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
