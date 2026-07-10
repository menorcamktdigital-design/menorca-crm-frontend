import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://n8n.menorca.pe/api/:path*",
        // Solo aplica en desarrollo local.
        // En producción el nginx del server ya redirige /api/ a donde corresponde.
      },
    ];
  },
};

export default nextConfig;
