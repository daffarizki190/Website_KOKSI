export interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  sub_kategori?: string | null;
  harga: number;
  stok: number;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  catatan?: string | null;
}

export interface User {
  id: number;
  nama: string;
  pt: string;
  departemen: string;
  no_hp: string;
  role: 'user' | 'admin' | 'it';
  createdAt?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    nama_barang: string;
    kategori?: string;
    sub_kategori?: string;
  };
  catatan?: string | null;
}

export interface Order {
  id: number;
  userId: number;
  total_amount: number;
  status: string;
  keterangan?: string;
  createdAt: string;
  user?: {
    id: number;
    nama: string;
    pt: string;
    departemen: string;
    no_hp: string;
  };
  items: OrderItem[];
}

export interface CategoryStructure {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  color: string;
  subCategories: string[];
}
