// Migration script to add images to existing URL cache entries
const { Client, Databases, Query } = require('appwrite');

const client = new Client()
  .setEndpoint('https://app.huffpalmer.fyi/v1')
  .setProject('686d7df60026eca1ebb0');

// Set API key for server operations
client.headers['X-Appwrite-Key'] = 'standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd';

const databases = new Databases(client);

const DATABASE_ID = '688189ad000ad6dd9410';
const URL_CACHE_COLLECTION_ID = '68915fa8003d3174638e';

async function updateCacheEntriesWithImages() {
  try {
    console.log('Fetching cache entries without images...');
    
    // Get all cache entries
    const response = await databases.listDocuments(DATABASE_ID, URL_CACHE_COLLECTION_ID, [
      Query.limit(100)
    ]);
    
    let updatedCount = 0;
    
    for (const doc of response.documents) {
      try {
        const metadata = JSON.parse(doc.metadata);
        
        // Check if this entry already has an image or if image_url field is missing
        if (!doc.image_url && metadata.image) {
          console.log(`Updating ${doc.url} with image...`);
          
          // Update the document with the image_url from metadata
          await databases.updateDocument(
            DATABASE_ID,
            URL_CACHE_COLLECTION_ID,
            doc.$id,
            {
              image_url: metadata.image
            }
          );
          
          updatedCount++;
        }
      } catch (error) {
        console.log(`Skipping ${doc.url}: ${error.message}`);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} cache entries with images`);
    
  } catch (error) {
    console.error('Error updating cache entries:', error.message);
  }
}

updateCacheEntriesWithImages();
