import { chromium, Browser, Page } from 'playwright';

export interface Lead {
    placeId: string;
    name: string;
    phone?: string;
    address: string;
    rating?: number;
    reviewCount?: number;
    website?: string;
    mapsUrl: string;
}

export interface ScrapeOptions {
    category: string;
    city: string;
    maxResults?: number;
    existingIds?: Set<string>; // IDs to skip (already in DB)
}

/**
 * Simple, fast Google Maps scraper.
 * Goal: Find 20-40 leads with phone numbers in under 60 seconds.
 */
export async function scrapeGoogleMaps(options: ScrapeOptions): Promise<Lead[]> {
    const { category, city, maxResults = 30, existingIds = new Set() } = options;
    const leads: Lead[] = [];
    const seenIds = new Set<string>();
    let skippedCount = 0;

    let browser: Browser | null = null;

    try {
        // 1. Launch browser (headless for speed)
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        const page = await context.newPage();

        // 2. Block heavy resources for speed
        await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());
        await page.route('**/maps/vt/**', route => route.abort()); // Map tiles

        // 3. Navigate to search
        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${category} en ${city}`)}`;
        console.log(`🔍 Searching: ${category} en ${city}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        // 4. Accept cookies if prompted
        try {
            const acceptBtn = await page.$('button[aria-label*="Accept"], button[aria-label*="Aceptar"]');
            if (acceptBtn) await acceptBtn.click();
        } catch { }

        // 5. Wait for results
        await page.waitForSelector('[role="feed"], .m6QErb', { timeout: 10000 }).catch(() => { });

        // 6. Scroll and extract (max 15 scrolls to find new leads)
        const scrollContainer = await page.$('[role="feed"]') || await page.$('.m6QErb.DxyBCb');

        for (let scroll = 0; scroll < 15 && leads.length < maxResults; scroll++) {
            // Get all business links
            const cards = await page.$$('a[href*="/maps/place/"]');
            console.log(`📍 Scroll ${scroll + 1}/15 - Cards: ${cards.length}, New: ${leads.length}, Skipped: ${skippedCount}`);

            for (const card of cards) {
                if (leads.length >= maxResults) break;

                try {
                    const href = await card.getAttribute('href');
                    if (!href) continue;

                    // Extract placeId from URL
                    const placeMatch = href.match(/place\/([^\/\?]+)/);
                    const placeId = placeMatch ? decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ') : '';

                    if (!placeId || seenIds.has(placeId)) continue;
                    seenIds.add(placeId);

                    // Skip if already in database
                    if (existingIds.has(placeId)) {
                        skippedCount++;
                        continue;
                    }

                    // Click to load details
                    await card.click();
                    await page.waitForTimeout(800);

                    // Extract data
                    const lead = await extractLeadDetails(page, placeId);

                    if (lead && lead.phone) {
                        leads.push(lead);
                        console.log(`✅ ${lead.name} - ${lead.phone}`);
                    }

                } catch (err) {
                    // Skip problematic cards silently
                }
            }

            // Scroll for more results
            if (scrollContainer) {
                await scrollContainer.evaluate(el => el.scrollBy(0, 800));
                await page.waitForTimeout(1000);
            }
        }

    } catch (error) {
        console.error('❌ Scrape error:', error);
    } finally {
        if (browser) await browser.close();
    }

    console.log(`✅ Done! Found ${leads.length} leads with phone numbers.`);
    return leads;
}

async function extractLeadDetails(page: Page, placeId: string): Promise<Lead | null> {
    try {
        // Name
        const nameEl = await page.$('h1.DUwDvf, h1');
        const name = nameEl ? (await nameEl.textContent())?.trim() : '';
        if (!name) return null;

        // Phone
        let phone = '';
        const phoneBtn = await page.$('button[data-item-id^="phone:"], a[href^="tel:"]');
        if (phoneBtn) {
            const href = await phoneBtn.getAttribute('href');
            const aria = await phoneBtn.getAttribute('aria-label');
            if (href?.startsWith('tel:')) {
                phone = href.replace('tel:', '');
            } else if (aria) {
                const match = aria.match(/[\d\s\-\+\(\)]{7,}/);
                if (match) phone = match[0].trim();
            }
        }

        // Address
        let address = '';
        const addrBtn = await page.$('button[data-item-id="address"]');
        if (addrBtn) {
            const aria = await addrBtn.getAttribute('aria-label');
            if (aria) address = aria.replace(/^(Address|Dirección):?\s*/i, '').trim();
        }

        // Rating
        let rating: number | undefined;
        const ratingEl = await page.$('div.F7nice span[aria-hidden="true"]');
        if (ratingEl) {
            const text = await ratingEl.textContent();
            if (text) {
                const match = text.match(/(\d[.,]\d)/);
                if (match) rating = parseFloat(match[1].replace(',', '.'));
            }
        }

        // Website
        let website = '';
        const webLink = await page.$('a[data-item-id="authority"]');
        if (webLink) {
            website = await webLink.getAttribute('href') || '';
        }

        return {
            placeId: placeId.substring(0, 50),
            name: name.substring(0, 200),
            phone: phone || undefined,
            address,
            rating,
            website: website || undefined,
            mapsUrl: page.url()
        };

    } catch {
        return null;
    }
}
