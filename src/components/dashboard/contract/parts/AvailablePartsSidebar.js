import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Stack,
  Button,
  Divider
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';

export const AvailablePartsSidebar = ({ 
  availableParts, 
  onAddPart, 
  onAddCustomPart 
}) => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: 'fit-content',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Available Sections
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click to add sections to your contract
        </Typography>
      </Box>

      {/* Add Custom Section Button */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Plus />}
          onClick={onAddCustomPart}
          size="small"
        >
          Create Custom Section
        </Button>
      </Box>

      <Divider />

      {/* Available Parts List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {availableParts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              All sections have been added
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 1 }}>
            {availableParts.map((part) => (
              <ListItem key={part.id} disablePadding>
                <ListItemButton 
                  onClick={() => onAddPart(part)}
                  sx={{ px: 3, py: 1.5 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {part.title}
                        </Typography>
                        {part.is_required && (
                          <Chip 
                            label="Required" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 0.5
                        }}
                      >
                        {part.content?.replace(/<[^>]*>/g, '').substring(0, 80)}...
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};