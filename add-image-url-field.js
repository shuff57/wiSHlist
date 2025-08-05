const { Client, Databases } = require('appwrite');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY_CACHE);

const databases = new Databases(client);

const databaseId = '686d7df60026eca1ebb0';
const itemsCollectionId = '686d7e820024d7fd5b71';

async function addImageUrlField() {
  try {
    console.log('Adding image_url field to items collection...');
    
    // Add the image_url attribute as a URL field
    await databases.createStringAttribute(
      databaseId,
      itemsCollectionId,
      'image_url',
      2048, // Max length for URL
      false, // Not required
      null, // No default value
      false // Not an array
    );
    
    console.log('✅ Successfully added image_url field to items collection!');
    console.log('The field will be available shortly after Appwrite processes the schema change.');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  image_url field already exists in the collection.');
    } else {
      console.error('❌ Error adding image_url field:', error.message);
    }
  }
}

// Check current schema first
async function checkCurrentSchema() {
  try {
    console.log('Current items collection schema:');
    const collection = await databases.getCollection(databaseId, itemsCollectionId);
    console.log('Attributes:');
    collection.attributes.forEach(attr => {
      console.log(`- ${attr.key} (${attr.type})`);
    });
    console.log('');
  } catch (error) {
    console.error('Error checking schema:', error.message);
  }
}

async function main() {
  await checkCurrentSchema();
  await addImageUrlField();
}

main();
