/**
 * Outscraper API client for Google Maps search.
 * Simple, reliable, no blocks.
 */

export interface Lead {
    placeId: string;
    name: string;
    phone?: string;
    email?: string;
    address: string;
    rating?: number;
    reviewCount?: number;
    website?: string;
    mapsUrl: string;
    instagramProfile?: string;
    category?: string;
    city?: string;
}

export interface OutscraperOptions {
    category: string;
    city: string;
    limit?: number;
    skip?: number;
    existingIds?: Set<string>;
}

interface OutscraperResult {
    place_id: string;
    name: string;
    phone?: string;
    email?: string;
    emails?: string[];
    full_address?: string;
    rating?: number;
    reviews?: number;
    website?: string;
    google_maps_url?: string;
    followers_count?: number;
    phone_number?: string;
    public_phone_country_code?: string;
    public_phone_number?: string;
    external_url?: string;
    username?: string;
    owner_username?: string;
    full_name?: string;
}

/**
 * Search Google Maps via Outscraper API.
 */
export async function searchOutscraper(options: OutscraperOptions): Promise<Lead[]> {
    const { category, city, limit = 30, skip = 0, existingIds = new Set() } = options;

    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) {
        throw new Error('OUTSCRAPER_API_KEY not configured');
    }

    const query = `${category} en ${city}`;
    const url = new URL('https://api.app.outscraper.com/maps/search-v3');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('skip', String(skip));
    url.searchParams.set('language', 'es');
    url.searchParams.set('async', 'false');

    console.log(`🔍 Outscraper: Searching "${query}" (limit: ${limit})`);

    const response = await fetch(url.toString(), {
        headers: {
            'X-API-KEY': apiKey
        }
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Outscraper error:', text);
        throw new Error(`Outscraper API error: ${response.status}`);
    }

    const data = await response.json();

    // Outscraper returns: { data: [[...results]] } for sync requests
    const results: OutscraperResult[] = data?.data?.[0] || [];

    console.log(`📍 Outscraper: Found ${results.length} results`);

    // Map to Lead interface and filter existing
    const leads: Lead[] = [];
    let skipped = 0;

    for (const r of results) {
        if (!r.place_id || !r.name) continue;

        // Skip if already in DB
        if (existingIds.has(r.place_id)) {
            skipped++;
            continue;
        }

        // Only include leads with phone or email (since email is now valuable)
        if (!r.phone && !r.email && (!r.emails || r.emails.length === 0)) continue;

        leads.push({
            placeId: r.place_id,
            name: r.name,
            phone: r.phone,
            email: r.email || (r.emails && r.emails.length > 0 ? r.emails[0] : undefined),
            address: r.full_address || '',
            rating: r.rating,
            reviewCount: r.reviews,
            website: r.website,
            mapsUrl: r.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
        });
    }

    console.log(`✅ Outscraper: ${leads.length} new leads with contaact (${skipped} skipped as duplicates)`);
    return leads;
}

/**
 * Search for a specific business query (e.g. "Business Name City")
 * Used for the SEO Validator.
 */
export async function searchByQuery(query: string, limit: number = 1): Promise<Lead[]> {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) throw new Error('OUTSCRAPER_API_KEY not configured');

    const url = new URL('https://api.app.outscraper.com/maps/search-v3');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('language', 'es');
    url.searchParams.set('async', 'false');

    console.log(`🔍 Outscraper Direct: "${query}"`);

    const response = await fetch(url.toString(), {
        headers: { 'X-API-KEY': apiKey }
    });

    if (!response.ok) {
        throw new Error(`Outscraper API error: ${response.status}`);
    }

    const data = await response.json();
    const results: OutscraperResult[] = data?.data?.[0] || [];

    return results.map(r => ({
        placeId: r.place_id,
        name: r.name,
        phone: r.phone,
        email: r.email || (r.emails && r.emails.length > 0 ? r.emails[0] : undefined),
        address: r.full_address || '',
        rating: r.rating,
        reviewCount: r.reviews,
        website: r.website,
        mapsUrl: r.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
    })).filter(l => l.placeId && l.name);
}

/**
 * Search Instagram via Outscraper
 * Finds posts/accounts matching the query.
 * (Note: Currently returning 404, kept for future use if fixed)
 */
export async function searchInstagram(query: string, limit: number = 20): Promise<Lead[]> {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) throw new Error('OUTSCRAPER_API_KEY not configured');

    const url = new URL('https://api.app.outscraper.com/instagram/search');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('async', 'false');
    url.searchParams.set('searchType', 'accounts');

    console.log(`📸 Instagram Search: "${query}"`);

    const response = await fetch(url.toString(), {
        headers: { 'X-API-KEY': apiKey }
    });

    if (!response.ok) {
        throw new Error(`Outscraper IG API error: ${response.status}`);
    }

    const data = await response.json();
    const results: any[] = data?.data || [];

    return results.map((r: OutscraperResult) => {
        const username = r.username || r.owner_username || '';
        const name = r.full_name || username;
        const placeId = `ig_${username}`;

        return {
            placeId,
            name: name,
            phone: r.phone_number || r.public_phone_country_code ? `+${r.public_phone_country_code}${r.public_phone_number}` : undefined,
            email: r.email, // If IG returns email
            address: 'Instagram',
            city: 'Instagram',
            category: 'Instagram',
            rating: 0,
            reviewCount: r.followers_count || 0,
            website: r.external_url || `https://instagram.com/${username}`,
            mapsUrl: `https://instagram.com/${username}`,
            instagramProfile: `https://instagram.com/${username}`
        } as Lead;
    }).filter((l: Lead) => l.name);
}
