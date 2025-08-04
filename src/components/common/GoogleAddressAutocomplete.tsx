import React, { useState, useRef, useEffect } from 'react';
import { MapPin, School, Building, Navigation, NavigationOff, AlertCircle } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '../../hooks/useGooglePlacesAutocomplete';
import { useGeolocation } from '../../hooks/useGeolocation';

interface GoogleAddressAutocompleteProps {
  onAddressSelect: (address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    website?: string;
  }) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  preferSchools?: boolean; // When true, will prioritize school results
}

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Search for school or address...",
  initialValue = "",
  className = "",
  preferSchools = true
}) => {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { 
    latitude, 
    longitude, 
    hasLocation, 
    permissionState, 
    requestLocation, 
    loading: locationLoading 
  } = useGeolocation();
  
  const { 
    suggestions, 
    loading, 
    debouncedSearch, 
    getPlaceDetails,
    parseAddress, 
    clearSuggestions,
    isConfigured
  } = useGooglePlacesAutocomplete({
    userLatitude: latitude || undefined,
    userLongitude: longitude || undefined,
    types: preferSchools ? ['school'] : ['establishment'],
    componentRestrictions: { country: 'us' }
  });

  useEffect(() => {
    if (query.length >= 3) {
      debouncedSearch(query, (results) => {
        setShowSuggestions(results.length > 0);
      });
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  }, [query, debouncedSearch, clearSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedIndex(-1);
    
    // If input is cleared, immediately hide suggestions
    if (newValue.length === 0) {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    try {
      // Clear the search box instead of setting it to the selected suggestion
      setQuery('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
      
      // Get detailed place information
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      if (placeDetails) {
        const parsed = parseAddress(placeDetails);
        onAddressSelect({
          name: parsed.name,
          address: parsed.address,
          city: parsed.city,
          state: parsed.state,
          zip: parsed.zip,
          phone: parsed.phone,
          website: parsed.website
        });
      } else {
        // Fallback to basic info from suggestion
        const parts = suggestion.description.split(',').map((part: string) => part.trim());
        onAddressSelect({
          name: suggestion.structured_formatting?.main_text || '',
          address: parts[0] || '',
          city: parts[1] || '',
          state: parts[2] || '',
          zip: ''
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const getSuggestionIcon = (suggestion: any) => {
    if (suggestion.types?.includes('school') || 
        suggestion.types?.includes('primary_school') ||
        suggestion.types?.includes('secondary_school') ||
        suggestion.structured_formatting?.main_text?.toLowerCase().includes('school')) {
      return <School className="w-4 h-4 text-blue-600" />;
    }
    if (suggestion.types?.includes('establishment')) {
      return <Building className="w-4 h-4 text-gray-600" />;
    }
    return <MapPin className="w-4 h-4 text-gray-600" />;
  };

  const formatSuggestionText = (suggestion: any) => {
    const main = suggestion.structured_formatting?.main_text || suggestion.description;
    const secondary = suggestion.structured_formatting?.secondary_text || '';
    
    return (
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{main}</div>
        {secondary && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{secondary}</div>
        )}
        {suggestion.distance_meters && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {suggestion.distance_meters < 1000 
              ? `${suggestion.distance_meters}m away`
              : `${(suggestion.distance_meters / 1000).toFixed(1)}km away`
            }
          </div>
        )}
      </div>
    );
  };

  // Show error if API returns an error
  if (!isConfigured) {
    return (
      <div className="relative">
        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <div className="text-sm text-red-700 dark:text-red-300">
            Address search is temporarily unavailable. Please enter address manually.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative flex">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          placeholder={hasLocation ? "Search nearby..." : placeholder}
          className={`w-full p-2 pr-20 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`}
          autoComplete="off"
        />
        
        {/* Location toggle button */}
        <button
          type="button"
          onClick={hasLocation ? undefined : requestLocation}
          disabled={locationLoading}
          className={`absolute right-10 top-1/2 transform -translate-y-1/2 p-1 rounded ${
            hasLocation 
              ? 'text-green-600 dark:text-green-400' 
              : permissionState === 'denied'
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-500 hover:text-sky-600 cursor-pointer'
          } ${locationLoading ? 'animate-pulse' : ''}`}
          title={
            hasLocation 
              ? 'Location enabled - showing nearby results first' 
              : permissionState === 'denied'
              ? 'Location access denied'
              : 'Click to enable location-based search'
          }
        >
          {hasLocation ? <Navigation className="w-4 h-4" /> : <NavigationOff className="w-4 h-4" />}
        </button>
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-neutral-700 ${
                index === selectedIndex ? 'bg-sky-50 dark:bg-sky-900' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                {getSuggestionIcon(suggestion)}
                {formatSuggestionText(suggestion)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && !loading && query.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="px-3 py-3 text-gray-500 dark:text-gray-400 text-sm">
            <div className="mb-2">No places found for "{query}"</div>
            <div className="text-xs text-gray-400">
              Try searching with:
              <ul className="mt-1 ml-2">
                <li>• School name: "Lincoln Elementary School"</li>
                <li>• Full address: "123 Main St, City, State"</li>
                <li>• Business name: "Target Store"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
