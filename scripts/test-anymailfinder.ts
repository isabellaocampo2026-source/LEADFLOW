import https from 'https';

const API_KEY = "mzG76zwt8sc8j1BOvwSn79P8";
const DOMAIN = "airbnb.com";

function testCompanySearch() {
    console.log(`Testing AnyMailFinder for domain: ${DOMAIN}...`);

    const data = JSON.stringify({
        domain: DOMAIN
    });

    const options = {
        hostname: 'api.anymailfinder.com',
        port: 443,
        path: '/v5.1/find-email/company', // Trying v5.1 based on search result
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_KEY, // Standard header
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);

        let body = '';
        res.on('data', (d) => {
            body += d;
        });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                console.log("Response Data:", JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.error("Could not parse JSON:", body);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.write(data);
    req.end();
}

testCompanySearch();
