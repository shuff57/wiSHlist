import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';

export async function GET(request: NextRequest) {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    // Set API key for server-side operations
    client.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY_CACHE!;

    const databases = new Databases(client);
    
    const databaseId = '686d7df60026eca1ebb0';
    const itemsCollectionId = '6882b8790034f4058a94';

    // Get collection schema
    const collection = await databases.getCollection(databaseId, itemsCollectionId);
    
    const hasImageUrl = collection.attributes.find((attr: any) => attr.key === 'image_url');
    
    return NextResponse.json({
      success: true,
      collectionName: collection.name,
      attributes: collection.attributes.map((attr: any) => ({
        key: attr.key,
        type: attr.type,
        required: attr.required,
        size: attr.size
      })),
      hasImageUrl: !!hasImageUrl,
      imageUrlDetails: hasImageUrl || null
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'addImageUrl') {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

      client.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY_CACHE!;
      const databases = new Databases(client);
      
      const databaseId = '686d7df60026eca1ebb0';
      const itemsCollectionId = '6882b8790034f4058a94';

      // Add the image_url attribute
      await databases.createStringAttribute(
        databaseId,
        itemsCollectionId,
        'image_url',
        2048,
        false
      );

      return NextResponse.json({
        success: true,
        message: 'image_url attribute added successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
