// Test API key validity and get detailed error info
const apiKey = 'AIzaSyDQkMjB7Q0puTOnkQc_iiKQTtzaRa5yKV4';

async function detailedAPITest() {
    console.log('API Key format check:');
    console.log('Length:', apiKey.length);
    console.log('Starts with AIza:', apiKey.startsWith('AIza'));
    console.log('Contains only valid chars:', /^[A-Za-z0-9_-]+$/.test(apiKey));
    
    console.log('\nTesting with minimal request...');
    
    try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=school&key=${apiKey}`;
        console.log('Request URL (key hidden):', url.replace(apiKey, '[KEY]'));
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        try {
            const data = JSON.parse(text);
            console.log('Parsed response:', data);
        } catch (e) {
            console.log('Could not parse as JSON');
        }
        
    } catch (error) {
        console.error('Request failed:', error);
    }
}

detailedAPITest();
