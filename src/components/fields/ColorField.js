import { Box } from '@mui/material';

export const ColorField = ({ value, onChange }) => {
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: '1 / 1',
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        component="input"
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)} // ✅ just send string
        sx={{
          width: '100%',
          height: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          appearance: 'none',
        }}
      />
    </Box>
  );
};
