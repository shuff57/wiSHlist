/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Handle static assets from your existing public folder
  async redirects() {
    return []
  },
  
  // Configure webpack to handle your existing assets
  webpack: (config, { isServer }) => {
    // Handle your existing assets
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
        },
      },
    });
    
    return config;
  },
  
  // Enable experimental features for better React integration
  experimental: {
    esmExternals: false,
  },
  
  // Configure TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configure ESLint
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig
