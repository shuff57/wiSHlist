import { NextRequest, NextResponse } from 'next/server';

// Function to clean up school name formatting
function cleanSchoolName(name: string): string {
  if (!name) return name;
  
  return name
    // Fix common school type formatting
    .replace(/\bhighschool\b/gi, 'High School')
    .replace(/\bmiddleschool\b/gi, 'Middle School')
    .replace(/\belementaryschool\b/gi, 'Elementary School')
    .replace(/\belementary\b(?!\s+school)/gi, 'Elementary School')
    .replace(/\bjr\.?\s*high\b/gi, 'Jr. High')
    .replace(/\bsr\.?\s*high\b/gi, 'Sr. High')
    // Proper case for common words
    .replace(/\bhigh\s+school\b/gi, 'High School')
    .replace(/\bmiddle\s+school\b/gi, 'Middle School')
    .replace(/\belementary\s+school\b/gi, 'Elementary School')
    .replace(/\bacademy\b/gi, 'Academy')
    .replace(/\binstitute\b/gi, 'Institute')
    .replace(/\buniversity\b/gi, 'University')
    .replace(/\bcollege\b/gi, 'College')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');
  const session_token = searchParams.get('session_token');

  if (!placeId) {
    return NextResponse.json(
      { error: 'Place ID is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    if (session_token) {
      url.searchParams.append('sessionToken', session_token);
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location,types,nationalPhoneNumber,websiteUri',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform new API response to match old API format for compatibility
    const originalName = data.displayName?.text || '';
    const cleanedName = cleanSchoolName(originalName);
    
    const transformedData = {
      result: {
        place_id: data.id || placeId,
        name: cleanedName,
        formatted_address: data.formattedAddress || '',
        address_components: data.addressComponents?.map((component: any) => ({
          long_name: component.longText || '',
          short_name: component.shortText || '',
          types: component.types || [],
        })) || [],
        geometry: {
          location: {
            lat: data.location?.latitude || 0,
            lng: data.location?.longitude || 0,
          },
        },
        types: data.types || [],
        formatted_phone_number: data.nationalPhoneNumber || '',
        website: data.websiteUri || '',
      },
      status: 'OK'
    };
    
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error('Places Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
