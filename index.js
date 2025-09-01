const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')());
app.use(express.static(path.join(__dirname, 'public')));

const usersRouter = require('./src/routes/users');
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 80;
const host = process.env.HOST || '0.0.0.0';
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Acess your application at : http://172.232.238.95:$(port)');
});

