import { createClient, Client } from "@libsql/client";

let _client: Client | null = null;
let _sqlite: any = null;

export const isProduction = process.env.NODE_ENV === "production";

export function getTursoClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _client;
}

export function getSqliteDb() {
  if (!_sqlite) {
    const Database = require("better-sqlite3");
    const path = require("path");
    _sqlite = new Database(path.join(process.cwd(), "auth.db"));
  }
  return _sqlite;
}

export async function dbExecute(sql: string, args: any[] = []) {
  if (isProduction) {
    const result = await getTursoClient().execute({ sql, args });
    return result.rows;
  } else {
    const db = getSqliteDb();
    return db.prepare(sql).all(...args);
  }
}

export async function dbRun(sql: string, args: any[] = []) {
  if (isProduction) {
    await getTursoClient().execute({ sql, args });
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...args);
  }
}