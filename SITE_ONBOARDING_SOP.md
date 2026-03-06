# Site Onboarding SOP

**System:** BAAM Dental
**Access Required:** super_admin
**Estimated Time:** ~30–50 seconds (with AI), ~15 seconds (skip AI)

> **Pipeline B** clones a master template site and customizes it for a new dental client in 7 automated steps (O1–O7). The result is a fully functional client site with unique content, branding, and SEO.

---

## Prerequisites

Before onboarding a new client, confirm ALL of the following:

- [ ] Master template site (`alex-dental`) is fully synced to Supabase (content, media, storage)
- [ ] You have the client's business information ready (name, address, phone, services, etc.)
- [ ] The dev server is running (`npm run dev`)
- [ ] You have super_admin access to the Admin dashboard

### Required Environment Variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` | Supabase REST API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for DB + Storage operations |
| `SUPABASE_STORAGE_BUCKET` or `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Storage bucket name for media files |
| `ANTHROPIC_API_KEY` | Claude API key (required for AI content; skippable) |

### Required Supabase Tables

| Table | Purpose |
|-------|---------|
| `sites` | Site registry (id, name, domain, enabled, locales) |
| `content_entries` | All CMS content (site_id, locale, path, data) |
| `media_assets` | Media file records (site_id, path, url) |
| `site_domains` | Domain-to-site mapping (site_id, domain, environment) |

---

## Method A: Admin Onboarding UI (Recommended)

### Step 1 — Open Onboarding Wizard

1. Navigate to `/admin/onboarding` in the browser
2. You must be logged in as a **super_admin** — regular admins will see an access denied message

### Step 2 — Fill in the Intake Form

The form has 11 sections. **Sections 1–7 are required** (expanded by default). **Sections 8–11 are optional** (collapsed by default).

#### Section 1: Identity & Template
| Field | Notes |
|-------|-------|
| **Business Name** | Required. Auto-generates Site ID, domain, and email fields |
| **Site ID** | Auto-derived slug (e.g., "Bright Smile Dental" → `bright-smile-dental`). Editable. |
| **Clone From** | Template to clone from. Default: `alex-dental` |

**Confirm:** "Is the Site ID correct? It becomes the permanent identifier for this client across DB, storage, and filesystem."

#### Section 2: Business Info
| Field | Notes |
|-------|-------|
| Owner Name | e.g., "Dr. James Park" |
| Owner Title | e.g., "DDS, FAGD" |
| Owner Languages | Checkboxes: English, Chinese, Spanish, Korean |
| Founded Year | Numeric |
| Years Experience | e.g., "15+" |
| Owner Certifications | Comma-separated (e.g., "ADA, FAGD") |
| Owner Specializations | Comma-separated (e.g., "Cosmetic Dentistry, Implants") |
| Owner Credentials | Repeatable list: Credential, Institution, Year, Location |
| Team Members | Repeatable list: Name, Title, Role, Languages, Specializations |

#### Section 3: Location & Contact
| Field | Notes |
|-------|-------|
| Address | Street address |
| City / State / Zip | State is 2-char (e.g., "NY") |
| Phone | Also populates Emergency Phone |
| Email | Auto-generated as `info@{slug}.com` |
| Emergency Phone | Defaults to Phone if left blank |
| Appointments Email | Auto-generated as `appointments@{slug}.com` |

#### Section 4: Hours
One text field per day (Mon–Sun). Defaults pre-filled:
- Mon–Fri: `9:00 AM - 5:00 PM`
- Saturday: `9:00 AM - 1:00 PM`
- Sunday: `Closed`

#### Section 5: Services
Checkbox grid with Select All / Deselect All per category. All 16 services selected by default:

| Category | Services |
|----------|----------|
| General | Cleanings & Exams, Fillings, Root Canal, Extractions, Gum Disease Treatment, Oral Cancer Screening |
| Cosmetic | Teeth Whitening, Veneers, Bonding, Smile Makeover |
| Restorative | Dental Implants, Crowns & Bridges, Dentures, Full Arch Implants |
| Orthodontics | Invisalign |
| Pediatric | Pediatric Dentistry |
| Comfort | Sedation Dentistry |

**Confirm:** "Are the correct services selected? Unchecked services will be removed from all pages."

#### Section 6: Brand
5 preset variants with color swatches:

| Variant | Primary | Secondary | Display Font |
|---------|---------|-----------|-------------|
| Teal & Gold | `#0D6E6E` | `#C9A84C` | Playfair Display |
| Blue & Silver | `#2563EB` | `#94A3B8` | Montserrat |
| Green & Cream | `#2D6A4F` | `#DDA15E` | Lora |
| Purple & Rose | `#6D28D9` | `#EC4899` | Cormorant Garamond |
| Navy & Copper | `#1E3A5F` | `#B87333` | DM Serif Display |

Optional: Primary color hex override (auto-generates dark/light/50/100 shades).

