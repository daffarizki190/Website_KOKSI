export interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  sub_kategori?: string | null;
  harga: number;
  stok: number;
  imageUrl?: string | null;
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
  is_blocked?: boolean;
  mustChangePassword?: boolean;
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

export interface OrderReview {
  id: number;
  orderId: number;
  userId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: number;
  total_amount: number;
  status: string;
  keterangan?: string;
  createdAt: string;
  pickupToken?: string;
  pickupTokenExpiresAt?: string;
  review?: OrderReview | null;
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
