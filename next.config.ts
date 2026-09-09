import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    // Next only serves quality values declared here. 90 is for the project
    // covers on the folder sheets, which are magnified in place and show
    // compression at the default 75.
    qualities: [75, 90],
  },
};

export default withBundleAnalyzer(nextConfig);
