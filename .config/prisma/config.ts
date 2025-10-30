import "dotenv/config";
import type { PrismaConfig } from "prisma";

export default {
  engine: "classic",
  migrations: {
    seed: "tsx prisma/seed.ts",
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
  // now you can use process.env variables
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
} satisfies PrismaConfig;
