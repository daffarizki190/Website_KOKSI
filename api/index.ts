let appInstance: any = null;
let importError: any = null;

async function getApp() {
  if (!appInstance && !importError) {
    try {
      const serverModule = await import('../server');
      appInstance = serverModule.app;
    } catch (err: any) {
      importError = err;
      console.error('Failed to import server module:', err);
    }
  }
  return { app: appInstance, error: importError };
}

export default async function handler(req: any, res: any) {
  const { app, error } = await getApp();
  
  if (error) {
    res.status(500).json({
      status: 'error',
      message: 'Serverless initialization error',
      error: error?.message || String(error),
      code: error?.code,
      stack: error?.stack
    });
    return;
  }

  return app(req, res);
}
