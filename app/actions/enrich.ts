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
        console.log("Checking Hunter.io (Sniper Mode: Personal Only)...")
        const hunterResponse = await hunter.findEmailsForDomain(domain)

        if (hunterResponse.success) {
            // STRICT FILTER: Only 'personal' emails
            // We ignore 'generic' (info@, sales@) as requested by user
            const personalEmails = hunterResponse.emails.filter(e => e.type === 'personal')

            if (personalEmails.length > 0) {
                console.log(`✅ Hunter found ${personalEmails.length} PERSONAL emails for ${domain}`)
                foundEmails = personalEmails.map(e => e.value)
                source = 'hunter'
                richData = personalEmails
            } else {
                // If we found emails but none were personal
                if (hunterResponse.emails.length > 0) {
                    console.log(`⚠️ Hunter found ${hunterResponse.emails.length} emails, but ALL were generic. Ignoring.`)
                    errors.push("Solo se encontraron emails genéricos (Ignorados por política de calidad)")
                } else {
                    console.log(`⚠️ Hunter found 0 emails.`)
                    errors.push(hunterResponse.error || "No data in Hunter")
                }
            }
        } else {
            if (hunterResponse.error) errors.push(`Hunter: ${hunterResponse.error}`)
            console.log(`⚠️ Hunter API failed for ${domain}.`)
        }

        // B. SCRAER FALLBACK REMOVED
        // User requested high quality only. If Hunter fails, we return empty.
        // const scrapeResult = await scraper.scrapeEmailsForDomain(domain) ... (REMOVED)

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
