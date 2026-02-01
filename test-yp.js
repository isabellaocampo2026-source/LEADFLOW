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

const url = `https://api.app.outscraper.com/yellowpages/search-v2?query=dentist+new+york&limit=1&async=false`;
console.log(`Testing Yellow Pages: ${url}`);

https.get(url, { headers: { 'X-API-KEY': key } }, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(`Body prefix:`, data.substring(0, 200)));
}).on('error', e => console.error(e));
