import { app, seedDefaultUsers } from '../server';

// Run seed on cold start (Vercel serverless)
let seeded = false;
const ensureSeeded = async () => {
  if (!seeded) {
    try {
      await seedDefaultUsers();
      seeded = true;
    } catch (err) {
      console.error('Seed on cold start failed:', err);
    }
  }
};

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await ensureSeeded();
  return app(req, res);
}
