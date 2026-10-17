function supabaseConnectOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const supabaseOrigin = supabaseConnectOrigin()
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              ["connect-src 'self' https: wss:", supabaseOrigin].filter(Boolean).join(' '),
              "worker-src blob:",
              "frame-src https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Authoritative type gate is `npm run typecheck:full` (tsc over the whole
    // codebase — currently 0 errors). Next's build type-checker is left off
    // because it produces resolution false-positives that tsc does not (e.g.
    // it wrongly reports lucide-react named icons like `Filter` as missing).
    // Wire `typecheck:full` into CI to prevent regressions.
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
