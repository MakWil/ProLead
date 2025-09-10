const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Login endpoint
router.post('/', async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password, name, created_at FROM user_info WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Log failed login attempt
      authLogger.loginFailed(email, req, 'User not found');
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt
      authLogger.loginFailed(email, req, 'Invalid password');
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Log successful login
    authLogger.loginSuccess(email, req, { 
      user_id: user.id, 
      user_name: user.name 
    });

    // Return user data (without password)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;
