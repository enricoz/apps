import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { neon } from '@neondatabase/serverless';
import { PostgresStorage } from './storage';
import { configurePassport } from './middleware/passport';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import { createAuthRoutes } from './routes/auth';
import { createFamilyRoutes } from './routes/families';
import { createCategoryRoutes } from './routes/categories';
import { createExpenseRoutes } from './routes/expenses';
import { createBudgetRoutes } from './routes/budgets';
import { createInviteRoutes } from './routes/invites';
import { createNotificationRoutes } from './routes/notifications';
import { createRevolutRoutes } from './routes/revolut';
import { createAnalyticsRoutes } from './routes/analytics';
import { createIncomeRoutes } from './routes/incomes';
import { createAccountRoutes } from './routes/accounts';
import { createSubscriptionRoutes } from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Initialize storage
const storage = new PostgresStorage(DATABASE_URL);

// Session store
const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  conString: DATABASE_URL,
  createTableIfMissing: true,
});

// Stripe webhook needs raw body - mount before JSON parser
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'famiglia-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Passport initialization
const passportInstance = configurePassport(storage);
app.use(passportInstance.initialize());
app.use(passportInstance.session());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    authenticated: !!req.session.userId,
  });
});

// Mount routes
app.use('/api/auth', createAuthRoutes(storage));
app.use('/api/families', createFamilyRoutes(storage));
app.use('/api/categories', createCategoryRoutes(storage));
app.use('/api/expenses', createExpenseRoutes(storage));
app.use('/api/budgets', createBudgetRoutes(storage));
app.use('/api/invites', createInviteRoutes(storage));
app.use('/api/notifications', createNotificationRoutes(storage));
app.use('/api/revolut', createRevolutRoutes(storage));
app.use('/api/analytics', createAnalyticsRoutes(storage));
app.use('/api/incomes', createIncomeRoutes(storage));
app.use('/api/accounts', createAccountRoutes(storage));
app.use('/api/subscriptions', createSubscriptionRoutes(storage));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client');
  app.use(express.static(clientDistPath));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Errore interno del server',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
