import 'dotenv/config';
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function fix() {
  try {
    await db.execute(sql`UPDATE users SET must_change_password = true WHERE no_hp NOT IN ('081234567890', '081222333444', '081299998888')`);
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
