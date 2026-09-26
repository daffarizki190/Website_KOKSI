import 'dotenv/config';
import { eq, gt } from 'drizzle-orm';
import { db } from './src/db/index';
import { orders } from './src/db/schema';

async function fixQR() {
  console.log('Fixing QR code expiration times in the database...');
  try {
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
    
    // Any order whose expiration is > 15 minutes from now gets capped to 15 minutes
    const result = await db.update(orders)
      .set({ pickupTokenExpiresAt: fifteenMinutesFromNow })
      .where(gt(orders.pickupTokenExpiresAt, fifteenMinutesFromNow))
      .returning();

    console.log(`Updated ${result.length} orders.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

fixQR();
