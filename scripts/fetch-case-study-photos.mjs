#!/usr/bin/env node
/**
 * Fetch case study photos from Unsplash for before/after dental cases,
 * upload to Supabase storage, and update JSON files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CASES_PAGE = path.join(ROOT, 'content', 'alex-dental', 'en', 'pages', 'case-studies.json');
const CASES_DIR = path.join(ROOT, 'content', 'alex-dental', 'en', 'cases');

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

// Curated Unsplash photos for case study before/after pairs
// Using dental-relevant images that suggest treatment scenarios
const CASE_PHOTOS = {
  'implant-transformation-john': {
    before: {
      url: 'https://plus.unsplash.com/premium_photo-1674735943926-036eb23cec17?w=800&q=80&fit=crop',
      desc: 'Dental X-ray showing missing teeth',
    },
    after: {
      url: 'https://plus.unsplash.com/premium_photo-1702598533345-57ecc9b1992d?w=800&q=80&fit=crop',
      desc: 'Dental implant result closeup',
    },
    main: {
      url: 'https://plus.unsplash.com/premium_photo-1702598544413-12567f383896?w=800&q=80&fit=crop',
      desc: 'Doctor examining patient with instruments',
    },
  },
  'smile-makeover-lisa': {
    before: {
      url: 'https://plus.unsplash.com/premium_photo-1681966988134-a54a475c2d85?w=800&q=80&fit=crop',
      desc: 'Woman having dental check-up',
    },
    after: {
      url: 'https://plus.unsplash.com/premium_photo-1723921250086-16ceaf41ccf6?w=800&q=80&fit=crop',
      desc: 'Closeup of beautiful smile',
    },
    main: {
      url: 'https://plus.unsplash.com/premium_photo-1702598878240-eab765fcc6d3?w=800&q=80&fit=crop',
      desc: 'Dentist holds veneers on plaster model',
    },
  },
  'invisalign-journey-maria': {
    before: {
      url: 'https://plus.unsplash.com/premium_photo-1667511022655-00c97e29a32a?w=800&q=80&fit=crop',
      desc: 'Female dentist showing invisalign to patient',
    },
    after: {
      url: 'https://plus.unsplash.com/premium_photo-1743025737329-26de62946f33?w=800&q=80&fit=crop',
      desc: 'Woman with bright smile',
    },
    main: {
      url: 'https://plus.unsplash.com/premium_photo-1667511043907-ecc7f378e629?w=800&q=80&fit=crop',
      desc: 'Orthodontic treatment in progress',
    },
  },
  'emergency-cracked-tooth-david': {
    before: {
      url: 'https://plus.unsplash.com/premium_photo-1673728788984-6d6540186c95?w=800&q=80&fit=crop',
      desc: 'Dental instruments on tray',
    },
    after: {
      url: 'https://plus.unsplash.com/premium_photo-1744142824546-d9a83babd9ce?w=800&q=80&fit=crop',
      desc: 'Restored tooth impression',
    },
    main: {
      url: 'https://plus.unsplash.com/premium_photo-1702598885865-35fbef538f29?w=800&q=80&fit=crop',
      desc: 'Dentist treating with curing light',
    },
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
  const storagePath = `alex-dental/cases/${filename}`;
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
  console.log('Fetching case study photos from Unsplash → Supabase...\n');
  const ts = Date.now();
  const results = {};
  let success = 0;
  let fail = 0;

  for (const [caseId, photos] of Object.entries(CASE_PHOTOS)) {
    console.log(`\n[${caseId}]`);
    results[caseId] = {};

    for (const [type, config] of Object.entries(photos)) {
      const label = `  ${type}: ${config.desc}`;
      console.log(label);
      try {
        const buffer = await downloadPhoto(config.url);
        console.log(`    Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);
        const filename = `${ts}-${caseId}-${type}.jpg`;
        const publicUrl = await uploadToSupabase(buffer, filename);
        console.log(`    ✓ ${publicUrl}`);
        results[caseId][type] = publicUrl;
        success++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`    ✗ ERROR: ${err.message}`);
        fail++;
      }
    }
  }

  // Update case-studies.json (page-level)
  console.log('\n\nUpdating case-studies.json...');
  const pageData = JSON.parse(fs.readFileSync(CASES_PAGE, 'utf-8'));
  for (const study of pageData.caseStudies) {
    const urls = results[study.id];
    if (!urls) continue;
    if (urls.main) study.image = urls.main;
    if (urls.before) study.beforeImage = urls.before;
    if (urls.after) study.afterImage = urls.after;
  }
  fs.writeFileSync(CASES_PAGE, JSON.stringify(pageData, null, 2) + '\n');
  console.log('  ✓ case-studies.json updated');

  // Update individual case files
  console.log('Updating individual case files...');
  for (const [caseId, urls] of Object.entries(results)) {
    const filePath = path.join(CASES_DIR, `${caseId}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${caseId}.json not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (urls.main) data.image = urls.main;
    if (urls.before) data.beforeImage = urls.before;
    if (urls.after) data.afterImage = urls.after;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✓ ${caseId}.json updated`);
  }

  console.log(`\nDone! ${success} photos uploaded, ${fail} failures.`);
  console.log('Run next: node scripts/sync-content-to-db.mjs');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
