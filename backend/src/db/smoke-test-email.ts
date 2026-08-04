import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the root env variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { notifyStaffOnBooking } from '../utils/notifyStaffOnBooking';

async function run() {
    console.log("=== Running Brevo Email Smoke Test ===");
    
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkIn.getDate() + 2); // 2 nights

    await notifyStaffOnBooking("Jane Doe (Smoke Test)", "King", checkIn, checkOut);
    
    console.log("Smoke test script execution complete.");
}

run();
