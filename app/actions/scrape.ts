'use server'

import { searchOutscraper, searchInstagram, Lead } from "@/lib/scraper/outscraper"
import { searchPeopleByDomain } from "@/lib/enrichment/apollo"
import { supabase } from "@/lib/supabase"

export interface ScrapeResult {
    success: boolean
    leads: Lead[]
    stats: {
        found: number
        savedNew: number
    }
    error?: string
}

/**
 * Scrape leads using Outscraper API.
 * 1. Call Outscraper API
 * 2. Apply filters (no website, max reviews)
 * 3. Save to database (duplicates ignored via ON CONFLICT)
 * 4. Return leads for display
 */
export async function scrapeLeads(
    category: string,
    city: string,
    options?: {
        skip?: number
        limit?: number
        strategy?: 'standard' | 'deep-dive'
        onlyNoWebsite?: boolean
        maxReviews?: number
        postalCode?: string
        source?: 'maps' | 'instagram'
        enrichment?: boolean
    }
): Promise<ScrapeResult> {
    try {
        let { skip = 0, limit = 50, strategy = 'standard', onlyNoWebsite = false, maxReviews, postalCode, source = 'maps', enrichment = false } = options || {};
        console.log(`🚀 Starting Scraper (${source}): ${category} en ${city} ${postalCode ? `(${postalCode})` : ''} (Target: ${limit})`);

        // 1. Get existing placeIds from DB (to skip duplicates)
        const { data: existing } = await supabase
            .from('business_leads')
            .select('place_id');

        const existingIds = new Set<string>(
            (existing || []).map(row => row.place_id)
        );
        console.log(`📋 Pre-filter: ${existingIds.size} existing leads in DB`);

        // Smart Fetch Loop
        let allLeads: Lead[] = [];
        let r_skip = skip;
        const maxRetries = 5;
        let attempts = 0;

        while (allLeads.length < limit && attempts < maxRetries) {
            attempts++;
            const remaining = limit - allLeads.length;
            const batchLimit = Math.max(remaining * (postalCode ? 1.5 : 3), postalCode ? 50 : 100); // Lower limits for targeted postal code search

            console.log(`🔄 Fetch ${attempts}/${maxRetries}: Requesting ${batchLimit} (Skip: ${r_skip})`);

            let batch: Lead[] = [];

            if (source === 'instagram') {
                // Instagram Search
                const query = `${category} ${city}`;
                batch = await searchInstagram(query, batchLimit);
                // Instagram API doesn't support 'skip' in the same way, usually pagination tokens.
                // For simplicity in this version, we trust limit.
                // To avoid loops if API returns same, we check IDs.
                if (batch.length === 0) break;
            } else {
                // Maps Search (Standard)
                const searchCity = postalCode ? `${city} ${postalCode}` : city;

                batch = await searchOutscraper({
                    category,
                    city: searchCity, // Append postal code to city for query
                    limit: batchLimit,
                    skip: r_skip,
                    existingIds,
                    enrichment
                });
            }

            if (batch.length === 0) {
                console.log("⚠️ No more results from API.");
                break;
            }

            // --- APPLY FILTERS ---
            let validBatch = batch.filter(lead => {
                // Filter: No website
                if (onlyNoWebsite && lead.website) {
                    return false;
                }

                // Filter: Max reviews
                if (maxReviews !== undefined && (lead.reviewCount || 0) > maxReviews) {
                    return false;
                }

                // Deep dive: Also exclude giants
                if (strategy === 'deep-dive') {
                    const isGiant = lead.website && (lead.reviewCount || 0) > 50 && (lead.rating || 0) > 4.5;
                    if (isGiant) return false;
                }

                return true;
            });

            console.log(`✅ Filtered: ${validBatch.length}/${batch.length} passed filters`);

            // Append and deduplicate
            allLeads = [...allLeads, ...validBatch];

            // Deduplicate freshly fetched leads just in case (though searchOutscraper handles DB dupes)
            // This is to prevent duplicates *within* the same multi-fetch session if API returns overlaps
            const uniqueMap = new Map();
            allLeads.forEach(l => uniqueMap.set(l.placeId, l));
            allLeads = Array.from(uniqueMap.values());

            console.log(`📥 Batch received: ${validBatch.length} valid. Total accumulated: ${allLeads.length}/${limit}`);

            // Increment skip for next pagination
            r_skip += batchLimit;
        }

        // Slice to exact limit if we over-fetched
        const finalLeads = allLeads.slice(0, limit);

        if (finalLeads.length === 0) {
            return { success: true, leads: [], stats: { found: 0, savedNew: 0 } };
        }

        // 3. Save to database (ON CONFLICT ignores duplicates)
        const { data, error } = await supabase
            .from('business_leads')
            .upsert(
                finalLeads.map((lead: Lead) => ({
                    place_id: lead.placeId,
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    city: city,
                    category: category,
                    email: lead.email, // Save email
                    rating: lead.rating,
                    review_count: lead.reviewCount, // Ensure correct mapping (review_count vs reviewCount)
                    website: lead.website,
                    maps_url: lead.mapsUrl,
                    scraped_at: new Date().toISOString(),
                    contacted: false
                })),
                { onConflict: 'place_id', ignoreDuplicates: true }
            )
            .select('id');

        const savedNew = data?.length || 0;

        if (error && error.code !== '23505') {
            console.error('DB Error:', error);
        }

        console.log(`✅ Smart Fetch Complete: ${finalLeads.length} leads returned (Saved new: ${savedNew})`);

        return {
            success: true,
            leads: finalLeads,
            stats: {
                found: finalLeads.length,
                savedNew
            }
        };

    } catch (error: any) {
        console.error('❌ Search failed:', error);
        return {
            success: false,
            leads: [],
            stats: { found: 0, savedNew: 0 },
            error: error.message || 'Failed to search'
        };
    }
}

