
const https = require('https');

const data = JSON.stringify({
    domain: 'airbnb.com'
});

const options = {
    hostname: 'api.anymailfinder.com',
    path: '/v5.1/find-email/company',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'mzG76zwt8sc8j1BOvwSn79P8',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let chunks = [];
    res.on('data', (d) => {
        chunks.push(d);
    });

    res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        console.log('BODY:', body);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
