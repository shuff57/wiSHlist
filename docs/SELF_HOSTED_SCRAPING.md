# Self-Hosted Product Image Scraping with Appwrite

## 🎯 **Self-Hosted Solution Overview**

Instead of using external APIs, this implementation uses **Appwrite Cloud Functions** to handle all product image scraping directly on your server. This gives you:

- ✅ **Complete control** - No external dependencies
- ✅ **No API costs** - Free scraping on your infrastructure  
- ✅ **Better privacy** - Data stays on your servers
- ✅ **Customization** - Modify scraping logic as needed
- ✅ **Caching** - Built-in Appwrite database caching
- ✅ **Reliability** - No third-party service downtime

## 🚀 **Setup Instructions**

### **1. Deploy the Appwrite Function**

```bash
# Navigate to your Appwrite functions directory
cd appwrite-functions/product-scraper

# Install dependencies
npm install

# Deploy to Appwrite
appwrite deploy function

# Or deploy via Appwrite Console
# Go to Functions → Create Function → Upload the folder
```

### **2. Configure Appwrite Database**

Create a collection for caching scraped images:

```json
{
  "collectionId": "image_cache",
  "name": "Image Cache",
  "attributes": [
    {
      "key": "productUrl",
      "type": "string",
      "size": 2048,
      "required": true
    },
    {
      "key": "productName", 
      "type": "string",
      "size": 255,
      "required": false
    },
    {
      "key": "retailer",
      "type": "string", 
      "size": 50,
      "required": true
    },
    {
      "key": "images",
      "type": "string",
      "size": 65535,
      "array": true,
      "required": true
    },
    {
      "key": "hostname",
      "type": "string",
      "size": 255, 
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "productUrl_index",
      "type": "key",
      "attributes": ["productUrl"]
    },
    {
      "key": "retailer_index", 
      "type": "key",
      "attributes": ["retailer"]
    }
  ]
}
```

### **3. Set Function Variables**

In Appwrite Console → Functions → product-scraper → Settings → Variables:

```env
APPWRITE_FUNCTION_ENDPOINT=https://app.huffpalmer.fyi/v1
APPWRITE_FUNCTION_PROJECT_ID=686d7df60026eca1ebb0  
APPWRITE_DATABASE_ID=your-database-id
```

### **4. Set Permissions**

**Function Permissions:**
- Execute: `any` (or restrict to authenticated users)

**Collection Permissions:**
- Read: `any` 
- Create: `any`
- Update: `any`
- Delete: `any`

## 🛍️ **Supported Retailers**

The function automatically detects and scrapes:

- **🏪 Amazon** - ASIN extraction + HTML parsing
- **🎯 Target** - Scene7 CDN image extraction  
- **🛒 Walmart** - Walmart Images CDN extraction
- **💻 Best Buy** - BBY Static CDN extraction
- **🌐 Generic** - Open Graph + JSON-LD extraction

## 📋 **How It Works**

```typescript
// React Component Usage
const urls = await appwriteImageService.getProductImages(storeLink, itemName, {
  width: 150,
  height: 150  
});
```

**Function Flow:**
1. **Cache Check** - Look for existing cached results (24hr TTL)
2. **Retailer Detection** - Auto-detect retailer from URL
3. **Targeted Scraping** - Use retailer-specific extraction logic
4. **Image Processing** - Resize/optimize images via proxy
5. **Cache Result** - Store in Appwrite database for future requests
6. **Return Images** - Send clean image URLs to frontend

## ⚡ **Performance Features**

- **Intelligent Caching** - 24-hour cache prevents repeat scraping
- **Image Resizing** - Automatic thumbnail generation
- **Batch Processing** - Multiple images per product
- **Error Handling** - Graceful fallbacks to placeholders
- **Logging** - Comprehensive function logging in Appwrite

## 🔧 **Customization**

**Add New Retailers:**
```javascript
// Add to the main function
else if (hostname.includes('newstore.')) {
  retailer = 'newstore';
  images = await scrapeNewStore(productUrl, options, log);
}

// Implement scraper function
async function scrapeNewStore(productUrl, options, log) {
  // Your custom scraping logic
}
```

**Modify Image Processing:**
```javascript
// Custom image filters
function processImages(images, options) {
  return images
    .filter(img => img.includes('high-res')) // Only high-res images
    .slice(0, 5); // Limit to 5 images
}
```

## 💰 **Cost Comparison**

**Self-Hosted (Appwrite):**
- ✅ **Free scraping** - Only server costs
- ✅ **No per-request fees** 
- ✅ **Unlimited requests**

**Third-Party APIs:**
- ❌ **$0.01-0.10 per request**
- ❌ **Rate limits**
- ❌ **Monthly minimums**

## 🔒 **Security Benefits**

- **Data Privacy** - Product URLs never leave your infrastructure
- **No API Keys** - No external credentials to manage
- **Rate Limiting** - Built-in Appwrite function limits
- **Access Control** - Appwrite permission system

## 📊 **Monitoring**

Monitor your scraping through Appwrite Console:
- **Function Logs** - Real-time scraping activity
- **Database Usage** - Cache hit rates and storage
- **Error Tracking** - Failed scraping attempts
- **Performance** - Execution times and optimization opportunities

This self-hosted solution gives you complete control while maintaining professional-grade functionality! 🎉
