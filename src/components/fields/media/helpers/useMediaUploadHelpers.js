'use client';

import { useState, useEffect } from 'react';
import { getMimeTypeFromUrl } from '@/data/fileTypes';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';

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
 * Shared handler logic for media upload operations
 */
export const useUploadHandlers = ({
  mode,
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
    setManualEntries([...manualEntries, { url: '', title: '', altText: '', copyright: '', description: '', originalTitle: '', tags: [], 
  mime_type: '', is_folder: false  }]);
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
    
    // Set mode to file if not already set
    if (!mode) {
      setMode('file');
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    // Prepare metadata
    const resolvedCompanyId = companyId || record?.company_id || (config?.name === 'company' ? record?.id : null);
    const resolvedProjectId = projectId || record?.project_id || (config?.name === 'project' ? record?.id : null);
    const metadata = {
      company_id: resolvedCompanyId,
      project_id: resolvedProjectId
    };

    let allMediaIds = [];

    try {
      // File upload handling
      if (mode === 'file' && selectedFiles.length > 0) {
        for (const media of selectedFiles) {
          if (!media.file) continue; // Skip entries without files
          
          const uploaded = await uploadAndCreateMediaRecord({
            file: media.file,
            record,
            field,
            baseFolder: field.baseFolder || '',
            altText: media.altText,
            copyright: media.copyright,
            title: media.title,
            description: media.description || '',
            original_title: media.originalTitle || '',
            mime_type: media.mime_type || getMimeTypeFromUrl(media.url),
            is_folder: media.is_folder || false,
            tags: media.tags || [],
          });

          if (uploaded?.id) {
            // Update with company/project metadata
            const { error: updateError } = await supabase
              .from('media')
              .update(metadata)
              .eq('id', uploaded.id);

            if (updateError) throw updateError;
            allMediaIds.push(uploaded.id);
          }
        }
      } 
      // Manual URL entry handling
      else if (mode === 'manual' && manualEntries.length > 0) {
        for (const media of manualEntries) {
          if (!media.url) continue; // Skip entries without URLs
          
          const { data, error } = await supabase
            .from('media')
            .insert({
              url: media.url,
              title: media.title,
              alt_text: media.altText,
              copyright: media.copyright,
              description: media.description || '',
              original_title: media.originalTitle || '',
              tags: media.tags || [],
              mime_type: media.mime_type || getMimeTypeFromUrl(media.url || media.file?.name),
              is_folder: media.is_folder || false,
              created_at: new Date().toISOString(),
              ...metadata
            })
            .select()
            .single();

          if (error) throw error;
          if (data?.id) {
            allMediaIds.push(data.id);
          }
        }
      }

      // Fetch the complete media records with all fields
      if (allMediaIds.length > 0) {
        const { data: finalMedia, error: finalError } = await supabase
          .from('media')
          .select('*')
          .in('id', allMediaIds);

        if (finalError) throw finalError;

        // Return media based on field configuration (single or multi)
        onUploadComplete((prev) => {
          if (!field?.multi) return finalMedia[0]; // Single field - return just the first item
          return [...(Array.isArray(prev) ? prev : []), ...finalMedia]; // Multi field - append to existing
        });
      }

      onClose();
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
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