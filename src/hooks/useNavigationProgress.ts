import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigationProgress = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loading bar when location changes
    setIsNavigating(true);
    
    // Hide loading bar after a brief delay
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isNavigating;
};
