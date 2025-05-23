'use client';

import { useState, useEffect } from 'react';
import { getMimeTypeFromUrl } from '@/data/fileTypes';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';
import {
  allEditableMediaKeys,
  manualOnlyKeys
} from '@/components/fields/media/old/components/data/mediaFieldConfig';
import { createClient } from '@/lib/supabase/browser';

/**
 * Shared form state hook for both single and gallery modals
 */
export const useUploadFormState = ({ open, record, config, supabase, existingMedia = null }) => {
  const [mode, setMode] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);

  const isProjectContext = config?.name === 'project';
  const isCompanyContext = config?.name === 'company';

  useEffect(() => {
    if (open) {
      // Reset state on modal open
      if (!existingMedia) {
        setSelectedFiles([]);
        setManualEntries([]);
        setMode(null);
      }

      // Load companies and projects
      const loadOptions = async () => {
        const [{ data: companyData }, { data: projectData }] = await Promise.all([
          supabase.from('company').select('id, title'),
          supabase.from('project').select('id, title')
        ]);
        setCompanies(companyData || []);
        setProjects(projectData || []);
      };

      loadOptions();

      // Infer company/project from context or record
      let inferredCompanyId = record?.company_id || '';
      let inferredProjectId = record?.project_id || '';
      const currentTable = config?.name;
      const currentId = record?.[`${currentTable}_id`] || record?.id || '';

      if (!inferredCompanyId && currentTable === 'company') {
        inferredCompanyId = currentId;
      }

      if (!inferredProjectId && currentTable === 'project') {
        inferredProjectId = currentId;
      }

      setCompanyId(inferredCompanyId || '');
      setProjectId(inferredProjectId || '');
    }
  }, [open, record, config, supabase, existingMedia]);

  return {
    mode,
    setMode,
    selectedFiles,
    setSelectedFiles,
    manualEntries,
    setManualEntries,
    companyId,
    setCompanyId,
    projectId,
    setProjectId,
    companies,
    projects,
    isProjectContext,
    isCompanyContext
  };
};

/**
 * Shared handler logic for media upload operations - FIXED VERSION
 */
export const useUploadHandlers = ({
  mode,
  setMode, // ADDED: Make sure setMode is included
  selectedFiles,
  setSelectedFiles,
  manualEntries,
  setManualEntries,
  onUploadComplete,
  onClose,
  record,
  field,
  config,
  setUploading,
  setError,
  supabase,
  companyId,
  projectId
}) => {
  const addManualEntry = () => {
    setManualEntries([...manualEntries, { 
      url: '', 
      title: '', 
      altText: '', 
      copyright: '', 
      description: '', 
      originalTitle: '', 
      tags: [], 
      mime_type: '', 
      is_folder: false  
    }]);
  };

  const removeManualEntry = (index) => {
    const next = [...manualEntries];
    next.splice(index, 1);
    setManualEntries(next);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // For existing files, append to the list
    setSelectedFiles(prevFiles => [
      ...prevFiles,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.split('.')[0] || '',  // Use filename without extension as default title
        altText: '',
        copyright: '',
        description: '', 
        originalTitle: '',
        tags: [], 
        mime_type: '', 
        is_folder: false 
      }))
    ]);
    
    // Set mode to file if not already set - FIXED: Check if setMode exists
    if (!mode && setMode) {
      setMode('file');
    }
  };

  const handleUpload = async () => {
    if (!setUploading || !setError) {

      return;
    }

    setUploading(true);
    setError(null);

    const resolvedCompanyId = companyId || record?.company_id || (config?.name === 'company' ? record?.id : null);
    const resolvedProjectId = projectId || record?.project_id || (config?.name === 'project' ? record?.id : null);
    const metadata = {
      company_id: resolvedCompanyId,
      project_id: resolvedProjectId
    };

    let allMediaIds = [];

    try {
      const buildPayload = (media) => {
        const payload = {};
        for (const key of allEditableMediaKeys) {
          payload[key] = media[key] ?? null;
        }
        return {
          ...payload,
          mime_type: media.mime_type || getMimeTypeFromUrl(media.url || media.file?.name),
          is_folder: media.is_folder || false,
          ...metadata
        };
      };

      if (mode === 'file' && selectedFiles.length > 0) {
        for (const media of selectedFiles) {
          if (!media.file) continue;

          const uploaded = await uploadAndCreateMediaRecord({
            file: media.file,
            record,
            field,
            baseFolder: field?.baseFolder || '',
            ...buildPayload(media)
          });

          if (uploaded?.id) {
            const { error: updateError } = await supabase
              .from('media')
              .update(metadata)
              .eq('id', uploaded.id);

            if (updateError) throw updateError;
            allMediaIds.push(uploaded.id);
          }
        }
      }

      if (mode === 'manual' && manualEntries.length > 0) {
        for (const media of manualEntries) {
          if (!media.url) continue;

          const payload = buildPayload(media);

          if (media.id) {
            // Update existing media
            const { error: updateError } = await supabase
              .from('media')
              .update(payload)
              .eq('id', media.id);

            if (updateError) throw updateError;
            allMediaIds.push(media.id);
          } else {
            // Insert new media
            const { data, error } = await supabase
              .from('media')
              .insert({
                ...payload,
                url: media.url,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (error) throw error;
            if (data?.id) {
              allMediaIds.push(data.id);
            }
          }
        }
      }

      if (allMediaIds.length > 0) {
        const { data: finalMedia, error: finalError } = await supabase
          .from('media')
          .select('*')
          .in('id', allMediaIds);

        if (finalError) throw finalError;

        // FIXED: Handle onUploadComplete properly
        if (onUploadComplete) {
          if (typeof onUploadComplete === 'function') {
            // If it's a function that expects the media directly
            onUploadComplete(finalMedia);
          } else {
            // Legacy callback style
            onUploadComplete((prev) => {
              if (!field?.multi) return finalMedia[0];
              return [...(Array.isArray(prev) ? prev : []), ...finalMedia];
            });
          }
        }
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {

      if (setError) {
        setError(err.message || 'Upload failed. Please try again.');
      }
    } finally {
      if (setUploading) {
        setUploading(false);
      }
    }
  };

  return {
    addManualEntry,
    removeManualEntry,
    handleFileChange,
    handleUpload
  };
};

/**
 * Utility hook for the media preview components
 */
export const useMediaPreview = (mediaId) => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchMedia = async () => {
      if (!mediaId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('id', mediaId)
          .single();
          
        if (error) throw error;
        setMedia(data);
      } catch (err) {
        console.error('Failed to fetch media:', err);
        setError('Failed to load media item');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedia();
  }, [mediaId]);
  
  return { media, loading, error };
};