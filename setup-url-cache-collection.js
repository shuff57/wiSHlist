// Setup script for URL Cache collection in Appwrite
// Run this script to create the URL cache collection in your Appwrite database

const { Client, Databases, Permission, Role } = require('appwrite');

// Configuration
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://app.huffpalmer.fyi/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '686d7df60026eca1ebb0';
const databaseId = '688189ad000ad6dd9410'; // Your existing database ID

// You'll need an API key with Database permissions from your Appwrite console
const apiKey = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE';

const client = new Client();
client
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey); // API key for admin operations

const databases = new Databases(client);

async function createUrlCacheCollection() {
  try {
    console.log('Creating URL Cache collection...');
    
    // Create the collection
    const collection = await databases.createCollection(
      databaseId,
      'url-cache', // Collection ID
      'URL Cache', // Collection Name
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    console.log('Collection created:', collection.$id);

    // Create attributes
    const attributes = [
      {
        name: 'url',
        type: 'string',
        size: 2048,
        required: true,
        array: false
      },
      {
        name: 'normalizedUrl',
        type: 'string', 
        size: 2048,
        required: true,
        array: false
      },
      {
        name: 'productId',
        type: 'string',
        size: 255,
        required: false,
        array: false
      },
      {
        name: 'metadata',
        type: 'string',
        size: 65535, // Large text field for JSON metadata
        required: true,
        array: false
      },
      {
        name: 'timestamp',
        type: 'integer',
        required: true,
        array: false
      },
      {
        name: 'hitCount',
        type: 'integer',
        required: true,
        array: false,
        default: 1
      }
    ];

    // Create each attribute
    for (const attr of attributes) {
      console.log(`Creating attribute: ${attr.name}`);
      
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          databaseId,
          collection.$id,
          attr.name,
          attr.size,
          attr.required,
          attr.default || null,
          attr.array || false
        );
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          databaseId,
          collection.$id,
          attr.name,
          attr.required,
          null, // min
          null, // max
          attr.default || null,
          attr.array || false
        );
      }
      
      // Wait a bit between attribute creation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Creating indexes for better performance...');
    
    // Create indexes for better query performance
    await databases.createIndex(
      databaseId,
      collection.$id,
      'normalizedUrl_index',
      'key',
      ['normalizedUrl']
    );

    await databases.createIndex(
      databaseId,
      collection.$id,
      'timestamp_index', 
      'key',
      ['timestamp']
    );

    await databases.createIndex(
      databaseId,
      collection.$id,
      'productId_index',
      'key', 
      ['productId']
    );

    console.log('✅ URL Cache collection created successfully!');
    console.log(`Collection ID: ${collection.$id}`);
    console.log('Update your route.ts file with this collection ID:');
    console.log(`const URL_CACHE_COLLECTION_ID = '${collection.$id}'`);

  } catch (error) {
    console.error('❌ Error creating collection:', error);
    console.log('\nInstructions to create manually:');
    console.log('1. Go to your Appwrite console');
    console.log('2. Navigate to Databases > Your Database');
    console.log('3. Create a new collection called "URL Cache"');
    console.log('4. Add the following attributes:');
    console.log('   - url (string, 2048, required)');
    console.log('   - normalizedUrl (string, 2048, required)');
    console.log('   - productId (string, 255, optional)');
    console.log('   - metadata (string, 65535, required)');
    console.log('   - timestamp (integer, required)');
    console.log('   - hitCount (integer, required, default: 1)');
    console.log('5. Create indexes on normalizedUrl, timestamp, and productId');
    console.log('6. Update the URL_CACHE_COLLECTION_ID in route.ts');
  }
}

// Run the setup
createUrlCacheCollection();
