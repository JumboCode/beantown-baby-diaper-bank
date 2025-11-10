const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/": ["./src/generated/prisma/**"],
    },
  },
};

export default nextConfig;
