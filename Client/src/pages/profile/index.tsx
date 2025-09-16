import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useAuth } from 'contexts/AuthContext';
import ProfilePicture from 'components/auth/ProfilePicture';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update name when user data changes
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({ name: name.trim() });
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      setError(String(err) || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mx="auto" sx={{ mx: 'auto', p: 4, width: 1, height: 1 }}>
      <Grid container spacing={1} justifyContent="center" alignItems="center">
        <Grid item xs={12} sm={9} md={8} lg={6} xl={5}>
          <Card
            sx={{
              py: { xs: 3, sm: 6 },
              px: { xs: 5, sm: 7.5 },
              bgcolor: 'common.white',
            }}
          >
            <Stack
              spacing={1}
              sx={{
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  typography: {
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                Profile Settings
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Update your profile information and picture
              </Typography>
            </Stack>

            <Stack spacing={4}>
              {/* Profile Picture Section */}
              <ProfilePicture />

              {/* Profile Form */}
              <Box component="form" onSubmit={handleNameChange}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ''}
                    disabled
                    helperText="Email cannot be changed"
                  />

                  <TextField
                    fullWidth
                    label="Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    helperText="This is how your name will appear to others"
                  />

                  {error && (
                    <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                      {error}
                    </Typography>
                  )}

                  {success && (
                    <Typography color="success" variant="body2" sx={{ textAlign: 'center' }}>
                      {success}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading || !name.trim() || name === user?.name}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Box>

              {/* Account Info */}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Account Information</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since: {new Date(user?.created_at || '').toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User ID: {user?.id}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
