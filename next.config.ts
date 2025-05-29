import type { NextConfig } from "next";
import { hostname } from "os";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {hostname:"images.pexels.com"}
    ],
  },
  reactStrictMode: true
};

export default nextConfig;
