// Script to migrate cache entries and add missing image URLs
async function migrateCacheImages() {
  try {
    console.log('Starting cache migration...');
    
    const response = await fetch('http://localhost:3000/api/migrate-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n🎉 Migration Results:');
      console.log('==================');
      console.log(result.message);
      console.log('\nStatistics:');
      console.log(`- Total entries: ${result.statistics.total}`);
      console.log(`- Updated: ${result.statistics.updated}`);
      console.log(`- Skipped: ${result.statistics.skipped}`);
      
      if (result.results && result.results.length > 0) {
        console.log('\nDetailed Results:');
        result.results.forEach(line => console.log(line));
      }
    } else {
      console.error('❌ Migration failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
  }
}

migrateCacheImages();