#### Section 7: Locales & Domain
| Field | Notes |
|-------|-------|
| Supported Locales | English (always enabled), Chinese (zh), Spanish (es), Korean (ko) |
| Default Locale | Dropdown of selected locales |
| Production Domain | e.g., `bright-smile-dental.com` (auto-derived) |
| Dev Domain | e.g., `bright-smile.local` (auto-derived) |

#### Sections 8–11 (Optional)

| Section | Key Fields |
|---------|-----------|
| **Content Tone** | Voice (Warm/Clinical/Casual), target demographic, USPs |
| **Social Media** | Facebook, Instagram, Google, Yelp, YouTube |
| **Insurance & Booking** | Accepts insurance, in-network note, financing, membership plan, booking URL |
| **Stats** | Repeatable: icon, number, label (4 defaults pre-filled) |

### Step 3 — Review & Generate

1. Review all filled fields
2. **Optional:** Check "Skip AI content generation" for faster processing (uses template copy as-is)
3. Click **"Generate Site"**

**Confirm:** "Is all information correct? The pipeline will start immediately."

### Step 4 — Monitor Pipeline Progress

The UI displays a live progress tracker via Server-Sent Events (SSE):

| Step | Name | What Happens | Duration |
|------|------|-------------|----------|
| O1 | Clone | Creates site record, clones content + media + storage + local files | ~15s |
| O2 | Brand | Applies color palette + font pairing from selected variant | <1s |
| O3 | Prune | Removes disabled services from all pages (up to 5 content files) | ~3s |
| O4 | Replace | Deep string replacement (NAP) + structural file updates | ~5s |
| O5 | AI Content | Claude generates unique copy + SEO (skipped if checkbox checked) | ~15–25s |
| O6 | Cleanup | Deletes entries for unsupported locales | <1s |
| O7 | Verify | Checks required paths, contamination, service count, domains | <1s |

Each step shows: running → done (with duration) or error (pipeline aborts).

### Step 5 — Review Results

On success, the Done panel displays:
- Green success banner with business name
- Stats grid: **Entries**, **Services**, **Locales**, **Domains**
- **Errors** (red) — must be fixed before site is usable
- **Warnings** (amber) — informational, site is still functional

Action buttons:
- **View in Content Editor** → `/admin/content?siteId={id}&locale=en`
- **Preview Site** → `http://{devDomain}:{port}/en` (new tab)
- **Onboard Another Client** → resets the form

---

## Method B: CLI Script

For development/testing, use the CLI script instead of the Admin UI:

```bash
# Create an intake JSON file
cp scripts/intake/example-dental.json scripts/intake/{client-id}.json
# Edit the intake file with client details

# Run the pipeline
node scripts/onboard-client.mjs {client-id}

# Dry run (logs actions, changes nothing)
node scripts/onboard-client.mjs {client-id} --dry-run

# Skip AI content generation
node scripts/onboard-client.mjs {client-id} --skip-ai
```

The CLI executes the same 7-step pipeline as the Admin UI but logs to the terminal instead of SSE.

---

## Post-Onboarding Steps

### Step 6 — Set Up Local Dev Domain

Add the `.local` domain to `/etc/hosts` so you can preview the site locally:

```bash
# Add hosts entry
sudo sh -c 'echo "127.0.0.1 {alias}.local" >> /etc/hosts'

# Flush DNS cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Test — should load the new client's site
open http://{alias}.local:{port}/en
```

### Step 7 — Run Verification Script

```bash
node scripts/verify-site.mjs {site-id}
```

This checks all layers against the template:

| Layer | Check | Expected |
|-------|-------|----------|
| DB | `sites` row exists | ✓ |
| DB | `content_entries` count matches template | ✓ (may differ after O2–O7) |
| DB | `media_assets` count matches template | ✓ |
| DB | `site_domains` ≥ 2 rows | ✓ |
| DB | No URL contamination in media | ✓ |
| Storage | Files in `{bucket}/{site-id}/` | ✓ (count matches template) |
| Local | `public/uploads/{site-id}/` exists | ✓ |
| Local | `content/{site-id}/` exists | ✓ |
| JSON | Entry in `_sites.json` | ✓ |
| JSON | Entry in `_site-domains.json` | ✓ |

### Step 8 — Visual Spot-Check

Open the site in a browser and verify:

- [ ] Homepage loads with correct business name and tagline
- [ ] Hero section shows correct branding (colors, fonts)
- [ ] About page shows correct owner bio, credentials
- [ ] Contact page shows correct phone, address, hours
- [ ] Footer shows correct hours, social links, copyright year
- [ ] Services page only shows enabled services (out of 16)
- [ ] Individual service pages exist for each enabled service
- [ ] SEO titles are client-specific (view page source)
- [ ] Language switcher works for all enabled locales
- [ ] No template business name ("Alex Dental") visible anywhere
- [ ] Doctor profiles show the new owner and team (not template doctors)

---

## Pipeline Details: What O1 Clone Creates

O1 is the most critical step — it creates the full data foundation across 4 layers:

