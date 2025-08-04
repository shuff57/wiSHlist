// Test different Google Maps APIs to see which ones work
const apiKey = 'AIzaSyDQkMjB7Q0puTOnkQc_iiKQTtzaRa5yKV4';

async function testAllAPIs() {
    const tests = [
        {
            name: 'Geocoding API',
            url: `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
        },
        {
            name: 'Places API (New) - Autocomplete',
            url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=high%20school&key=${apiKey}`
        },
        {
            name: 'Places API (Legacy) - Text Search',
            url: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=high%20school&key=${apiKey}`
        },
        {
            name: 'Maps Static API',
            url: `https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap&key=${apiKey}`
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n--- Testing ${test.name} ---`);
            const response = await fetch(test.url);
            const data = await response.json();
            
            if (data.status) {
                console.log(`Status: ${data.status}`);
                if (data.error_message) {
                    console.log(`Error: ${data.error_message}`);
                }
            } else {
                console.log('Response received (likely success)');
            }
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

testAllAPIs();
