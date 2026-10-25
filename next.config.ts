import type { NextConfig } from "next";
import { imageRemotePatterns } from "./src/lib/images";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
