# DrHUortho — SEO Implementation Plan (Chinese-First)
## Site: drhuortho.com (site_id: hu-orthodontics)

| | |
|---|---|
| **Date** | May 8, 2026 |
| **Business** | 胡林正畸中心 Hu Lin Orthodontics |
| **Primary Audience** | Chinese-speaking patients (US local) |
| **Locations** | 法拉盛 Flushing, NY + 大颈 Great Neck, NY |
| **Phone** | (718) 353-0880 (Flushing), (516) 809-8686 (Great Neck) |
| **Primary SEO Locale** | `zh` only (current campaign scope) |
| **Goal** | Build stable local ranking for Chinese orthodontic searches |

---

## Executive Decision (Must Follow)

### 1) SEO language scope
- **Only Chinese SEO is in scope** for current phase.
- English pages are not part of index growth targets.

### 2) URL strategy (Chinese vs English/Pinyin)
- **Recommended for this project: use stable English slugs** (lowercase + hyphen), keep Chinese in title/H1/body/anchor text.
- Do **not** migrate existing indexed slugs to Chinese characters unless there is a strong business reason and a full redirect plan.

### 3) Why this matches SEO rules
- Google can index Chinese URLs, but **Chinese characters in URL do not create guaranteed ranking advantage** by themselves.
- Ranking is driven mainly by content relevance, internal links, entity/local signals, schema, and behavioral quality.
- English slugs are usually more stable for sharing, copy/paste, analytics, log processing, and cross-system tooling.
- For local Chinese SEO in the US, the strongest gains come from:
  - Chinese intent coverage in title/H1/content
  - consistent NAP + location landing intent
  - review/reputation + GBP signals

---

## Current Status Snapshot

| Component | Current State | Target State | Priority |
|----------|---------------|--------------|----------|
| Locale indexing | `zh` + placeholders in codebase | `zh`-first index only | P0 |
| `robots.txt` | Disallow non-target locales + admin/api | Keep and monitor | P0 |
| `sitemap.xml` | Chinese URLs only | Keep and monitor freshness | P0 |
| Canonical/hreflang | Canonical points to `zh`; alternates trimmed to `zh` + `x-default` | Keep | P0 |
| Metadata map (`seo.json`) | Mostly complete, route keys fixed | Expand by page intent cluster | P1 |
| Location SEO architecture | Two clinics present in content | Explicit Flushing/Great Neck targeting in key pages | P1 |
| Service detail pages | Existing | Strengthen local-intent copy + internal linking | P1 |
| Case/condition detail SEO pages | Limited detail routing | Add dedicated route strategy if needed | P2 |

---

## URL Policy (Final)

### Canonical URL format
- Use:
  - `/zh/services/invisalign`
  - `/zh/blog/braces-vs-invisalign`
  - `/zh/case-studies`
- Avoid changing to Chinese character slugs unless doing a planned migration.

### If Chinese URL is ever required
Use this only when all conditions are true:
- clear branding reason;
- no conflict with existing indexed slug;
- redirect mapping prepared;
- Search Console reindex workflow scheduled.

Migration checklist (required if ever switching slugs):
- old URL -> new URL **308** permanent redirect;
- canonical updated to new URL;
- sitemap updated same release;
- internal links updated same release;
- GSC URL Inspection request for top pages.

---

## Phase Plan

| Phase | Scope | Outcome | Owner |
|------|-------|---------|-------|
| **Phase 1** | Technical hygiene baseline | Robots, sitemap, canonical, metadata are clean for Chinese index | Engineering |
| **Phase 2** | Two-location SEO strengthening | Flushing + Great Neck intent is explicit across core pages | Content + Engineering |
| **Phase 3** | Complete local SEO page buildout | New location+service+condition local landing pages launched | Engineering + Content |
| **Phase 4** | Internal linking & authority flow | Service/blog/case links push authority to core money pages | Engineering |
| **Phase 5** | Schema/GBP/Citation implementation | Rich results + map pack + local trust consistency | SEO Ops + Content |
| **Phase 6** | Search Console + monitoring | Crawl/index coverage and query growth tracked weekly | SEO Ops |
| **Phase 7** | Continuous optimization | Expand query clusters, reviews, CTR optimization | SEO Ops + Content |

