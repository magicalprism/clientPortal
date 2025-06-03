'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Hook to handle Google Drive folder renaming when record names change
 * Tracks original names and triggers renames when needed
 */
export const useDriveRename = ({ record, config, onRecordUpdate }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState(null);
  const [renameSuccess, setRenameSuccess] = useState(false);
  
  const supabase = createClient();

  // Get the name field for this collection type
  const getNameField = () => {
    const nameFieldMap = {
      'company': 'title',
      'project': 'title', 
      'element': 'title'
    };
    return nameFieldMap[config.name] || 'title';
  };

  // Check if a rename is needed
  const needsRename = useCallback(() => {
    if (!record?.drive_folder_id) return false;
    
    const nameField = getNameField();
    const currentName = record[nameField];
    const originalName = record.drive_original_name || record.original_title;
    
    // Need rename if we have an original name and it's different from current
    return originalName && currentName && originalName !== currentName;
  }, [record, config]);

  // Get the collection type for API calls
  const getCollectionType = () => {
    const typeMap = {
      'company': 'company',
      'project': 'project', 
      'element': 'element'
    };
    return typeMap[config.name] || null;
  };

  // Perform the rename operation
  const performRename = useCallback(async () => {
    if (!needsRename()) {
      return { success: true, message: 'No rename needed' };
    }

    const collectionType = getCollectionType();
    if (!collectionType) {
      return { success: false, error: 'Unknown collection type' };
    }

    setIsRenaming(true);
    setRenameError(null);
    setRenameSuccess(false);

    try {
      const nameField = getNameField();
      const newName = record[nameField];
      const originalName = record.drive_original_name || record.original_title;

      console.log(`[useDriveRename] Renaming ${collectionType} folder from "${originalName}" to "${newName}"`);

      // Call the rename API
      const response = await fetch('/api/google-drive/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: collectionType,
          folderId: record.drive_folder_id,
          newName: newName,
          oldName: originalName,
          recordId: record.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('[useDriveRename] Rename successful:', result);

      // Update the record to track the new name as the "original"
      const updateData = {
        drive_original_name: newName,
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { error: updateError } = await supabase
        .from(config.name)
        .update(updateData)
        .eq('id', record.id);

      if (updateError) {
        console.error('[useDriveRename] Error updating record:', updateError);
      } else if (onRecordUpdate) {
        // Update local record
        onRecordUpdate(prev => ({
          ...prev,
          ...updateData
        }));
      }

      setRenameSuccess(true);
      return { success: true, result };

    } catch (error) {
      console.error('[useDriveRename] Rename failed:', error);
      setRenameError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsRenaming(false);
    }
  }, [record, config, supabase, onRecordUpdate, needsRename]);

  // Auto-rename when needed (optional - might want to make this manual)
  useEffect(() => {
    if (needsRename() && !isRenaming) {
      // Auto-rename with a small delay to avoid rapid-fire renames
      const timer = setTimeout(() => {
        performRename();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [needsRename, isRenaming, performRename]);

  // Manual trigger
  const triggerRename = useCallback(() => {
    return performRename();
  }, [performRename]);

  return {
    // State
    isRenaming,
    renameError,
    renameSuccess,
    needsRename: needsRename(),
    
    // Actions  
    performRename: triggerRename,
    
    // Utils
    originalName: record?.drive_original_name || record?.original_title,
    currentName: record?.[getNameField()],
    collectionType: getCollectionType()
  };
};