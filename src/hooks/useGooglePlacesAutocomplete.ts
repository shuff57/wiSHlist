import { useState, useCallback, useRef, useEffect } from 'react';

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  distance_meters?: number;
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
  formatted_phone_number?: string;
  website?: string;
}

interface ParsedAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
}

interface UseGooglePlacesOptions {
  userLatitude?: number;
  userLongitude?: number;
  types?: string[]; // e.g., ['school', 'establishment']
  componentRestrictions?: {
    country: string; // e.g., 'us'
  };
}

export const useGooglePlacesAutocomplete = (options: UseGooglePlacesOptions = {}) => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const currentSearchRef = useRef<string>('');

  // Cleanup function to cancel pending requests and timeouts
  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const searchPlaces = useCallback(async (query: string, abortSignal: AbortSignal): Promise<PlaceSuggestion[]> => {
    if (query.length < 3) return [];

    try {
      // Build request parameters for our API route
      const params = new URLSearchParams({
        input: query,
        components: options.componentRestrictions?.country ? `country:${options.componentRestrictions.country}` : '',
      });

      // Add location bias if user location is available
      if (options.userLatitude && options.userLongitude) {
        params.append('location', `${options.userLatitude},${options.userLongitude}`);
        params.append('radius', '50000'); // 50km radius
      }

      // Add place types if specified
      if (options.types && options.types.length > 0) {
        params.append('types', options.types.join('|'));
      }

      const response = await fetch(
        `/api/places/autocomplete?${params.toString()}`,
        { 
          signal: abortSignal,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions || [];
      } else if (data.status === 'ZERO_RESULTS') {
        return [];
      } else {
        console.error('Google Places API error:', data.status, data.error_message);
        console.error('Full response data:', data);
        console.error('Request URL was:', `/api/places/autocomplete?${params.toString()}`);
        return [];
      }
    } catch (error) {
      if (!abortSignal.aborted) {
        console.error('Place search error:', error);
      }
      return [];
    }
  }, [
    options.userLatitude,
    options.userLongitude,
    options.types?.join(','),
    options.componentRestrictions?.country
  ]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
      });

      const response = await fetch(
        `/api/places/details?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Places Details API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      } else {
        console.error('Google Places Details API error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }, []);

  const debouncedSearch = useCallback((query: string, callback: (suggestions: PlaceSuggestion[]) => void) => {
    // Cancel any existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (query.length < 3) {
      cleanup();
      setSuggestions([]);
      setLoading(false);
      callback([]);
      return;
    }
    
    // Store current search query
    currentSearchRef.current = query;
    
    debounceRef.current = setTimeout(async () => {
      // Only cancel previous request when starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Only proceed if this search is still current
      if (currentSearchRef.current !== query) {
        return;
      }
      
      // Create new AbortController for this search
      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        const results = await searchPlaces(query, abortControllerRef.current.signal);
        
        // Only update results if this search is still current and wasn't aborted
        if (currentSearchRef.current === query && !abortControllerRef.current.signal.aborted) {
          setSuggestions(results);
          setLoading(false);
          callback(results);
        }
      } catch (error) {
        // Only handle errors if the search wasn't aborted
        if (currentSearchRef.current === query && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          console.error('Search error:', error);
          setSuggestions([]);
          setLoading(false);
          callback([]);
        }
      }
    }, 300); // Shorter delay for Google API since it's faster
  }, [searchPlaces, cleanup]);

  const parseAddress = useCallback((placeDetails: PlaceDetails): ParsedAddress => {
    const components = placeDetails.address_components;
    
    // Extract address components
    const getComponent = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.long_name || '';
    };

    const getComponentShort = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.short_name || '';
    };

    // Build street address
    const streetNumber = getComponent(['street_number']);
    const route = getComponent(['route']);
    const address = [streetNumber, route].filter(Boolean).join(' ') || placeDetails.formatted_address;

    return {
      name: placeDetails.name || '',
      address,
      city: getComponent(['locality', 'sublocality']),
      state: getComponentShort(['administrative_area_level_1']),
      zip: getComponent(['postal_code']),
      phone: placeDetails.formatted_phone_number,
      website: placeDetails.website
    };
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setLoading(false);
    currentSearchRef.current = '';
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
  }, []);

  return {
    suggestions,
    loading,
    debouncedSearch,
    getPlaceDetails,
    parseAddress,
    clearSuggestions,
    isConfigured: true // Always true since we handle API key server-side
  };
};
