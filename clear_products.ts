import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from './src/db';
import { products, cartItems } from './src/db/schema';

async function clearProducts() {
  try {
    console.log('Clearing cart items...');
    await db.delete(cartItems);
    
    console.log('Clearing products...');
    await db.delete(products);
    
    console.log('Products cleared successfully.');
  } catch (error) {
    console.error('Failed to clear products:', error);
  }
}

clearProducts();
