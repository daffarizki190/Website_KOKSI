import 'dotenv/config';
import { db } from './src/db/index';
import { products } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Koleksi gambar stok beresolusi tinggi berdasarkan kategori
const imageDictionary: Record<string, string[]> = {
  'Minuman Dingin': [
    'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=400&auto=format&fit=crop', // Kopi Es
    'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=400&auto=format&fit=crop', // Air mineral / Es
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop', // Soft drink
  ],
  'Makanan Instan': [
    'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=400&auto=format&fit=crop', // Mie instan
    'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=400&auto=format&fit=crop', // Sup / Makanan cepat
  ],
  'Roti & Pastry': [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop', // Roti
    'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=400&auto=format&fit=crop', // Pastry
  ],
  'Snack & Camilan': [
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=400&auto=format&fit=crop', // Snack ringan
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=400&auto=format&fit=crop', // Keripik
  ],
  'Alat Tulis': [
    'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=400&auto=format&fit=crop', // Kertas & Pulpen
    'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=400&auto=format&fit=crop', // ATK
  ],
  'default': [
    'https://images.unsplash.com/photo-1606830733744-0ad22d710d52?q=80&w=400&auto=format&fit=crop', // General Box/Product
    'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop', // Grocery
  ]
};

function getRandomImage(category: string, sub_category: string): string {
  // Coba cari dari sub kategori dulu
  if (sub_category && imageDictionary[sub_category]) {
    const list = imageDictionary[sub_category];
    return list[Math.floor(Math.random() * list.length)];
  }
  // Coba dari kategori
  if (category && imageDictionary[category]) {
    const list = imageDictionary[category];
    return list[Math.floor(Math.random() * list.length)];
  }
  // Default jika tidak dikenali
  const list = imageDictionary['default'];
  return list[Math.floor(Math.random() * list.length)];
}

async function assignImages() {
  console.log('🔄 Memulai proses pemberian gambar otomatis ke seluruh produk...');
  
  try {
    const allProducts = await db.select().from(products);
    console.log(`Menemukan ${allProducts.length} produk di database.`);
    
    let updatedCount = 0;
    
    for (const p of allProducts) {
      // Jika gambar sudah ada (dan bukan string kosong), bisa kita lewati atau timpa
      // Untuk script ini, kita akan menimpa/memperbarui semua produk yang gambarnya kosong, 
      // atau jika Anda ingin menimpa semuanya, hapus kondisi !p.imageUrl
      if (!p.imageUrl || p.imageUrl.trim() === '') {
        const newImage = getRandomImage(p.kategori, p.sub_kategori || '');
        
        await db.update(products)
          .set({ imageUrl: newImage })
          .where(eq(products.id, p.id));
          
        updatedCount++;
        console.log(`✅ Gambar ditambahkan untuk: ${p.nama_barang} (${p.sub_kategori})`);
      }
    }
    
    console.log(`🎉 Selesai! Sebanyak ${updatedCount} produk telah diperbarui dengan gambar.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal menjalankan script:', error);
    process.exit(1);
  }
}

assignImages();