---

## Phase 1 — Technical SEO Baseline (P0)

### 1.1 Robots
Expected principles:
- allow public pages;
- disallow `/admin`, `/api`;
- disallow non-target locales for current campaign.

Validation:
```bash
curl https://www.drhuortho.com/robots.txt
```

Pass criteria:
- `Allow: /` exists;
- non-target locale paths are disallowed;
- sitemap URL is present.

### 1.2 Sitemap
Expected principles:
- only indexable Chinese URLs included;
- no placeholder or non-rendered URLs;
- `lastmod` reflects real content updates.

Validation:
```bash
curl https://www.drhuortho.com/sitemap.xml
```

Pass criteria:
- all URLs start with `/zh`;
- no `/en`/`/es`/`/ko` entries;
- key pages and service/blog detail pages included.

### 1.3 Metadata & Canonical
Expected principles:
- each indexable page has unique Chinese title/description;
- canonical points to the Chinese URL;
- alternates include only valid locale targets.

Validation pages:
- `/zh`
- `/zh/services`
- `/zh/blog`
- `/zh/contact`
- top 3 service detail pages

Pass criteria:
- title <= 60 chars (or close to intent-safe length);
- description <= 155 chars (or concise local intent);
- canonical self-references the correct `zh` URL.

---

## Phase 2 — Two-Location SEO Structure (P1)

### 2.1 Core intent clusters
Create/strengthen copy for both:
- 法拉盛正畸
- 大颈正畸

### 2.2 Page-level location coverage
Add clear location text blocks and internal links on:
- homepage
- services page
- contact page
- about/team page

Each block should include:
- neighborhood/city mention;
- clinic address/phone;
- service intent keywords (natural language);
- CTA to booking/contact.

### 2.3 Location-specific trust signals
Add (where available):
- patient review snippets by location;
- map links for each clinic;
- appointment instructions by location.

---

## Phase 3 — Complete Local SEO Page Program (P1)

> Goal: Build a complete local page architecture for both locations, using stable English slugs and Chinese on-page signals.

### 3.1 New page inventory (complete target)

| Page Group | Count | URL Pattern | Notes |
|---|---:|---|---|
| Core location landing pages | 2 | `/zh/flushing-orthodontist`, `/zh/great-neck-orthodontist` | Highest local intent pages |
| Service + location pages | 24 | `/zh/{location}-{service}` | 12 services x 2 locations |
| Condition + location pages | 16 | `/zh/{location}-{condition}` | 8 conditions x 2 locations |
| Cost/insurance/comparison pages | 6 | `/zh/{location}-orthodontics-cost` etc. | Money-page + conversion intent |
| **Total new local SEO pages** | **48** |  | Phased rollout required |

### 3.2 Service page matrix (24 pages)

For each service below, create both:
- `flushing-{service-slug}`
- `great-neck-{service-slug}`

| Service (ZH) | Service Slug |
|---|---|
| 传统金属牙套 | `traditional-braces` |
| 陶瓷牙套 | `ceramic-braces` |
| 自锁牙套 | `self-ligating-braces` |
| 隐适美 | `invisalign` |
| 隐适美青少年版 | `invisalign-teen` |
| 早期正畸 | `early-orthodontics` |
| 青少年正畸 | `teen-orthodontics` |
| 成人正畸 | `adult-orthodontics` |
| 正畸正颌手术 | `surgical-orthodontics` |
| 上颌扩弓器 | `palatal-expanders` |
| 保持器 | `retainers` |
| 正畸急诊 | `emergency-orthodontics` |

### 3.3 Condition page matrix (16 pages)

For each condition below, create both:
- `flushing-{condition-slug}`
- `great-neck-{condition-slug}`

| Condition Intent (ZH) | Condition Slug |
|---|---|
| 牙齿拥挤 | `crowding` |
| 深覆合 | `deep-bite` |
| 地包天/反颌 | `underbite` |
| 开咬 | `open-bite` |
| 交叉咬合 | `crossbite` |
| 牙缝大 | `spacing` |
| 上颌狭窄 | `narrow-palate` |
| 儿童早期干预 | `early-intervention` |

