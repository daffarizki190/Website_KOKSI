import 'dotenv/config';
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function fixSeq() {
  try {
    const res = await db.execute(sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
    console.log('✅ Sequence updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
}
fixSeq();
