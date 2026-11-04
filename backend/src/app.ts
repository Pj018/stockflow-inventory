import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { errorHandler } from './middlewares/errorHandler';

export const createApp = () => {
  const app = express();

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows inline script/style execution for bundled SPA
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const isProd = ENV.NODE_ENV === 'production';
  app.use(
    cors({
      origin: isProd && ENV.CORS_ORIGIN !== '*' ? ENV.CORS_ORIGIN : true,
      credentials: true,
    })
  );

  // Rate Limiting for Auth Endpoints (Protection against brute-force attacks)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    },
    skip: () => ENV.NODE_ENV === 'test', // Bypass in test suite
  });

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health Check Endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'StockFlow Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/settings', settingsRoutes);

  // Serve compiled frontend SPA if available and not in test mode
  if (ENV.NODE_ENV !== 'test') {
    const frontendDistPath = fs.existsSync(path.resolve(__dirname, '../../frontend/dist'))
      ? path.resolve(__dirname, '../../frontend/dist')
      : path.resolve(process.cwd(), 'frontend/dist');

    if (fs.existsSync(frontendDistPath)) {
      app.use(express.static(frontendDistPath));

      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          const indexPath = path.join(frontendDistPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
          }
        }
        next();
      });
    }
  }

  // 404 Route Handler for unhandled API endpoints
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
