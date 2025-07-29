# wiSHlist - Quick Setup Guide 🎓📝

## 📖 Overview

wiSHlist is a modern, user-friendly wishlist application designed specifically for teachers to create and share classroom supply wishlists with supporters. Built with React, TypeScript, and Appwrite, it empowers educators to create organized wishlists of classroom supplies and materials, making it easy for parents, community members, and supporters to contribute to student success.

## ✨ Key Features

### For Teachers
- **📋 Wishlist Management**: Create and manage multiple wishlists with drag-and-drop reordering
- **🎨 Customizable Items**: Add items with names, descriptions, store links, and estimated costs
- **👥 User Management**: Invite and manage recommenders and administrators
- **📊 Contribution Tracking**: Monitor which items have been purchased and by how many contributors
- **🔗 Easy Sharing**: Generate shareable links and keys for public wishlist access

### For Supporters
- **🛍️ Easy Browsing**: View wishlists in list or grid layout
- **🔍 Item Details**: See item descriptions, costs, and store links
- **✅ Purchase Tracking**: Mark items as purchased to prevent duplicates
- **🌐 Direct Links**: Quick access to store pages for purchasing
- **💡 Suggestions**: Recommend new items to teachers

### Technical Features
- **🌙 Dark/Light Mode**: Automatic theme switching
- **🔐 Secure Authentication**: User registration and login with Appwrite
- **📦 Real-time Updates**: Live synchronization of wishlist changes
- **🎯 Modern UI**: Clean, intuitive interface built with Tailwind CSS

---

## 📚 For Complete Documentation & Installation Guide
**👉 Visit the full repository: [https://github.com/shuff57/wiSHlist](https://github.com/shuff57/wiSHlist)**

The main repository contains:
- Complete installation instructions
- Appwrite setup guide
- Deployment instructions
- Project structure details
- Contributing guidelines

## 📖 Overview

wiSHlist is a modern, user-friendly wishlist application designed specifically for teachers to create and share classroom supply wishlists with supporters. Built with React, TypeScript, and Appwrite, it empowers educators to create organized wishlists of classroom supplies and materials, making it easy for parents, community members, and supporters to contribute to student success.

## ✨ Key Features

### For Teachers
- **📋 Wishlist Management**: Create and manage multiple wishlists with drag-and-drop reordering
- **🎨 Customizable Items**: Add items with names, descriptions, store links, and estimated costs
- **👥 User Management**: Invite and manage recommenders and administrators
- **📊 Contribution Tracking**: Monitor which items have been purchased and by how many contributors
- **🔗 Easy Sharing**: Generate shareable links and keys for public wishlist access

### For Supporters
- **🛍️ Easy Browsing**: View wishlists in list or grid layout
- **🔍 Item Details**: See item descriptions, costs, and store links
- **✅ Purchase Tracking**: Mark items as purchased to prevent duplicates
- **🌐 Direct Links**: Quick access to store pages for purchasing
- **💡 Suggestions**: Recommend new items to teachers

### Technical Features
- **🌙 Dark/Light Mode**: Automatic theme switching
- **🔐 Secure Authentication**: User registration and login with Appwrite
- **📦 Real-time Updates**: Live synchronization of wishlist changes
- **🎯 Modern UI**: Clean, intuitive interface built with Tailwind CSS

---

# Optional: Enhanced Product Thumbnails with Smartproxy

## 🚀 Get Started in 3 Steps

### 1. Sign Up for Smartproxy
- Visit: https://smartproxy.com/scraping/ecommerce
- Create account and get your username/password credentials
- Start with their free trial credits

### 2. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials:
REACT_APP_SMARTPROXY_USERNAME=your-username
REACT_APP_SMARTPROXY_PASSWORD=your-password
```

### 3. Test the System
```bash
npm start
```

Your thumbnails will now work for:
- ✅ **Amazon** - Full product data extraction
- ✅ **Target** - AI-powered scraping  
- ✅ **Walmart** - AI-powered scraping
- ✅ **Best Buy** - AI-powered scraping
- ✅ **Wayfair** - Dedicated Wayfair API
- ✅ **Any eCommerce site** - Universal AI parser

## 💰 Pricing
- **Pay-per-request** - Only pay for what you use
- **Free trial** included with signup
- **Volume discounts** available
- **Much cheaper** than building your own infrastructure

## 🔧 How It Works
The system automatically detects the retailer and uses the appropriate Smartproxy API:

```typescript
// Amazon → Uses dedicated Amazon API
target: 'amazon', parse: true

// Target/Walmart/Best Buy → Uses AI eCommerce parser  
target: 'ecommerce', parse: true, parser_type: 'ecommerce_product'

// Wayfair → Uses dedicated Wayfair API
target: 'wayfair', parse: false
```

## 📋 What You Get
- **No CORS issues** - Server-side scraping
- **High-quality images** - Direct from retailer servers
- **Automatic resizing** - Perfect for thumbnails
- **Professional reliability** - Enterprise-grade infrastructure
- **Multi-retailer support** - One API for everything

## ⚠️ Important Notes
- **Credentials required** - System will show placeholders without valid credentials
- **API costs apply** - Monitor usage through Smartproxy dashboard
- **Rate limits** - Smartproxy handles throttling automatically
- **Error handling** - System falls back to placeholders on failures

## 🆘 Need Help?
- Smartproxy Documentation: https://github.com/Decodo/eCommerce-Scraping-API
- Smartproxy Support: Available through their dashboard
- API Status: Check Smartproxy service status page
