const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired OTPs (helper function)
async function cleanupExpiredOTPs() {
  try {
    await pool.query('DELETE FROM otp_codes WHERE expires_at < NOW()');
  } catch (err) {
    console.error('Error cleaning up expired OTPs:', err);
  }
}

// Request OTP (send to email in real life)
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Clean up expired OTPs first
    await cleanupExpiredOTPs();

    // Ensure user exists
    const userRes = await pool.query('SELECT id FROM user_info WHERE email = $1', [email]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userRes.rows[0].id;

    // Invalidate any existing unused OTPs for this user
    await pool.query('UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE', [userId]);

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await pool.query(
      'INSERT INTO otp_codes (user_id, otp_code, expires_at) VALUES ($1, $2, $3)',
      [userId, otpCode, expiresAt]
    );

    // Log password reset request
    authLogger.passwordReset(email, req, { 
      user_id: userId,
      otp_expires_at: expiresAt 
    });

    // For dev: return OTP directly (in production, send via email)
    return res.json({ 
      message: 'OTP sent (dev mode)', 
      otp: otpCode,
      expires_in: '10 minutes'
    });
  } catch (err) {
    console.error('request-otp error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    // Clean up expired OTPs first
    await cleanupExpiredOTPs();

    const userRes = await pool.query('SELECT id FROM user_info WHERE email = $1', [email]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userRes.rows[0].id;

    // Check if OTP exists and is valid
    const otpRes = await pool.query(
      'SELECT id FROM otp_codes WHERE user_id = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW()',
      [userId, otp]
    );

    if (otpRes.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password (requires OTP)
router.post('/reset', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, OTP, and new_password are required' });
    }

    // Clean up expired OTPs first
    await cleanupExpiredOTPs();

    const userRes = await pool.query('SELECT id FROM user_info WHERE email = $1', [email]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userRes.rows[0].id;

    // Verify OTP is valid and not used
    const otpRes = await pool.query(
      'SELECT id FROM otp_codes WHERE user_id = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW()',
      [userId, otp]
    );

    if (otpRes.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const otpId = otpRes.rows[0].id;

    // Hash the new password
    const hashed = await bcrypt.hash(new_password, 10);
    
    // Update password and mark OTP as used
    await pool.query('BEGIN');
    try {
      await pool.query('UPDATE user_info SET password = $1 WHERE id = $2', [hashed, userId]);
      await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [otpId]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }

    // Log successful password reset
    authLogger.passwordReset(email, req, { 
      user_id: userId,
      action: 'password_reset_completed' 
    });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optional: Get OTP status for debugging (development only)
router.get('/otp-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const userRes = await pool.query('SELECT id FROM user_info WHERE email = $1', [email]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userRes.rows[0].id;
    
    const otpRes = await pool.query(
      'SELECT otp_code, created_at, expires_at, used FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    return res.json({ 
      email,
      recent_otps: otpRes.rows.map(row => ({
        otp_code: row.otp_code,
        created_at: row.created_at,
        expires_at: row.expires_at,
        used: row.used,
        is_expired: new Date() > new Date(row.expires_at)
      }))
    });
  } catch (err) {
    console.error('otp-status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup endpoint for expired OTPs (can be called by a cron job)
router.delete('/cleanup-expired', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM otp_codes WHERE expires_at < NOW()');
    return res.json({ 
      message: 'Expired OTPs cleaned up successfully',
      deleted_count: result.rowCount
    });
  } catch (err) {
    console.error('cleanup-expired error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
