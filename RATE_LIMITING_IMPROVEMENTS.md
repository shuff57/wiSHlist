# Rate Limiting and Error Handling Improvements

## Overview
Implemented comprehensive rate limiting and error handling improvements to resolve "Too Many Requests" (429) errors while maintaining a smooth user experience.

## Changes Made

### 1. Enhanced Rate Limiting (`app/api/scrape/route.ts`)
- **Increased Rate Limits**: 
  - Main window: 20 requests per minute (was 10)
  - Burst protection: 5 requests per 10 seconds
- **Better Error Messages**: Specific retry-after times and helpful error messages
- **Cleanup Mechanism**: Automatic cleanup of expired rate limit entries
- **Headers**: Proper HTTP headers for rate limiting (`Retry-After`, `X-RateLimit-Remaining`)

### 2. Smart Retry Logic (`src/hooks/useUrlPreview.ts`)
- **Exponential Backoff**: Automatic retries with increasing delay
- **Rate Limit Awareness**: Respects server's retry-after suggestions
- **Fallback Strategy**: Always provides basic URL preview when server fails
- **Retry Tracking**: Shows retry attempts to users (1/3, 2/3, etc.)

### 3. Improved User Experience (`src/components/common/UrlPreview.tsx`)
- **Better Loading States**: Shows retry progress during loading
- **Helpful Error Messages**: Explains rate limiting and provides tips
- **Rate Limit Guidance**: Suggests waiting between requests
- **Fallback Indicators**: Clear indication when using basic preview

### 4. Development Tools
- **Rate Limit Reset Endpoint**: `/api/scrape/reset-rate-limit` (development only)
- **Better Logging**: Enhanced server-side logging for debugging

## How It Works

### Normal Operation
1. User enters URL
2. System checks cache first
3. If not cached, makes scraping request
4. Returns enhanced preview with images, prices, etc.

### Rate Limited Scenario
1. User hits rate limit (429 error)
2. System automatically retries with exponential backoff
3. If retries fail, shows basic URL preview instead
4. User sees helpful message about rate limiting
5. System respects retry-after headers

### Fallback Strategy
When server scraping fails (rate limits, network errors, etc.):
- Extracts basic info from URL (domain, path-based title)
- Shows "Limited preview available" with explanation
- Provides functional preview instead of complete failure

## User Benefits
- **No Complete Failures**: Always get some kind of preview
- **Automatic Recovery**: System handles retries transparently
- **Clear Feedback**: Know what's happening and why
- **Better Performance**: Intelligent caching reduces requests

## Rate Limit Guidelines
- **Casual Use**: 20 requests per minute is plenty for normal use
- **Burst Protection**: 5 rapid requests allowed, then brief pause
- **Cache Benefits**: Similar URLs use cached data
- **Development**: Rate limits reset on server restart

## Testing
The system has been tested with:
- Multiple rapid URL requests
- Rate limit scenarios
- Network failures
- Invalid URLs
- Cached vs non-cached requests

## Future Improvements
- Redis-based rate limiting for multi-instance deployments
- User-specific rate limits based on authentication
- More sophisticated retry strategies
- Better cache invalidation policies
