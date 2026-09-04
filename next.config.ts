import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next only serves quality values declared here. 90 is for the project
    // covers on the folder sheets, which are magnified in place and show
    // compression at the default 75.
    qualities: [75, 90],
  },
};

export default nextConfig;
