'use server'

import { supabase } from "@/lib/supabase"

import { BusinessLead } from "@/lib/scraper/types"

// Types
export interface Report {
    id: string
    name: string
    client_name: string | null
    whatsapp_template: string | null
    sender_phone: string | null
    category: string | null
    location: string | null
    created_at: string
    updated_at: string
    lead_count?: number
}

// ... (ReportWithLeads interface remains same, usually extends Report)

// ...

// Get all reports
export async function getReports(): Promise<{ success: boolean; data?: Report[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error: any) {
        console.error('Error fetching reports:', error)
        return { success: false, error: error.message }
    }
}

// Get a single report by ID
export async function getReportById(id: string): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching report:', error)
        return { success: false, error: error.message }
    }
}

// Interface for Report with Leads
export interface ReportWithLeads extends Report {
    leads: BusinessLead[]
    lead_count: number
}

// Get a report with all its leads
export async function getReportWithLeads(reportId: string): Promise<{ success: boolean; data?: ReportWithLeads; error?: string }> {
    try {
        // 1. Get the report
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single()

        if (reportError) throw reportError

        // 2. Get the leads linked to this report
        const { data: leadsData, error: leadsError } = await supabase
            .from('report_leads')
            .select(`
                added_at,
                business_leads (*)
            `)
            .eq('report_id', reportId)
            .order('added_at', { ascending: false })

        if (leadsError) throw leadsError

        // 3. Map leads to clean structure
        const leads: BusinessLead[] = (leadsData || []).map((row: any) => {
            const lead = row.business_leads
            return {
                id: lead.id,
                source: 'google_maps' as const,
                placeId: lead.place_id,
                name: lead.name,
                category: lead.category,
                phone: lead.phone,
                email: lead.email,
                website: lead.website,
                address: lead.address,
                city: lead.city,
                rating: lead.rating,
                reviewCount: lead.review_count,
                priceLevel: lead.price_level,
                mapsUrl: lead.maps_url,
                scrapedAt: new Date(lead.scraped_at),
                contacted: lead.contacted,
                notes: lead.notes,
                hasWhatsapp: lead.has_whatsapp
            }
        })

        // 4. Return combined object
        const result: ReportWithLeads = {
            ...report,
            lead_count: leads.length,
            leads
        }

        return { success: true, data: result }
    } catch (error: any) {
        console.error('Error fetching report with leads:', error)
        return { success: false, error: error.message }
    }
}

// Get leads for a specific report
export async function getReportLeads(reportId: string): Promise<{ success: boolean; data?: BusinessLead[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('report_leads')
            .select(`
                lead_id,
                business_leads (*)
            `)
            .eq('report_id', reportId)

        if (error) throw error

        const leads: BusinessLead[] = (data || []).map((row: any) => {
            const lead = row.business_leads
            return {
                id: lead.id,
                source: 'google_maps' as const,
                placeId: lead.place_id,
                name: lead.name,
                category: lead.category,
                phone: lead.phone,
                email: lead.email,
                website: lead.website,
                address: lead.address,
                city: lead.city,
                rating: lead.rating,
                reviewCount: lead.review_count,
                priceLevel: lead.price_level,
                mapsUrl: lead.maps_url,
                scrapedAt: new Date(lead.scraped_at),
                contacted: lead.contacted,
                notes: lead.notes,
                hasWhatsapp: lead.has_whatsapp
            }
        })

        return { success: true, data: leads }
    } catch (error: any) {
        console.error('Error fetching report leads:', error)
        return { success: false, error: error.message }
    }
}

// Create a new report
export async function createReport(data: {
    name: string
    client_name?: string
    whatsapp_template?: string
    sender_phone?: string
    category?: string
    location?: string
}): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        // Construct payload dynamically to avoid inserting into non-existent columns (if migration wasn't run)
        const payload: any = {
            name: data.name,
            client_name: data.client_name || null,
            whatsapp_template: data.whatsapp_template || null,
            category: data.category || null,
            location: data.location || null
        }

        // Only include sender_phone if it's explicitly provided
        if (data.sender_phone) {
            payload.sender_phone = data.sender_phone
        }

        const { data: report, error } = await supabase
            .from('reports')
            .insert([payload])
            .select()
            .single()

        if (error) throw error

        return { success: true, data: report }
    } catch (error: any) {
        console.error('Error creating report:', error)
        return { success: false, error: error.message }
    }
}

// Update a report
export async function updateReport(reportId: string, data: Partial<{
    name: string
    client_name: string
    whatsapp_template: string
    sender_phone: string
}>): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('reports')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', reportId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error updating report:', error)
        return { success: false, error: error.message }
    }
}

// Delete a report
export async function deleteReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting report:', error)
        return { success: false, error: error.message }
    }
}

// ============ Lead Management ============

// Add leads to a report
export async function addLeadsToReport(reportId: string, leadIds: string[]): Promise<{ success: boolean; added: number; error?: string }> {
    try {
        const insertData = leadIds.map(leadId => ({
            report_id: reportId,
            lead_id: leadId
        }))

        const { error } = await supabase
            .from('report_leads')
            .upsert(insertData, { onConflict: 'report_id,lead_id' })

        if (error) throw error

        return { success: true, added: leadIds.length }
    } catch (error: any) {
        console.error('Error adding leads to report:', error)
        return { success: false, added: 0, error: error.message }
    }
}

// Remove a lead from a report
export async function removeLeadFromReport(reportId: string, leadId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('report_leads')
            .delete()
            .eq('report_id', reportId)
            .eq('lead_id', leadId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error removing lead from report:', error)
        return { success: false, error: error.message }
    }
}

// Toggle has_whatsapp for a lead
export async function toggleLeadWhatsapp(leadId: string, hasWhatsapp: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('business_leads')
            .update({ has_whatsapp: hasWhatsapp })
            .eq('id', leadId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error updating WhatsApp status:', error)
        return { success: false, error: error.message }
    }
}

// Get leads not in a specific report (for adding)
export async function getAvailableLeads(reportId: string): Promise<{ success: boolean; data?: BusinessLead[]; error?: string }> {
    try {
        // Get leads already in the report
        const { data: existingLeads } = await supabase
            .from('report_leads')
            .select('lead_id')
            .eq('report_id', reportId)

        const existingIds = existingLeads?.map(l => l.lead_id) || []

        // Get all leads not in the report
        let query = supabase
            .from('business_leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (existingIds.length > 0) {
            query = query.not('id', 'in', `(${existingIds.join(',')})`)
        }

        const { data, error } = await query

        if (error) throw error

        const leads: BusinessLead[] = (data || []).map(row => ({
            id: row.id,
            source: 'google_maps' as const,
            placeId: row.place_id,
            name: row.name,
            category: row.category,
            phone: row.phone,
            email: row.email,
            website: row.website,
            address: row.address,
            city: row.city,
            rating: row.rating,
            reviewCount: row.review_count,
            priceLevel: row.price_level,
            mapsUrl: row.maps_url,
            scrapedAt: new Date(row.scraped_at),
            contacted: row.contacted,
            notes: row.notes,
            hasWhatsapp: row.has_whatsapp
        }))

        return { success: true, data: leads }
    } catch (error: any) {
        console.error('Error fetching available leads:', error)
        return { success: false, error: error.message }
    }
}
