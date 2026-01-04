import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... votre configuration existante ...
  
  // Pour développement avec domaine personnalisé
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
