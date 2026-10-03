import * as dotenv from 'dotenv';
dotenv.config();
import { db } from './src/db/index';
import { products } from './src/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function run() {
  console.log("Checking for duplicate products...");
  const allProducts = await db.select().from(products);
  const seen = new Map<string, number>();
  const toDelete: number[] = [];
  
  for (const p of allProducts) {
    const key = p.nama_barang.trim().toLowerCase();
    if (seen.has(key)) {
      toDelete.push(p.id);
    } else {
      seen.set(key, p.id);
    }
  }
  
  console.log(`Found ${toDelete.length} duplicate products.`);
  if (toDelete.length > 0) {
    console.log("Deleting duplicates:", toDelete);
    await db.delete(products).where(inArray(products.id, toDelete));
    console.log("Duplicates deleted successfully.");
  }
}

run().then(() => process.exit(0)).catch(console.error);
