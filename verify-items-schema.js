const { Client, Databases } = require('appwrite');

const client = new Client()
  .setEndpoint('https://app.huffpalmer.fyi/v1')
  .setProject('686d7df60026eca1ebb0');

const databases = new Databases(client);

const databaseId = '686d7df60026eca1ebb0';
const itemsCollectionId = '6882b8790034f4058a94';

async function checkItemsCollectionSchema() {
  try {
    console.log('Checking items collection schema...\n');
    
    // Try to get collection info using client-side access
    const response = await fetch('https://app.huffpalmer.fyi/v1/databases/686d7df60026eca1ebb0/collections/6882b8790034f4058a94', {
      headers: {
        'X-Appwrite-Project': '686d7df60026eca1ebb0',
        'X-Appwrite-Key': 'standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd'
      }
    });
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return;
    }
    
    const collection = await response.json();
    
    console.log('Collection Name:', collection.name);
    console.log('Collection ID:', collection.$id);
    console.log('\nAttributes:');
    console.log('===========');
    
    const hasImageUrl = collection.attributes.find(attr => attr.key === 'image_url');
    
    collection.attributes.forEach(attr => {
      console.log(`- ${attr.key} (${attr.type}, required: ${attr.required}, size: ${attr.size || 'N/A'})`);
    });
    
    if (hasImageUrl) {
      console.log('\n✅ image_url attribute found!');
      console.log('Details:', JSON.stringify(hasImageUrl, null, 2));
    } else {
      console.log('\n❌ image_url attribute NOT found!');
      console.log('You need to add the image_url attribute to the items collection.');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  }
}

checkItemsCollectionSchema();
