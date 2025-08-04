// Simple test script to verify Google Places API key
const apiKey = 'AIzaSyDQkMjB7Q0puTOnkQc_iiKQTtzaRa5yKV4';

async function testGooglePlacesAPI() {
    try {
        console.log('Testing Google Places API...');
        
        // Test autocomplete API
        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=high%20school&key=${apiKey}&types=establishment&components=country:us`;
        
        console.log('Testing autocomplete endpoint...');
        const autocompleteResponse = await fetch(autocompleteUrl);
        const autocompleteData = await autocompleteResponse.json();
        
        console.log('Autocomplete Status:', autocompleteData.status);
        console.log('Autocomplete Response:', JSON.stringify(autocompleteData, null, 2));
        
        if (autocompleteData.status === 'OK' && autocompleteData.predictions?.length > 0) {
            // Test place details API with first result
            const placeId = autocompleteData.predictions[0].place_id;
            console.log('\nTesting place details endpoint...');
            
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address,address_components,geometry,place_id,types`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            console.log('Details Status:', detailsData.status);
            console.log('Details Response:', JSON.stringify(detailsData, null, 2));
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testGooglePlacesAPI();
