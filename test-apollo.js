
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

const domain = "stripe.com"; // Test with a known tech company

const data = JSON.stringify({
    q_organization_domains: domain,
    person_titles: ["CEO", "Founder", "Owner"],
    page: 1,
    per_page: 3
});

const options = {
    hostname: 'api.apollo.io',
    path: '/v1/mixed_people/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
    }
};

console.log(`🚀 Testing Apollo API for domain: ${domain}`);
console.log(`🔑 Key length: ${apiKey.length}`);

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log(`\n📡 Status Code: ${res.statusCode}`);
        try {
            const json = JSON.parse(responseBody);
            // console.log("Full Response:", JSON.stringify(json, null, 2)); 

            if (json.people && json.people.length > 0) {
                console.log(`✅ Found ${json.people.length} people.`);
                json.people.forEach(p => {
                    console.log(`   - ${p.first_name} ${p.last_name} (${p.title}): ${p.email}`);
                });
            } else {
                console.log("⚠️ No people found via API.");
                if (json.error_message) console.log("Error:", json.error_message);
            }
        } catch (e) {
            console.error("❌ Parse Error:", e);
            console.log("Raw Body:", responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Network Error:", error);
});

req.write(data);
req.end();
