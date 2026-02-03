'use server'

import { supabase } from "@/lib/supabase"

export interface SavedLead {
    id: string;
    placeId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
    website?: string;
    mapsUrl?: string;
    contacted: boolean;
    notes?: string;
    scrapedAt: string;
    archived?: boolean;
}

export interface GetLeadsResult {
    success: boolean;
    data: SavedLead[];
    error?: string;
}

export async function getLeads(): Promise<GetLeadsResult> {
    try {
        const { data, error } = await supabase
            .from('business_leads')
            .select('*')
            .order('scraped_at', { ascending: false })

        if (error) {
            console.error('Error fetching leads:', error)
            return { success: false, data: [], error: error.message }
        }

        const leads: SavedLead[] = (data || []).map(row => ({
            id: row.id,
            placeId: row.place_id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            city: row.city,
            category: row.category,
            rating: row.rating,
            reviewCount: row.review_count,
            website: row.website,
            mapsUrl: row.maps_url,
            contacted: row.contacted,
            notes: row.notes,
            scrapedAt: row.scraped_at,
            archived: row.archived
        }))

        return { success: true, data: leads }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, data: [], error: 'Failed to fetch leads' }
    }
}

export async function deleteLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('business_leads')
            .delete()
            .eq('id', leadId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting lead:', error)
        return { success: false, error: error.message }
    }
}

export async function archiveLead(leadId: string, archive: boolean = true): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('business_leads')
            .update({ archived: archive })
            .eq('id', leadId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error archiving lead:', error)
        return false
    }
}

export async function updateLead(leadId: string, updates: Partial<SavedLead>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('business_leads')
            .update({
                email: updates.email,
                name: updates.name,
                notes: updates.notes,
                contacted: updates.contacted // Allow updating contacted status directly
            })
            .eq('id', leadId)

        if (error) {
            console.error('Update error:', error)
            return false
        }
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}
