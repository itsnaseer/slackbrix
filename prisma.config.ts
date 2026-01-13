import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // Prisma 7: datasource URL belongs here (NOT in schema.prisma)
  datasource: {
    url: env("DATABASE_URL"),
  },

  // optional, but nice to keep explicit
  migrations: {
    path: "prisma/migrations",
  },
});
