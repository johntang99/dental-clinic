#!/usr/bin/env node
/**
 * Fetch gallery photos from Unsplash, upload to Supabase storage,
 * and update gallery.json with real URLs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GALLERY_FILE = path.join(ROOT, 'content', 'alex-dental', 'en', 'pages', 'gallery.json');

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

// Curated Unsplash photos for each gallery image — all unique
const GALLERY_PHOTOS = {
  // Office (4)
  'office-1': {
    url: 'https://plus.unsplash.com/premium_photo-1675686363504-ba2df7786f16?w=1000&q=80&fit=crop',
    desc: 'Modern dental clinic reception area',
  },
  'office-2': {
    url: 'https://plus.unsplash.com/premium_photo-1675686363422-7d7ab88ee530?w=1000&q=80&fit=crop',
    desc: 'Dental office with chair and equipment',
  },
  'office-3': {
    url: 'https://images.unsplash.com/photo-1770321119305-f191c09c5801?w=1000&q=80&fit=crop',
    desc: 'Dental equipment with monitor and tools',
  },
  'office-4': {
    url: 'https://plus.unsplash.com/premium_photo-1682095297340-3909168db218?w=1000&q=80&fit=crop',
    desc: 'Clean clinical environment',
  },
  // Team (3)
  'team-1': {
    url: 'https://plus.unsplash.com/premium_photo-1661306466576-d28b469a8a2a?w=1000&q=80&fit=crop',
    desc: 'Male dentist in modern clinic',
  },
  'team-2': {
    url: 'https://plus.unsplash.com/premium_photo-1667511013870-b0dff8be22c4?w=1000&q=80&fit=crop',
    desc: 'Female dentist portrait',
  },
  'team-3': {
    url: 'https://plus.unsplash.com/premium_photo-1661580492041-8a2239a88fef?w=1000&q=80&fit=crop',
    desc: 'Child high-fiving dental team',
  },
  // Technology (3)
  'tech-1': {
    url: 'https://plus.unsplash.com/premium_photo-1744142824792-ea371bd1783d?w=1000&q=80&fit=crop',
    desc: 'Dental tooth model examination',
  },
  'tech-2': {
    url: 'https://plus.unsplash.com/premium_photo-1744142824546-d9a83babd9ce?w=1000&q=80&fit=crop',
    desc: 'Dental impression closeup',
  },
  'tech-3': {
    url: 'https://plus.unsplash.com/premium_photo-1674575272669-c476afd261b4?w=1000&q=80&fit=crop',
    desc: 'Man getting teeth checked',
  },
  // Patient Results (3)
  'results-1': {
    url: 'https://plus.unsplash.com/premium_photo-1702598878240-eab765fcc6d3?w=1000&q=80&fit=crop',
    desc: 'Veneers on plaster model',
  },
  'results-2': {
    url: 'https://plus.unsplash.com/premium_photo-1702598533345-57ecc9b1992d?w=1000&q=80&fit=crop',
    desc: 'Dental implant closeup',
  },
  'results-3': {
    url: 'https://plus.unsplash.com/premium_photo-1723921250086-16ceaf41ccf6?w=1000&q=80&fit=crop',
    desc: 'Bright white smile closeup',
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
  const storagePath = `alex-dental/gallery/${filename}`;
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
  console.log('Fetching gallery photos from Unsplash → Supabase...\n');
  const ts = Date.now();
  const urlMap = {};
  let success = 0;
  let fail = 0;

  for (const [imageId, config] of Object.entries(GALLERY_PHOTOS)) {
    console.log(`[${imageId}] ${config.desc}`);
    try {
      const buffer = await downloadPhoto(config.url);
      console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);
      const filename = `${ts}-${imageId}.jpg`;
      const publicUrl = await uploadToSupabase(buffer, filename);
      console.log(`  ✓ ${publicUrl}`);
      urlMap[imageId] = publicUrl;
      success++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      fail++;
    }
  }

  // Update gallery.json
  console.log('\nUpdating gallery.json...');
  const data = JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
  for (const image of data.images) {
    if (urlMap[image.id]) {
      image.src = urlMap[image.id];
    }
  }
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ gallery.json updated`);

  console.log(`\nDone! ${success} gallery photos uploaded, ${fail} failures.`);
  console.log('Run next: node scripts/sync-content-to-db.mjs');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
