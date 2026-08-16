import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';

// Add global connection pool caching to persist across hot-reloads and serverless invocations
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SQL_DATABASE_URL;
    
    let poolConfig: PoolConfig;

    if (connectionString) {
      const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
      poolConfig = {
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 4000,
      };
    } else {
      const host = process.env.SQL_HOST;
      const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres';
      const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '';
      const database = process.env.SQL_DB_NAME || 'postgres';
      const port = Number(process.env.SQL_PORT) || 5432;
      const isLocal = !host || host === 'localhost' || host === '127.0.0.1';
      const useSsl = process.env.SQL_SSL === 'true' || (!isLocal && process.env.SQL_SSL !== 'false');

      poolConfig = {
        host: host || 'localhost',
        port,
        user,
        password,
        database,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 4000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool background client event:', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
let pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

// Check if an error is a transient connection/socket error that can be safely retried
export function isTransientDbError(error: any): boolean {
  if (!error) return false;

  const code = error?.code || error?.cause?.code;
  const message = `${error?.message || ''} ${error?.cause?.message || ''} ${error?.detail || ''}`.toLowerCase();

  // Socket and system level error codes
  if (['epipe', 'econnreset', 'etimedout', 'econnrefused', 'ehostunreach', 'enetunreach', '08006', '08001', '08004', '57p01', '57p02', '57p03'].includes((code || '').toLowerCase())) {
    return true;
  }

  // String match on common disconnection messages
  if (
    message.includes('epipe') ||
    message.includes('econnreset') ||
    message.includes('connection terminated') ||
    message.includes('closed unexpectedly') ||
    message.includes('terminating connection') ||
    message.includes('starting up') ||
    message.includes('shutting down') ||
    message.includes('connection refused') ||
    message.includes('socket') ||
    message.includes('timeout')
  ) {
    return true;
  }

  return false;
}

// Helper to safely execute db operations with automatic retry for transient socket drops (EPIPE, ECONNRESET, scale-to-zero wake up)
export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (isTransientDbError(error) && attempt <= maxRetries) {
        const delayMs = attempt * 300;
        console.warn(`Transient DB socket event (${error?.code || error?.message || 'unknown'}), retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
}
