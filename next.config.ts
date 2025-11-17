import { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./src/generated/prisma/**"],
  },
};

export default nextConfig;
