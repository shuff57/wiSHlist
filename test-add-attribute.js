// Simple test to add image_url attribute to items collection
const { Client, Databases } = require('appwrite');

async function addImageUrlAttribute() {
  try {
    // Use the Next.js API endpoint to add the attribute
    const response = await fetch('http://localhost:3000/api/test-db-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'addAttribute',
        databaseId: '686d7df60026eca1ebb0',
        collectionId: '6882b8790034f4058a94',
        attributeId: 'image_url',
        size: 2048,
        required: false
      })
    });

    const result = await response.json();
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addImageUrlAttribute();
