'use server'

import { AnyMailFinderService } from "@/lib/services/anymailfinder"
import { EmailScraperService } from "@/lib/services/email-scraper"
import { HunterService } from "@/lib/services/hunter"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const enricher = new AnyMailFinderService()
const scraper = new EmailScraperService()
const hunter = new HunterService()

export interface EnrichResult {
    success: boolean
    emails?: string[]
    savedCount?: number
    error?: string
    debugInfo?: string // For UI debugging
    source?: 'hunter' | 'scraper' | 'api'
    richData?: any[] // Store full profiles if available
}

/**
 * Server action to enrich a lead with emails via Cascade Strategy
 * Priority: Hunter.io -> Web Scraper
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

        // 2. Cascade Strategy: High Quality API (Hunter) -> Free Scraper -> Backup API

        let foundEmails: string[] = []
        let richData: any[] = []
        let source: 'hunter' | 'scraper' | 'api' = 'scraper' // default fallback
        let errors: string[] = []

        // A. Priority 1: Hunter.io (Best for Decision Makers)
        console.log("Checking Hunter.io...")
        const hunterResponse = await hunter.findEmailsForDomain(domain)
        if (hunterResponse.success && hunterResponse.emails.length > 0) {
            console.log(`✅ Hunter found ${hunterResponse.emails.length} emails for ${domain}`)
            foundEmails = hunterResponse.emails.map(e => e.value)
            source = 'hunter'
            richData = hunterResponse.emails
        } else {
            if (hunterResponse.error) errors.push(`Hunter: ${hunterResponse.error}`)
            console.log(`⚠️ Hunter empty/failed for ${domain}. Falling back to Scraper...`)

            // B. Priority 2: Web Scraper (Free, broad coverage)
            const scrapeResult = await scraper.scrapeEmailsForDomain(domain)
            if (scrapeResult.success && scrapeResult.emails.length > 0) {
                foundEmails = scrapeResult.emails
                source = 'scraper'
                console.log(`✅ Scraper found ${foundEmails.length} emails for ${domain}`)
            } else {
                errors.push(`Scraper: ${scrapeResult.error || 'Empty'}`)
                console.log(`⚠️ Scraper empty for ${domain}.`)
            }
        }

        if (foundEmails.length === 0) {
            return {
                success: true,
                emails: [],
                savedCount: 0,
                debugInfo: errors.join(' | ')
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
            richData,
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
