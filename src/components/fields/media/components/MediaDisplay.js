'use client';

import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { MediaPreviewCard } from './MediaPreviewCard';

/**
 * Handles the display of media items (both single and multi modes)
 */
export const MediaDisplay = ({
  isMulti,
  localSelectedItems,
  canEdit,
  canAddMore,
  menuOptions,
  field,
  mediaConfig,
  onRemove,
  onEdit,
  onMenuClick,
  onAddClick
}) => {
  if (isMulti) {
    return (
      <Grid container spacing={2}>
        {localSelectedItems.map((media) => (
          <Grid item xs={12} sm={6} md={4} key={media.id}>
            <MediaPreviewCard 
              media={media} 
              onRemove={canEdit ? () => onRemove(media.id) : null} 
              onEdit={canEdit ? (event) => onEdit(media, event) : null}
              field={field}
              config={mediaConfig}
              showControls={canEdit}
            />
          </Grid>
        ))}
        
        {/* Add Media Card - only show if we can add more */}
        {canAddMore && (
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                minHeight: 200, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }
              }}
              onClick={onAddClick}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Plus size={32} weight="light" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add Media
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  }

  // Single media display
  return (
    <Box>
      {localSelectedItems.length > 0 ? (
        <MediaPreviewCard
          media={localSelectedItems[0]}
          onRemove={canEdit ? () => onRemove(localSelectedItems[0].id) : null}
          onEdit={canEdit ? (event) => onEdit(localSelectedItems[0], event) : null}
          field={field}
          config={mediaConfig}
          showControls={canEdit}
        />
      ) : (
        <Box
          sx={{
            minHeight: 200,
            border: '2px dashed #ccc',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f6ff',
            textAlign: 'center',
            p: 3,
            cursor: canEdit ? 'pointer' : 'default',
            '&:hover': canEdit ? {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50'
            } : {}
          }}
          onClick={canEdit ? onAddClick : undefined}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {canEdit ? 'Click to add media' : 'No media selected'}
            </Typography>
            {!canEdit && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Field is read-only
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};