'use server'

import { searchByQuery } from "@/lib/scraper/outscraper"
import { supabase } from "@/lib/supabase"

export interface AuditResult {
    query: string
    found: boolean
    data?: {
        name: string
        rating: number
        reviews: number
        website: string
        placeId: string
        address: string
        phone?: string
    }
    status: 'good_opportunity' | 'healthy' | 'not_found'
}

/**
 * Audit a list of leads (Name + City)
 * Checks Google Maps for each and returns SEO stats.
 */
export async function auditLeads(queries: string[]): Promise<{ success: boolean, results: AuditResult[] }> {
    try {
        console.log(`🕵️ Auditing ${queries.length} leads...`);

        const results: AuditResult[] = [];

        // Process in chunks to avoid rate limits / timeouts
        // Outscraper is fast but let's be polite
        const chunkSize = 5;

        for (let i = 0; i < queries.length; i += chunkSize) {
            const chunk = queries.slice(i, i + chunkSize);

            const chunkPromises = chunk.map(async (q) => {
                try {
                    const leads = await searchByQuery(q, 1);

                    if (leads.length === 0) {
                        return { query: q, found: false, status: 'not_found' } as AuditResult;
                    }

                    const lead = leads[0];
                    const rating = lead.rating || 0;
                    const reviews = lead.reviewCount || 0;
                    const website = lead.website;

                    // Determine SEO Status
                    let status: AuditResult['status'] = 'healthy';

                    // Opportunity if:
                    // 1. No website
                    // 2. Rating < 4.0
                    // 3. Reviews < 20 (Invisible)
                    if (!website || rating < 4.0 || reviews < 20) {
                        status = 'good_opportunity';
                    }

                    return {
                        query: q,
                        found: true,
                        data: {
                            name: lead.name,
                            rating,
                            reviews,
                            website: website || '',
                            placeId: lead.placeId,
                            address: lead.address,
                            phone: lead.phone
                        },
                        status
                    } as AuditResult;

                } catch (err) {
                    console.error(`Error auditing "${q}":`, err);
                    return { query: q, found: false, status: 'not_found' } as AuditResult;
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }

        return { success: true, results };

    } catch (error: any) {
        console.error('Audit failed:', error);
        return { success: false, results: [] };
    }
}

/**
 * Save audited leads directly to database
 */
export async function saveAuditedLeads(results: AuditResult[]) {
    const validLeads = results
        .filter(r => r.found && r.data)
        .map(r => ({
            place_id: r.data!.placeId,
            name: r.data!.name,
            phone: r.data!.phone,
            address: r.data!.address,
            city: 'Auditoría Externa', // Generic city for these
            category: 'Auditoría',
            rating: r.data!.rating,
            website: r.data!.website,
            maps_url: `https://www.google.com/maps/place/?q=place_id:${r.data!.placeId}`,
            scraped_at: new Date().toISOString(),
            contacted: false
        }));

    if (validLeads.length === 0) return { success: true, count: 0 };

    const { data, error } = await supabase
        .from('business_leads')
        .upsert(validLeads, { onConflict: 'place_id', ignoreDuplicates: true })
        .select('id');

    if (error) throw error;

    return { success: true, count: data.length, ids: data.map(d => d.id) };
}
