const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173', 
      'http://127.0.0.1:5173', 
      'http://10.200.1.2:5173', 
      'http://localhost:3000', 
      'http://127.0.0.1:3000'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Serve static files from the React app source directory
app.use(express.static(path.join(__dirname, '../Client/dist')));

// Serve profile pictures statically
app.use('/profile-pictures', express.static(path.join(__dirname, 'profile-pictures')));

// Routes
const registerRouter = require('./src/routes/register');
const loginRouter = require('./src/routes/login');
const passwordRouter = require('./src/routes/password');
const usersRouter = require('./src/routes/users');
const productsRouter = require('./src/routes/products');
const categoriesRouter = require('./src/routes/categories');
const { router: authRouter } = require('./src/routes/auth');
const logsRouter = require('./src/routes/logs');
const profileRouter = require('./src/routes/profile');
const propertiesRouter = require('./src/routes/properties');
const productPropertiesRouter = require('./src/routes/product-properties');
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/password', passwordRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/logs', logsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/product-properties', productPropertiesRouter);

// Catch all handler: send back React's index.html file for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

// Test S3 connection if S3 is configured
if (process.env.LINODE_ACCESS_KEY && process.env.LINODE_SECRET_KEY && process.env.LINODE_ENDPOINT) {
  const { testS3Connection } = require('./src/utils/s3Service');
  // Test S3 connection asynchronously
  testS3Connection().catch(err => {
    console.error('S3 connection test failed during startup:', err.message);
  });
} else {
  console.log('⚠️  S3 not configured - profile picture upload will not work');
}

const port = process.env.PORT || 3001;
app.listen(port,"0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Registration endpoint: http://10.200.1.2:${port}/api/register`);
  console.log(`🔑 Login endpoint: http://10.200.1.2:${port}/api/login`);
  console.log(`🔒 Password endpoints: http://10.200.1.2:${port}/api/password/*`);
  console.log(`👥 Users/Customers endpoint: http://10.200.1.2:${port}/api/users`);
  console.log(`📦 Products endpoint: http://10.200.1.2:${port}/api/products`);
  console.log(`🏷️  Categories endpoint: http://10.200.1.2:${port}/api/categories`);
  console.log(`🔐 Auth endpoints: http://10.200.1.2:${port}/api/auth/*`);
  console.log(`📊 Logs endpoints: http://10.200.1.2:${port}/api/logs`);
  console.log(`👤 Profile endpoints: http://10.200.1.2:${port}/api/profile`);
  console.log(`🏠 Properties endpoints: http://10.200.1.2:${port}/api/properties`);
  console.log(`📈 Product-properties endpoints: http://10.200.1.2:${port}/api/product-properties`);
  console.log(`✅ Winston logging with PostgreSQL JSONB enabled`);
});
