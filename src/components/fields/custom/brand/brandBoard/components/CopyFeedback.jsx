// components/brand/components/CopyFeedback.jsx
import {
  Box,
  Typography
} from '@mui/material';
import { Check } from '@phosphor-icons/react';

export const CopyFeedback = ({ copiedColor }) => {
  if (!copiedColor) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        bgcolor: 'success.main',
        color: 'white',
        px: 2,
        py: 1,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        zIndex: 1000
      }}
    >
      <Check size={16} />
      <Typography variant="body2">
        Copied {copiedColor}
      </Typography>
    </Box>
  );
};