const isDev = process.env.NODE_ENV === 'development'
const enablePWAinDev = process.env.PWA_DEV === 'true'

const withPWA = (isDev && !enablePWAinDev)
  ? (config) => config
  : require('@ducanh2912/next-pwa').default({
      dest: 'public',
      disable: false,
      register: true,
      skipWaiting: true,
      sw: 'sw.js',
      fallbacks: {
        document: '/offline',
      },
    })

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  reactStrictMode: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  transpilePackages: ['shared'],
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
}

module.exports = withPWA(nextConfig)
