import { integer, pgTable, serial, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  pt: text('pt').notNull(),
  departemen: text('departemen').notNull(),
  no_hp: text('no_hp').notNull().unique(),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'admin' | 'it'
  password: text('password').notNull(),
  
  // Fitur Keamanan
  mustChangePassword: boolean('must_change_password').default(true),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  lastLoginIp: text('last_login_ip'),
  lastLoginAt: timestamp('last_login_at'),

  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  nama_barang: text('nama_barang').notNull(),
  kategori: text('kategori').notNull(),
  sub_kategori: text('sub_kategori'),
  harga: integer('harga').notNull(),
  stok: integer('stok').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  total_amount: integer('total_amount').notNull(),
  status: text('status').notNull().default('Proses'),
  keterangan: text('keterangan'),
  pickupToken: text('pickup_token').unique(),
  pickupTokenExpiresAt: timestamp('pickup_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id),  // nullable: product may be deleted but order must survive
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  catatan: text('catatan'),
});

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  catatan: text('catatan'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  keys: text('keys').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  receiverId: integer('receiver_id').references(() => users.id), // null jika broadcast atau ke semua admin
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatsRelations = relations(chats, ({ one }) => ({
  sender: one(users, {
    fields: [chats.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [chats.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const settings = pgTable('settings', {
  setting_key: text('setting_key').primaryKey(),
  setting_value: text('setting_value').notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
});
