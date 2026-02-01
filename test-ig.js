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

// Test Cases
const tests = [
    { name: 'Control (Maps)', url: 'https://api.app.outscraper.com/maps/search-v3?query=test&limit=1&async=false' },
    { name: 'IG Search (App)', url: 'https://api.app.outscraper.com/instagram/search?query=test&limit=1&async=false' },
    { name: 'IG Search (No-App)', url: 'https://api.outscraper.com/instagram/search?query=test&limit=1&async=false' },
];

function runTest(index) {
    if (index >= tests.length) return;
    const t = tests[index];
    console.log(`Testing [${t.name}]: ${t.url}`);

    const req = https.get(t.url, { headers: { 'X-API-KEY': key } }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log(`[${t.name}] Status: ${res.statusCode}`);
            if (res.statusCode !== 200) console.log(`[${t.name}] Body: ${body.substring(0, 200)}`);
            runTest(index + 1); // Serial execution
        });
    });

    req.on('error', e => {
        console.error(`[${t.name}] Error: ${e.message}`);
        runTest(index + 1);
    });
}

runTest(0);
