import 'dotenv/config';
import { db } from './src/db/index';
import { products } from './src/db/schema';
import { eq } from 'drizzle-orm';

function getPlaceholderImage(nama: string): string {
  // Buat text yang URL-safe
  const encodedName = encodeURIComponent(nama);
  // Warna background teal (0d9488) dengan teks putih (ffffff)
  return `https://placehold.co/400x400/0d9488/ffffff.png?text=${encodedName}`;
}

async function assignImages() {
  console.log('🔄 Memulai proses pembuatan gambar produk sesuai nama...');
  
  try {
    const allProducts = await db.select().from(products);
    console.log(`Menemukan ${allProducts.length} produk di database.`);
    
    let updatedCount = 0;
    
    for (const p of allProducts) {
      const newImage = getPlaceholderImage(p.nama_barang);
      
      await db.update(products)
        .set({ imageUrl: newImage })
        .where(eq(products.id, p.id));
        
      updatedCount++;
      console.log(`✅ Gambar sesuai nama dibuat untuk: ${p.nama_barang}`);
    }
    
    console.log(`🎉 Selesai! Sebanyak ${updatedCount} produk telah diperbarui dengan gambar nama.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal menjalankan script:', error);
    process.exit(1);
  }
}

assignImages();
