import "dotenv/config";
import { defineConfig } from "prisma/config";

// env() は未設定時に即 throw するため、Vercel ビルドでは fallback を使う
const databaseUrl =
  process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
