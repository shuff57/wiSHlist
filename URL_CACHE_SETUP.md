# URL Cache Database Setup

## Manual Setup Instructions

Since you're already using Appwrite, follow these steps to create the URL cache collection:

### 1. Go to Appwrite Console
- Navigate to https://app.huffpalmer.fyi/
- Go to your project: wiSHlist
- Navigate to Databases → Your Database (ID: 688189ad000ad6dd9410)

### 2. Create New Collection
- Click "Create Collection"
- Name: `URL Cache`
- Collection ID: You can let Appwrite generate this, or use `url-cache`

### 3. Add Attributes
Create the following attributes in order:

#### url (String)
- Type: String
- Size: 2048
- Required: Yes
- Array: No

#### normalizedUrl (String)
- Type: String  
- Size: 2048
- Required: Yes
- Array: No

#### productId (String)
- Type: String
- Size: 255
- Required: No
- Array: No

#### metadata (String)
- Type: String
- Size: 65535
- Required: Yes
- Array: No

#### timestamp (Integer)
- Type: Integer
- Required: Yes
- Array: No

#### hitCount (Integer)
- Type: Integer
- Required: Yes
- Default: 1
- Array: No

### 4. Create Indexes (Optional but Recommended)
For better query performance, create these indexes:

#### normalizedUrl Index
- Type: Key
- Attributes: `normalizedUrl`

#### timestamp Index  
- Type: Key
- Attributes: `timestamp`

#### productId Index
- Type: Key
- Attributes: `productId`

### 5. Set Permissions
Make sure the collection has appropriate permissions:
- Read: Any
- Create: Any  
- Update: Any
- Delete: Any

### 6. Update Your Code
After creating the collection, copy the Collection ID from Appwrite console and update the line in `app/api/scrape/route.ts`:

```typescript
const URL_CACHE_COLLECTION_ID = 'YOUR_COLLECTION_ID_HERE' // Replace with actual ID
```

### 7. Test the Setup
Once everything is configured, test with a URL to make sure caching works:

```bash
curl "http://localhost:3000/api/scrape?url=https://www.amazon.com"
```

The first request should be a cache miss (scrapes the URL), and subsequent requests should be cache hits (returns from database).

## Benefits of Database Caching

✅ **Persistent Storage**: Cache survives server restarts and deployments  
✅ **Scalable**: Works across multiple server instances  
✅ **Queryable**: Can analyze cache performance and usage patterns  
✅ **Cost Optimization**: Reduces proxy usage by reusing similar URLs  
✅ **No File System Dependencies**: Works on serverless platforms  

## Cache Features

- **7-day expiry**: Automatic cleanup of old entries
- **URL similarity matching**: 80% similarity threshold for reusing cache
- **Hit count tracking**: Monitor cache effectiveness  
- **Amazon product ID matching**: Smart caching for product variations
- **Background cleanup**: Periodic removal of expired entries
