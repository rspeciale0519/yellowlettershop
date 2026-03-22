/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@supabase/realtime-js'],
  webpack: (config, { isServer, webpack }) => {
    // Fix Windows file system caching issues
    config.cache = {
      type: 'memory',
    };

    // Fix Edge Runtime compatibility issues with Supabase realtime-js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Polyfill process for Edge Runtime compatibility
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.version': JSON.stringify(process.version),
        'process.versions': JSON.stringify({}),
      })
    );
    
    return config;
  },
}

export default nextConfig
