import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';


dotenv.config({ path: '../.env'});
if (!process.env.DATABASE_URL) throw new Error("No Database URL setup!")
const pool = new Pool ({
    connectionString: process.env.DATABASE_URL
});

export const db = drizzle(pool);