/**
 * Mark a lead as contacted
 */
export async function markAsContacted(placeId: string, notes?: string) {
    const { error } = await supabase
        .from('business_leads')
        .update({
            contacted: true,
            notes,
            updated_at: new Date().toISOString()
        })
        .eq('place_id', placeId);

    return { success: !error };
}

/**
 * Get all saved leads
 */
export async function getLeads() {
    const { data, error } = await supabase
        .from('business_leads')
        .select('*')
        .order('scraped_at', { ascending: false });

    if (error) {
        return { success: false, data: [] };
    }

    return {
        success: true,
        data: data?.map(row => ({
            id: row.id,
            placeId: row.place_id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            city: row.city,
            category: row.category,
            rating: row.rating,
            reviewCount: row.review_count, // Map correctly
            website: row.website,
            mapsUrl: row.maps_url,
            contacted: row.contacted,
            notes: row.notes,
            scrapedAt: row.scraped_at
        })) || []
    };
}

/**
 * Enrich a specific lead with email
 */
export async function enrichLeadWithEmail(placeId: string, website: string) {
    try {
        // 1. Clean domain
        let domain = website.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
        if (!domain) return { success: false, error: "Dominio inválido" };

        // 2. Try Apollo (Premium - Owner/CEO)
        let email: string | undefined | null = null;
        let source = 'outscraper';
        let foundPerson = null;

        try {
            foundPerson = await searchPeopleByDomain(domain);
            if (foundPerson?.email) {
                email = foundPerson.email;
                source = `Apollo (${foundPerson.title})`;
            }
        } catch (e) {
            console.error("Apollo search failed:", e);
        }

        // 3. Fallback to Outscraper (Generic Web Scraper)
        if (!email) {
            const { enrichDomainEmails } = await import("@/lib/scraper/outscraper");
            email = await enrichDomainEmails(domain);
            source = 'Web Scraper';
        }

        // 4. Update DB
        const { error } = await supabase
            .from('business_leads')
            .update({ email })
            .eq('place_id', placeId);

        if (error) throw error;

        return { success: true, email, source, person: foundPerson };

    } catch (error: any) {
        console.error('Enrichment failed:', error);
        return { success: false, error: error.message };
    }
}
