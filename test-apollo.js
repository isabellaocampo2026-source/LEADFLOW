
const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/APOLLO_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("❌ Could not read .env.local");
}

if (!apiKey) {
    console.error("❌ Validated: Missing APOLLO_API_KEY in .env.local");
    process.exit(1);
}

const domain = "stripe.com";

const data = JSON.stringify({
    q_organization_domains: domain,
    person_titles: ["CEO", "Founder", "Owner"],
    page: 1,
    per_page: 1
});

const options = {
    hostname: 'api.apollo.io',
    path: '/v1/mixed_people/search', // Trying mixed_people/search endpoint
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
        'User-Agent': 'LeadScraper/1.0'
    }
};

console.log(`🚀 Testing Apollo API Key: ${apiKey.substring(0, 5)}...`);

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log(`\n📡 Status: ${res.statusCode} ${res.statusMessage}`);
        // console.log("Headers:", JSON.stringify(res.headers, null, 2));

        try {
            const json = JSON.parse(responseBody);
            if (res.statusCode !== 200) {
                console.log("\n❌ API ERROR RESPONSE:");
                console.log(JSON.stringify(json, null, 2));

                if (res.statusCode === 403) {
                    console.log("\n⚠️ CHECK: Allowed Scopes? API enabled in Settings? Trial limitations?");
                }
            } else {
                console.log("\n✅ SUCCESS!");
                console.log(`Found: ${json.people?.length || 0} results.`);
                if (json.people && json.people.length > 0) {
                    const p = json.people[0];
                    console.log(`Sample: ${p.first_name} ${p.last_name} - ${p.email || 'No Email'}`);
                }
            }
        } catch (e) {
            console.error("❌ Parse Error. Raw Body:", responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Network Error:", error);
});

req.write(data);
req.end();
