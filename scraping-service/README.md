# 🚀 Self-Hosted Scraping Microservice Setup

This guide will help you set up and run your own product image scraping service.

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd scraping-service
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (optional)
# Default port is 3001
```

### 3. Start the Service

```bash
# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm start
```

The service will start on `http://localhost:3001`

### 4. Update React App Configuration

Add this to your React app's `.env` file:

```env
REACT_APP_SCRAPING_SERVICE_URL=http://localhost:3001
```

For production, change this to your actual server URL:
```env
REACT_APP_SCRAPING_SERVICE_URL=https://your-domain.com
```

## 🔧 API Endpoints

### POST `/api/scrape-images`
Scrape product images from a URL.

**Request:**
```json
{
  "productUrl": "https://www.amazon.com/dp/B08N5WRWNW",
  "productName": "Echo Dot (optional)",
  "options": {
    "width": 150,
    "height": 150
  }
}
```

**Response:**
```json
{
  "images": ["https://image1.jpg", "https://image2.jpg"],
  "retailer": "amazon",
  "count": 2,
  "cached": false
}
```

### GET `/health`
Check service health.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "cacheSize": 45
}
```

### GET `/api/cache-stats`
Get cache statistics.

## 🏪 Supported Retailers

- ✅ **Amazon** - Full image extraction
- ✅ **Target** - Scene7 CDN images
- ✅ **Walmart** - Product images
- ✅ **Best Buy** - Product gallery
- ✅ **Generic** - Open Graph and meta images

## 🔄 Caching

The service automatically caches results for 24 hours to improve performance and reduce load on retailer websites.

- **In-Memory Cache**: Default (lost on restart)
- **Redis Cache**: Optional (configure REDIS_URL in .env)

## 🚀 Production Deployment

### Option 1: Traditional Server

1. Install Node.js on your server
2. Clone/upload your code
3. Install dependencies: `npm install --production`
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "scraping-service"
   pm2 startup
   pm2 save
   ```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t scraping-service .
docker run -p 3001:3001 scraping-service
```

### Option 3: Cloud Platforms

Deploy to Heroku, Railway, Render, or any Node.js hosting platform.

## 🔒 Security Considerations

1. **Rate Limiting**: Built-in (100 requests per 15 minutes per IP)
2. **CORS**: Configured for cross-origin requests
3. **Input Validation**: URL validation and sanitization
4. **Error Handling**: Graceful fallbacks for failed scraping

### Optional: Add API Key Authentication

Edit `server.js` to add API key middleware:

```javascript
const API_KEY = process.env.API_KEY;

app.use('/api/', (req, res, next) => {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});
```

## 📊 Monitoring

Monitor your service:

```bash
# Check health
curl http://localhost:3001/health

# Check cache stats
curl http://localhost:3001/api/cache-stats

# Test scraping
curl -X POST http://localhost:3001/api/scrape-images \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://www.amazon.com/dp/B08N5WRWNW"}'
```

## 🐛 Troubleshooting

### Service Won't Start
- Check if port 3001 is available: `netstat -tulpn | grep 3001`
- Verify Node.js version: `node --version`

### No Images Returned
- Check service logs for errors
- Verify the product URL is accessible
- Some sites may block scraping (use VPN or proxy)

### React App Can't Connect
- Verify `REACT_APP_SCRAPING_SERVICE_URL` is set correctly
- Check CORS configuration in `server.js`
- Ensure service is running and accessible

## 🎯 Testing

Test with various retailer URLs:

```bash
# Amazon
curl -X POST http://localhost:3001/api/scrape-images \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://www.amazon.com/dp/B08N5WRWNW"}'

# Target  
curl -X POST http://localhost:3001/api/scrape-images \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://www.target.com/p/echo-dot/-/A-54191097"}'
```

Your self-hosted scraping service is now ready! 🎉
