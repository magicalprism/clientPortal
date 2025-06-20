'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { Upload, LinkSimple, Link } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { MediaActions } from '@/components/fields/media/components/MediaActions';
import { MediaPreviewCard } from '@/components/fields/media/components/MediaPreviewCard';
import { SimpleThumbnailTemplate } from '@/components/fields/media/components/SimpleThumbnailTemplate';
import * as collections from '@/collections';

// Initialize variables to hold component references
let MediaUploadModal = null;
let MediaLibraryPicker = null;
let MediaEditModal = null;

// Import components with error handling
try {
  const mediaUploadModule = require('@/components/fields/media/modals/MediaUploadModal');
  MediaUploadModal = mediaUploadModule.MediaUploadModal;
} catch (e) {
  console.warn('Error loading MediaUploadModal:', e.message);
}

try {
  const libraryModule = require('@/components/fields/media/components/MediaLibraryPicker');
  MediaLibraryPicker = libraryModule.MediaLibraryPicker;
} catch (e) {
  console.warn('Error loading MediaLibraryPicker:', e.message);
}

try {
  const editModule = require('@/components/fields/media/modals/MediaEditModal');
  MediaEditModal = editModule.MediaEditModal;
} catch (e) {
  console.warn('Error loading MediaEditModal:', e.message);
}

const supabase = createClient();

