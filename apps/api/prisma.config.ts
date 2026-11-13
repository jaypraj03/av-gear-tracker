// Prisma configuration: tells the Prisma CLI where the schema and migrations
// live, and which database to connect to (read from the DATABASE_URL in .env).
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // process.env (not env()) so `prisma generate` still works in CI,
    // where there is no .env file and no database connection is needed.
    url: process.env['DATABASE_URL'],
  },
})
