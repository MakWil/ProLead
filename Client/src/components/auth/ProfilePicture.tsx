import React, { useState, useRef } from 'react';
import { Box, Avatar, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { useAuth } from 'contexts/AuthContext';

interface ProfilePictureProps {
  currentPicture?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ currentPicture }) => {
  const { user, uploadProfilePictureFile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the user's profile picture from AuthContext, fallback to prop
  const currentProfilePicture = user?.profile_picture || currentPicture;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    uploadPicture(file);
  };

  const uploadPicture = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadProfilePictureFile(file);
      setSuccess('Profile picture updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({ profile_picture: undefined });
      setSuccess('Profile picture removed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getAvatarSrc = () => {
    if (currentProfilePicture) {
      return currentProfilePicture;
    }
    return undefined; // This will show the default avatar
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Picture
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={getAvatarSrc()} sx={{ width: 120, height: 120 }} alt="Profile" />
          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
              }}
            >
              <CircularProgress size={40} sx={{ color: 'white' }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Button
            variant="contained"
            startIcon={<PhotoCamera />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Picture'}
          </Button>

          {currentProfilePicture && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleRemovePicture}
              disabled={uploading}
            >
              Remove Picture
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Accepted formats: JPEG, PNG, GIF. Maximum file size: 5MB
      </Typography>
    </Paper>
  );
};

export default ProfilePicture;
