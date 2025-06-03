'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, Typography, Menu, MenuItem, IconButton } from '@mui/material';
import { Plus, CaretDown, Upload, LinkSimple, Link as LinkIcon } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { CompactMediaPreview } from './CompactMediaPreview';
import { MediaLibraryPicker } from '@/components/fields/media/components/MediaLibraryPicker';

// Import the media modals with error handling
import dynamic from 'next/dynamic';

const MediaUploadModal = dynamic(
  () => import('@/components/fields/media/modals/MediaUploadModal'),
  { ssr: false }
);




const supabase = createClient();

export const CompactMediaField = ({ 
  value = [],
  onChange, 
  label = "Media",
  placeholder = "No media selected",
  record,
  editable = true,
  size = 'small',
  maxItems = 5,
  pivotTable,
  sourceField,
  targetField = 'media_id',
  parentId
}) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  console.log('[CompactMediaField] PROPS:', {
    editable,
    parentId,
    pivotTable,
    sourceField,
    targetField
  });

  // Simple fetch function
  useEffect(() => {
    const fetchMedia = async () => {
      if (!pivotTable || !parentId) {
        console.log('[CompactMediaField] No pivot table or parentId, skipping fetch');
        setMediaItems([]);
        setLoading(false);
        return;
      }

      console.log(`[CompactMediaField] Starting fetch from ${pivotTable} where ${sourceField}=${parentId}`);
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from(pivotTable)
          .select(`media:${targetField}(id, url, title, alt_text, mime_type, is_external)`)
          .eq(sourceField, parentId);

        if (error) {
          console.error('[CompactMediaField] Fetch error:', error);
          setMediaItems([]);
        } else {
          const media = data?.map(row => row.media).filter(Boolean) || [];
          console.log(`[CompactMediaField] Fetched ${media.length} items:`, media);
          setMediaItems(media);
        }
      } catch (err) {
        console.error('[CompactMediaField] Catch error:', err);
        setMediaItems([]);
      } finally {
        console.log('[CompactMediaField] Setting loading to FALSE');
        setLoading(false);
      }
    };

    fetchMedia();
  }, [pivotTable, parentId, sourceField, targetField]);

  const handleUploadComplete = (uploadedMedia) => {
    console.log('[CompactMediaField] Upload complete:', uploadedMedia);
    handleMediaSelect(uploadedMedia);
    setUploadModalOpen(false);
  };

  const handleEditComplete = (editedMedia) => {
    console.log('[CompactMediaField] Edit complete:', editedMedia);
    handleMediaSelect(editedMedia);
    setEditModalOpen(false);
    setEditingMedia(null);
  };

  const openExternalLinkEditor = () => {
    console.log('[CompactMediaField] Opening external link editor');
    setEditingMedia({
      url: '',
      mime_type: 'external/url',
      title: '',
      alt_text: '',
      company_id: record?.company_id || null,
      project_id: record?.project_id || null,
      status: 'active',
      is_external: true
    });
    setEditModalOpen(true);
    setMenuAnchor(null);
  };

  const menuOptions = [
    {
      label: 'Upload File',
      icon: Upload,
      onClick: () => {
        console.log('[CompactMediaField] Upload option selected');
        setUploadModalOpen(true);
        setMenuAnchor(null);
      }
    },
    {
      label: 'Choose from Library',
      icon: LinkIcon,
      onClick: () => {
        console.log('[CompactMediaField] Library option selected');
        setLibraryOpen(true);
        setMenuAnchor(null);
      }
    },
    {
      label: 'Link External URL',
      icon: LinkSimple,
      onClick: openExternalLinkEditor
    }
  ];
  const handleMediaSelect = async (selectedMedia) => {
    const mediaArray = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];
    
    if (pivotTable && parentId) {
      try {
        for (const media of mediaArray) {
          const pivotData = {};
          pivotData[sourceField] = parentId;
          pivotData[targetField] = media.id;
          
          const { error } = await supabase
            .from(pivotTable)
            .upsert(pivotData, { 
              onConflict: `${sourceField},${targetField}`,
              ignoreDuplicates: true 
            });

          if (error) {
            console.error('Failed to create pivot relationship:', error);
          }
        }
        
        // Refresh the media items
        setMediaItems(prev => [...prev, ...mediaArray.filter(m => 
          !prev.some(existing => existing.id === m.id)
        )]);
        
      } catch (err) {
        console.error('Error adding media relationships:', err);
      }
    }
    
    // Close any open modals
    setLibraryOpen(false);
    setUploadModalOpen(false);
    setEditModalOpen(false);
  };

  const handleRemove = async (mediaId) => {
    if (pivotTable && parentId) {
      try {
        const { error } = await supabase
          .from(pivotTable)
          .delete()
          .eq(sourceField, parentId)
          .eq(targetField, mediaId);

        if (error) {
          console.error('Failed to remove pivot relationship:', error);
        } else {
          setMediaItems(prev => prev.filter(item => item.id !== mediaId));
        }
      } catch (err) {
        console.error('Error removing media relationship:', err);
      }
    }
  };

  const canAddMore = mediaItems.length < maxItems;

  console.log('[CompactMediaField] RENDER STATE:', {
    loading,
    mediaItemsLength: mediaItems.length,
    editable,
    canAddMore,
    showButton: editable && canAddMore && !loading
  });

  return (
    <Box sx={{ p: 0, border: '0px solidrgba(240, 240, 240, 0)', borderRadius: 1 }}>
      
      {loading ? (
        <Typography variant="body2" color="text.secondary">
          ⏳ Loading media...
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {mediaItems.length > 0 ? (
            mediaItems.map((media) => (
              <CompactMediaPreview 
                key={media.id}
                media={media} 
                onRemove={editable ? () => handleRemove(media.id) : null}
                showRemove={editable}
                size={size}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              {placeholder || 'No media attached'}
            </Typography>
          )}
          
          {editable && canAddMore && (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Plus size={16} />}
                endIcon={<CaretDown size={16} />}
                onClick={(e) => {
                  console.log('[CompactMediaField] DROPDOWN CLICKED!');
                  setMenuAnchor(e.currentTarget);
                }}
                sx={{ 
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  height: size === 'medium' ? 32 : 24
                }}
              >
                Add Media
              </Button>
              
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                {menuOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <MenuItem
                      key={index}
                      onClick={option.onClick}
                    >
                      <IconComponent size={16} style={{ marginRight: 8 }} />
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          )}
        </Stack>
      )}

      {/* Media Library Picker */}
      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleMediaSelect}
        record={record}
        multi={true}
        selectedMediaIds={mediaItems.map(m => m.id)}
      />

      {/* Upload Modal */}
      {MediaUploadModal && (
        <MediaUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
          record={record}
          field={{ name: 'section_media' }}
          config={{ name: 'media' }}
          isMulti={true}
        />
      )}

      {/* Edit Modal for External Links */}
      {MediaEditModal && editModalOpen && editingMedia && (
        <MediaEditModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingMedia(null);
          }}
          config={{ name: 'media' }}
          initialMedia={editingMedia}
          onSave={handleEditComplete}
        />
      )}
    </Box>
  );
};