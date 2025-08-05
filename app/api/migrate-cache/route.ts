import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'appwrite';

export async function POST(request: NextRequest) {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    // Set API key for server-side operations
    client.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY_CACHE!;

    const databases = new Databases(client);
    
    const DATABASE_ID = '688189ad000ad6dd9410';
    const URL_CACHE_COLLECTION_ID = '68915fa8003d3174638e';

    console.log('Fetching cache entries...');
    
    // Get all cache entries
    const response = await databases.listDocuments(DATABASE_ID, URL_CACHE_COLLECTION_ID, [
      Query.limit(100)
    ]);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const results: string[] = [];
    
    for (const doc of response.documents) {
      try {
        const metadata = JSON.parse(doc.metadata);
        
        // Check if this entry needs image_url updated
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
          results.push(`✅ Updated: ${doc.url}`);
        } else if (doc.image_url) {
          skippedCount++;
          results.push(`⏭️ Already has image: ${doc.url}`);
        } else {
          skippedCount++;
          results.push(`❌ No image in metadata: ${doc.url}`);
        }
      } catch (error: any) {
        results.push(`⚠️ Error processing ${doc.url}: ${error.message}`);
        skippedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration complete! Updated ${updatedCount} entries, skipped ${skippedCount}`,
      results: results,
      statistics: {
        total: response.documents.length,
        updated: updatedCount,
        skipped: skippedCount
      }
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
