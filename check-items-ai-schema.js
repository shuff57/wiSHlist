const { Client, Databases } = require('appwrite');

const client = new Client()
  .setEndpoint('https://app.huffpalmer.fyi/v1')
  .setProject('686d7df60026eca1ebb0');

const databases = new Databases(client);

const databaseId = '686d7df60026eca1ebb0';
const itemsCollectionId = '6882b8790034f4058a94';
const cacheCollectionId = '686e1a2e0013c72c7a75';

async function checkAndAddAiAttributesToItems() {
  try {
    console.log('🔍 Checking Items collection schema...\n');
    
    // Check current schema using HTTP request like verify-items-schema.js
    const response = await fetch('https://app.huffpalmer.fyi/v1/databases/686d7df60026eca1ebb0/collections/6882b8790034f4058a94', {
      headers: {
        'X-Appwrite-Project': '686d7df60026eca1ebb0',
        'X-Appwrite-Key': 'standard_26fc023ca7e6575e13d3b795a8db1c2916bd008638931f718276e8f6283c7dfbf4cd289c479c762ef84ede53ebc5e72ad1db0fada309f5c988a215ff47ea59b592548ae933151cf4e6b0f4c91f916240a1035cc21cdd6175fd74103b3732a89713a968bdcc590a7d7ae79d3bdbf1b15aceb7cb7b51a5519ca2e5e8f3c5f401cd'
      }
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
    
    if (!hasAiItemName || !hasAiDescription) {
      console.log('\n🤔 Should we add AI attributes to the Items collection?');
      console.log('\nPros of adding to Items collection:');
      console.log('✅ Items can store their own AI-enhanced names/descriptions');
      console.log('✅ Direct access without needing to join with cache');
      console.log('✅ Items can have different AI enhancements than cached versions');
      console.log('✅ Better for items not found in cache');
      
      console.log('\nCons of adding to Items collection:');
      console.log('❌ Data duplication between Items and Cache');
      console.log('❌ Potential inconsistency if cache is updated but items are not');
      console.log('❌ More complex synchronization logic needed');
      
      console.log('\n💡 Recommendation: Add aiItemName and aiDescription to Items collection');
      console.log('   This allows items to store their final enhanced names/descriptions');
      console.log('   independent of the cache, which is better for user customization.');
      
      return false; // Don't auto-add, let user decide
    }
    
    console.log('\n✅ Items collection already has AI attributes!');
    return true;
    
  } catch (error) {
    console.error('Error checking Items collection:', error);
    return false;
  }
}

async function addAiAttributesToItems() {
  try {
    console.log('🔧 Adding AI attributes to Items collection...\n');
    
    const collection = await databases.getCollection(databaseId, itemsCollectionId);
    const hasAiItemName = collection.attributes.find(attr => attr.key === 'aiItemName');
    const hasAiDescription = collection.attributes.find(attr => attr.key === 'aiDescription');
    
    if (!hasAiItemName) {
      console.log('Adding aiItemName attribute to Items collection...');
      await databases.createStringAttribute(databaseId, itemsCollectionId, 'aiItemName', 500, false);
      console.log('✅ aiItemName attribute added to Items');
      
      // Wait for attribute to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!hasAiDescription) {
      console.log('Adding aiDescription attribute to Items collection...');
      await databases.createStringAttribute(databaseId, itemsCollectionId, 'aiDescription', 2000, false);
      console.log('✅ aiDescription attribute added to Items');
      
      // Wait for attribute to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n✅ Items collection now has AI attributes!');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ AI attributes already exist in Items collection');
    } else {
      console.error('Error adding AI attributes to Items collection:', error);
      throw error;
    }
  }
}

async function main() {
  const hasAttributes = await checkAndAddAiAttributesToItems();
  
  if (!hasAttributes) {
    console.log('\n❓ Would you like to add aiItemName and aiDescription to the Items collection?');
    console.log('   Run with --add-attributes flag to proceed');
    
    if (process.argv.includes('--add-attributes')) {
      await addAiAttributesToItems();
    }
  }
}

main().catch(console.error);
