import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware setup
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'StockFlow Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Serve compiled frontend SPA
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

// 404 Route Handler for unhandled API endpoints
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Centralized Error Handling
app.use(errorHandler);

const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 StockFlow Backend running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
