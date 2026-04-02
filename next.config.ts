import { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  outputFileTracingIncludes: {
    "/": ["./src/generated/prisma/**"],
  },
  outputFileTracingExcludes: {
    "/": ["./prisma/data/**"], // <- skip this directory
  },
};

export default nextConfig;
