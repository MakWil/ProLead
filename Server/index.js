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
const usersRouter = require('./src/routes/users');
app.use('/api/users', usersRouter);

// Catch all handler: send back React's index.html file for any non-API routes (exclude /api)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
