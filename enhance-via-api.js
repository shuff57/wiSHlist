// Enhancement script that uses the Next.js API endpoints
// This avoids direct Appwrite authentication issues

async function testConnection() {
  try {
    console.log('🔌 Testing connection to Next.js server...');
    const response = await fetch('http://localhost:3000/api/cache/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' })
    });
    
    if (response.ok) {
      console.log('✅ Next.js server is reachable');
      return true;
    } else {
      console.log('❌ Next.js server error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach Next.js server:', error.message);
    return false;
  }
}

async function getCacheData() {
  try {
    console.log('🔍 Fetching cache data through API...');
    // We'll use the search endpoint to get cache data
    const response = await fetch('http://localhost:3000/api/cache/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' }) // Empty query to get all results
    });
    
    if (!response.ok) {
      console.log('❌ Cache API error:', response.status);
      return [];
    }
    
    const result = await response.json();
    return result.results || [];
    
  } catch (error) {
    console.error('Error fetching cache data:', error);
    return [];
  }
}

async function enhanceItem(itemData) {
  try {
    const response = await fetch('http://localhost:3000/api/enhance-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'enhance-scraped',
        data: {
          url: itemData.url,
          title: itemData.title,
          description: itemData.description,
          price: itemData.price,
          image: itemData.image
        }
      })
    });
    
    if (!response.ok) {
      console.error('Enhancement API error:', response.status);
      return null;
    }
    
    const result = await response.json();
    return result.success ? result.data : null;
    
  } catch (error) {
    console.error('Error enhancing item:', error);
    return null;
  }
}

async function updateCacheWithEnhancement(url, aiData) {
  try {
    // Re-scrape the same URL to trigger the enhancement and caching
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: url,
        searchContext: 'AI enhancement update'
      })
    });
    
    if (!response.ok) {
      console.error('Scrape API error:', response.status);
      return false;
    }
    
    const result = await response.json();
    return result.success;
    
  } catch (error) {
    console.error('Error updating cache:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting AI enhancement for existing cache items...\n');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot connect to Next.js server. Make sure it\'s running with "npm run dev"');
    return;
  }
  
  // Get cache data
  const cacheItems = await getCacheData();
  console.log(`📦 Found ${cacheItems.length} items in cache\n`);
  
  if (cacheItems.length === 0) {
    console.log('ℹ️  No cache items found. Try adding some items first.');
    return;
  }
  
  // Filter items that might not have AI enhancement
  const itemsToEnhance = cacheItems.filter(item => {
    // Check if item has basic metadata but might be missing AI enhancement
    return item.title && (!item.aiItemName || !item.aiDescription);
  });
  
  console.log(`🤖 Found ${itemsToEnhance.length} items that might need AI enhancement\n`);
  
  if (itemsToEnhance.length === 0) {
    console.log('✅ All items appear to already have AI enhancement!');
    console.log('\nTo force re-enhancement, you can:');
    console.log('1. Delete specific cache entries from Appwrite console');
    console.log('2. Re-scrape URLs to trigger fresh AI enhancement');
    return;
  }
  
  let processed = 0;
  let enhanced = 0;
  let failed = 0;
  
  for (const item of itemsToEnhance) {
    processed++;
    console.log(`\n[${processed}/${itemsToEnhance.length}] Processing: ${item.title}`);
    
    try {
      // Re-scrape to trigger AI enhancement and update cache
      const updated = await updateCacheWithEnhancement(item.url, null);
      
      if (updated) {
        enhanced++;
        console.log(`✅ Updated cache with AI enhancement`);
      } else {
        failed++;
        console.log(`❌ Failed to update cache`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      failed++;
      console.error(`❌ Error processing item:`, error.message);
    }
  }
  
  console.log(`\n📊 Enhancement Summary:`);
  console.log(`   Total processed: ${processed}`);
  console.log(`   Successfully enhanced: ${enhanced}`);
  console.log(`   Failed: ${failed}`);
  
  console.log('\n💡 Tips:');
  console.log('- Enhanced items now have aiItemName and aiDescription fields');
  console.log('- These will be used consistently in both auto and manual item addition');
  console.log('- Check your cache in Appwrite console to verify the new fields');
}

main().catch(console.error);
