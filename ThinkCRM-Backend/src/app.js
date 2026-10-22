import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import routes from './routes/index.js';
import { metaWebhookRoute } from './integrations/meta/webhook.js';

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: true, credentials: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Parse JSON payload
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public and uploads folders
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Root endpoint - Health / Status check so anyone opening the backend URL sees it is live & running
app.get('/', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  if (req.accepts('html')) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ThinkCRM API Server - Online</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            position: relative;
            overflow-x: hidden;
          }
          .bg-glow {
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 0;
          }
          .card {
            position: relative;
            z-index: 1;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            max-width: 540px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 20px;
            box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.4);
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .subtitle {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 9999px;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.28);
            color: #34d399;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse-animation 2s infinite;
          }
          @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .desc {
            font-size: 14px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 24px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
          }
          .info-box {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 12px 14px;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .info-val {
            font-size: 13px;
            font-weight: 600;
            color: #e2e8f0;
            font-family: 'JetBrains Mono', monospace;
          }
          .actions {
            display: flex;
            gap: 12px;
          }
          .btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .btn-primary {
            background: #10b981;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          }
          .btn-primary:hover {
            background: #059669;
            transform: translateY(-1px);
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="bg-glow"></div>
        <div class="card">
          <div class="header">
            <div class="brand">
              <img src="/logo.webp" alt="ThinkTive" style="height: 38px; width: auto; max-width: 160px; object-fit: contain; margin-right: 8px;" />
              <div>
                <div class="title">ThinkCRM API</div>
                <div class="subtitle">Cloud Production Server</div>
              </div>
            </div>
            <div class="badge">
              <div class="pulse"></div>
              <span>Operational</span>
            </div>
          </div>
          <p class="desc">
            The ThinkCRM backend services are fully initialized, healthy, and handling live API requests.
          </p>
          <div class="grid">
            <div class="info-box">
              <div class="info-label">Status</div>
              <div class="info-val" style="color: #34d399;">200 OK • Live</div>
            </div>
            <div class="info-box">
              <div class="info-label">Uptime</div>
              <div class="info-val">${uptimeFormatted}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Environment</div>
              <div class="info-val">${process.env.NODE_ENV || 'production'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">API Version</div>
              <div class="info-val">v1.0.0</div>
            </div>
          </div>
          <div class="actions">
            <a href="/api/docs" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Swagger API Docs</span>
            </a>
            <a href="/api/v1/health" class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <span>Health JSON</span>
            </a>
          </div>
          <div class="footer">
            ThinkCRM Backend • Hosted on Render • ${new Date().toUTCString()}
          </div>
        </div>
      </body>
      </html>
    `);
  }

  return res.status(200).json({
    success: true,
    status: 'online',
    message: 'ThinkCRM API Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: {
      auth: '/api/v1/auth',
      leads: '/api/v1/leads',
      customers: '/api/v1/customers',
      quotations: '/api/v1/quotations',
      staff: '/api/v1/staff',
      reports: '/api/v1/reports',
      health: '/api/v1/health',
    },
  });
});

// Standalone health endpoint for Render and external pingers
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'thinkcrm-backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Swagger Docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base Routes
app.use('/api/v1', routes);

// Special Webhook Routes that might bypass standard API structure
app.use('/api/v1/integrations/meta', metaWebhookRoute);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
