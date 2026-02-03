
// scripts/simulate_enrich.js
// Simulates exactly what app/actions/enrich.ts does, but locally.

// Mock environment for Hunter Service
process.env.HUNTER_API_KEY = "df86375e5cb407215038dd25dfe5f3b7a7615275"; // User's key

// We cannot import TS files directly in node without compiling.
// So we will copy-paste the logic of the services lightly or rely on the previous JS verify scripts?
// Better: use the verify scripts I already made and chain them here to see logic flow.

// Actually, let's just make a single JS script that does both fetch calls manually to test the CASCADE logic.

const hunterKey = process.env.HUNTER_API_KEY;
const domain = process.argv[2] || 'aliar.mx';

async function runSimulation() {
    console.log(`🤖 Simulating Enrichment for: ${domain}`);
    console.log("------------------------------------------------");

    // 1. Hunter Step
    console.log(`[1] Checks Hunter.io (Key: ${hunterKey.substring(0, 5)}...)`);
    try {
        const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}&type=personal&limit=5`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.data && data.data.emails && data.data.emails.length > 0) {
            console.log(`✅ Hunter SUCCESS! Found ${data.data.emails.length} emails.`);
            data.data.emails.forEach(e => console.log(`   - ${e.value} (${e.type})`));
            return; // Stop here like the real code
        } else {
            console.log(`⚠️ Hunter returned 0 personal emails.`);
            if (data.errors) console.log(`   Error: ${JSON.stringify(data.errors)}`);
        }
    } catch (e) {
        console.log(`❌ Hunter Exception: ${e.message}`);
    }

    // 2. Scraper Step
    console.log(`\n[2] Falling back to Web Scraper...`);
    // We'll call the local test_scraper.js logic here if possible, or just spawn it.
    const { execSync } = require('child_process');
    try {
        const output = execSync(`node scripts/test_scraper.js ${domain}`, { encoding: 'utf-8' });
        console.log(output);
    } catch (e) {
        console.log(`❌ Scraper Exception: ${e.message}`);
    }
}

runSimulation();
