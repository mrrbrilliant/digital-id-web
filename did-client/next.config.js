/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["avatars.dicebear.com", "gateway.kumandra.org"],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
