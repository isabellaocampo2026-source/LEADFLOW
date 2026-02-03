import { BusinessLead } from "@/lib/scraper/types"

const ANYMAILFINDER_API_KEY = process.env.ANYMAILFINDER_API_KEY || "mzG76zwt8sc8j1BOvwSn79P8" // Fallback to provided key for now
const BASE_URL = "https://api.anymailfinder.com/v5.1"

export interface EnrichmentResult {
    success: boolean
    emails: string[]
    error?: string
}

export class AnyMailFinderService {
    private apiKey: string

    constructor(apiKey?: string) {
        this.apiKey = apiKey || ANYMAILFINDER_API_KEY
    }

    /**
     * Find emails for a company domain
     */
    async findEmailsForDomain(domain: string): Promise<EnrichmentResult> {
        if (!domain) return { success: false, emails: [], error: "No domain provided" }

        console.log(`📡 AnyMailFinder Call. Domain: ${domain}, Key Present: ${!!this.apiKey}, Key Prefix: ${this.apiKey?.substring(0, 4)}...`)

        try {
            const response = await fetch(`${BASE_URL}/find-email/company`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": this.apiKey
                },
                body: JSON.stringify({ domain })
            })

            if (!response.ok) {
                if (response.status === 404) {
                    return { success: true, emails: [] } // Valid request, just no emails found
                }
                const errorText = await response.text()
                throw new Error(`API Error ${response.status}: ${errorText}`)
            }

            const data = await response.json()

            // Extract emails from response
            // The API returns { emails: [...], ... }
            const emails = data.emails || []

            return {
                success: true,
                emails: emails
            }

        } catch (error: any) {
            console.error("AnyMailFinder enrichment failed:", error)
            return {
                success: false,
                emails: [],
                error: error.message || "Unknown error"
            }
        }
    }
}
