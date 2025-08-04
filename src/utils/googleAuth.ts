/**
 * Google OAuth utilities for forcing account selector
 */

// Alternative function to create Google OAuth URL with custom parameters
export const createGoogleOAuthUrl = (
  clientId: string,
  redirectUri: string,
  state?: string
): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account', // This forces the account selector
    access_type: 'offline',
    ...(state && { state })
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Function to clear Google session
export const clearGoogleSession = (): Promise<void> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://accounts.google.com/logout';
    
    iframe.onload = () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 500);
    };
    
    document.body.appendChild(iframe);
  });
};

// Function to add logout option to clear all sessions
export const forceAccountSelector = async (): Promise<void> => {
  try {
    // Clear Google session first
    await clearGoogleSession();
    
    // Small delay to ensure logout is processed
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.warn('Could not clear Google session:', error);
  }
};
