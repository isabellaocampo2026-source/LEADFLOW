# 🎯 LeadFlow - Google Maps Lead Scraper

> **Purpose of this file**: This document provides complete context for any AI assistant (LLM) to understand and continue development on this project. Read this file before making any changes.

---

## 📋 Project Overview

**What is this project?**
A lead generation platform that scrapes business information from Google Maps. Users can search for any type of business (restaurants, dentists, gyms, etc.) in any location and extract contact information.

**Primary Goal:**
Help users find leads for any business niche by extracting phone numbers, websites, addresses, and ratings from Google Maps.

**Target User:**
- Sales professionals looking for leads
- Marketing agencies doing lead generation
- Business owners looking for B2B contacts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js with App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **Database** | Supabase (PostgreSQL) |
| **Scraping** | Playwright (headless Chromium browser) |
| **i18n** | next-intl (Spanish/English) |
| **Package Manager** | npm |

---

## 📁 Key File Structure

```
lead-scraper/
├── app/
│   ├── [locale]/              # Internationalized routes
│   │   ├── scraper/
│   │   │   └── page.tsx       # ⭐ MAIN SCRAPER UI - search form + results cards
│   │   ├── leads/
│   │   │   └── page.tsx       # Saved leads list
│   │   └── layout.tsx         # Main layout with sidebar
│   ├── actions/
│   │   └── scrape.ts          # ⭐ Server actions for scraping and lead management
│   └── api/                   # API routes
├── lib/
│   ├── scraper/
│   │   ├── google-maps.ts     # ⭐ MAIN SCRAPER - Google Maps implementation
│   │   ├── base-scraper.ts    # Base class with Playwright setup
│   │   └── types.ts           # BusinessLead interface definition
│   └── supabase.ts            # Supabase client
├── database/
│   └── migration_business_leads.sql  # ⭐ SQL schema for business_leads table
├── components/
│   └── ui/                    # shadcn/ui components
├── messages/
│   ├── es.json                # Spanish translations
│   └── en.json                # English translations
├── scripts/
│   └── test-gmaps-scraper.ts  # Standalone scraper test
└── .env.local                 # Environment variables (Supabase keys)
```

---

## 🔑 Critical Files to Understand

### 1. `lib/scraper/google-maps.ts`
The core scraping engine. Key features:
- **Search URL**: Builds `https://www.google.com/maps/search/{query}+in+{location}`
- **Scroll Pagination**: Scrolls the results panel to load more businesses
- **Data Extraction**: Clicks each business to extract details
- **Extracts**: name, phone, website, address, rating, review count, price level

### 2. `app/[locale]/scraper/page.tsx`
The main UI. Key features:
- **Search Inputs**: Business type, location, max results
- **Results Cards**: Shows business info with phone, website, address, rating
- **Export CSV**: Download all leads as CSV file
- **Mark Contacted**: Save notes and mark leads as contacted

### 3. `lib/scraper/types.ts`
```typescript
interface BusinessLead {
    source: 'google_maps';
    placeId: string;           // Unique Google Place ID
    name: string;              // Business name
    category: string;          // Searched category
    phone?: string;            // Phone number
    website?: string;          // Website URL
    address: string;           // Full address
    city?: string;             // City
    rating?: number;           // Rating 1-5
    reviewCount?: number;      // Number of reviews
    mapsUrl: string;           // Google Maps URL
    contacted?: boolean;       // Already contacted
    notes?: string;            // User notes
}
```

---

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Run development server
npm run dev

# Test scraper standalone
npx tsx scripts/test-gmaps-scraper.ts
```

**Default URLs:**
- `http://localhost:3000` (or 3001 if 3000 is busy)
- Main scraper page: `/es/scraper`

---

## 📌 Environment Variables Required

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJS...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJS...
```

---

## 🗄️ Database Schema (Supabase)

```sql
CREATE TABLE business_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    rating DECIMAL(2,1),
    review_count INTEGER,
    price_level TEXT,
    maps_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    contacted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🐛 Known Issues / Future Improvements

1. **Rate Limiting**: Heavy use might get IP blocked by Google. Consider proxy rotation.
2. **Email Extraction**: Currently not implemented. Could scrape websites for email addresses.
3. **Captcha Handling**: Google may show captchas. Consider using SerpAPI for production.

---

*Last updated: 2026-01-26*
