'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';

/**
 * TagsDebugger - A component to help debug tag issues in multirelationship fields
 * Place this component in your CollectionItemPage to see what's happening with tags
 */
export const TagsDebugger = ({ record, config }) => {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [databaseTags, setDatabaseTags] = useState(null);
  const [error, setError] = useState(null);
  
  const recordId = record?.id;
  const tagsField = config?.fields?.find(f => 
    f.type === 'multiRelationship' && f.name === 'tags'
  );
  
  // Extract the raw tag data from record
  const recordTags = record?.tags || [];
  const recordTagDetails = record?.tags_details || [];
  
  // Function to load tags directly from the database
  const loadTagsFromDatabase = async () => {
    if (!recordId || !tagsField) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { junctionTable, sourceKey, targetKey, table, labelField } = {
        junctionTable: tagsField.relation?.junctionTable || 'category_task',
        sourceKey: tagsField.relation?.sourceKey || 'task_id',
        targetKey: tagsField.relation?.targetKey || 'category_id',
        table: tagsField.relation?.table || 'category',
        labelField: tagsField.relation?.labelField || 'title'
      };
      
      // 1. Fetch tag IDs from junction table
      const { data: junctionData, error: junctionError } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, recordId);
        
      if (junctionError) {
        setError(`Junction table error: ${junctionError.message}`);
        return;
      }
      
      const tagIds = junctionData.map(row => row[targetKey]).filter(Boolean);
      
      if (tagIds.length === 0) {
        setDatabaseTags({ ids: [], details: [] });
        return;
      }
      
      // 2. Fetch tag details
      const { data: tagDetails, error: detailsError } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .in('id', tagIds);
        
      if (detailsError) {
        setError(`Details error: ${detailsError.message}`);
        return;
      }
      
      setDatabaseTags({
        ids: tagIds.map(String),
        details: tagDetails
      });
    } catch (err) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Auto-load tags when component mounts
    if (recordId) {
      loadTagsFromDatabase();
    }
  }, [recordId]);
  
  return (
    <Box sx={{ 
      p: 2, 
      mb: 2, 
      backgroundColor: '#f5f5f5', 
      border: '1px dashed #ccc',
      borderRadius: 1 
    }}>
      <Typography variant="subtitle2" fontWeight="bold" color="primary">
        Tags Debugger
      </Typography>
      
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" fontWeight="bold">
          Record ID: {recordId || 'None'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', mt: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Record Tags ({recordTags.length})
          </Typography>
          <Box sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            border: '1px solid #eee',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '10px',
            maxHeight: '80px',
            overflow: 'auto'
          }}>
            {recordTags.length > 0 
              ? recordTags.join(', ')
              : '(empty)'}
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, ml: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Database Tags ({databaseTags?.ids?.length || 0})
          </Typography>
          <Box sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            border: '1px solid #eee',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '10px',
            maxHeight: '80px',
            overflow: 'auto'
          }}>
            {databaseTags?.ids?.length > 0 
              ? databaseTags.ids.join(', ')
              : isLoading 
                ? 'Loading...' 
                : error 
                  ? 'Error' 
                  : '(empty)'}
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', mt: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Record Tag Details ({recordTagDetails.length})
          </Typography>
          <Box sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            border: '1px solid #eee',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '10px',
            maxHeight: '80px',
            overflow: 'auto'
          }}>
            {recordTagDetails.length > 0 
              ? JSON.stringify(recordTagDetails, null, 2)
              : '(empty)'}
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, ml: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Database Tag Details ({databaseTags?.details?.length || 0})
          </Typography>
          <Box sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            border: '1px solid #eee',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '10px',
            maxHeight: '80px',
            overflow: 'auto'
          }}>
            {databaseTags?.details?.length > 0 
              ? JSON.stringify(databaseTags.details, null, 2)
              : isLoading 
                ? 'Loading...' 
                : error 
                  ? error 
                  : '(empty)'}
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
        
        <Button 
          size="small" 
          variant="outlined" 
          disabled={isLoading}
          onClick={loadTagsFromDatabase}
          sx={{ fontSize: '10px' }}
        >
          {isLoading ? <CircularProgress size={12} /> : 'Reload Tags'}
        </Button>
      </Box>
    </Box>
  );
};

export default TagsDebugger;