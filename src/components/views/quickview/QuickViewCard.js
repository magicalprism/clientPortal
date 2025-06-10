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
  CircularProgress,
  Grid
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ArrowSquareOut } from '@phosphor-icons/react';
import SignatureButton from '@/components/dashboard/contract/parts/SignatureButton';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { compileContractContent } from '@/lib/utils/contractContentCompiler';
import { DeleteRecordButton } from '@/components/buttons/DeleteRecordButton.jsx';
import { table } from '@/lib/supabase/queries';

// Simple debug helper - only logs in development
const debug = (label, value) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(label, value);
  }
};

// Helper function to get nested value using dot notation
const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return null;
    return current[key];
  }, obj);
};

// Helper function to get the appropriate URL for a multi-relationship item
const getItemUrl = (item, relationConfig, fieldName, quickViewConfig) => {
  const { table } = relationConfig || {};
  
  // Priority 1: Check for QuickView-specific link override
  const linkOverrides = quickViewConfig?.linkOverrides || {};
  const overrideField = linkOverrides[fieldName];
  

  
  if (overrideField && item) {
    let url = null;
    
    // Support dot notation for nested relationships (e.g., 'link_id_details.url')
    if (overrideField.includes('.')) {
      url = getNestedValue(item, overrideField);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 [${fieldName}] Dot notation result:`, { path: overrideField, url });
      }
    } else {
      // Simple field access
      url = item[overrideField];
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 [${fieldName}] Simple field result:`, { field: overrideField, url });
      }
    }
    
    if (url) {
      // Ensure external URLs have proper protocol
      if (typeof url === 'string') {
        if (url.includes('://') || url.startsWith('/')) {
          return url;
        } else {
          // Add https:// for URLs that don't have a protocol
          return `https://${url}`;
        }
      }
    }
  }
  
  // Priority 2: Use linkField if specified and item has that field (only if no QuickView override)
  const { linkField, linkTo } = relationConfig || {};
  if (!overrideField && linkField && item[linkField]) {
    const url = item[linkField];
    // Ensure external URLs have proper protocol
    if (url.includes('://') || url.startsWith('/')) {
      return url;
    } else {
      // Add https:// for URLs that don't have a protocol
      return `https://${url}`;
    }
  }
  
  // Priority 3: Use linkTo field (legacy support, only if no QuickView override)
  if (!overrideField && linkTo && item[linkTo]) {
    const url = item[linkTo];
    if (url.includes('://') || url.startsWith('/')) {
      return url;
    } else {
      return `https://${url}`;
    }
  }
  
  // Priority 4: Check for common URL field names (only if no QuickView override)
  if (!overrideField) {
    const urlFields = ['url', 'link', 'website', 'href'];
    for (const field of urlFields) {
      if (item[field]) {
        const url = item[field];
        if (url.includes('://') || url.startsWith('/')) {
          return url;
        } else {
          return `https://${url}`;
        }
      }
    }
  }
  
  // Fallback: Use collection page URL
  return `/dashboard/${table}/${item.id}`;
};

// Helper function to determine if URL should open in new tab
const shouldOpenInNewTab = (url) => {
  return url.includes('://') && !url.startsWith(window.location.origin);
};

