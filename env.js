export function getConfig() {
  return {
    siteName: process.env.SITE_NAME || 'Noor Islamic Journal',
    siteUrl: process.env.SITE_URL || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    dataDir: process.env.DATA_DIR || './data',
    adminSecretCode: process.env.ADMIN_SECRET_CODE || '',
    sessionSecret: process.env.SESSION_SECRET || ''
  };
}
