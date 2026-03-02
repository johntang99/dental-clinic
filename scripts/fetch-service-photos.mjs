#!/usr/bin/env node
/**
 * Fetch dental service photos from Unsplash, upload to Supabase storage,
 * and update service JSON files with real Supabase URLs.
 *
 * Usage: node scripts/fetch-service-photos.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVICES_DIR = path.join(ROOT, 'content', 'alex-dental', 'en', 'services');

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

// Verified Unsplash URLs (from napi search results) — each is a real, working URL
const SERVICE_PHOTOS = {
  'bonding': {
    url: 'https://plus.unsplash.com/premium_photo-1702598885865-35fbef538f29?w=1200&q=80&fit=crop',
    desc: 'Dentist treating teeth with curing light',
  },
  'crowns-and-bridges': {
    url: 'https://plus.unsplash.com/premium_photo-1744142824546-d9a83babd9ce?w=1200&q=80&fit=crop',
    desc: 'Dental impression held by gloved hand',
  },
  'dental-implants': {
    url: 'https://plus.unsplash.com/premium_photo-1702598544413-12567f383896?w=1200&q=80&fit=crop',
    desc: 'Doctor examining patient with dental instruments',
  },
  'dentures': {
    url: 'https://plus.unsplash.com/premium_photo-1744142824049-90bdb944aa2e?w=1200&q=80&fit=crop',
    desc: 'Dentures in mirror with toothbrush',
  },
  'extractions': {
    url: 'https://plus.unsplash.com/premium_photo-1673728788984-6d6540186c95?w=1200&q=80&fit=crop',
    desc: 'Dental instruments on tray',
  },
  'full-arch-implants': {
    url: 'https://plus.unsplash.com/premium_photo-1673728802322-294342ae5a07?w=1200&q=80&fit=crop',
    desc: 'Dental model with toothbrush',
  },
  'gum-disease-treatment': {
    url: 'https://plus.unsplash.com/premium_photo-1681966988134-a54a475c2d85?w=1200&q=80&fit=crop',
    desc: 'Woman having dental check-up',
  },
  'invisalign': {
    url: 'https://plus.unsplash.com/premium_photo-1667511022655-00c97e29a32a?w=1200&q=80&fit=crop',
    desc: 'Female dentist showing invisalign to patient',
  },
  'oral-cancer-screening': {
    url: 'https://plus.unsplash.com/premium_photo-1681997077513-13ee0f3878f8?w=1200&q=80&fit=crop',
    desc: 'Patient having dental treatment',
  },
  'pediatric-dentistry': {
    url: 'https://plus.unsplash.com/premium_photo-1667511043907-ecc7f378e629?w=1200&q=80&fit=crop',
    desc: 'Little girl having teeth examined by dentist',
  },
  'root-canal': {
    url: 'https://plus.unsplash.com/premium_photo-1744142824792-ea371bd1783d?w=1200&q=80&fit=crop',
    desc: 'Dentist examines a tooth model',
  },
  'sedation-dentistry': {
    url: 'https://plus.unsplash.com/premium_photo-1661438133415-ca0ec60b8f3d?w=1200&q=80&fit=crop',
    desc: 'Dental specialist helping comfortable patient',
  },
  'smile-makeover': {
    url: 'https://plus.unsplash.com/premium_photo-1723921250086-16ceaf41ccf6?w=1200&q=80&fit=crop',
    desc: 'Closeup of smiling woman',
  },
  'teeth-whitening': {
    url: 'https://plus.unsplash.com/premium_photo-1674575272669-c476afd261b4?w=1200&q=80&fit=crop',
    desc: 'Man getting teeth checked by dentist',
  },
  'veneers': {
    url: 'https://plus.unsplash.com/premium_photo-1702598878240-eab765fcc6d3?w=1200&q=80&fit=crop',
    desc: 'Dentist holds veneers on plaster model',
  },
};

async function downloadPhoto(photoUrl, serviceName) {
  console.log(`  Downloading: ${serviceName}...`);
  const res = await fetch(photoUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) {
    throw new Error(`File too small (${buffer.length} bytes)`);
  }

  console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

async function uploadToSupabase(buffer, filename) {
  const storagePath = `alex-dental/services/${filename}`;
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

function updateServiceJson(serviceName, imageUrl) {
  const filePath = path.join(SERVICES_DIR, `${serviceName}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  data.image = imageUrl;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  Updated JSON: ${serviceName}.json`);
}

async function main() {
  console.log('Fetching dental service photos from Unsplash → Supabase...');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Bucket: ${BUCKET}`);
  console.log('');

  const services = Object.entries(SERVICE_PHOTOS);
  let successCount = 0;
  let failCount = 0;

  for (const [serviceName, config] of services) {
    console.log(`\n[${serviceName}] ${config.desc}`);
    try {
      const buffer = await downloadPhoto(config.url, serviceName);
      const timestamp = Date.now();
      const filename = `${timestamp}-${serviceName}.jpg`;
      const publicUrl = await uploadToSupabase(buffer, filename);
      console.log(`  ✓ ${publicUrl}`);
      updateServiceJson(serviceName, publicUrl);
      successCount++;
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n\nDone! ${successCount} photos uploaded to Supabase, ${failCount} failures.`);
  if (successCount > 0) {
    console.log('Run next: node scripts/sync-content-to-db.mjs');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
