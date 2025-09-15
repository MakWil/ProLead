const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Middleware to verify JWT token (import from auth.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, email, name, profile_picture, created_at FROM user_info WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name must be at least 1 character long'),
  body('profile_picture').optional().isURL().withMessage('Profile picture must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { name, profile_picture } = req.body;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
      paramCount++;
    }

    if (profile_picture !== undefined) {
      updateFields.push(`profile_picture = $${paramCount}`);
      updateValues.push(profile_picture);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    const query = `
      UPDATE user_info 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, email, name, profile_picture, created_at
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log profile update
    authLogger.logEvent('profile_update', {
      userId: userId,
      email: result.rows[0].email,
      updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined),
      timestamp: new Date().toISOString()
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture (base64 encoded)
router.post('/upload-picture', [
  authenticateToken,
  body('image_data').notEmpty().withMessage('Image data is required'),
  body('image_type').isIn(['image/jpeg', 'image/png', 'image/gif']).withMessage('Invalid image type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { image_data, image_type } = req.body;

    // For now, we'll store the base64 data directly
    // In production, you'd want to upload to a cloud storage service
    const profilePictureUrl = `data:${image_type};base64,${image_data}`;

    const result = await pool.query(
      'UPDATE user_info SET profile_picture = $1 WHERE id = $2 RETURNING id, email, name, profile_picture, created_at',
      [profilePictureUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log profile picture update
    authLogger.logEvent('profile_picture_update', {
      userId: userId,
      email: result.rows[0].email,
      imageType: image_type,
      timestamp: new Date().toISOString()
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
