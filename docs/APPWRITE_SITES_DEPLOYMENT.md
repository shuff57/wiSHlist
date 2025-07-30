# Appwrite Sites Deployment Guide

This guide walks you through deploying the wiSHlist app to Appwrite Sites.

## Prerequisites

1. **Appwrite Project**: You need an existing Appwrite project with your database collections set up
2. **GitHub Repository**: Your code should be pushed to GitHub (repository: `shuff57/wiSHlist`)
3. **Environment Variables**: Your Appwrite endpoint and project ID

## Deployment Steps

### 1. Access Appwrite Console
- Go to [Appwrite Console](https://cloud.appwrite.io/)
- Navigate to your project
- Click on "Sites" in the left sidebar

### 2. Create a New Site
- Click "Add Site" or "Create Site"
- Choose "Connect Git Repository"
- Select GitHub as your provider
- Authorize Appwrite to access your GitHub account

### 3. Configure Repository
- Repository: `shuff57/wiSHlist`
- Branch: `main`
- Root Directory: `/` (leave empty for root)

### 4. Build Settings
- **Framework**: React
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `build`

### 5. Environment Variables
Add these environment variables in the Appwrite Sites dashboard:

```
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=your-actual-project-id
```

**Important**: Replace `your-actual-project-id` with your real Appwrite project ID.

### 6. Deploy
- Click "Deploy" to start the initial deployment
- Appwrite will clone your repository and build your app
- Future pushes to the `main` branch will trigger automatic deployments

## Build Configuration

The app is configured with:
- **Node.js** for the build environment
- **React Scripts** for building
- **Output Directory**: `build/`
- **SPA Support**: Enabled for React Router

## Environment Variables in Your Local Project

Your local `.env` file should contain:
```
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=your-actual-project-id
```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure build command succeeds locally: `npm run build`
- Check build logs in Appwrite Sites dashboard

### App Loads but API Fails
- Verify environment variables are set correctly in Appwrite Sites
- Check that your Appwrite project ID matches
- Ensure your domain is added to allowed origins in Appwrite settings

### Routing Issues (404 on Refresh)
- Verify SPA (Single Page Application) support is enabled
- Check that `public/index.html` exists and is configured for React Router

## Post-Deployment

1. **Custom Domain** (Optional): Add your custom domain in the Sites settings
2. **SSL Certificate**: Automatically provided by Appwrite
3. **CDN**: Automatically enabled for better performance

## Automatic Deployments

Once set up, every push to the `main` branch will:
1. Trigger a new build automatically
2. Deploy the updated app
3. Update your live site

You can monitor deployments in the Appwrite Sites dashboard.
