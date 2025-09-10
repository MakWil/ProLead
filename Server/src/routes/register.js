const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Register endpoint
router.post('/', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM user_info WHERE email = $1', 
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      // Log failed registration attempt
      authLogger.registerFailed(email, req, 'User already exists');
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO user_info (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // Log successful registration
    authLogger.registerSuccess(email, req, { 
      user_id: user.id, 
      user_name: user.name 
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;

