// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Ignora erros do ESLint apenas durante o build (não afeta em dev)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
