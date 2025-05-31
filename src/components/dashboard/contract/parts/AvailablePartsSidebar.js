// Enhanced AvailablePartsSidebar component
// Replace your existing AvailablePartsSidebar.jsx with this enhanced version

'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Stack,
  Alert,
  Collapse
} from '@mui/material';
import { Plus, Star, CaretDown, CaretUp } from '@phosphor-icons/react';

export const AvailablePartsSidebar = ({ 
  availableParts, 
  onAddPart, 
  onAddCustomPart, 
  contractParts = [],
  onAddAllRequired 
}) => {
  const [showOptional, setShowOptional] = useState(false);

  // Filter parts into required and optional
  const requiredParts = availableParts.filter(part => part.is_required);
  const optionalParts = availableParts.filter(part => !part.is_required);
  
  // Get IDs of parts already in the contract
  const usedPartIds = contractParts.map(p => p.id);
  
  // Filter out parts that are already added
  const availableRequiredParts = requiredParts.filter(part => !usedPartIds.includes(part.id));
  const availableOptionalParts = optionalParts.filter(part => !usedPartIds.includes(part.id));

  return (
    <Box sx={{ position: 'sticky', top: 16 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Available Sections
      </Typography>

      {/* Add All Required Button */}
      {availableRequiredParts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<Plus size={20} />}
            onClick={onAddAllRequired}
            sx={{ mb: 1 }}
          >
            Add All Required ({availableRequiredParts.length})
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            Adds all missing required sections
          </Typography>
        </Box>
      )}

      {/* Required Parts Section */}
      {availableRequiredParts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
            Required Sections ({availableRequiredParts.length})
          </Typography>
          <Stack spacing={1}>
            {availableRequiredParts.map(part => (
              <Card key={part.id} variant="outlined" sx={{ borderColor: 'primary.light' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ flex: 1, mr: 1 }}>
                      {part.title}
                    </Typography>
                    <Chip 
                      label="Required" 
                      size="small" 
                      color="primary" 
                      icon={<Star size={12} />}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                  {part.content && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: part.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                      }}
                    />
                  )}
                </CardContent>
                <CardActions sx={{ pt: 0, pb: 1.5, px: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={() => onAddPart(part)}
                    fullWidth
                  >
                    Add Section
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Show message if all required parts are added */}
      {availableRequiredParts.length === 0 && requiredParts.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✅ All required sections have been added
          </Typography>
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Optional Parts Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="medium">
            Optional Sections ({availableOptionalParts.length})
          </Typography>
          <Button
            size="small"
            onClick={() => setShowOptional(!showOptional)}
            endIcon={showOptional ? <CaretUp size={16} /> : <CaretDown size={16} />}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            {showOptional ? 'Hide' : 'Show'}
          </Button>
        </Box>

        <Collapse in={showOptional}>
          <Stack spacing={1}>
            {availableOptionalParts.map(part => (
              <Card key={part.id} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    {part.title}
                  </Typography>
                  {part.content && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: part.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                      }}
                    />
                  )}
                </CardContent>
                <CardActions sx={{ pt: 0, pb: 1.5, px: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={() => onAddPart(part)}
                    fullWidth
                  >
                    Add Section
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Collapse>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Create Custom Section */}
      <Box>
        <Typography variant="subtitle2" gutterBottom fontWeight="medium">
          Create New Section
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<Plus />}
          onClick={onAddCustomPart}
          sx={{ borderStyle: 'dashed' }}
        >
          Create Custom Section
        </Button>
      </Box>
    </Box>
  );
};