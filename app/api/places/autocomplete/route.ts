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
  const input = searchParams.get('input');
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');
  const types = searchParams.get('types');
  const components = searchParams.get('components');
  const session_token = searchParams.get('session_token');

  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Prepare request body for new Places API
    const requestBody: any = {
      input,
      languageCode: 'en',
    };

    // Add location bias if provided
    if (location && radius) {
      const [lat, lng] = location.split(',').map(Number);
      requestBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: parseFloat(radius)
        }
      };
    }

    // Add included types (new API uses different format)
    if (types) {
      requestBody.includedPrimaryTypes = types.split(',');
    }

    // Add region code from components (country:us becomes regionCode: "US")
    if (components) {
      const countryMatch = components.match(/country:([a-z]{2})/i);
      if (countryMatch) {
        requestBody.regionCode = countryMatch[1].toUpperCase();
      }
    }

    if (session_token) {
      requestBody.sessionToken = session_token;
    }

    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform new API response to match old API format for compatibility
    const transformedData = {
      predictions: data.suggestions?.map((suggestion: any) => {
        const originalDescription = suggestion.placePrediction?.text?.text || '';
        const originalMainText = suggestion.placePrediction?.structuredFormat?.mainText?.text || '';
        
        // Clean up school names for better formatting
        const cleanedDescription = cleanSchoolName(originalDescription);
        const cleanedMainText = cleanSchoolName(originalMainText);
        
        return {
          description: cleanedDescription,
          place_id: suggestion.placePrediction?.placeId || '',
          structured_formatting: {
            main_text: cleanedMainText,
            secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
          },
          types: suggestion.placePrediction?.types || [],
        };
      }) || [],
      status: 'OK'
    };
    
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
