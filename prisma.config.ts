import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // url: "file:./dev.db",           // SQLite
    url: process.env["DATABASE_URL"],   // PostgreSQL
  },
});