```
┌─────────────────────────────────────────────────────┐
│                    O1: CLONE                        │
│                                                     │
│  DB Layer                                           │
│  ├── sites          → 1 new row                     │
│  ├── content_entries → cloned from alex-dental      │
│  ├── media_assets   → cloned (URLs remapped)        │
│  └── site_domains   → 2 rows (prod + dev)           │
│                                                     │
│  Storage Layer                                      │
│  └── {bucket}/{site-id}/ → files copied from tpl    │
│                                                     │
│  Local Filesystem                                   │
│  ├── public/uploads/{site-id}/ → images copied      │
│  └── content/{site-id}/        → fallback files     │
│                                                     │
│  JSON Registry                                      │
│  ├── content/_sites.json       → entry appended     │
│  └── content/_site-domains.json → entries appended  │
└─────────────────────────────────────────────────────┘
```

### O3 Service Pruning — 5 Files Updated

When services are disabled, they are removed from:

| File | What's Removed |
|------|---------------|
| `services/{slug}.json` | Entire service entry deleted |
| `navigation.json` | Service link removed from mega-menu; empty category headers removed |
| `pages/services.json` | Service removed from `servicesList.items`; empty categories removed |
| `pages/home.json` | Service removed from homepage services section |
| `footer.json` | Service link removed from footer service list |

### O4 Template Replacement Pairs

These template-specific strings are replaced with client values:

| Template String | Replaced With |
|----------------|--------------|
| `Alex Dental Clinic` | Business name |
| `Alex Dental` | Short business name |
| `alex-dental.com` | Production domain |
| `(845) 555-0180` | Client phone |
| `+18455550180` | Phone digits |
| `tel:+18455550180` | Tel link |
| `info@alex-dental.com` | Client email |
| `appointments@alex-dental.com` | Appointments email |
| `85 Crystal Run Road, Middletown, NY 10940` | Full address |
| `85 Crystal Run Road` | Street address |
| `Middletown, NY 10940` | City, State Zip |
| `Middletown, NY` | City, State |
| `Middletown` | City |
| `NY 10940` | State Zip |
| `10940` | Zip |

Replacement order: longest strings first to prevent partial matches.

### O4 Structural File Rebuilds

Beyond string replacement, these files get structural updates:

| File | Key Changes |
|------|-------------|
| `site.json` | Full rebuild: all NAP fields, hours, social, booking, insurance, credentials, languages |
| `header.json` | logoText, CTA phone link, announcement bar |
| `footer.json` | Brand section, contact section, hours array, copyright |
| `doctors/*.json` | Delete template profiles (`dr-alex-chen`, `dr-sarah-kim`), create new from intake |

### O7 Template Contamination Checks

These 4 strings are scanned across all content:

| String | Source |
|--------|--------|
| `Alex Dental` | Template business name |
| `alex-dental.com` | Template domain |
| `(845) 555-0180` | Template phone |
| `85 Crystal Run` | Template address |

Any matches are reported as warnings (site is still usable but should be reviewed).

### Idempotency

All O1 operations are idempotent — safe to re-run:
- DB upserts use `ON CONFLICT` merge-duplicates
- Storage copy ignores "already exists" errors
- File copy uses `errorOnExist: false`
- JSON registry checks for existing entries before appending

---

## Troubleshooting

### Pipeline fails at O1 with Supabase error
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that the template site (`alex-dental`) exists in the `sites` table
- Verify Supabase project is accessible

### No images on the new site
- Run `node scripts/verify-site.mjs {site-id}` — check Storage and uploads
- Verify `SUPABASE_STORAGE_BUCKET` is set in `.env.local`
- Check Supabase Storage dashboard for `{site-id}/` folder

### Template business name ("Alex Dental") still visible
- O7 verification reports contamination as warnings
- Re-run the pipeline or manually fix in Content Editor
- Check the replacement pairs in the API route

### Dev domain doesn't resolve
- Check `/etc/hosts` has the `127.0.0.1 {alias}.local` entry
- Flush DNS: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
- Verify `site_domains` table has the dev domain row

### "Cannot find module" error after onboarding
- Delete `.next` cache: `rm -rf .next`
- Restart the dev server

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md) | How to delete a client site (reverse of this process) |
| `scripts/verify-site.mjs` | Automated post-onboarding verification |
| `scripts/delete-site.mjs` | Interactive site deletion with confirmations |
| `scripts/onboard-client.mjs` | CLI-based onboarding (alternative to Admin UI) |

---

## Notes

- **Template sites** (e.g., `alex-dental`) must NEVER be modified by the onboarding pipeline. Always clone FROM them, never INTO them.
- The Admin UI (`/admin/sites`) supports editing and disabling sites but does NOT have a delete button. See [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md) for deletion.
- If you only want to temporarily disable a site, set `enabled: false` in the `sites` table instead of deleting.
- The "Skip AI" option is useful for test onboarding — it runs in ~15 seconds instead of ~50 seconds.
- Each onboarding costs approximately **$0.13** in Claude API usage (when AI is enabled).
- Dental supports **4 locales** (en, zh, es, ko) vs Chinese Medicine's 2 (en, zh).
- Dental has **16 services** in 6 categories vs Chinese Medicine's 8 in 3 categories.
