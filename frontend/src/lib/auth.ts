import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import Sqlite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const db = isProduction
  ? new Kysely({
      dialect: new LibsqlDialect({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }),
    })
  : new Kysely({
      dialect: new SqliteDialect({
        database: new Sqlite(path.join(process.cwd(), "auth.db")),
      }),
    });

export const auth = betterAuth({
  database: kyselyAdapter(db, { type: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL!,
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});