### 3.4 Resource/comparison page matrix (6 pages)

| Intent | URL |
|---|---|
| 法拉盛正畸费用 | `/zh/flushing-orthodontics-cost` |
| 大颈正畸费用 | `/zh/great-neck-orthodontics-cost` |
| 法拉盛正畸保险 | `/zh/flushing-orthodontics-insurance` |
| 大颈正畸保险 | `/zh/great-neck-orthodontics-insurance` |
| 法拉盛牙套 vs 隐适美 | `/zh/flushing-braces-vs-invisalign` |
| 大颈牙套 vs 隐适美 | `/zh/great-neck-braces-vs-invisalign` |

### 3.5 Page template standard (every local SEO page)

Required sections:
1. Chinese intent-matched H1 (`{location}{service|condition}`).
2. Immediate trust block (ABO credentials + years + bilingual + two clinics).
3. Candidate/problem matching section.
4. Treatment method section (linked service details).
5. Location-specific logistics (address, transit, parking, office hours).
6. Insurance/cost CTA block.
7. FAQ block (5-8 Q&A, full Chinese).
8. Conversion CTA (book/call).

Required schema:
- `BreadcrumbList`
- `FAQPage`
- `LocalBusiness`/`Dentist` (location-specific fields)
- `MedicalBusiness`/`Orthodontist` equivalent fields where applicable

### 3.6 Engineering architecture tasks (required before page rollout)

Current codebase does not yet have a generic local SEO page system.

Implementation tasks:
- Create content directory: `content/hu-orthodontics/zh/local-seo/*.json`
- Create route: `app/[locale]/local-seo/[slug]/page.tsx` (or an equivalent catch-all strategy)
- Create page loader helper for `local-seo` directory
- Add metadata builder for local-seo pages (title/description/canonical)
- Add sitemap discovery for `local-seo` entries
- Add admin panel support to edit local-seo page content
- Add internal-link helpers (service/blog/case -> local-seo pages)

### 3.7 Rollout waves (practical launch order)

| Wave | Scope | Count | SLA |
|---|---|---:|---|
| Wave 1 | 2 core location pages + 8 high-value service pages + 2 cost pages | 12 | Week 1 |
| Wave 2 | Remaining 16 service pages + 2 insurance pages | 18 | Week 2-3 |
| Wave 3 | 16 condition pages + 2 comparison pages | 18 | Week 4-5 |

---

## Phase 4 — Internal Linking Model (P1)

### 4.1 Service-first authority flow
Ensure:
- homepage service cards link to service detail pages;
- blog posts link to matching service pages;
- case studies link to relevant services.

### 4.2 Local SEO anchors (Chinese)
Anchor text examples:
- “法拉盛隐适美”
- “大颈儿童正畸”
- “法拉盛牙套矫正”

### 4.3 Avoid orphan pages
Every indexed page must receive:
- at least 1 nav/footer/internal entry link;
- at least 1 contextual in-content link.

### 4.4 Homepage SEO hub block (implemented)

Implementation decision:
- Keep `hero.primaryCta` for booking only (do not replace with SEO landing URL).
- Add a dedicated homepage block: `seoHub` to surface local SEO entries.

Where configured:
- `content/hu-orthodontics/zh/pages/home.json` -> `seoHub`
- `content/hu-orthodontics/zh/pages/home.layout.json` -> section id `seoHub`
- rendered by `components/sections/SeoHubLinksSection.tsx`

Homepage SEO hub links (10):
- `/zh/flushing-orthodontist`
- `/zh/great-neck-orthodontist`
- `/zh/flushing-invisalign`
- `/zh/great-neck-invisalign`
- `/zh/flushing-adult-orthodontics`
- `/zh/great-neck-teen-orthodontics`
- `/zh/flushing-traditional-braces`
- `/zh/great-neck-traditional-braces`
- `/zh/flushing-orthodontics-cost`
- `/zh/great-neck-braces-vs-invisalign`

---

## Phase 5 — Schema + GBP + Citation System (P1)

### 5.1 Schema implementation checklist