export const QuickViewCard = ({ config, record }) => {
  const [regenerating, setRegenerating] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const supabase = createClient();
  
  // Guard clause for config
  if (!config?.quickView?.enabled) return null;

  const {
    imageField,
    titleField,
    subtitleField,
    descriptionField,
    extraFields = [],
    relatedFields = [],
    linkOverrides = {} // NEW: QuickView-specific link field overrides
  } = config.quickView || {};

  

  // Check if this is a contract - multiple detection methods
  const isContract = 
    config?.name === 'contract' || 
    config?.label?.toLowerCase().includes('contract') ||
    config?.singularLabel?.toLowerCase().includes('contract') ||
    record?.hasOwnProperty('content') && record?.hasOwnProperty('signature_status');

  // ✅ FIXED: Stabilized dependencies to prevent useEffect array size changes
  const recordId = record?.id;
  const configName = config?.name;
  const fieldValue = record?.[imageField];
  
  // Memoize the field config to prevent re-fetching when config object changes reference
  const imageFieldConfig = useMemo(() => {
    return config.fields?.find(f => f.name === imageField);
  }, [config.fields, imageField]);
  
  // Memoize the relation config to stabilize the dependency
  const relationConfig = useMemo(() => {
    if (imageFieldConfig?.type !== 'media') return null;
    return imageFieldConfig.relation?.relation || imageFieldConfig.relation;
  }, [imageFieldConfig]);

  // ✅ ENHANCED: Company thumbnail fallback fetching
  useEffect(() => {
    const fetchCompanyThumbnail = async () => {
      // Only try to fetch company thumbnail if we don't have a resolved image
      if (resolvedImageUrl || imageLoading) return;
      
      let companyId = null;
      let companyData = null;
      
      // Method 1: Direct company_id foreign key
      if (record?.company_id) {
        companyId = record.company_id;
        companyData = record.company_id_details;
      }
      
      // Method 2: Multi-relationship companies (take first one)
      if (!companyId && record?.companies_details?.length > 0) {
        companyData = record.companies_details[0];
        companyId = companyData?.id;
      }
      
      // Method 3: Companies array of IDs
      if (!companyId && record?.companies?.length > 0) {
        companyId = record.companies[0];
      }
      
      if (!companyId) {
        return;
      }
      
      // If we have company data but no thumbnail info, fetch it
      if (!companyData?.thumbnail_id && !companyData?.thumbnail_id_details) {
        setImageLoading(true);
        
        try {
          const { data: company } = await table.company.fetchCompanyById(companyId);
            
          if (!error && company?.thumbnail_id) {
            // Now fetch the actual media
            const { data: media } = await table.media.fetchMediaById(mediaId);
              
            if (!mediaError && media?.url) {
              setResolvedImageUrl(media.url);
            }
          }
        } catch (err) {
          // Silently handle error
        } finally {
          setImageLoading(false);
        }
      } else if (companyData?.thumbnail_id_details?.url) {
        // We have resolved company thumbnail data
        setResolvedImageUrl(companyData.thumbnail_id_details.url);
      } else if (companyData?.thumbnail_id) {
        // We have company thumbnail ID but not resolved data
        setImageLoading(true);
        
        try {
          const { data: media, error } = await supabase
            .from('media')
            .select('*')
            .eq('id', companyData.thumbnail_id)
            .single();
            
          if (!error && media?.url) {
            setResolvedImageUrl(media.url);
          }
        } catch (err) {
          // Silently handle error
        } finally {
          setImageLoading(false);
        }
      }
    };
    
    // Only run company thumbnail fallback if main image fetch failed
    const timeoutId = setTimeout(fetchCompanyThumbnail, 100);
    return () => clearTimeout(timeoutId);
  }, [resolvedImageUrl, imageLoading, record, supabase]);

  useEffect(() => {
    const fetchMediaData = async () => {
      if (!imageField || !recordId) {
        return;
      }
      
      if (!imageFieldConfig || imageFieldConfig.type !== 'media') {
        return;
      }
      
      if (!relationConfig) {
        return;
      }
      
      const { table, linkTo, junctionTable, sourceKey, targetKey } = relationConfig;
      
      // Check if we already have resolved URL
      const detailsKey = `${imageField}_details`;
      const resolvedDetails = record?.[detailsKey];
      
      if (resolvedDetails?.[linkTo] || resolvedDetails?.url) {
        setResolvedImageUrl(resolvedDetails[linkTo] || resolvedDetails.url);
        return;
      }
      
      setImageLoading(true);
      
      try {
        let mediaData = null;
        
        // ✅ Handle junction table relationships (many-to-many)
        if (junctionTable) {
          const effectiveSourceKey = sourceKey || `${configName}_id`;
          const effectiveTargetKey = targetKey || `${table}_id`;
          
          // First, get the relationship from junction table
          const { data: junctionData, error: junctionError } = await supabase
            .from(junctionTable)
            .select(`${effectiveTargetKey}`)
            .eq(effectiveSourceKey, recordId)
            .limit(1);
            
          if (junctionError) {
            return;
          }
          
          if (junctionData && junctionData.length > 0) {
            const mediaId = junctionData[0][effectiveTargetKey];
            
            // Now fetch the actual media record
            const { data: media, error: mediaError } = await supabase
              .from(table)
              .select('*')
              .eq('id', mediaId)
              .single();
              
            if (!mediaError && media) {
              mediaData = media;
            }
          }
        } else {
          // ✅ Handle direct foreign key relationships (one-to-one/many-to-one)
          const mediaId = fieldValue;
          
          if (mediaId && (typeof mediaId === 'number' || typeof mediaId === 'string')) {
            const { data: media, error: mediaError } = await supabase
              .from(table)
              .select('*')
              .eq('id', mediaId)
              .single();
              
            if (!mediaError && media) {
              mediaData = media;
            }
          }
        }
        
        if (mediaData) {
          const mediaUrl = mediaData[linkTo] || mediaData.url;
          setResolvedImageUrl(mediaUrl);
        }
      } catch (err) {
        // Silently handle error
      } finally {
        setImageLoading(false);
      }
    };
    
    fetchMediaData();
    // ✅ FIXED: Use only primitive values and memoized objects in dependencies
  }, [imageField, recordId, configName, fieldValue, imageFieldConfig, relationConfig]);

  // ✅ ENHANCED: Smart image handling with improved resolution and fallbacks
  const getImageSource = () => {
    if (!imageField) {
      return '/assets/placeholder.png';
    }

    // ✅ PRIORITY 1: If we have a resolved image URL from useEffect, use it
    if (resolvedImageUrl) {
      return resolvedImageUrl;
    }

    // Get the field configuration to understand the relationship
    const imageFieldConfig = config.fields?.find(f => f.name === imageField);
    
    if (!imageFieldConfig) {
      return '/assets/placeholder.png';
    }

    // Handle media type fields
    if (imageFieldConfig.type === 'media') {
      // ✅ FIXED: Handle both nested and non-nested relation configs
      const relationConfig = imageFieldConfig.relation?.relation || imageFieldConfig.relation;
      
      if (!relationConfig) {
        return '/assets/placeholder.png';
      }

      const { table, linkTo, junctionTable } = relationConfig;

      // Get the raw media ID first
      const mediaId = record?.[imageField];

      // Method 1: Check for resolved details using _details pattern
      const detailsKey = `${imageField}_details`;
      const resolvedDetails = record?.[detailsKey];
      
      if (resolvedDetails) {
        const imageUrl = resolvedDetails[linkTo] || resolvedDetails.url;
        if (imageUrl) {
          return imageUrl;
        }
      }

      // Method 2: Check for junction table pattern
      if (junctionTable) {
        const possibleJunctionKeys = [
          `${imageField}_${table}`, // thumbnail_id_media
          `${imageField}_${junctionTable}`, // thumbnail_id_contact_media
          `${junctionTable}_${table}`, // contact_media_media
        ];

        for (const key of possibleJunctionKeys) {
          const junctionData = record?.[key];
          
          if (junctionData) {
            const imageUrl = junctionData[linkTo] || junctionData.url;
            if (imageUrl) {
              return imageUrl;
            }
          }
        }
      }

      // Method 3: Check for direct relationship resolution (if media is embedded)
      if (mediaId && typeof mediaId === 'object') {
        const imageUrl = mediaId[linkTo] || mediaId.url;
        if (imageUrl) {
          return imageUrl;
        }
      }
    }

    // Handle direct URL fields
    if (imageFieldConfig.type === 'link' || !imageFieldConfig.type) {
      const directImage = record?.[imageField];
      if (directImage && typeof directImage === 'string') {
        return directImage;
      }
    }

    // --- ENHANCED: Fallback methods for company thumbnails ---
    
    // Method 1: Direct company_id with resolved details
    const companyIdDetails = record?.company_id_details;
    if (companyIdDetails?.thumbnail_id_details?.url) {
      return companyIdDetails.thumbnail_id_details.url;
    }
    
    // Method 2: Multi-relationship companies_details (take first)
    const companiesDetails = record?.companies_details;
    if (companiesDetails?.length > 0) {
      const firstCompany = companiesDetails[0];
      if (firstCompany?.thumbnail_id_details?.url) {
        return firstCompany.thumbnail_id_details.url;
      }
    }
    
    // Method 3: Check for nested company data patterns
    const alternativeCompanyPaths = [
      record?.company?.thumbnail_id_details?.url,
      record?.company_id?.thumbnail_id_details?.url,
      record?.company_id?.company?.thumbnail_id?.url,
      record?.company?.thumbnail_id?.url,
    ];
    
    for (const path of alternativeCompanyPaths) {
      if (path) {
        return path;
      }
    }
    
    // Method 4: Legacy patterns for backward compatibility
    const legacyPaths = [
      record?.company_id?.company?.thumbnail_id?.url,
      record?.company_id?.company?.media?.url,
    ];
    
    for (const path of legacyPaths) {
      if (path) {
        return path;
      }
    }

    return '/assets/placeholder.png';
  };

  const image = getImageSource();
  
  // Get basic content fields - allow any field to be null
  const title = titleField ? record?.[titleField] : null;
  
  // For status/select fields, find the proper label
  let subtitle = null;
  if (subtitleField && record?.[subtitleField] !== undefined) {
    const subtitleFieldConfig = config.fields?.find(f => f.name === subtitleField);
    
    if (subtitleFieldConfig?.type === 'select' || subtitleFieldConfig?.type === 'status') {
      const value = typeof record[subtitleField] === 'object' 
        ? record[subtitleField]?.value 
        : record[subtitleField];
        
      const option = subtitleFieldConfig.options?.find(opt => opt.value === value);
      subtitle = option?.label || value;
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
      const relatedData = await fetchContractRelatedData(record, config);
      const compiledContent = await compileContractContent(record, relatedData);
      
      const { error } = await updateContractContentById(record.id, compiledContent);

      if (error) {
        console.error('[RegenerateContent] Update failed:', error);
        alert('Failed to regenerate contract content.');
      } else {
        alert('Contract content regenerated successfully!');
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
          <Grid container spacing={4} alignItems="flex-start">
    {/* Image / Logo on the left */}
    <Grid item xs={12} md={2}>
      {(image || imageLoading) && (
        <Box>
          {imageLoading ? (
            <Box 
              sx={{ 
                width: '100%', 
                aspectRatio: '1', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 2
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box
              component="img"
              src={image}
              alt={title || 'Preview image'}
              sx={{ width: '100%', borderRadius: 2 }}
              onError={(e) => {
                const fallback = '/assets/placeholder.png';
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
              }}
            />
          )}
        </Box>
      )}
    </Grid>

    {/* Text content on the right */}
    <Grid item xs={12} md={10}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flexBasis: '100%' }}>
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
              <Button
                sx={{ width: '100%' }}
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
</Box>
       <Divider sx={{ my: 2 }} />         
             {extraFields && extraFields.length > 0 && (

    
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      flexWrap="wrap"
      sx={{ alignItems: 'flex-start' }}
    >
      {extraFields.map((fieldName) => {
        if (!fieldName) return null;

        const field = config.fields?.find((f) => f.name === fieldName);
        if (!field) return null;

        const label = field.label || fieldName;

        // other field type handling...

        // ✅ This must be inside the map
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

)}

   
        
        {/* Related Fields Section */}
        {relatedFields && relatedFields.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {relatedFields.map((fieldName) => {
                if (!fieldName || extraFields?.includes(fieldName)) return null;
                
                const field = config.fields?.find(f => f.name === fieldName);
                if (!field || field.type !== 'multiRelationship') {
                  return null;
                }
                
                const relationConfig = field.relation;
                const detailsKey = `${fieldName}_details`;
                const details = record?.[detailsKey] || [];
                const ids = record?.[fieldName] || [];
                
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
                      {details.map(item => {
                        const itemUrl = getItemUrl(item, relationConfig, fieldName, config.quickView);
                        const isExternal = shouldOpenInNewTab(itemUrl);
                        
                        return (
                          <Chip
                            key={item.id}
                            component="a"
                            href={itemUrl}
                            target={isExternal ? '_blank' : '_self'}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            clickable
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {item[relationConfig?.labelField] || item.name || item.title || `ID: ${item.id}`}
                                {isExternal && (
                                  <ArrowSquareOut size={12} />
                                )}
                              </Box>
                            }
                            size="small"
                            sx={{ 
                              '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                              }
                            }}
                          />
                        );
                      })}
                      
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
        </Box>
            </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickViewCard;