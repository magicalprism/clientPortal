// components/brand/components/ColorEditDialog.jsx
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { ArrowsClockwise } from '@phosphor-icons/react';

export const ColorEditDialog = ({
  open,
  colorKey,
  currentValue,
  colorName,
  regeneratingColor,
  onClose,
  onValueChange,
  onSaveColor,
  onRegenerateScale
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Edit {colorName} Color
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              width: '100%',
              height: 100,
              backgroundColor: currentValue,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
              mb: 2
            }}
          />
          
          <TextField
            type="color"
            label="Color"
            value={currentValue}
            onChange={(e) => onValueChange(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          
          <TextField
            label="Hex Value"
            value={currentValue}
            onChange={(e) => onValueChange(e.target.value)}
            fullWidth
            placeholder="#000000"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Save Color Only:</strong> Updates just this base color<br/>
              <strong>Save & Regenerate Scale:</strong> Updates this color and regenerates all 100-900 scale variations plus related tokens
            </Typography>
          </Alert>

          {colorKey?.includes('alt_color') && (
            <Alert severity="success" sx={{ mt: 1 }}>
              <Typography variant="body2">
                💡 <strong>Tip:</strong> You can add up to 4 alternative colors using the dotted "+" boxes in the Alternative Colors section.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={regeneratingColor}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onSaveColor(currentValue)}
          variant="outlined"
          disabled={!currentValue || regeneratingColor}
        >
          Save Color Only
        </Button>
        <Button 
          onClick={onRegenerateScale}
          variant="contained"
          disabled={!currentValue || regeneratingColor}
          startIcon={regeneratingColor ? <CircularProgress size={16} /> : <ArrowsClockwise size={16} />}
        >
          {regeneratingColor ? 'Regenerating...' : 'Save & Regenerate Scale'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};