For both location landing pages and location-service pages:
- [ ] `LocalBusiness` with location-specific phone/address/map URL
- [ ] `Dentist` business category signals
- [ ] `BreadcrumbList` for hierarchy
- [ ] `FAQPage` with 5-8 Chinese Q&A

For case/service pages:
- [ ] `MedicalProcedure` or service-equivalent structured fields
- [ ] keep FAQ schema only when FAQs are visible on page

### 5.2 Google Business Profile (two locations)

Required profile setup:
- one GBP for Flushing clinic;
- one GBP for Great Neck clinic;
- each profile links to its matching location landing page URL.

Weekly GBP posting plan:
- 1 treatment education post (service intent)
- 1 trust/proof post (case/review/team)
- 1 conversion post (consultation, financing, booking CTA)

### 5.3 Citation consistency plan

NAP consistency must be exact per location across:
- Google, Apple Maps, Bing Places, Yelp
- Healthgrades/Zocdoc (if used)
- Chinese community directories/social channels (if applicable)

Tracking fields per citation:
- profile URL
- published NAP version
- link target URL
- last verified date

---

## Phase 6 — GSC Execution (Manual)

### 6.1 Submit sitemap
```text
https://www.drhuortho.com/sitemap.xml
```

### 6.2 Complete SEO program URL inventory (submit from this list)

> This section centralizes all SEO program pages, including all Phase 3 pages.

#### 6.2.1 Foundation URLs (existing)
```text
https://www.drhuortho.com/zh
https://www.drhuortho.com/zh/services
https://www.drhuortho.com/zh/contact
https://www.drhuortho.com/zh/about
https://www.drhuortho.com/zh/blog
https://www.drhuortho.com/zh/case-studies
https://www.drhuortho.com/zh/new-patients
```

#### 6.2.2 Phase 3 core location landing pages (2)
```text
https://www.drhuortho.com/zh/flushing-orthodontist
https://www.drhuortho.com/zh/great-neck-orthodontist
```

#### 6.2.3 Phase 3 service + location pages (24)

Flushing (12):
```text
https://www.drhuortho.com/zh/flushing-traditional-braces
https://www.drhuortho.com/zh/flushing-ceramic-braces
https://www.drhuortho.com/zh/flushing-self-ligating-braces
https://www.drhuortho.com/zh/flushing-invisalign
https://www.drhuortho.com/zh/flushing-invisalign-teen
https://www.drhuortho.com/zh/flushing-early-orthodontics
https://www.drhuortho.com/zh/flushing-teen-orthodontics
https://www.drhuortho.com/zh/flushing-adult-orthodontics
https://www.drhuortho.com/zh/flushing-surgical-orthodontics
https://www.drhuortho.com/zh/flushing-palatal-expanders
https://www.drhuortho.com/zh/flushing-retainers
https://www.drhuortho.com/zh/flushing-emergency-orthodontics
```

Great Neck (12):
```text
https://www.drhuortho.com/zh/great-neck-traditional-braces
https://www.drhuortho.com/zh/great-neck-ceramic-braces
https://www.drhuortho.com/zh/great-neck-self-ligating-braces
https://www.drhuortho.com/zh/great-neck-invisalign
https://www.drhuortho.com/zh/great-neck-invisalign-teen
https://www.drhuortho.com/zh/great-neck-early-orthodontics
https://www.drhuortho.com/zh/great-neck-teen-orthodontics
https://www.drhuortho.com/zh/great-neck-adult-orthodontics
https://www.drhuortho.com/zh/great-neck-surgical-orthodontics
https://www.drhuortho.com/zh/great-neck-palatal-expanders
https://www.drhuortho.com/zh/great-neck-retainers
https://www.drhuortho.com/zh/great-neck-emergency-orthodontics
```

#### 6.2.4 Phase 3 condition + location pages (16)

Flushing (8):
```text
https://www.drhuortho.com/zh/flushing-crowding
https://www.drhuortho.com/zh/flushing-deep-bite
https://www.drhuortho.com/zh/flushing-underbite
https://www.drhuortho.com/zh/flushing-open-bite
https://www.drhuortho.com/zh/flushing-crossbite
https://www.drhuortho.com/zh/flushing-spacing
https://www.drhuortho.com/zh/flushing-narrow-palate
https://www.drhuortho.com/zh/flushing-early-intervention
```

