# Dynamic OTP System Documentation

## Overview
The OTP (One-Time Password) system has been upgraded from a hardcoded "1234" to a dynamic, database-driven system for enhanced security during password reset operations.

## Database Schema

### OTP Codes Table
```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
- `idx_otp_user_id` on `user_id` for faster user lookups
- `idx_otp_expires_at` on `expires_at` for efficient cleanup

## API Endpoints

### 1. Request OTP
**POST** `/api/password/request-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent (dev mode)",
  "otp": "123456",
  "expires_in": "10 minutes"
}
```

**Features:**
- Generates a random 6-digit OTP
- Invalidates any existing unused OTPs for the user
- Sets expiration time to 10 minutes
- Stores OTP in database
- Returns OTP directly in dev mode (for production, send via email)

### 2. Verify OTP
**POST** `/api/password/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "valid": true
}
```

### 3. Reset Password
**POST** `/api/password/reset`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

**Features:**
- Verifies OTP validity and expiration
- Uses database transaction to ensure atomicity
- Marks OTP as used after successful password reset
- Hashes new password with bcrypt

### 4. OTP Status (Development Only)
**GET** `/api/password/otp-status/:email`

**Response:**
```json
{
  "email": "user@example.com",
  "recent_otps": [
    {
      "otp_code": "123456",
      "created_at": "2025-09-09T03:00:00.000Z",
      "expires_at": "2025-09-09T03:10:00.000Z",
      "used": false,
      "is_expired": false
    }
  ]
}
```

### 5. Cleanup Expired OTPs
**DELETE** `/api/password/cleanup-expired`

**Response:**
```json
{
  "message": "Expired OTPs cleaned up successfully",
  "deleted_count": 5
}
```

## Security Features

1. **Time-based Expiration**: OTPs expire after 10 minutes
2. **Single Use**: OTPs are marked as used after successful password reset
3. **User Isolation**: Each user's OTPs are separate and secure
4. **Automatic Cleanup**: Expired OTPs are automatically cleaned up
5. **Transaction Safety**: Password reset uses database transactions

## Frontend Changes

- Updated placeholder text from "Enter 1234 (dev)" to "Enter OTP from your email"
- No other frontend changes required - the API interface remains the same

## Production Considerations

For production deployment:

1. **Email Integration**: Replace the direct OTP return with email sending service (SendGrid, AWS SES, etc.)
2. **Rate Limiting**: Implement rate limiting on OTP requests to prevent abuse
3. **Logging**: Add proper logging for security monitoring
4. **Environment Variables**: Ensure proper environment configuration
5. **Cleanup Job**: Set up a cron job to regularly clean expired OTPs

## Development Usage

1. Start the server: `npm start` or `node index.js`
2. Request OTP via frontend or API call
3. The OTP will be returned in the API response (dev mode)
4. Use the OTP to reset password through the frontend

## Testing

You can test the system by:
1. Making a POST request to `/api/password/request-otp` with a valid email
2. Using the returned OTP in `/api/password/verify-otp` or `/api/password/reset`
3. Checking OTP status with `/api/password/otp-status/:email` (dev only)
