import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? '/isl-recognition' : '',
  assetPrefix: isGithubPages ? '/isl-recognition/' : '',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;