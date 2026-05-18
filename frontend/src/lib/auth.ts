import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";
const dbPath = path.join(process.cwd(), "auth.db");
console.log("DB PATH:", dbPath);

const db = new Kysely({
  dialect: new SqliteDialect({
    database: new Sqlite(path.join(process.cwd(), "auth.db")),
  }),
});

export const auth = betterAuth({
  database: kyselyAdapter(db, { type: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: ["http://localhost:3000"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