Great Neck (8):
```text
https://www.drhuortho.com/zh/great-neck-crowding
https://www.drhuortho.com/zh/great-neck-deep-bite
https://www.drhuortho.com/zh/great-neck-underbite
https://www.drhuortho.com/zh/great-neck-open-bite
https://www.drhuortho.com/zh/great-neck-crossbite
https://www.drhuortho.com/zh/great-neck-spacing
https://www.drhuortho.com/zh/great-neck-narrow-palate
https://www.drhuortho.com/zh/great-neck-early-intervention
```

#### 6.2.5 Phase 3 resource/comparison pages (6)
```text
https://www.drhuortho.com/zh/flushing-orthodontics-cost
https://www.drhuortho.com/zh/great-neck-orthodontics-cost
https://www.drhuortho.com/zh/flushing-orthodontics-insurance
https://www.drhuortho.com/zh/great-neck-orthodontics-insurance
https://www.drhuortho.com/zh/flushing-braces-vs-invisalign
https://www.drhuortho.com/zh/great-neck-braces-vs-invisalign
```

### 6.3 GSC submission order (execute exactly)
1. Submit sitemap first.
2. Submit all Foundation URLs (6.2.1).
3. Submit core location landing pages (6.2.2).
4. Submit service+location pages (6.2.3), high-value services first: `invisalign`, `adult-orthodontics`, `traditional-braces`, `teen-orthodontics`.
5. Submit condition+location pages (6.2.4).
6. Submit resource/comparison pages (6.2.5).
7. Re-check any "Crawled - currently not indexed" URLs after 7-14 days.

### 6.4 Weekly monitoring views
- Coverage: indexed vs excluded
- Performance query filters:
  - contains `法拉盛`
  - contains `大颈`
  - contains `正畸` / `隐适美` / `牙套`
- CTR and average position for top 20 queries

---

## Phase 7 — Ongoing Optimization (P2)

### Content
- publish 2-4 Chinese blog posts/month around orthodontics concerns;
- add FAQ sections to service and case pages.

### Reputation
- collect and respond to Chinese reviews continuously;
- route review acquisition to both clinic locations.

### CTR improvements
- refine title hooks (expert credentials, two-location convenience, treatment outcomes);
- test meta descriptions every 4-6 weeks.

---

## AI Crawlers Policy (Robots Guidance)

### Should we allow AI engines to crawl?
- **Yes, default allow is acceptable** for discovery, as long as sensitive paths remain blocked.
- Current `User-agent: *` + `Allow: /` already allows compliant AI/search crawlers.

### Optional stricter policy
If business/legal later wants tighter control, use explicit allow/disallow by bot class:
- search discovery bots (allow),
- model training bots (case-by-case),
- always block admin/private APIs.

Important:
- `robots.txt` is advisory for compliant bots, not an absolute security control.
- Never expose sensitive data assuming robots rules will protect it.

---

## Done-Gate Checklist

- [ ] `robots.txt` reflects Chinese-first indexing policy
- [ ] `sitemap.xml` contains only valid Chinese URLs
- [ ] Canonical is correct on all core pages
- [ ] Metadata titles/descriptions are unique and intent-aligned
- [ ] 48 new local SEO pages are created and indexable (2 + 24 + 16 + 6)
- [ ] Flushing + Great Neck intent is explicit on core pages
- [ ] No orphan indexable pages
- [ ] Required schema is valid on local landing pages
- [ ] Two GBP profiles point to matching location landing pages
- [ ] Citation sheet is complete with NAP consistency verification
- [ ] GSC sitemap submitted and first crawl success confirmed
- [ ] Weekly monitoring dashboard/process established

---

## Appendix — URL Language Rule (Quick Answer)

If you must choose one standard for this project, choose:
- **English slug + Chinese content SEO**

Reason:
- best operational stability;
- no proven standalone ranking boost from Chinese URL characters;
- easier maintenance across CMS/dev/analytics/share channels;
- fully compatible with strong Chinese local SEO performance.
