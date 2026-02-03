
const cheerio = require('cheerio');

async function scrape(url) {
    console.log(`Visiting ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            redirect: 'follow'
        });

        if (!res.ok) {
            console.log(`Failed with status ${res.status}`);
            return [];
        }

        const html = await res.text();
        const $ = cheerio.load(html);
        const found = new Set();

        // Mailto
        $('a[href^="mailto:"]').each((_, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
                console.log(`Found mailto: ${email}`);
                found.add(email.toLowerCase());
            }
        });

        // Regex
        const text = $('body').text();
        const regex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g;
        const matches = text.match(regex) || [];
        matches.forEach(m => {
            const clean = m.trim().toLowerCase();
            // Basic filter
            if (!clean.endsWith('.png') && !clean.endsWith('.jpg') && !clean.startsWith('wix@')) {
                console.log(`Found regex: ${clean}`);
                found.add(clean);
            }
        });

        return Array.from(found);

    } catch (e) {
        console.error(`Error visiting ${url}:`, e.message);
        return [];
    }
}

const domain = process.argv[2] || 'airbnb.com';
(async () => {
    console.log(`Testing scraping (fetch) for: ${domain}`);

    // Try Home
    const home = await scrape(`https://${domain}`);

    // Try Contact
    const contact = await scrape(`https://${domain}/contacto`);

    console.log('--- FINAL UNIQUE EMAILS ---');
    const all = new Set([...home, ...contact]);
    console.log(Array.from(all));
})();
