import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message,
  fullScreen = false,
  overlay = false,
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'background.paper',
          zIndex: 9999,
        }),
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1,
        }),
      }}
    >
      <Fade in={true} timeout={500}>
        <CircularProgress size={size} />
      </Fade>
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  return content;
};

// Специализированные спиннеры
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingSpinner
    size={50}
    message={message || "Загрузка..."}
    fullScreen
  />
);

export const ButtonLoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <CircularProgress size={size} color="inherit" />
);

export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
    <CircularProgress size={20} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

export const TableLoadingSpinner: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress size={30} />
  </Box>
);

export default LoadingSpinner;