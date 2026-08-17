import { CategoryStructure } from '../types';

export const CATEGORY_STRUCTURES: CategoryStructure[] = [
  {
    id: 'fnb',
    name: 'Makanan & Minuman Siap Saji (F&B)',
    shortName: 'Makanan & Minuman Siap Saji (F&B)',
    iconName: 'UtensilsCrossed',
    color: 'amber',
    subCategories: [
      'Minuman Dingin & Kemasan',
      'Makanan Ringan (Snacks)',
      'Makanan Instan',
      'Bahan Makanan (Sembako)',
      'Susu & Olahan Susu'
    ]
  },
  {
    id: 'personal_care',
    name: 'Perawatan Diri & Kesehatan (Personal Care)',
    shortName: 'Perawatan Diri & Kesehatan (Personal Care)',
    iconName: 'HeartPulse',
    color: 'teal',
    subCategories: [
      'Perawatan Mandi & Rambut',
      'Perawatan Gigi',
      'Perawatan Kulit & Tubuh',
      'Kebutuhan Wanita & Bayi',
      'Obat-obatan Bebas (OTC) & P3K'
    ]
  },
  {
    id: 'household',
    name: 'Kebutuhan Rumah Tangga (Household)',
    shortName: 'Kebutuhan Rumah Tangga (Household)',
    iconName: 'Home',
    color: 'sky',
    subCategories: [
      'Pembersih Pakaian',
      'Pembersih Rumah',
      'Perlengkapan Rumah',
      'Alat Kebersihan Dasar'
    ]
  },
  {
    id: 'impulse_items',
    name: 'Rokok & Produk Kasir (Impulse Items)',
    shortName: 'Rokok & Produk Kasir (Impulse Items)',
    iconName: 'Sparkles',
    color: 'rose',
    subCategories: [
      'Rokok & Aksesori',
      'Permen & Cokelat Kecil',
      'Aksesori & Baterai'
    ]
  },
  {
    id: 'non_food',
    name: 'Non-Food & Perlengkapan Umum',
    shortName: 'Non-Food & Perlengkapan Umum',
    iconName: 'FolderKanban',
    color: 'indigo',
    subCategories: [
      'Alat Tulis Kantor (ATK) Dasar',
      'Perlengkapan Plastik & Dapur'
    ]
  }
];

export const ALL_MAIN_CATEGORIES = CATEGORY_STRUCTURES.map(c => c.name);

export const ALL_SUB_CATEGORIES = CATEGORY_STRUCTURES.flatMap(c => c.subCategories);

export const getSubCategoriesForCategory = (categoryName: string): string[] => {
  const match = CATEGORY_STRUCTURES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase() || c.shortName.toLowerCase() === categoryName.toLowerCase()
  );
  return match ? match.subCategories : [];
};

export const getCategoryForSubCategory = (subCategoryName: string): string | undefined => {
  const match = CATEGORY_STRUCTURES.find(c =>
    c.subCategories.some(sub => sub.toLowerCase() === subCategoryName.toLowerCase())
  );
  return match ? match.name : undefined;
};
