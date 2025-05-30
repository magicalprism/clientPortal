'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip,
  IconButton,
  Button,
  CircularProgress
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ArrowSquareOut } from '@phosphor-icons/react';
import SignatureButton from '@/components/dashboard/contract/parts/SignatureButton';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { compileContractContent } from '@/lib/utils/contractContentCompiler';

// Simple debug helper - only logs in development
const debug = (label, value) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log(label, value);
  }
};

export const QuickViewCard = ({ config, record }) => {
  const [regenerating, setRegenerating] = useState(false);
  const supabase = createClient();
  // Always log the record structure to help with debugging
  
  // Guard clause for config
  if (!config?.quickView?.enabled) return null;

  const {
    imageField,
    titleField,
    subtitleField,
    descriptionField,
    extraFields = [],
    relatedFields = []
  } = config.quickView || {};

  // Check if this is a contract - multiple detection methods
  const isContract = 
    config?.name === 'contract' || 
    config?.label?.toLowerCase().includes('contract') ||
    config?.singularLabel?.toLowerCase().includes('contract') ||
    record?.hasOwnProperty('content') && record?.hasOwnProperty('signature_status'); // Contract-specific fields

  // --- Smart image handling ---
  // Try each possible image source path
  const imageSources = {
    // Direct image field
    directImageDetail: imageField && record?.[`${imageField}_details`]?.url,
    directImage: imageField && record?.[imageField],
    
    // Company logo paths
    companyLogo: record?.company?.media?.url,
    companyThumbnail: record?.company_thumbnail_url,
    companyDetailsThumb: record?.company_id_details?.thumbnail_id_details?.url
  };
  
  debug('Image sources', imageSources);
  
  // Use the first available image, or fallback
  const image = 
    imageSources.directImageDetail || 
    imageSources.directImage || 
    imageSources.companyLogo || 
    imageSources.companyThumbnail || 
    imageSources.companyDetailsThumb || 
    '/assets/placeholder.png';
  
  // Get basic content fields - allow any field to be null
  const title = titleField ? record?.[titleField] : null;
  
  // For status/select fields, find the proper label
  let subtitle = null;
  if (subtitleField && record?.[subtitleField] !== undefined) {
    const subtitleFieldConfig = config.fields?.find(f => f.name === subtitleField);
    
    if (subtitleFieldConfig?.type === 'select' || subtitleFieldConfig?.type === 'status') {
      // Handle different status field formats
      const value = typeof record[subtitleField] === 'object' 
        ? record[subtitleField]?.value 
        : record[subtitleField];
        
      const option = subtitleFieldConfig.options?.find(opt => opt.value === value);
      subtitle = option?.label || value;
      
      debug('Status/subtitle', { value, option, subtitle });
    } else {
      subtitle = record[subtitleField];
    }
  }
  
  const description = descriptionField ? record?.[descriptionField] : null;

  // Contract regenerate content function
  const handleRegenerateContent = async () => {
    if (!isContract || !record?.id) return;
    
    setRegenerating(true);
    try {
      // Fetch the latest related data
      const relatedData = await fetchContractRelatedData(record, config);
      
      // Compile the content with the latest data using the standalone utility
      const compiledContent = await compileContractContent(record, relatedData);
      
      // Update the contract in the database
      const { error } = await supabase
        .from('contract')
        .update({ 
          content: compiledContent, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', record.id);

      if (error) {
        console.error('[RegenerateContent] Update failed:', error);
        alert('Failed to regenerate contract content.');
      } else {
        alert('Contract content regenerated successfully!');
        // Optionally refresh the page or update the record
        window.location.reload();
      }
    } catch (err) {
      console.error('[RegenerateContent] Unexpected error:', err);
      alert('An unexpected error occurred while regenerating content.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        {image && (
          <Box sx={{ p: 1, mb: 2 }}>
            <Box
              component="img"
              src={image}
              alt={title || 'Preview image'}
              sx={{ width: '100%', borderRadius: 2 }}
              onError={(e) => {
                const fallback = '/assets/placeholder.png';
                e.currentTarget.onerror = null;
          
                if (!e.currentTarget.src.includes(fallback)) {
                  e.currentTarget.src = fallback;
                } else {
                  e.currentTarget.src =
                    'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                }
              }}
            />
          </Box>
        )}

        {title && (
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
        )}

        {subtitle && (
          <Chip label={subtitle} size="small" sx={{ mb: 2 }} color="primary" />
        )}

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
          >
            {description}
          </Typography>
        )}

        {/* Add Contract-Specific Actions Section */}
        {isContract && record?.id && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: 'block', mb: 1 }}
              >
                Contract Actions
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <SignatureButton 
                  contractRecord={record}
                  onStatusUpdate={(status, data) => {
                    console.log('Signature status updated:', status);
                  }}
                />
                
                {/* Regenerate Content Button */}
                <Button
                sx={{ width: '100%',}}
                  variant="outlined"
                  size="medium"
                  onClick={handleRegenerateContent}
                  disabled={regenerating}
                  startIcon={regenerating ? <CircularProgress size={16} /> : null}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Content'}
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {extraFields && extraFields.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {extraFields.map((fieldName) => {
                if (!fieldName) return null;
                
                const field = config.fields?.find((f) => f.name === fieldName);
                if (!field) {
                  debug(`Field not found: ${fieldName}`, 
                    config.fields?.map(f => f.name)
                  );
                  return null;
                }

                const label = field.label || fieldName;
                
                // For relationship fields, basic output without FieldRenderer
                if (field.type === 'relationship') {
                  const details = record?.[`${fieldName}_details`];
                  const id = record?.[fieldName];
                  
                  debug(`Relationship field ${fieldName}`, { 
                    id,
                    details,
                    hasDetails: !!details
                  });
                  
                  return (
                    <Box key={fieldName}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {label}
                      </Typography>
                      
                      {details ? (
                        <Typography 
                          component="a"
                          href={`/dashboard/${field.relation?.table}/${id}`}
                          variant="body2"
                          color="primary"
                          sx={{ textDecoration: 'none' }}
                        >
                          {details[field.relation?.labelField] || details.name || details.title || `ID: ${id}`}
                        </Typography>
                      ) : id ? (
                        <Typography variant="body2">ID: {id}</Typography>
                      ) : (
                        <Typography variant="body2">—</Typography>
                      )}
                    </Box>
                  );
                }

                // For multi-relationship fields, show as chips
                if (field.type === 'multiRelationship') {
                  const details = record?.[`${fieldName}_details`] || [];
                  const ids = record?.[fieldName] || [];
                  
                  debug(`MultiRelationship field ${fieldName}`, { 
                    ids: ids.length,
                    details: details.length,
                    detailsData: details
                  });
                  
                  if (details.length === 0 && ids.length === 0) {
                    return (
                      <Box key={fieldName}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {label}
                        </Typography>
                        <Typography variant="body2">—</Typography>
                      </Box>
                    );
                  }
                  
                  return (
                    <Box key={fieldName}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {label}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {details.map(item => (
                          <Chip
                            key={item.id}
                            component="a"
                            href={`/dashboard/${field.relation?.table}/${item.id}`}
                            clickable
                            label={item[field.relation?.labelField] || item.name || item.title || `ID: ${item.id}`}
                            size="small"
                            sx={{ 
                              '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                              }
                            }}
                          />
                        ))}
                        
                        {details.length === 0 && ids.length > 0 && (
                          <Typography variant="body2">
                            {ids.length} items
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                }
                
                // For all other field types, use FieldRenderer
                return (
                  <Box key={fieldName}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    
                    <FieldRenderer
                      value={record?.[field.name]}
                      field={field}
                      record={record}
                      config={config}
                      mode="view"
                    />
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
        
        {/* Show related fields (like tags) if specified in relatedFields */}
        {relatedFields && relatedFields.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {relatedFields.map((fieldName) => {
                if (!fieldName) return null;
                
                // Skip if already displayed in extraFields
                if (extraFields?.includes(fieldName)) return null;
                
                const field = config.fields?.find(f => f.name === fieldName);
                if (!field || field.type !== 'multiRelationship') {
                  debug(`Related field not found or not multiRelationship: ${fieldName}`);
                  return null;
                }
                
                const details = record?.[`${fieldName}_details`] || [];
                const ids = record?.[fieldName] || [];
                
                debug(`Related field ${fieldName}`, {
                  details: details.length,
                  ids: ids.length
                });
                
                if (details.length === 0 && ids.length === 0) {
                  return (
                    <Box key={fieldName}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {field.label}
                      </Typography>
                      <Typography variant="body2">—</Typography>
                    </Box>
                  );
                }
                
                return (
                  <Box key={fieldName}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {field.label}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {details.map(item => (
                        <Chip
                          key={item.id}
                          component="a"
                          href={`/dashboard/${field.relation?.table}/${item.id}`}
                          clickable
                          label={item[field.relation?.labelField] || item.name || item.title || `ID: ${item.id}`}
                          size="small"
                          sx={{ 
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        />
                      ))}
                      
                      {details.length === 0 && ids.length > 0 && (
                        <Typography variant="body2">
                          {ids.length} items
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickViewCard;