import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/api/v1/public.routes.js';
import adminRoutes from './routes/api/v1/admin.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: false, limit: '3mb' }));
app.use(cookieParser());
app.use('/api/v1/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/admin', express.static(path.join(projectRoot, 'admin'), { extensions: ['html'] }));
app.use('/assets', express.static(path.join(projectRoot, 'frontend', 'assets'), { maxAge: '1h' }));
app.use('/styles', express.static(path.join(projectRoot, 'frontend', 'styles'), { maxAge: '1h' }));
app.use('/scripts', express.static(path.join(projectRoot, 'frontend', 'scripts'), { maxAge: '1h' }));
app.use(express.static(path.join(projectRoot, 'frontend', 'pages'), { extensions: ['html'] }));

app.use(notFound);
app.use(errorHandler);

export default app;
