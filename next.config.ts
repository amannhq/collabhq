import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Pino packages from server bundle - they will be loaded at runtime
  // This prevents Turbopack from trying to bundle test files and incompatible modules
  serverExternalPackages: [
    'pino',
    'pino-pretty', // Optional dev dependency
    'thread-stream', // Used by pino-pretty
    'sonic-boom', // Used by pino
    'real-require', // Used by pino
    'pino-abstract-transport',
  ],
  
  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    // Empty config to acknowledge we're using Turbopack
    // serverExternalPackages handles the pino/thread-stream exclusion
  },
};

export default nextConfig;
