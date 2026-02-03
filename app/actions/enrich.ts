'use server'

import { AnyMailFinderService } from "@/lib/services/anymailfinder"
import { EmailScraperService } from "@/lib/services/email-scraper"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const enricher = new AnyMailFinderService()
const scraper = new EmailScraperService()

export interface EnrichResult {
    success: boolean
    emails?: string[]
    savedCount?: number
    error?: string
    debugInfo?: string // For UI debugging
    source?: 'scraper' | 'api'
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

        // 2. Strategy: Try Scraper First
        let foundEmails: string[] = []
        let source: 'scraper' | 'api' = 'scraper'
        let scraperError = ""

        // A. Run Scraper
        const scrapeResult = await scraper.scrapeEmailsForDomain(domain)
        if (scrapeResult.success && scrapeResult.emails.length > 0) {
            foundEmails = scrapeResult.emails
            console.log(`✅ Scraper found ${foundEmails.length} emails for ${domain}`)
        } else {
            console.log(`⚠️ Scraper empty for ${domain}. Error: ${scrapeResult.error || 'None'}`)
            scraperError = scrapeResult.error || "No emails on web"

            // B. Fallback to API (optional, keeping it as backup if user wants)
            /*
            const result = await enricher.findEmailsForDomain(domain)
            if (result.success && result.emails.length > 0) {
                foundEmails = result.emails
                source = 'api'
            }
            */
        }

        if (foundEmails.length === 0) {
            return {
                success: true,
                emails: [],
                savedCount: 0,
                debugInfo: `Scraper: ${scraperError}`
            }
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
            savedCount: foundEmails.length,
            source,
            debugInfo: `Source: ${source}`
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
