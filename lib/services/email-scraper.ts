import * as cheerio from 'cheerio';

export interface ScrapedResult {
    success: boolean;
    emails: string[];
    source?: string;
    error?: string;
}

export class EmailScraperService {
    // Common useless emails to ignore
    private ignoredPatterns = [
        /\.png$/, /\.jpg$/, /\.jpeg$/, /\.gif$/, /\.webp$/, // Image files mistook as emails
        /^noreply@/, /^no-reply@/, /^donotreply@/,
        /^wix@/, /^wordpress@/, /^sentry@/, /^axios@/,
        /^example@/, /^domain@/, /^email@/, /^contact@yoursite/,
        /\.wixpress\.com$/, /\.squarespace\.com$/, /\.sentry\.io$/,
        /@(sentry|intercom|google|facebook|wix|cloudflare|wixpress)\./,
        /[0-9a-f]{32}@/ // UUID style emails (often sentry/analytics keys)
    ];

    async scrapeEmailsForDomain(domain: string): Promise<ScrapedResult> {
        let allEmails: Set<string> = new Set();
        const urlsToTry = [
            `https://${domain}`,
            `https://${domain}/contact`,
            `https://${domain}/contacto`,
            `https://${domain}/about`,
            `https://${domain}/nosotros`
        ];

        // We'll just try the home page first, and if nothing, try contact/about
        // To be faster, we can try Home + Contact in parallel or waterfall.
        // Let's do waterfall for politeness and speed (if found on home).

        try {
            // 1. Try Home
            const homeEmails = await this.scrapeUrl(`https://${domain}`);
            homeEmails.forEach(e => allEmails.add(e));

            // If we found some, great. If not, try /contact
            if (allEmails.size === 0) {
                const contactEmails = await this.scrapeUrl(`https://${domain}/contacto`);
                contactEmails.forEach(e => allEmails.add(e));

                // If still nothing, try /contact (english)
                if (allEmails.size === 0) {
                    const contactEnEmails = await this.scrapeUrl(`https://${domain}/contact`);
                    contactEnEmails.forEach(e => allEmails.add(e));
                }
            }

            return {
                success: true,
                emails: Array.from(allEmails)
            };

        } catch (error: any) {
            console.error(`Scraping failed for ${domain}:`, error);
            // Even if it failed, maybe we found partial data?
            return {
                success: false,
                emails: Array.from(allEmails),
                error: error.message
            };
        }
    }

    private async scrapeUrl(url: string): Promise<Set<string>> {
        const found = new Set<string>();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) return found;

            const html = await response.text();
            const $ = cheerio.load(html);

            // 1. Look for mailto links
            $('a[href^="mailto:"]').each((_, elem) => {
                const href = $(elem).attr('href');
                if (href) {
                    const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
                    if (this.isValidEmail(email)) found.add(email.toLowerCase());
                }
            });

            // 2. Look for text patterns in body
            const bodyText = $('body').text();
            const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g;
            const matches = bodyText.match(emailRegex) || [];

            matches.forEach(email => {
                const clean = email.trim().toLowerCase();
                if (this.isValidEmail(clean)) found.add(clean);
            });

            return found;
        } catch (e) {
            // Ignore errors for specific pages (404, etc)
            return found;
        }
    }

    private isValidEmail(email: string): boolean {
        // Basic syntax check
        if (!email.includes('@') || !email.includes('.')) return false;
        if (email.length > 100 || email.length < 5) return false;

        // Check against ignored patterns
        for (const pattern of this.ignoredPatterns) {
            if (pattern.test(email)) return false;
        }

        return true;
    }
}
