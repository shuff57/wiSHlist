/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Configure external images for URL previews
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    unoptimized: true
  },
  
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

    // Handle native binary modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        're2': 'commonjs re2',
        'hpagent': 'commonjs hpagent'
      });
    }

    // Ignore binary modules for client-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
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
