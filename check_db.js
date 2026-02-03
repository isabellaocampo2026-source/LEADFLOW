
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const matchUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const matchKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

    if (matchUrl) supabaseUrl = matchUrl[1].trim();
    if (matchKey) supabaseKey = matchKey[1].trim();
} catch (e) {
    console.error("❌ Could not read .env.local");
}

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing env vars in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("🔍 Checking 'contacts' table...");
    try {
        const { data, error } = await supabase.from('contacts').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Error accessing table:", JSON.stringify(error, null, 2));
            if (error.code === '42P01') {
                console.log("\n🚨 DIAGNOSIS: The 'contacts' table does not exist!");
            }
        } else {
            console.log("✅ Table 'contacts' exists & is accessible.");
        }
    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

check();
