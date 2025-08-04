# Google Places API Setup Guide

This application now uses Google Places API for intelligent address autocomplete with school prioritization.

## Setup Instructions

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### 2. Enable Required APIs
Navigate to **APIs & Services > Library** and enable:
- **Places API (New)** - For address autocomplete
- **Places API** - For place details
- **Geocoding API** - For address validation (optional)

### 3. Create API Key
1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API Key**
3. Copy the generated API key

### 4. Secure Your API Key (IMPORTANT!)
1. Click on your API key to edit it
2. Under **Application restrictions**:
   - Choose **HTTP referrers (web sites)**
   - Add your domains:
     - `localhost:3000/*` (for development)
     - `yourdomain.com/*` (for production)
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose only the APIs you enabled
4. Save the restrictions

### 5. Set Up Billing
- Google Places API requires a billing account
- You get **$200 free credits per month**
- Most small applications stay within the free tier

### 6. Configure Environment Variables
Add your API key to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

**Important**: 
- Use `NEXT_PUBLIC_` prefix for client-side access
- Never commit your actual API key to version control
- The `.env.local` file is already in `.gitignore`

## Features

### Current Implementation
- **School Prioritization**: Searches prioritize educational institutions
- **Location Awareness**: Results biased toward user's location (50km radius)
- **Rich Data**: Gets name, address, phone, website from Google Places
- **Session-Based Pricing**: Efficient cost model (one session per selection)
- **US-Only Results**: Restricted to United States addresses
- **Intelligent Parsing**: Automatically extracts address components

### Search Types
- **Schools**: Primary and secondary schools, universities
- **Establishments**: Businesses, organizations, landmarks
- **Addresses**: Street addresses and locations

### API Usage Optimization
- **Debounced Search**: 300ms delay to reduce API calls
- **Session Management**: One session per user selection
- **Request Cancellation**: Prevents unnecessary API calls
- **Location Biasing**: Prioritizes nearby results

## Cost Estimation

### Pricing (after $200 free monthly credit)
- **Autocomplete**: $2.83 per 1,000 sessions
- **Place Details**: $17 per 1,000 requests

### Expected Usage for School Wishlist App
- **Small (100 users/month)**: $0 (within free tier)
- **Medium (1,000 users/month)**: $0-5/month
- **Large (10,000 users/month)**: $20-50/month

### What's a Session?
A session starts when typing begins and ends when:
- User selects a place
- Session times out (3 minutes)
- User clears the input

Example: Typing "Lin" → "Lincoln" → "Lincoln Elementary" and selecting = **1 session**

## Error Handling

The component will show a helpful error message if:
- API key is missing or invalid
- API quotas are exceeded
- Network connectivity issues occur

## Fallback Strategy

If Google Places API is unavailable, you can:
1. Keep the old OpenStreetMap implementation as backup
2. Display a user-friendly error message
3. Allow manual address entry

## Monitoring Usage

Track your API usage in Google Cloud Console:
1. Go to **APIs & Services > Quotas**
2. Monitor your daily/monthly usage
3. Set up billing alerts if needed

## Security Best Practices

1. **Restrict API Key**: Always use application and API restrictions
2. **Environment Variables**: Never hardcode API keys
3. **Regular Rotation**: Consider rotating API keys periodically
4. **Monitor Usage**: Watch for unexpected usage spikes
5. **Error Logging**: Log API errors for debugging

## Troubleshooting

### Common Issues
- **"API key not configured"**: Check `.env.local` file and restart dev server
- **"Invalid API key"**: Verify key is correct and APIs are enabled
- **"Quota exceeded"**: Check usage in Google Cloud Console
- **No results**: Verify API restrictions allow your domain

### Testing
1. Start dev server: `npm run dev`
2. Navigate to wishlist edit page
3. Try searching for local schools
4. Verify address autocomplete works
5. Check browser console for any errors
