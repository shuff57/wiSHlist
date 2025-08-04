import React, { useState, useRef, useEffect } from 'react';
import { MapPin, School, Building, Navigation, NavigationOff } from 'lucide-react';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';
import { useGeolocation } from '../../hooks/useGeolocation';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Search for school or address...",
  initialValue = "",
  className = ""
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
  
  const { suggestions, loading, debouncedSearch, parseAddress, clearSuggestions } = useAddressAutocomplete({
    userLatitude: latitude || undefined,
    userLongitude: longitude || undefined
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

  const handleSuggestionClick = (suggestion: any) => {
    const parsed = parseAddress(suggestion);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    onAddressSelect({
      name: parsed.name || '',
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip
    });
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
    if (suggestion.address?.amenity === 'school' || suggestion.address?.school) {
      return <School className="w-4 h-4 text-blue-600" />;
    }
    if (suggestion.address?.amenity) {
      return <Building className="w-4 h-4 text-gray-600" />;
    }
    return <MapPin className="w-4 h-4 text-gray-600" />;
  };

  const formatSuggestionText = (suggestion: any) => {
    const parts = suggestion.display_name.split(',');
    const main = parts[0];
    const secondary = parts.slice(1, 3).join(',');
    
    return (
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{main}</div>
        {secondary && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{secondary}</div>
        )}
        {suggestion.distance && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {suggestion.distance < 1 
              ? `${Math.round(suggestion.distance * 1000)}m away`
              : `${suggestion.distance.toFixed(1)}km away`
            }
          </div>
        )}
      </div>
    );
  };

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
      </div>      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.lat}-${suggestion.lon}`}
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
            <div className="mb-2">No addresses found for "{query}"</div>
            <div className="text-xs text-gray-400">
              Try searching with:
              <ul className="mt-1 ml-2">
                <li>• Full address: "123 Main St, City"</li>
                <li>• School name: "Lincoln Elementary"</li>
                <li>• Just street name: "Oak Street"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
