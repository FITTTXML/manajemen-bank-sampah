const nextConfig = {
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  // Prevent Watchpack from scanning D:\ root and System Volume Information
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/System Volume Information/**', '**/.git/**'],
    };
    return config;
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'https://manajemen-bank-sampah-production-110e.up.railway.app';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;
