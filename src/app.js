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
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Parse JSON payload - MUST be placed after webhooks that might need raw body if applicable
// But for standard Meta webhook, we'll parse it here or custom for meta.
// Standard express parsing:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder (optional, if local storage used)
app.use('/uploads', express.static('uploads'));

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
