
// Standalone script to verify Hunter.io API Key
// Usage: node scripts/verify_hunter.js <DOMAIN> <API_KEY>

(async () => {
    const domain = process.argv[2];
    const apiKey = process.argv[3];

    if (!domain || !apiKey) {
        console.error("❌ Usage: node scripts/verify_hunter.js <DOMAIN> <API_KEY>");
        process.exit(1);
    }

    console.log(`🔍 Testing Hunter.io for domain: ${domain}`);

    // Using the Domain Search endpoint which is what we use in the app
    // We specifically ask for type=personal to find decision makers
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&type=personal&limit=5`;

    try {
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`❌ API Error: ${res.status} ${res.statusText}`);
            const err = await res.text();
            console.error(err);
            process.exit(1);
        }

        const data = await res.json();

        console.log(`✅ Success! Found ${data.data.emails.length} emails.`);

        if (data.data.emails.length > 0) {
            console.log("\n--- Top Results ---");
            data.data.emails.forEach(e => {
                console.log(`📧 ${e.value}`);
                console.log(`   👤 ${e.first_name || ''} ${e.last_name || ''}`);
                console.log(`   👔 ${e.position || 'No position'}`);
                console.log(`   🔒 Confidence: ${e.confidence}%`);
                console.log(`   🏷️ Type: ${e.type}`);
                console.log("-------------------");
            });
        } else {
            console.log("⚠️ No emails found regarding criteria (personal).");
        }

    } catch (error) {
        console.error("❌ Script Error:", error.message);
    }
})();
