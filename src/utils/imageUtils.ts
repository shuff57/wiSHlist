export const extractThumbnailFromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;

  console.log('Extracting thumbnail from URL:', url);

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    console.log('Hostname:', hostname);

    // Legacy Amazon fallback for basic ASIN extraction
    if (hostname.includes('amazon.')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4];
        console.log('Found Amazon ASIN:', asin);
        
        // Basic Amazon image URL format
        const imageUrl = `https://images.amazon.com/images/P/${asin}.01.L.jpg`;
        console.log('Using Amazon image URL:', imageUrl);
        return imageUrl;
      }
    }

    // For other sites, return null (webscraping functionality removed)
    console.log('No basic image extraction available for:', hostname);
    return null;
  } catch (error) {
    console.warn('Error extracting thumbnail from URL:', error);
    return null;
  }
};

export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(pathname);
  } catch {
    return false;
  }
};
