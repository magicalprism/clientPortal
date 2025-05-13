'use client';

/**
 * Debug helper for multirelationship fields
 * Temporarily add this to your component to see what's happening with tags
 */

import { Typography, Box, Paper } from '@mui/material';

export const MultiRelationshipDebugger = ({ field, record }) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  // Extract field data
  const fieldName = field?.name;
  const ids = record?.[fieldName];
  const details = record?.[`${fieldName}_details`];
  
  // Format data for display
  const formattedIds = Array.isArray(ids) 
    ? ids.map(String) 
    : typeof ids === 'object' && ids?.ids
    ? ids.ids.map(String)
    : [];
    
  const formattedDetails = Array.isArray(details)
    ? details.map(d => ({ id: d.id, label: d.title || d.name }))
    : [];
    
  return (
    <Paper 
      sx={{ 
        p: 2, 
        mt: 2, 
        mb: 2, 
        backgroundColor: '#f9f9f9',
        border: '1px dashed #ccc'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" color="primary">
        MultiRelationship Debug: {fieldName}
      </Typography>
      
      <Box mt={1}>
        <Typography variant="caption" fontWeight="bold">IDs ({formattedIds.length}):</Typography>
        <Box 
          sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            borderRadius: 1,
            border: '1px solid #eee',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '100px',
            overflow: 'auto'
          }}
        >
          {formattedIds.length > 0 
            ? JSON.stringify(formattedIds, null, 2) 
            : '(empty)'}
        </Box>
      </Box>
      
      <Box mt={1}>
        <Typography variant="caption" fontWeight="bold">Details ({formattedDetails.length}):</Typography>
        <Box 
          sx={{ 
            p: 1, 
            backgroundColor: '#fff', 
            borderRadius: 1,
            border: '1px solid #eee',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '100px',
            overflow: 'auto'
          }}
        >
          {formattedDetails.length > 0 
            ? JSON.stringify(formattedDetails, null, 2) 
            : '(empty)'}
        </Box>
      </Box>
    </Paper>
  );
};

export default MultiRelationshipDebugger;