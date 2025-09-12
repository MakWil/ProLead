import { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera, Save } from '@mui/icons-material';
import { useAuth } from 'contexts/AuthContext';

const ProfilePage = () => {
  const { user, updateProfile, uploadProfilePicture } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or GIF image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1]; // Remove data URL prefix
        try {
          await uploadProfilePicture(base64Data, file.type);
          setSuccess('Profile picture updated successfully!');
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setUploading(false);
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
              <Box sx={{ textAlign: 'center' }}>
                <Stack direction="column" alignItems="center" spacing={2}>
                  <Avatar
                    src={user?.profile_picture}
                    alt={user?.name}
                    sx={{
                      width: 120,
                      height: 120,
                      border: '3px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>

                  <Box>
                    <input
                      accept="image/jpeg,image/png,image/gif"
                      id="profile-picture-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <label htmlFor="profile-picture-upload">
                      <IconButton
                        component="span"
                        color="primary"
                        disabled={uploading}
                        sx={{
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          px: 2,
                          py: 1,
                        }}
                      >
                        {uploading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <>
                            <PhotoCamera sx={{ mr: 1 }} />
                            <Typography variant="button">Change Photo</Typography>
                          </>
                        )}
                      </IconButton>
                    </label>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Max file size: 5MB. Formats: JPEG, PNG, GIF
                  </Typography>
                </Stack>
              </Box>

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
