/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["avatars.dicebear.com", "gateway.kumandra.org", "www.facebook.com"],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
