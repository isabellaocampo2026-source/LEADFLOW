const https = require('https');
const fs = require('fs');
const path = require('path');

// Load API Key
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/OUTSCRAPER_API_KEY=(.+)/);
    if (match) process.env.OUTSCRAPER_API_KEY = match[1].trim();
} catch (e) { }

const key = process.env.OUTSCRAPER_API_KEY;
if (!key) { console.error("No API Key"); process.exit(1); }

const variations = [
    '/instagram/search-v1',
    '/instagram/search',
    '/instagrams/search',
    '/social/instagram/search',
    '/v1/instagram/search',
    '/instagram-search',
    '/instagram_search',
    '/instagram/search/v1',
    '/instagram-scraper/search',
];

function runTest(index) {
    if (index >= variations.length) return;
    const v = variations[index];
    const url = `https://api.app.outscraper.com${v}?query=test&limit=1&async=false`;

    const req = https.get(url, { headers: { 'X-API-KEY': key } }, (res) => {
        console.log(`[${v}] Status: ${res.statusCode}`);
        if (res.statusCode !== 404) {
            console.log(`!!! FOUND !!! [${v}] Status: ${res.statusCode}`);
        }
        runTest(index + 1);
    });

    req.on('error', e => {
        runTest(index + 1);
    });
}

console.log("Brute-forcing endpoints...");
runTest(0);
