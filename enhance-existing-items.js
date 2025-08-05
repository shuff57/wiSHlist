const { Client, Databases, Query } = require('appwrite');

const client = new Client()
  .setEndpoint('https://app.huffpalmer.fyi/v1')
  .setProject('686d7df60026eca1ebb0');

client.setKey('standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd');

const databases = new Databases(client);

const databaseId = '686d7df60026eca1ebb0';
const cacheCollectionId = '686e1a2e0013c72c7a75';

// Helper function to call our enhance-item API
async function enhanceWithGemini(data) {
  try {
    const response = await fetch('http://localhost:3000/api/enhance-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'enhance-scraped',
        data: {
          url: data.url,
          title: data.title,
          description: data.description,
          price: data.price,
          image: data.image
        }
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        enhancedName: result.data.name,
        enhancedDescription: result.data.description
      };
    } else {
      console.error('Enhancement failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error calling enhance API:', error);
    return null;
  }
}

async function enhanceExistingCacheEntries() {
  try {
    console.log('🔍 Fetching cache entries without AI enhancement...\n');
    
    // Get all cache entries that don't have aiItemName or aiDescription
    const entriesResponse = await databases.listDocuments(databaseId, cacheCollectionId, [
      Query.limit(100) // Adjust if you have more items
    ]);
    
    console.log(`Found ${entriesResponse.documents.length} total cache entries`);
    
    const unenhancedEntries = entriesResponse.documents.filter(doc => 
      !doc.aiItemName || !doc.aiDescription
    );
    
    console.log(`Found ${unenhancedEntries.length} entries without AI enhancement\n`);
    
    if (unenhancedEntries.length === 0) {
      console.log('✅ All cache entries already have AI enhancement!');
      return;
    }
    
    let processed = 0;
    let enhanced = 0;
    let failed = 0;
    
    for (const entry of unenhancedEntries) {
      processed++;
      console.log(`\n[${processed}/${unenhancedEntries.length}] Processing: ${entry.title || entry.url}`);
      
      try {
        // Enhance the item
        const enhancement = await enhanceWithGemini({
          url: entry.url,
          title: entry.title,
          description: entry.description,
          price: entry.price,
          image: entry.image
        });
        
        if (enhancement) {
          // Update the cache entry with AI enhancement
          await databases.updateDocument(databaseId, cacheCollectionId, entry.$id, {
            aiItemName: enhancement.enhancedName,
            aiDescription: enhancement.enhancedDescription
          });
          
          enhanced++;
          console.log(`✅ Enhanced: "${enhancement.enhancedName}"`);
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          failed++;
          console.log(`❌ Failed to enhance item`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error processing entry ${entry.$id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Enhancement Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Successfully enhanced: ${enhanced}`);
    console.log(`   Failed: ${failed}`);
    
  } catch (error) {
    console.error('Error enhancing cache entries:', error);
  }
}

async function addAiAttributesToCache() {
  try {
    console.log('🔧 Adding AI attributes to cache collection...\n');
    
    // Check if attributes already exist
    const collection = await databases.getCollection(databaseId, cacheCollectionId);
    const hasAiItemName = collection.attributes.find(attr => attr.key === 'aiItemName');
    const hasAiDescription = collection.attributes.find(attr => attr.key === 'aiDescription');
    
    if (!hasAiItemName) {
      console.log('Adding aiItemName attribute...');
      await databases.createStringAttribute(databaseId, cacheCollectionId, 'aiItemName', 500, false);
      console.log('✅ aiItemName attribute added');
      
      // Wait a bit for the attribute to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('✅ aiItemName attribute already exists');
    }
    
    if (!hasAiDescription) {
      console.log('Adding aiDescription attribute...');
      await databases.createStringAttribute(databaseId, cacheCollectionId, 'aiDescription', 2000, false);
      console.log('✅ aiDescription attribute added');
      
      // Wait a bit for the attribute to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('✅ aiDescription attribute already exists');
    }
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ AI attributes already exist in cache collection');
    } else {
      console.error('Error adding AI attributes to cache:', error);
    }
  }
}

async function main() {
  console.log('🚀 Starting cache enhancement process...\n');
  
  // First, ensure the AI attributes exist in the cache collection
  await addAiAttributesToCache();
  
  // Then enhance existing entries
  await enhanceExistingCacheEntries();
  
  console.log('\n🎉 Enhancement process complete!');
}

// Run the script
main().catch(console.error);
