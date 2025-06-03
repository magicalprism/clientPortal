'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Hook to handle Google Drive folder creation for records
 * Integrates with the existing modal and collection system
 */
export const useGoogleDriveFolders = ({ record, config, onRecordUpdate }) => {
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderCreationError, setFolderCreationError] = useState(null);
  const [foldersCreated, setFoldersCreated] = useState(false);
  
  const supabase = createClient();

  // Determine the collection type for the API call
  const getCollectionType = () => {
    if (!config?.name) return null;
    
    const typeMap = {
      'company': 'company',
      'project': 'project', 
      'element': 'element'
    };
    
    return typeMap[config.name] || null;
  };

  // Check if record needs folder creation
  const needsFolderCreation = useCallback(() => {
    if (!record?.id || !record?.create_folder) return false;
    
    const collectionType = getCollectionType();
    if (!collectionType) return false;

    // Check if folders were already created (you can add a field like drive_folder_id to track this)
    if (record.drive_folder_id) return false;
    
    return true;
  }, [record, config]);

  // Enhanced payload preparation with relationship fetching
  const prepareEnhancedPayload = async () => {
    if (!record) return null;

    let payload = { ...record };
    const collectionType = getCollectionType();

    console.log('[useGoogleDriveFolders] Preparing payload for:', collectionType, record.id);

    try {
      // Fetch company details if needed
      if ((collectionType === 'project' || collectionType === 'element') && record.company_id) {
        if (!payload.company_id_details) {
          console.log('[useGoogleDriveFolders] Fetching company details for company_id:', record.company_id);
          const { data: company, error } = await supabase
            .from('company')
            .select('id, title')
            .eq('id', record.company_id)
            .single();

          if (!error && company) {
            payload.company_id_details = company;
            payload.companyTitle = company.title; // Fallback format
            console.log('[useGoogleDriveFolders] Company details added:', company.title);
          } else {
            console.warn('[useGoogleDriveFolders] Failed to fetch company details:', error);
          }
        }
      }

      // Fetch project details if needed (for elements)
      if (collectionType === 'element' && record.project_id) {
        if (!payload.project_id_details) {
          console.log('[useGoogleDriveFolders] Fetching project details for project_id:', record.project_id);
          const { data: project, error } = await supabase
            .from('project')
            .select('id, title')
            .eq('id', record.project_id)
            .single();

          if (!error && project) {
            payload.project_id_details = project;
            payload.projectTitle = project.title; // Fallback format
            console.log('[useGoogleDriveFolders] Project details added:', project.title);
          } else {
            console.warn('[useGoogleDriveFolders] Failed to fetch project details:', error);
          }
        }
      }

      return payload;
    } catch (error) {
      console.error('[useGoogleDriveFolders] Error preparing payload:', error);
      return payload;
    }
  };

  // Create folders via API
  const createFolders = useCallback(async (force = false) => {
    if (!needsFolderCreation() && !force) {
      console.log('[useGoogleDriveFolders] Folder creation not needed');
      return { success: true, message: 'No folder creation needed' };
    }

    const collectionType = getCollectionType();
    if (!collectionType) {
      console.error('[useGoogleDriveFolders] Unknown collection type:', config?.name);
      return { success: false, error: 'Unknown collection type' };
    }

    setIsCreatingFolders(true);
    setFolderCreationError(null);

    try {
      console.log(`[useGoogleDriveFolders] Creating folders for ${collectionType}:`, record.id);
      
      // Prepare enhanced payload with relationship data
      const payload = await prepareEnhancedPayload();
      
      if (!payload) {
        throw new Error('Failed to prepare payload');
      }

      console.log('[useGoogleDriveFolders] Payload prepared:', {
        type: collectionType,
        title: payload.title,
        companyTitle: payload.company_id_details?.title || payload.companyTitle,
        projectTitle: payload.project_id_details?.title || payload.projectTitle
      });

      // Call the Google Drive API
      const response = await fetch('/api/google-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: collectionType,
          payload: payload
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('[useGoogleDriveFolders] Folders created successfully:', result);

      // ✅ IMPROVED: Extract folder ID from multiple possible response formats
      let folderId = null;
      
      // Try different response formats
      if (result.folder?.id) {
        folderId = result.folder.id;
        console.log('[useGoogleDriveFolders] Using result.folder.id:', folderId);
      } else if (result.folders?.main?.id) {
        folderId = result.folders.main.id;
        console.log('[useGoogleDriveFolders] Using result.folders.main.id:', folderId);
      } else if (result.companyFolder?.id) {
        folderId = result.companyFolder.id;
        console.log('[useGoogleDriveFolders] Using result.companyFolder.id:', folderId);
      }

      // ✅ IMPROVED: Always try to update the record with folder ID (as backup to server-side saving)
      if (folderId) {
        const updateData = {
          drive_folder_id: folderId,
          updated_at: new Date().toISOString()
        };

        console.log('[useGoogleDriveFolders] Updating record with folder ID:', folderId);

        // Update in database
        const { error: updateError } = await supabase
          .from(config.name)
          .update(updateData)
          .eq('id', record.id);

        if (updateError) {
          console.error('[useGoogleDriveFolders] Error updating record:', updateError);
          // Don't throw here - folder was created successfully, just database update failed
        } else {
          console.log('[useGoogleDriveFolders] ✅ Record updated successfully with folder ID');
          
          // Update the local record if callback provided
          if (onRecordUpdate) {
            onRecordUpdate(prev => ({
              ...prev,
              ...updateData
            }));
          }
        }
      } else {
        console.warn('[useGoogleDriveFolders] ⚠️ No folder ID found in API response:', result);
      }

      setFoldersCreated(true);
      return { success: true, result };

    } catch (error) {
      console.error('[useGoogleDriveFolders] Error creating folders:', error);
      setFolderCreationError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsCreatingFolders(false);
    }
  }, [record, config, supabase, onRecordUpdate, needsFolderCreation, prepareEnhancedPayload]);

  // Auto-create folders when record is loaded (if needed)
  useEffect(() => {
    if (needsFolderCreation() && !isCreatingFolders && !foldersCreated) {
      console.log('[useGoogleDriveFolders] Auto-triggering folder creation');
      createFolders();
    }
  }, [needsFolderCreation, isCreatingFolders, foldersCreated, createFolders]);

  // Manual trigger function
  const triggerFolderCreation = useCallback(() => {
    return createFolders(true);
  }, [createFolders]);

  return {
    // State
    isCreatingFolders,
    folderCreationError,
    foldersCreated: foldersCreated || !!record?.drive_folder_id,
    needsFolderCreation: needsFolderCreation(),
    
    // Actions
    createFolders: triggerFolderCreation,
    
    // Utils
    collectionType: getCollectionType()
  };
};