import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionState: 'unknown'
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        permissionState: 'denied'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    const options = {
      enableHighAccuracy: false, // Use network-based location for faster results
      timeout: 10000, // 10 second timeout
      maximumAge: 300000 // Use cached location if less than 5 minutes old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionState: 'granted'
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setLocation(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
          permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : 'unknown'
        }));
      },
      options
    );
  }, []);

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocation(prev => ({
          ...prev,
          permissionState: result.state as 'granted' | 'denied' | 'prompt'
        }));
        
        // Auto-request location if permission is already granted
        if (result.state === 'granted') {
          requestLocation();
        }
      }).catch(() => {
        // Permissions API not supported, fallback to unknown state
        setLocation(prev => ({ ...prev, permissionState: 'unknown' }));
      });
    }
  }, [requestLocation]);

  const clearLocation = useCallback(() => {
    setLocation({
      latitude: null,
      longitude: null,
      error: null,
      loading: false,
      permissionState: 'unknown'
    });
  }, []);

  const hasLocation = location.latitude !== null && location.longitude !== null;

  return {
    ...location,
    hasLocation,
    requestLocation,
    clearLocation
  };
};
