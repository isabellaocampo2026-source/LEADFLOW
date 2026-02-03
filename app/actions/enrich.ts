'use server'

import { AnyMailFinderService } from "@/lib/services/anymailfinder"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const enricher = new AnyMailFinderService()

export interface EnrichResult {
    success: boolean
    emails?: string[]
    savedCount?: number
    error?: string
    debugInfo?: string // For UI debugging
}

/**
 * Server action to enrich a lead with emails from AnyMailFinder
 * @param leadId - UUID of the lead in business_leads table
 * @param website - The website domain to search for
 */
export async function enrichLead(leadId: string, website: string): Promise<EnrichResult> {
    try {
        if (!website) {
            return { success: false, error: "Website required for enrichment" }
        }

        // 1. Clean domain
        let domain = "";
        try {
            // Ensure protocol exists for URL parsing
            const urlStr = website.startsWith('http') ? website : `https://${website}`;
            const url = new URL(urlStr);
            domain = url.hostname;
        } catch (e) {
            // Fallback for weird strings
            domain = website.toLowerCase().split('/')[0];
        }

        // Remove www. reference
        domain = domain.replace(/^www\./i, "");

        // Basic domain validation
        if (!domain.includes('.') || domain.length < 4) {
            return { success: false, error: "Invalid domain format", debugInfo: `Input: ${website}, Parsed: ${domain}` }
        }

        console.log(`🔍 Enriching lead ${leadId} for domain: ${domain}`)

        // 2. Call AnyMailFinder Service
        const result = await enricher.findEmailsForDomain(domain)

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to find emails",
                debugInfo: `Domain parsed: ${domain}. API Error: ${result.error}`
            }
        }

        const foundEmails = result.emails || []

        if (foundEmails.length === 0) {
            return { success: true, emails: [], savedCount: 0 }
        }

        // 3. Save to Database
        // We use a raw SQL query or JSONB update to append or replace the array
        // Here we'll just replace/set the array for simplicity and consistency
        const { error } = await supabase
            .from('business_leads')
            .update({
                additional_emails: foundEmails
            })
            .eq('id', leadId)

        if (error) {
            console.error("DB update failed:", error)
            throw error
        }

        revalidatePath('/leads')
        revalidatePath(`/reports`) // Revalidate reports too just in case

        return {
            success: true,
            emails: foundEmails,
            savedCount: foundEmails.length
        }

    } catch (error: any) {
        console.error("Enrichment action failed:", error)
        return {
            success: false,
            error: error.message || "Unknown error",
            debugInfo: `Domain tried: ${website}`
        }
    }
}
