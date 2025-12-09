import { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./src/generated/prisma/**"],
  },
  outputFileTracingExcludes: {
    "/": ["./prisma/data/**"], // <- skip this directory
  },
};

export default nextConfig;
