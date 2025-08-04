import { useState, useCallback, useRef, useEffect } from 'react';

interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    hamlet?: string;
    state?: string;
    postcode?: string;
    country?: string;
    amenity?: string;
    school?: string;
  };
  lat: string;
  lon: string;
  distance?: number; // Distance from user's location
}

interface ParsedAddress {
  name?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface UseAddressAutocompleteOptions {
  userLatitude?: number;
  userLongitude?: number;
}

// Haversine formula to calculate distance between two points on Earth
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

export const useAddressAutocomplete = (options: UseAddressAutocompleteOptions = {}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
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

  const searchAddresses = useCallback(async (query: string, abortSignal: AbortSignal): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];
    
    try {
      const allResults: AddressSuggestion[] = [];
      const { userLatitude, userLongitude } = options;
      
      // Build viewbox parameter for location-based prioritization
      let locationParams = '';
      let stateFilter = '';
      let enhancedQuery = query;
      
      if (userLatitude && userLongitude) {
        // Create a viewbox around the user's location (about 100km radius for better coverage)
        const offset = 0.9; // roughly 100km
        const viewbox = `${userLongitude - offset},${userLatitude + offset},${userLongitude + offset},${userLatitude - offset}`;
        locationParams = `&viewbox=${viewbox}&bounded=1`; // bounded=1 to prioritize results within viewbox
        
        // If user is in California (rough bounds), add state filter and enhance query
        if (userLatitude >= 32.5 && userLatitude <= 42.0 && userLongitude >= -124.5 && userLongitude <= -114.0) {
          stateFilter = '&state=California';
          // For short queries, add "California" to help bias results
          if (query.length < 10 && !query.toLowerCase().includes('california') && !query.toLowerCase().includes('ca')) {
            enhancedQuery = `${query} California`;
          }
        }
      }
      
      // Check if request was cancelled before starting
      if (abortSignal.aborted) {
        return [];
      }
      
      // Search 1: Schools specifically with location priority
      const schoolResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(enhancedQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=3&` +
        `countrycodes=us&` +
        `amenity=school${locationParams}${stateFilter}`,
        { signal: abortSignal }
      );
      
      if (schoolResponse.ok && !abortSignal.aborted) {
        const schoolResults = await schoolResponse.json();
        allResults.push(...schoolResults);
      }
      
      // Check if request was cancelled before next search
      if (abortSignal.aborted) {
        return [];
      }
      
      // Search 2: General addresses with location priority
      const addressResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(enhancedQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=7&` +
        `countrycodes=us&` +
        `dedupe=1${locationParams}${stateFilter}`,
        { signal: abortSignal }
      );
      
      if (addressResponse.ok && !abortSignal.aborted) {
        const addressResults = await addressResponse.json();
        // Filter out duplicates and add to results
        addressResults.forEach((result: AddressSuggestion) => {
          const isDuplicate = allResults.some(existing => 
            existing.lat === result.lat && existing.lon === result.lon
          );
          if (!isDuplicate) {
            allResults.push(result);
          }
        });
      }
      
      // Check if request was cancelled before fallback search
      if (abortSignal.aborted) {
        return [];
      }
      
      // Search 3: If still no results, try a fallback search with relaxed bounds
      if (allResults.length === 0) {
        const broadResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=5&` +
          `countrycodes=us&` +
          `featuretype=settlement,highway,amenity&` +
          `bounded=0${stateFilter}`, // Only use state filter in fallback, not strict bounds
          { signal: abortSignal }
        );
        
        if (broadResponse.ok && !abortSignal.aborted) {
          const broadResults = await broadResponse.json();
          allResults.push(...broadResults);
        }
      }
      
      // Final check before processing results
      if (abortSignal.aborted) {
        return [];
      }
      
      // Calculate distances if user location is available
      if (userLatitude && userLongitude) {
        allResults.forEach(result => {
          const resultLat = parseFloat(result.lat);
          const resultLon = parseFloat(result.lon);
          result.distance = calculateDistance(userLatitude, userLongitude, resultLat, resultLon);
        });
      }
      
      // Sort results: schools first, then by distance (if available), then by relevance
      const sortedResults = allResults.sort((a, b) => {
        const aIsSchool = a.address?.amenity === 'school' || a.address?.school;
        const bIsSchool = b.address?.amenity === 'school' || b.address?.school;
        
        // Schools first
        if (aIsSchool && !bIsSchool) return -1;
        if (!aIsSchool && bIsSchool) return 1;
        
        // If user has location, prioritize California results and then by distance
        if (userLatitude && userLongitude) {
          const aIsCA = a.address?.state === 'California' || a.display_name?.includes('California') || a.display_name?.includes(', CA,');
          const bIsCA = b.address?.state === 'California' || b.display_name?.includes('California') || b.display_name?.includes(', CA,');
          
          // California results first
          if (aIsCA && !bIsCA) return -1;
          if (!aIsCA && bIsCA) return 1;
          
          // Then by distance if both are in same state category
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
        }
        
        return 0;
      });
      
      return sortedResults.slice(0, 8);
    } catch (error) {
      // Don't log errors for aborted requests
      if (!abortSignal.aborted) {
        console.error('Address search error:', error);
      }
      return [];
    }
  }, [options]);

  const debouncedSearch = useCallback((query: string, callback: (suggestions: AddressSuggestion[]) => void) => {
    // Cancel any existing timeout (but not the actual request yet)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (query.length < 3) {
      // Only cancel requests and clear results for very short queries
      cleanup();
      setSuggestions([]);
      setLoading(false);
      callback([]);
      return;
    }
    
    // Store current search query
    currentSearchRef.current = query;
    
    debounceRef.current = setTimeout(async () => {
      // Only cancel previous request when we're about to start a new one
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
        const results = await searchAddresses(query, abortControllerRef.current.signal);
        
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
    }, 500);
  }, [searchAddresses, cleanup]);

  const parseAddress = useCallback((suggestion: AddressSuggestion): ParsedAddress => {
    const addr = suggestion.address;
    const displayParts = suggestion.display_name.split(',').map(part => part.trim());
    
    // Extract name (school name or business name)
    let name = '';
    if (addr.amenity === 'school' || addr.school) {
      name = displayParts[0] || addr.school || '';
    }
    
    // Build street address - try multiple approaches
    let address = '';
    
    // Method 1: Use house_number + road
    if (addr.house_number && addr.road) {
      address = `${addr.house_number} ${addr.road}`;
    }
    // Method 2: Use just road if no house number
    else if (addr.road) {
      address = addr.road;
    }
    // Method 3: Extract from display_name
    else {
      // Try to find a part that looks like an address
      const addressPart = displayParts.find(part => 
        /\d/.test(part) && /(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i.test(part)
      );
      address = addressPart || displayParts[0] || '';
    }
    
    // Extract city (try multiple fields and fallbacks)
    let city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || '';
    
    // If no city found, try to extract from display_name
    if (!city && displayParts.length > 1) {
      // Look for a part that might be a city (usually after the address)
      for (let i = 1; i < displayParts.length - 1; i++) {
        const part = displayParts[i];
        // Skip if it looks like a road or number
        if (!/^\d/.test(part) && !/(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i.test(part)) {
          city = part;
          break;
        }
      }
    }
    
    // Extract state
    let state = addr.state || '';
    
    // Try to extract state from display_name if not found
    if (!state && displayParts.length > 0) {
      const lastPart = displayParts[displayParts.length - 2]; // Second to last is often state
      if (lastPart && lastPart.length === 2 && /^[A-Z]{2}$/.test(lastPart)) {
        state = lastPart;
      }
    }
    
    // Extract ZIP
    const zip = addr.postcode || '';
    
    return {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim()
    };
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setLoading(false);
    currentSearchRef.current = '';
    // Only clear timeouts, let ongoing requests complete naturally
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
  }, []);

  return {
    suggestions,
    loading,
    debouncedSearch,
    parseAddress,
    clearSuggestions
  };
};
