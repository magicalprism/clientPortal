'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Grid, Typography, Card, CardMedia, CardContent } from '@mui/material';
import { X as XIcon, DownloadSimple, Plus } from '@phosphor-icons/react';
import { MediaUploadGalleryModal } from './MediaUploadGalleryModal';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { createClient } from '@/lib/supabase/browser';
import { MediaPreviewCard } from '../components/MediaPreviewCard';

export const MediaFieldGallery = ({ value, onChange, field, record, config }) => {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (value && Array.isArray(value) && value.length > 0) {
        // Handle array of ids
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .in('id', value);

        if (data) {
          setMediaItems(data);
        } else {
          console.error('❌ Failed to fetch media items', error);
        }
      } else if (value && !Array.isArray(value)) {
        // Handle single id
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('id', value)
          .single();

        if (data) {
          setMediaItems([data]);
        } else {
          console.error('❌ Failed to fetch media', error);
        }
      } else {
        setMediaItems([]);
      }
    };

    fetchMediaDetails();
  }, [value]);

  const handleUploadComplete = (newMediaItems) => {
    setMediaItems(prevItems => {
      // If newMediaItems is a function (from the modal's callback)
      if (typeof newMediaItems === 'function') {
        return newMediaItems(prevItems);
      }
      // If it's a single media item
      if (!Array.isArray(newMediaItems)) {
        return [...prevItems, newMediaItems];
      }
      // If it's an array
      return [...prevItems, ...newMediaItems];
    });

    // Update parent component
    if (Array.isArray(newMediaItems)) {
      onChange(newMediaItems.map(item => item.id));
    } else if (newMediaItems && newMediaItems.id) {
      onChange([...mediaItems.map(item => item.id), newMediaItems.id]);
    }
  };

  const handleRemove = (mediaId) => {
    setMediaItems(prevItems => prevItems.filter(item => item.id !== mediaId));
    onChange(mediaItems.filter(item => item.id !== mediaId).map(item => item.id));
  };

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} width="100%">
        <Grid container spacing={2}>
          {mediaItems.map((media) => (
            <Grid item xs={12} sm={6} md={4} key={media.id}>
              <MediaPreviewCard 
                media={media} 
                onRemove={() => handleRemove(media.id)} 
                field={field}
              />
            </Grid>
          ))}
          
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
                bgcolor: 'background.paper'
              }}
              onClick={() => setModalOpen(true)}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Plus size={32} weight="light" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add Media
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Button 
          variant="outlined" 
          onClick={() => setModalOpen(true)}
          startIcon={<Plus size={16} />}
        >
          Add Media
        </Button>
      </Box>

      <MediaUploadGalleryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        record={record}
        field={field}
        config={config}
      />
    </>
  );
};