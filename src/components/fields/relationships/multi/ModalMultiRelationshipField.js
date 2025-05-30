// Update your ModalMultiRelationshipField to detect create mode and disable auto-save

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, IconButton, Stack
} from '@mui/material';
import { Plus, X } from '@phosphor-icons/react';
import { useMultiRelationshipModal } from '@/components/fields/relationships/multi/useMultiRelationshipModal';

export const ModalMultiRelationshipField = ({
  field,
  record,
  setRecord,
  config,
  onChange,
  hideLabel = false,
  refreshRecord
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // CRITICAL FIX: Detect create mode
  const isCreateMode = !record?.id;
  
  console.log('[ModalMultiRelationshipField] Mode check:', {
    fieldName: field?.name,
    recordId: record?.id,
    isCreateMode,
    hasOnChange: !!onChange
  });

  const {
    selectedItems,
    availableItems,
    loading,
    error,
    handleSave: originalHandleSave,
    handleCancel,
    searchTerm,
    setSearchTerm,
    toggleItem
  } = useMultiRelationshipModal({
    field,
    record,
    // CRITICAL FIX: Disable auto-save in create mode
    autoSave: !isCreateMode, // Only auto-save when we have a record ID
    onSuccess: refreshRecord
  });

  // Handle save differently for create mode
  const handleSave = async () => {
    if (isCreateMode) {
      // In create mode, just update local state via onChange
      console.log('[ModalMultiRelationshipField] Create mode - updating local state only');
      
      if (onChange) {
        const selectedIds = selectedItems.map(item => String(item.id));
        onChange(field.name, selectedIds);
      }
      
      // Update the record state directly
      if (setRecord) {
        setRecord(prev => ({
          ...prev,
          [field.name]: selectedItems.map(item => String(item.id)),
          [`${field.name}_details`]: selectedItems
        }));
      }
      
      setIsOpen(false);
    } else {
      // In edit mode, use the original save logic
      await originalHandleSave();
      setIsOpen(false);
    }
  };

  // Get current selection for display
  const currentSelection = record?.[`${field.name}_details`] || [];
  const currentCount = Array.isArray(currentSelection) ? currentSelection.length : 0;

  return (
    <>
      <Box
        onClick={() => setIsOpen(true)}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          py: 0,
          px: 2,
          cursor: 'pointer',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        {!hideLabel && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {field.label}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {currentSelection.slice(0, 3).map((item) => (
            <Chip
              key={item.id}
              label={item[field.relation.labelField] || item.title || `ID: ${item.id}`}
              size="small"
              variant="outlined"
              sx={{ py:2, px: 1, }}
            />
          ))}
          
          {currentCount > 3 && (
            <Chip
              label={`+${currentCount - 3} more`}
              size="small"
              variant="outlined"
              color="primary"
              
            />
          )}
          
          {currentCount === 0 && (
            <Typography variant="body2" color="text.secondary">
              Select {field.label.toLowerCase()}...
            </Typography>
          )}
          
          <IconButton size="small" sx={{ ml: 'auto' }}>
            <Plus size={16} />
          </IconButton>
        </Box>
      </Box>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Select {field.label}
          {isCreateMode && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Changes will be saved when you create the record
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {/* Your existing modal content here */}
          {loading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              Loading...
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Box>
              {/* Search and selection UI */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', marginBottom: 16, padding: 8 }}
              />
              
              <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                {availableItems.map((item) => (
                  <Box
                    key={item.id}
                    onClick={() => toggleItem(item)}
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedItems.find(s => s.id === item.id) ? 'primary.200' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Typography>
                      {item[field.relation.labelField] || item.title || `ID: ${item.id}`}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {isCreateMode ? 'Apply Selection' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};