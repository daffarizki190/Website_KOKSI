import { app, seedDefaultUsers } from '../server';

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

export default function handler(req: any, res: any) {
  triggerColdStartSeed();
  return app(req, res);
}
