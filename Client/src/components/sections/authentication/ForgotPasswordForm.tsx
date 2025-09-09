import { Box, Button, Divider, Link, Stack, TextField, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const res = await fetch('http://localhost:3001/api/password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');

      sessionStorage.setItem('reset_email', email);
      setInfo(`OTP sent (dev): ${data.otp}`);

      setTimeout(() => navigate('/authentication/reset-password'), 600);
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
        <Alert severity="info" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}
      <Stack spacing={3}>
        <TextField
          fullWidth
          variant="outlined"
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {loading ? 'Sending...' : 'Send OTP'}
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

export default ForgotPasswordForm;
