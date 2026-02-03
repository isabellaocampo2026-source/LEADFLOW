
export interface HunterResult {
    success: boolean;
    emails: HunterEmail[];
    error?: string;
}

export interface HunterEmail {
    value: string;
    type: 'personal' | 'generic';
    confidence: number;
    first_name?: string;
    last_name?: string;
    position?: string;
    linkedin?: string;
    twitter?: string;
    seniority?: string;
    department?: string;
}

export class HunterService {
    private apiKey: string;
    private baseUrl = "https://api.hunter.io/v2";

    constructor() {
        this.apiKey = process.env.HUNTER_API_KEY || "";
    }

    async findEmailsForDomain(domain: string): Promise<HunterResult> {
        if (!this.apiKey) {
            return { success: false, emails: [], error: "Missing HUNTER_API_KEY" };
        }

        try {
            // We specifically ask for personal emails to find decision makers
            const params = new URLSearchParams({
                domain: domain,
                api_key: this.apiKey,
                type: 'personal', // Focus on humans, not generic
                limit: '10'       // Get enough partial keys to find a boss
            });

            const response = await fetch(`${this.baseUrl}/domain-search?${params.toString()}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                // Handle 401, 429, etc
                const errJson = await response.json().catch(() => ({}));
                const errMsg = errJson?.errors?.[0]?.details || response.statusText;
                return { success: false, emails: [], error: `Hunter API Error: ${response.status} - ${errMsg}` };
            }

            const data = await response.json();

            // Map to our structure
            const emails: HunterEmail[] = (data.data?.emails || []).map((e: any) => ({
                value: e.value,
                type: e.type,
                confidence: e.confidence,
                first_name: e.first_name,
                last_name: e.last_name,
                position: e.position,
                linkedin: e.linkedin,
                seniority: e.seniority,
                department: e.department
            }));

            return {
                success: true,
                emails: emails
            };

        } catch (error: any) {
            console.error("Hunter API failed:", error);
            return { success: false, emails: [], error: error.message };
        }
    }
}
