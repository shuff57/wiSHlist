# Self-Hosted Appwrite Deployment Guide

This guide covers deployment options for wiSHlist with self-hosted Appwrite, including Git integration setup.

## Prerequisites

1. **Self-Hosted Appwrite**: Running Appwrite on your own server
2. **GitHub Repository**: `shuff57/wiSHlist` pushed to GitHub
3. **Environment Variables**: Properly configured for your self-hosted instance

## Option 1: Git Integration (Recommended)

To enable GitHub integration on self-hosted Appwrite, you need to configure Git support.

### Step 1: Configure Git Integration Environment Variables

Add these to your Appwrite instance's `.env` file or docker-compose.yml:

```bash
# Enable Git support
_APP_VCS_ENABLED=true

# GitHub Integration
_APP_VCS_GITHUB_APP_NAME=your-github-app-name
_APP_VCS_GITHUB_PRIVATE_KEY=your-github-private-key
_APP_VCS_GITHUB_APP_ID=your-github-app-id
_APP_VCS_GITHUB_CLIENT_ID=your-github-client-id
_APP_VCS_GITHUB_CLIENT_SECRET=your-github-client-secret
_APP_VCS_GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### Step 2: Create GitHub App

1. **Go to GitHub Settings**:
   - Navigate to: https://github.com/settings/apps
   - Click "New GitHub App"

2. **Configure GitHub App**:
   ```
   GitHub App name: Appwrite-SelfHosted
   Homepage URL: https://your-appwrite-domain.com
   Webhook URL: https://your-appwrite-domain.com/v1/vcs/github/events
   ```

3. **Set Permissions**:
   - Repository permissions:
     - Contents: Read
     - Metadata: Read
     - Pull requests: Read
     - Webhooks: Write
   - Subscribe to events: Push, Pull request

4. **Generate Private Key**: Download the `.pem` file after creating the app

### Step 3: Update Appwrite Configuration

Update your `.env` with the GitHub App details and restart:

```bash
docker-compose down
docker-compose up -d
```

### Step 4: Deploy via Sites

After Git is configured:
1. Go to Appwrite Console → Sites
2. "Connect to GitHub" should now be enabled
3. Select `shuff57/wiSHlist` repository
4. Configure build settings:
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Set environment variables:
   ```
   REACT_APP_APPWRITE_ENDPOINT=https://your-appwrite-domain.com/v1
   REACT_APP_APPWRITE_PROJECT_ID=688189ad000ad6dd9410
   ```

## Option 2: Manual Static File Deployment

#### Step 1: Build the Application Locally
```bash
# Install dependencies
npm install

# Create production build
npm run build
```

#### Step 2: Deploy Build Files
The `build/` folder contains all static files needed to run your app. You can:

1. **Upload to your web server** (Apache, Nginx, etc.)
2. **Use a static hosting service** (Netlify, Vercel, etc.)
3. **Serve directly from your Appwrite server**

#### Step 3: Configure Web Server
For React Router to work properly, configure your web server to serve `index.html` for all routes.

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/build/folder;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache Configuration (.htaccess):**
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Create nginx.conf
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Step 3: Build and Run
```bash
docker build -t wishlist-app .
docker run -p 80:80 wishlist-app
```

### Option 3: Enable GitHub Integration (Self-Hosted)

If you want to enable GitHub integration on your self-hosted Appwrite:

#### Requirements:
- Appwrite 1.4+ with Sites feature enabled
- GitHub OAuth App configured
- Proper network access for webhooks

#### Configuration:
1. **Create GitHub OAuth App:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create new OAuth App
   - Set Authorization callback URL to your Appwrite instance

2. **Configure Appwrite Environment:**
```env
_APP_GITEE_CLIENT_ID=your-github-client-id
_APP_GITEE_CLIENT_SECRET=your-github-client-secret
```

3. **Restart Appwrite Services:**
```bash
docker-compose down
docker-compose up -d
```

## Environment Variables for Self-Hosted

Update your environment variables to point to your self-hosted instance:

```env
REACT_APP_APPWRITE_ENDPOINT=https://your-appwrite-domain.com/v1
REACT_APP_APPWRITE_PROJECT_ID=688189ad000ad6dd9410
```

## Recommended Approach

For self-hosted Appwrite, I recommend **Option 1 (Manual Deployment)** as it's:
- Simplest to set up
- Most reliable
- Gives you full control
- Works with any web server

You can automate this with a simple script or CI/CD pipeline if needed.

## Next Steps

1. Choose your preferred deployment method
2. Build your application locally
3. Deploy the static files to your web server
4. Configure your web server for SPA routing
5. Update your domain settings in Appwrite console

Would you like detailed instructions for any specific deployment option?
