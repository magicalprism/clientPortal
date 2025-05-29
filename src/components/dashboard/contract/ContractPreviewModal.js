import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import { X } from '@phosphor-icons/react';

export const ContractPreviewModal = ({ isOpen, onClose, title, compiledContent }) => {
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Contract Preview: {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box
          sx={{
            p: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            backgroundColor: '#fafafa',
            minHeight: '400px'
          }}
          dangerouslySetInnerHTML={{ __html: compiledContent }}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};