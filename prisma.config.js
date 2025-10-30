// prisma.config.js
require("dotenv/config");

module.exports = {
  engine: "classic",
  migrations: { seed: "tsx prisma/seed.ts", path: "prisma/migrations" },
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
};
