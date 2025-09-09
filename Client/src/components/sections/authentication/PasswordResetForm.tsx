import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useState } from 'react';

const PasswordResetForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleClickShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword((prevShowConfirmPassword) => !prevShowConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const email = sessionStorage.getItem('reset_email') || '';
    if (!email) {
      setError('No email found. Please request OTP again.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch('http://localhost:3001/api/password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.valid) throw new Error(verifyData.error || 'Invalid OTP');

      const resetRes = await fetch('http://localhost:3001/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: password }),
      });
      const resetData = await resetRes.json();
      if (!resetRes.ok) throw new Error(resetData.error || 'Failed to reset password');

      setInfo('Password reset successful. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: { sm: 5, xs: 2.5 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}
      <Stack spacing={3}>
        <TextField
          fullWidth
          variant="outlined"
          id="otp"
          label="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP from your email"
          required
        />
        <TextField
          fullWidth
          variant="outlined"
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? (
                    <IconifyIcon icon="el:eye-open" color="action.active" />
                  ) : (
                    <IconifyIcon icon="el:eye-close" color="action.focus" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          required
        />
        <TextField
          fullWidth
          variant="outlined"
          id="confirm"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowConfirmPassword}
                  edge="end"
                >
                  {showConfirmPassword ? (
                    <IconifyIcon icon="el:eye-open" color="action.active" />
                  ) : (
                    <IconifyIcon icon="el:eye-close" color="action.focus" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          required
        />
      </Stack>
      <Button
        color="primary"
        variant="contained"
        size="large"
        fullWidth
        type="submit"
        sx={{ mt: 3 }}
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </Button>
      <Stack sx={{ textAlign: 'center', color: 'text.secondary', my: 3 }} />
      <Divider sx={{ my: 3 }} />

      <Stack spacing={1.5} sx={{ mt: 4 }}>
        <Typography textAlign="center" color="text.secondary" variant="subtitle1">
          Remembered your Password?
        </Typography>
        <Button
          component={Link}
          href="/authentication/login"
          variant="outlined"
          sx={{ typography: { sm: 'button', xs: 'subtitle1', whiteSpace: 'nowrap' } }}
        >
          Back to Sign-in
        </Button>
      </Stack>
    </Box>
  );
};

export default PasswordResetForm;
