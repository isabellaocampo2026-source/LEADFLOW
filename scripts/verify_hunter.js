
const { HunterService } = require('../lib/services/hunter');

// Mock env var manually if needed or load from .env.local usually
// but here we just need to see if code compiles/runs. 
// We can't really test without a key, so this is just a structural test.

(async () => {
    // Mock the class if running in plain node (since it uses TS exports)
    // Actually, running TS files in node is tricky without ts-node.
    // simpler to just make a JS file that fetches manually like verified_api.js

    console.log("To verify Hunter, we need an API Key.");
    console.log("Usage: node scripts/verify_hunter.js <DOMAIN> <API_KEY>");

    const domain = process.argv[2];
    const apiKey = process.argv[3];

    if (!domain || !apiKey) {
        console.log("Skipping test, no args provided.");
        return;
    }

    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=5`;
    console.log(`Fetching ${url}...`);

    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
})();
