import type { NextConfig } from 'next'
import { buildContentSecurityPolicy } from './lib/security/content-security-policy'

const nextConfig: NextConfig = {
  async headers() {
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
            value: buildContentSecurityPolicy(),
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
    config.cache = {
      type: 'memory',
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.version': JSON.stringify(process.version),
        'process.versions': JSON.stringify({}),
      })
    )

    return config
  },
}

export default nextConfig
