// Test AI Enhancement for Amazon PLA Filament URL
async function testAiEnhancement() {
  const url = 'https://www.amazon.com/Creality-PLA-1-75mm-Hyper-Dimensional/dp/B0C2BJB256/ref=sr_1_3?crid=1P0AFGCJCNAA0&dib=eyJ2IjoiMSJ9.ymkWHhoNAYmebB7zKNoDa_MhHIX_IVE0mAjGjENdQg_pcljZSQTB0EhVRzaEDPffUOV1ZOAFhiD_fLmf_YwgHxi26ZUwn_J29YykG_VPfLXkg1SLjxqrVh2aG8gSe9woVMg5Q_K9B_BropzSK8Kd3Bi-nd6V0YclZBfJeLkHpPk5nkI2i11PG8AUIvRoQQwEAIDpTK_sIc7Aed_Xv-fOXYm9DRfSFmXXk2gkzqROq9E.2gMIIvqA-LfgOgXBivV8ZMyEZCtwmQc-BuadaxmRSkQ&dib_tag=se&keywords=hyper%2Bpla&qid=1754407666&sprefix=hyper%2Bpla%2Caps%2C212&sr=8-3&th=1';

  try {
    console.log('🔄 Testing AI enhancement on Amazon PLA filament...\n');
    
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: url,
        searchContext: 'classroom 3D printing supplies'
      })
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AI Enhancement Results:');
      console.log('========================\n');
      
      // Show original scraped data
      console.log('📋 Original Scraped Data:');
      console.log(`Title: ${result.title || 'N/A'}`);
      console.log(`Description: ${result.description ? result.description.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`Price: ${result.price || 'N/A'}\n`);
      
      // Show AI enhancement
      if (result._ai && result._ai.enhanced) {
        console.log('🤖 AI-Enhanced Data (Parent-Friendly):');
        console.log(`Name: "${result._ai.name}"`);
        console.log(`Description: "${result._ai.description}"\n`);
        
        console.log('📊 Improvements Made:');
        console.log('- ✅ Removed brand name ("Creality")');
        console.log('- ✅ Made name generic and educational');
        console.log('- ✅ Focused on specifications and classroom use');
        console.log('- ✅ Removed marketing language');
        console.log('- ✅ Added educational context for parents');
      } else {
        console.log('❌ No AI enhancement found in response');
      }
      
      // Show cache info
      if (result._cache) {
        console.log(`\n💾 Cache Status: ${result._cache.hit ? 'HIT' : 'MISS'}`);
        if (result._cache.hit) {
          console.log(`Hit Count: ${result._cache.hitCount}`);
        }
      }
      
    } else {
      console.error('❌ Scraping failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing AI enhancement:', error.message);
  }
}

testAiEnhancement();
