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
  CircularProgress,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useState } from 'react';
import { useAuth } from 'contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  age: string;
  date_of_birth: string;
  favorite_food: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  age?: number;
  date_of_birth?: string;
  favorite_food?: string;
}

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    date_of_birth: '',
    favorite_food: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    } as FormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Create registerData with proper types
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      // Add optional fields only if they have values
      if (formData.age && formData.age !== '') {
        registerData.age = parseInt(formData.age);
      }
      if (formData.date_of_birth && formData.date_of_birth !== '') {
        registerData.date_of_birth = formData.date_of_birth;
      }
      if (formData.favorite_food && formData.favorite_food !== '') {
        registerData.favorite_food = formData.favorite_food;
      }

      await register(registerData);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: { sm: 5, xs: 2.5 },
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={3}>
        <TextField
          fullWidth
          variant="outlined"
          id="name"
          name="name"
          type="text"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          variant="outlined"
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          variant="outlined"
          id="password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
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
        />
        <TextField
          fullWidth
          variant="outlined"
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
        <Stack
          spacing={0.5}
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1">By creating account, you agree to our</Typography>
          <Link href="#!">
            <Typography color="primary" variant="subtitle1">
              Terms of Service
            </Typography>
          </Link>
        </Stack>
      </Stack>
      <Divider
        sx={{
          my: 3,
        }}
      />

      <Stack
        spacing={1.5}
        sx={{
          mt: 4,
        }}
      >
        <Typography textAlign="center" color="text.secondary" variant="subtitle1">
          Or create an account using:
        </Typography>
        <Button
          startIcon={<IconifyIcon icon="flat-color-icons:google" />}
          sx={{ typography: { sm: 'button', xs: 'subtitle1', whiteSpace: 'nowrap' } }}
          variant="outlined"
        >
          Continue with Google
        </Button>
        <Button
          startIcon={<IconifyIcon icon="logos:facebook" />}
          sx={{ typography: { sm: 'button', xs: 'subtitle1', whiteSpace: 'nowrap' } }}
          variant="outlined"
        >
          Continue with Facebook
        </Button>
      </Stack>
    </Box>
  );
};

export default RegisterForm;
