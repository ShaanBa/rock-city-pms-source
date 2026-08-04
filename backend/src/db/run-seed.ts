import { db } from "./client";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("=== Rock City PMS — Seeding Database ===");
    try {
        const guestSql = fs.readFileSync(path.join(__dirname, "../../seed-anonymous-guest.sql"), "utf-8");
        console.log("Seeding anonymous guest...");
        await db.execute(sql.raw(guestSql));

        const roomsSql = fs.readFileSync(path.join(__dirname, "../../seed-rooms.sql"), "utf-8");
        console.log("Seeding rooms...");
        await db.execute(sql.raw(roomsSql));

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

main();
