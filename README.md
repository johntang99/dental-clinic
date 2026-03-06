# BAAM Dental Template

Premium dental clinic website template built on Next.js 14 + Supabase.

## Quick Start

```bash
npm install
npm run dev
```

Dev server runs on http://localhost:3004



lsof -ti:3004 | xargs kill -9
rm -rf .next
npm run dev

npm install
npm run build

git add .
git commit -m "Update: describe your changes"
git push


curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_kOcAmT83xpIx4DuthlKTrivPeTc9/VaJ46kNc3S




## Build & Deploy

```bash
npm run build
npm start
```

## Project Structure

- `app/` — Next.js app router pages
- `components/` — React components (sections, UI, admin, layout)
- `content/alex-dental/` — Site content JSON files (en/zh/es/ko)
- `lib/` — Utilities (content loading, i18n, auth, Supabase)
- `styles/` — Global CSS + design tokens
- `public/` — Static assets

## Key Features

- Multi-site architecture
- 4-language support (EN/ZH/ES/KO)
- Admin CMS dashboard
- Supabase backend (auth, content, media, bookings)
- Dental-specific design tokens (Deep Teal + Warm Gold)
