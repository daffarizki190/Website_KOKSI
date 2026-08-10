import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './src/db/index.ts';
import { users, products, orders, orderItems } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_koperasi';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- TYPES ---
export interface AuthRequest extends Request {
  user?: { id: number; role: string; no_hp: string; nama: string };
}

// --- MIDDLEWARES ---
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nama, pt, departemen, no_hp, password } = req.body;
    const existingUser = await db.select().from(users).where(eq(users.no_hp, no_hp));
    if (existingUser.length > 0) {
      res.status(400).json({ error: 'No HP already registered' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.insert(users).values({
      nama, pt, departemen, no_hp, password: hashedPassword, role: 'user'
    }).returning();
    res.status(201).json({ message: 'User registered successfully', user: { id: newUser[0].id, nama: newUser[0].nama } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { no_hp, password } = req.body;
    const userList = await db.select().from(users).where(eq(users.no_hp, no_hp));
    const user = userList[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, no_hp: user.no_hp, nama: user.nama },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.id, nama: user.nama, role: user.role, pt: user.pt, departemen: user.departemen, no_hp: user.no_hp } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PRODUCT ROUTES ---
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      nama: users.nama,
      pt: users.pt,
      departemen: users.departemen,
      no_hp: users.no_hp,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id/password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, Number(req.params.id)))
      .returning();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const productList = await db.select().from(products);
    res.json(productList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nama_barang, kategori, harga, stok } = req.body;
    const newProduct = await db.insert(products).values({
      nama_barang, kategori, harga, stok
    }).returning();
    res.status(201).json(newProduct[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nama_barang, kategori, harga, stok } = req.body;
    const updated = await db.update(products)
      .set({ nama_barang, kategori, harga, stok })
      .where(eq(products.id, Number(req.params.id)))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.delete(products).where(eq(products.id, Number(req.params.id)));
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- ORDER ROUTES ---
app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, total_amount } = req.body; // items: [{ productId, quantity, price }]
    const userId = req.user!.id;
    
    const newOrder = await db.insert(orders).values({
      userId, total_amount
    }).returning();
    const orderId = newOrder[0].id;
    
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    }
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: {
          with: {
            product: true
          }
        }
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });
    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.get('/api/orders/all', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allOrders = await db.query.orders.findMany({
      with: {
        user: true,
        items: {
          with: {
            product: true
          }
        }
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

app.post('/api/products/batch', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const newProducts = req.body.products;
    if (!newProducts || !Array.isArray(newProducts)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const inserted = await db.insert(products).values(newProducts).returning();
    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to batch insert products' });
  }
});

// --- VITE DEV / PROD SERVER ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