export const GalleryRelationshipField = ({ 
  field, 
  value = [], 
  onChange, 
  config, 
  record,
  editable = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [modalState, setModalState] = useState({
    uploadOpen: false,
    libraryOpen: false,
    editOpen: false,
    editingItem: null
  });
  const initialized = useRef(false);

  const showAll = field?.showAll === true;
  const relation = field.relation || {};
  const table = relation.table || 'media';
  const mediaConfig = collections.media;

  const menuOptions = [
    {
      label: 'Upload Media',
      icon: Upload,
      onClick: () => {
        setModalState(prev => ({ ...prev, uploadOpen: true }));
      }
    },
    {
      label: 'Choose from Library',
      icon: Link,
      onClick: () => {
        setModalState(prev => ({ ...prev, libraryOpen: true }));
      }
    },
    {
      label: 'Link External URL',
      icon: LinkSimple,
      onClick: () => {
        if (!MediaEditModal) {
          console.error('MediaEditModal not available for external link');
          return;
        }
        
        setModalState(prev => ({ 
          ...prev, 
          editOpen: true,
          editingItem: {
            url: '',
            mime_type: 'external/url',
            title: '',
            alt_text: '',
            company_id: record?.company_id || null,
            project_id: record?.project_id || null,
            status: 'active',
            is_external: true
          }
        }));
      }
    }
  ];

  // Handle menu actions
  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  useEffect(() => {
    if (initialized.current) return;

    const fetchItems = async () => {
      setLoading(true);
      
      try {
        // For fields with junction tables, always use junction table query
        if (relation.junctionTable && record?.id) {
          const { data: junctionData, error: junctionError } = await supabase
            .from(relation.junctionTable)
            .select(`${relation.targetKey}`)
            .eq(relation.sourceKey, record.id);
            
          if (junctionError) {
            console.error('Junction table query error:', junctionError);
            setItems([]);
          } else {
            const mediaIds = junctionData.map(row => row[relation.targetKey]);
            
            if (mediaIds.length > 0) {
              const { data: mediaData, error: mediaError } = await supabase
                .from(table)
                .select('*')
                .in('id', mediaIds);
                
              if (mediaError) {
                console.error('Media query error:', mediaError);
                setItems([]);
              } else {
                setItems(mediaData || []);
              }
            } else {
              setItems([]);
            }
          }
        } else if (showAll && relation.filter) {
          // ShowAll mode with direct filters
          let query = supabase.from(table).select('*');
          Object.entries(relation.filter).forEach(([key, val]) => {
            if (typeof val === 'string' && val.startsWith('record.')) {
              const recordKey = val.split('record.')[1];
              const resolvedVal = record?.[recordKey];
              if (resolvedVal) query = query.eq(key, resolvedVal);
            } else if (typeof val === 'string' && val === 'record.id') {
              query = query.eq(key, record?.id);
            } else {
              query = query.eq(key, val);
            }
          });
          
          const { data, error } = await query;
          if (error) {
            console.error('Direct filter query error:', error);
            setItems([]);
          } else {
            setItems(data || []);
          }
        } else {
          // Fallback: use provided value
          let ids = [];
          
          if (Array.isArray(value)) {
            ids = value.map(item => {
              if (typeof item === 'object' && item?.id) {
                return item.id;
              }
              return item;
            }).filter(Boolean);
          } else if (typeof value === 'object' && value?.ids) {
            ids = value.ids.filter(Boolean);
          } else if (value) {
            ids = [value];
          }

          if (!ids.length) {
            setItems([]);
          } else {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .in('id', ids);
              
            if (error) {
              console.error(`Failed to fetch ${table}:`, error);
              setItems([]);
            } else {
              setItems(data || []);
            }
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setItems([]);
      } finally {
        setLoading(false);
        initialized.current = true;
      }
    };

    fetchItems();
  }, [value, record, field?.name, showAll, relation.junctionTable]);

  // Refresh effect for deliverables field
  useEffect(() => {
    const refreshAfterChanges = async () => {
      if (field?.name !== 'deliverables' || !relation.junctionTable || !record?.id) return;
      
      const { data: junctionData, error: junctionError } = await supabase
        .from(relation.junctionTable)
        .select(`${relation.targetKey}`)
        .eq(relation.sourceKey, record.id);
        
      if (!junctionError && junctionData) {
        const mediaIds = junctionData.map(row => row[relation.targetKey]);
        
        if (mediaIds.length > 0) {
          const { data: mediaData, error: mediaError } = await supabase
            .from(table)
            .select('*')
            .in('id', mediaIds);
            
          if (!mediaError && mediaData) {
            setItems(mediaData);
          }
        } else {
          setItems([]);
        }
      }
    };
    
    const timeoutId = setTimeout(refreshAfterChanges, 2000);
    return () => clearTimeout(timeoutId);
  }, [items.length, field?.name]);

  // Handle adding media
  const handleAdd = async (media) => {
    if (!media) {
      console.warn('No media provided to handleAdd');
      return;
    }

    const mediaArray = Array.isArray(media) ? media : [media];
    const validMedia = mediaArray.filter(m => m && m.id);
    
    if (validMedia.length === 0) {
      console.warn('No valid media to add');
      return;
    }

    // Create junction table entries
    if (relation.junctionTable && record?.id) {
      for (const mediaItem of validMedia) {
        const junctionData = {
          [relation.sourceKey]: record.id,
          [relation.targetKey]: mediaItem.id
        };
        
        const { error } = await supabase
          .from(relation.junctionTable)
          .upsert(junctionData, { 
            onConflict: `${relation.sourceKey},${relation.targetKey}`,
            ignoreDuplicates: true 
          });
          
        if (error) {
          console.error('Junction insert error:', error);
        }
      }
    } else if (relation.foreignKey && record?.id) {
      // Fallback to foreign key approach
      for (const mediaItem of validMedia) {
        const { error } = await supabase
          .from('media')
          .update({ [relation.foreignKey]: record.id })
          .eq('id', mediaItem.id);
          
        if (error) {
          console.error('Foreign key update error:', error);
        }
      }
    }

    // Update local state
    const next = [...items, ...validMedia];
    setItems(next);
    
    // For regular mode (not showAll), also call onChange
    if (!showAll && onChange && typeof onChange === 'function') {
      const newIds = next.map(m => m.id);
      
      try {
        onChange(newIds);
      } catch (error) {
        console.error('onChange error:', error);
      }
    }
  };

  // Handle removing media
  const handleRemove = async (mediaId) => {
    // Remove from junction table if it exists
    if (relation.junctionTable && record?.id) {
      const { error } = await supabase
        .from(relation.junctionTable)
        .delete()
        .eq(relation.sourceKey, record.id)
        .eq(relation.targetKey, mediaId);
        
      if (error) {
        console.error('Failed to remove from junction table:', error);
        return;
      }
    } else if (relation.foreignKey && record?.id) {
      // Fallback to foreign key approach
      const { error } = await supabase
        .from('media')
        .update({ [relation.foreignKey]: null })
        .eq('id', mediaId)
        .eq(relation.foreignKey, record.id);
        
      if (error) {
        console.error('Failed to update media foreign key:', error);
        return;
      }
    }
    
    // Update local state
    const next = items.filter(m => m.id !== mediaId);
    setItems(next);
    
    // For regular mode, also call onChange
    if (!showAll && onChange) {
      const newIds = next.map(m => m.id);
      onChange(newIds);
    }
  };

  // Handle editing media
  const handleEdit = (item) => {
    setModalState(prev => ({
      ...prev,
      editOpen: true,
      editingItem: item
    }));
  };

  const handleEditComplete = (editedItem) => {
    // Update local items
  setItems(prev => {
    const updated = prev.map(item => 
      item.id === editedItem.id ? editedItem : item
    );
    return updated;
  });

  // If not in the list, add it
  if (!items.find(item => item.id === editedItem.id)) {
    setItems(prev => [...prev, editedItem]);
  }

  // 👇 Call onChange with updated IDs
  if (onChange && typeof onChange === 'function') {
    const updatedIds = items.map(m => m.id);
    if (!updatedIds.includes(editedItem.id)) {
      updatedIds.push(editedItem.id);
    }
    onChange(updatedIds); // ⚠️ This is what actually triggers save
  }
    
    setModalState(prev => ({ 
      ...prev, 
      editOpen: false, 
      editingItem: null 
    }));
  };

  const availableComponents = {
    upload: !!MediaUploadModal,
    library: !!MediaLibraryPicker,
    edit: !!MediaEditModal
  };

  const missingComponents = Object.entries(availableComponents)
    .filter(([key, available]) => !available)
    .map(([key]) => key);

  return (
    <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%' }}>
      {/* Show warning if components are missing */}
      {missingComponents.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing components: {missingComponents.join(', ')}. Some functionality may not work.
        </Alert>
      )}

      <Stack spacing={2} width="100%">
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading media items...
          </Typography>
        ) : items.length > 0 ? (
          <Grid 
            container 
            spacing={2} 
            className="media-gallery-grid"
          >
            {items.map((media) => {
              // Check if we should use the simple thumbnail template
              const useSimpleTemplate = field?.displayOptions?.thumbnailTemplate === 'simple';
              
              // Determine grid size based on displayOptions or default
              const gridSize = field?.displayOptions?.gridSize || 'medium';
              const gridSizeMap = {
                small: { xs: 12, sm: 12, md: 12 },
                medium: { xs: 12, sm: 12, md: 12 },
                large: { xs: 12, sm: 12, md:12 }
              };
              const gridProps = gridSizeMap[gridSize] || gridSizeMap.medium;
              
              // Determine if we should show title based on displayOptions
              const showTitle = field?.displayOptions?.showTitle === 'icon-only' 
                ? !media?.mime_type?.startsWith('image') // Only show for non-images
                : field?.displayOptions?.showTitle !== false; // Default to true
              
              return (
                <Grid 
                  item 
                  {...gridProps}
                  key={media.id}
                  className="media-item"
                >
                  {useSimpleTemplate ? (
                    <SimpleThumbnailTemplate
                      media={media}
                      onRemove={editable ? () => handleRemove(media.id) : null}
                      onEdit={editable ? (mediaItem, anchorEl) => {
                        setModalState(prev => ({
                          ...prev,
                          editOpen: true,
                          editingItem: mediaItem
                        }));
                      } : null}
                      showControls={editable}
                      size={gridSize}
                    />
                  ) : (
                    <MediaPreviewCard 
                      media={media} 
                      onRemove={editable ? () => handleRemove(media.id) : null} 
                      onEdit={editable ? (mediaItem, anchorEl) => {
                        setModalState(prev => ({
                          ...prev,
                          editOpen: true,
                          editingItem: mediaItem
                        }));
                      } : null}
                      field={field}
                      config={config}
                      showControls={editable}
                      showTitle={showTitle}
                      showSubtitle={field?.displayOptions?.hideDescription !== true}
                      aspectRatio={field?.displayOptions?.thumbnailAspectRatio || 'auto'}
                    />
                  )}
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No media found
            </Typography>
            {editable && (
              <Typography variant="caption" color="text.secondary" display="block">
                Click "Add Media" to add items
              </Typography>
            )}
          </Box>
        )}
        
        {/* MediaActions component for dropdown */}
        {editable && (
          <MediaActions
            canEdit={editable}
            isMulti={true}
            canAddMore={true}
            localSelectedItems={items}
            maxItems={100}
            menuOptions={menuOptions}
            menuAnchor={menuAnchor}
            onMenuClick={handleMenuClick}
            onMenuClose={handleMenuClose}
          />
        )}


      </Stack>

      {/* Upload Modal */}
      {MediaUploadModal && (
        <MediaUploadModal
          open={modalState.uploadOpen}
          onClose={() => {
            setModalState(prev => ({ ...prev, uploadOpen: false }));
          }}
          onUploadComplete={(uploadedMedia) => {
            handleAdd(uploadedMedia);
            setModalState(prev => ({ ...prev, uploadOpen: false }));
          }}
          record={record}
          field={field}
          config={config}
          isMulti={true}
        />
      )}

      {/* Library Picker */}
      {MediaLibraryPicker && (
        <MediaLibraryPicker
          open={modalState.libraryOpen}
          onClose={() => setModalState(prev => ({ ...prev, libraryOpen: false }))}
          onSelect={(selectedMedia) => {
            handleAdd(selectedMedia);
            setModalState(prev => ({ ...prev, libraryOpen: false }));
          }}
          record={record}
          multi={true}
        />
      )}

      {/* Edit Modal */}
      {MediaEditModal && modalState.editOpen && modalState.editingItem && (
        <MediaEditModal
          open={modalState.editOpen}
          onClose={() => setModalState(prev => ({ 
            ...prev, 
            editOpen: false, 
            editingItem: null 
          }))}
          config={mediaConfig}
          initialMedia={{
          ...modalState.editingItem,
          projects: [record.id] // 👈 inject reverse relationship!
        }}
          onSave={handleEditComplete}
        />
      )}
    </Box>
  );
};