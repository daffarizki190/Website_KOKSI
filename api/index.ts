import { app, seedDefaultUsers } from '../server.ts';

// Trigger seed in background on cold start without blocking initial request
let seedTriggered = false;
const triggerColdStartSeed = () => {
  if (!seedTriggered) {
    seedTriggered = true;
    seedDefaultUsers().catch((err) => {
      console.warn('Cold-start DB seed check notice:', err?.message || err);
    });
  }
};

// Vercel serverless request handler
export default async function handler(req: any, res: any) {
  triggerColdStartSeed();
  return app(req, res);
}
