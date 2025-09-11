const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Serve static files from the React app source directory
app.use(express.static(path.join(__dirname, '../Client/dist')));

// Routes
const registerRouter = require('./src/routes/register');
const loginRouter = require('./src/routes/login');
const passwordRouter = require('./src/routes/password');
const usersRouter = require('./src/routes/users');
const { router: authRouter } = require('./src/routes/auth');
const logsRouter = require('./src/routes/logs');
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/password', passwordRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/logs', logsRouter);

// Catch all handler: send back React's index.html file for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port,"0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Registration endpoint: http://localhost:${port}/api/register`);
  console.log(`🔑 Login endpoint: http://localhost:${port}/api/login`);
  console.log(`🔒 Password endpoints: http://localhost:${port}/api/password/*`);
  console.log(`👥 Users/Customers endpoint: http://localhost:${port}/api/users`);
  console.log(`🔐 Auth endpoints: http://localhost:${port}/api/auth/*`);
  console.log(`📊 Logs endpoints: http://localhost:${port}/api/logs`);
  console.log(`✅ Winston logging with PostgreSQL JSONB enabled`);
});
