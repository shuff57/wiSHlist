const { Client, Databases } = require('appwrite');

const client = new Client()
  .setEndpoint('https://app.huffpalmer.fyi/v1')
  .setProject('686d7df60026eca1ebb0')
  .setKey('standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd');

const databases = new Databases(client);

const databaseId = '686d7df60026eca1ebb0';
const itemsCollectionId = '686d7e820024d7fd5b71';

async function getCollectionDetails() {
  try {
    console.log('Getting items collection details...\n');
    
    const collection = await databases.getCollection(databaseId, itemsCollectionId);
    
    console.log('Collection Name:', collection.name);
    console.log('Collection ID:', collection.$id);
    console.log('Database ID:', collection.databaseId);
    console.log('\nAttributes:');
    console.log('===========');
    
    collection.attributes.forEach(attr => {
      console.log(`\nAttribute: ${attr.key}`);
      console.log(`  Type: ${attr.type}`);
      console.log(`  Size: ${attr.size || 'N/A'}`);
      console.log(`  Required: ${attr.required}`);
      console.log(`  Array: ${attr.array}`);
      console.log(`  Default: ${attr.default || 'None'}`);
      if (attr.elements) {
        console.log(`  Elements: ${JSON.stringify(attr.elements)}`);
      }
    });
    
    console.log('\nIndexes:');
    console.log('========');
    collection.indexes.forEach(index => {
      console.log(`\nIndex: ${index.key}`);
      console.log(`  Type: ${index.type}`);
      console.log(`  Attributes: ${index.attributes.join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error getting collection details:', error.message);
  }
}

getCollectionDetails();
