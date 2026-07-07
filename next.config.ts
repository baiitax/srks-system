/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keeps your remote preview window working
  allowedDevOrigins: ['172.22.144.1'],
  
  // PERFORMANCE BOOST: Tell Next.js to tree-shake heavy UI libraries
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig; 
// Use `export default nextConfig;` if your file ends in .mjs