import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
let client: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  if (!database) {
    client = postgres(connectionString, { prepare: false });
    database = drizzle(client, { schema });
  }

  return database;
}

export async function closeDatabase() {
  await client?.end();
  client = undefined;
  database = undefined;
}
