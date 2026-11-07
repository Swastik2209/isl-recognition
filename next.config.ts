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
  // Exclude API routes from static export
  skipTrailingSlashRedirect: true,
  // The /api route can't be statically exported, so we need to handle it
  // For GitHub Pages, we'll just not include it
};

export default nextConfig;