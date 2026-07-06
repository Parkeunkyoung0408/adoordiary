/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    localPatterns: [
      {
        pathname: "/assets/artworks/**",
      },
    ],
  },
};

export default nextConfig;
