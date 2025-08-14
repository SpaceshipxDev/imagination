// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  
    // Optional: avoid flaky FS cache on external drives like your "Minas Tirith" volume
    webpack: (config, { dev }) => {
      if (dev) {
        config.cache = false;
      }
      return config;
    },
  };
  
export default nextConfig;