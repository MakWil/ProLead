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

// Serve static files from the React app source directory
app.use(express.static(path.join(__dirname, '../Client/dist')));

// Routes
const registerRouter = require('./src/routes/register');
const loginRouter = require('./src/routes/login');
const passwordRouter = require('./src/routes/password');
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/password', passwordRouter);

// Catch all handler: send back React's index.html file for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Registration endpoint: http://localhost:${port}/api/register`);
  console.log(`🔑 Login endpoint: http://localhost:${port}/api/login`);
  console.log(`🔒 Password endpoints: http://localhost:${port}/api/password/*`);
});