// Simple script to check Items collection schema and enhance cache entries
// Uses HTTP API directly for reliability

const APPWRITE_ENDPOINT = 'https://app.huffpalmer.fyi/v1';
const PROJECT_ID = '686d7df60026eca1ebb0';
const DATABASE_ID = '686d7df60026eca1ebb0';
const ITEMS_COLLECTION_ID = '6882b8790034f4058a94';
const CACHE_COLLECTION_ID = '686e1a2e0013c72c7a75';
const API_KEY = 'standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd';

const headers = {
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
  'Content-Type': 'application/json'
};

async function checkItemsCollectionSchema() {
  try {
    console.log('🔍 Checking Items collection schema...\n');
    
    const response = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${ITEMS_COLLECTION_ID}`, {
      headers: headers
    });
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return false;
    }
    
    const collection = await response.json();
    
    console.log('Current Items collection attributes:');
    collection.attributes.forEach(attr => {
      console.log(`- ${attr.key} (${attr.type}, required: ${attr.required})`);
    });
    
    const hasAiItemName = collection.attributes.find(attr => attr.key === 'aiItemName');
    const hasAiDescription = collection.attributes.find(attr => attr.key === 'aiDescription');
    
    console.log('\n📋 AI Attribute Status:');
    console.log(`   aiItemName: ${hasAiItemName ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   aiDescription: ${hasAiDescription ? '✅ EXISTS' : '❌ MISSING'}`);
    
    return { hasAiItemName: !!hasAiItemName, hasAiDescription: !!hasAiDescription };
    
  } catch (error) {
    console.error('Error checking Items collection:', error);
    return false;
  }
}

async function getCacheEntries() {
  try {
    const response = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${CACHE_COLLECTION_ID}/documents?limit=100`, {
      headers: headers
    });
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return [];
    }
    
    const result = await response.json();
    return result.documents || [];
    
  } catch (error) {
    console.error('Error fetching cache entries:', error);
    return [];
  }
}

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

async function updateCacheEntry(entryId, aiData) {
  try {
    const response = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${CACHE_COLLECTION_ID}/documents/${entryId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({
        aiItemName: aiData.enhancedName,
        aiDescription: aiData.enhancedDescription
      })
    });
    
    if (!response.ok) {
      console.error('HTTP Error updating cache:', response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating cache entry:', error);
    return false;
  }
}

async function enhanceExistingCacheEntries() {
  try {
    console.log('🔍 Fetching cache entries...\n');
    
    const allEntries = await getCacheEntries();
    console.log(`Found ${allEntries.length} total cache entries`);
    
    const unenhancedEntries = allEntries.filter(doc => 
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
          const updated = await updateCacheEntry(entry.$id, enhancement);
          
          if (updated) {
            enhanced++;
            console.log(`✅ Enhanced: "${enhancement.enhancedName}"`);
          } else {
            failed++;
            console.log(`❌ Failed to update database`);
          }
          
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

async function main() {
  console.log('🚀 Starting enhancement process...\n');
  
  // Check Items collection schema
  const itemsSchema = await checkItemsCollectionSchema();
  
  if (itemsSchema && (!itemsSchema.hasAiItemName || !itemsSchema.hasAiDescription)) {
    console.log('\n🤔 Items collection is missing AI attributes.');
    console.log('💡 Recommendation: Add aiItemName and aiDescription to Items collection');
    console.log('   This allows items to store their final enhanced names/descriptions');
    console.log('   Run: node check-items-ai-schema.js --add-attributes');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Enhance existing cache entries
  await enhanceExistingCacheEntries();
  
  console.log('\n🎉 Enhancement process complete!');
}

// Run the script
main().catch(console.error);
