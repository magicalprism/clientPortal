'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Stack,
  Avatar,
  Divider
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ArrowSquareOut, FolderOpen, Globe, User, FileText } from '@phosphor-icons/react';
import SignatureButton from '@/components/dashboard/contract/parts/SignatureButton';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { compileContractContent } from '@/lib/utils/contractContentCompiler';
import { useModal } from '@/components/modals/ModalContext';
import { table } from '@/lib/supabase/queries';
import * as collections from '@/collections';

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
    
    // Support dot notation for nested relationships
    if (overrideField.includes('.')) {
      url = getNestedValue(item, overrideField);
    } else {
      url = item[overrideField];
    }
    
    if (url) {
      // Ensure external URLs have proper protocol
      if (typeof url === 'string') {
        if (url.includes('://') || url.startsWith('/')) {
          return url;
        } else {
          return `https://${url}`;
        }
      }
    }
  }
  
  // Priority 2: Check for common URL field names
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
  
  // Return null to indicate this should open a modal instead
  return null;
};

// Helper function to determine if URL should open in new tab
const shouldOpenInNewTab = (url) => {
  return url && url.includes('://') && !url.startsWith(window.location.origin);
};

// Icon mapping for different field types and content
const getQuickLinkIcon = (item, relationConfig, fieldName) => {
  // Check field name patterns
  if (fieldName.includes('folder') || fieldName.includes('drive')) {
    return <FolderOpen size={16} />;
  }
  if (fieldName.includes('url') || fieldName.includes('link') || fieldName.includes('website')) {
    return <Globe size={16} />;
  }
  if (fieldName.includes('contact') || fieldName.includes('user') || fieldName.includes('assigned')) {
    return <User size={16} />;
  }
  
  // Check item properties
  if (item?.url || item?.website || item?.link) {
    return <Globe size={16} />;
  }
  if (item?.is_folder) {
    return <FolderOpen size={16} />;
  }
  
  // Default icon
  return <FileText size={16} />;
};

export const QuickViewCard = ({ config, record, onRefresh }) => {
  const [regenerating, setRegenerating] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const { openModal } = useModal();
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
    linkOverrides = {}
  } = config.quickView || {};

  // Check if this is a contract
  const isContract = 
    config?.name === 'contract' || 
    config?.label?.toLowerCase().includes('contract') ||
    config?.singularLabel?.toLowerCase().includes('contract') ||
    record?.hasOwnProperty('content') && record?.hasOwnProperty('signature_status');

  // Stabilized dependencies
  const recordId = record?.id;
  const configName = config?.name;
  const fieldValue = record?.[imageField];
  
  const imageFieldConfig = useMemo(() => {
    return config.fields?.find(f => f.name === imageField);
  }, [config.fields, imageField]);
  
  const relationConfig = useMemo(() => {
    if (imageFieldConfig?.type !== 'media') return null;
    return imageFieldConfig.relation?.relation || imageFieldConfig.relation;
  }, [imageFieldConfig]);

  // Enhanced image handling
  useEffect(() => {
    const fetchMediaData = async () => {
      if (!imageField || !recordId) return;
      if (!imageFieldConfig || imageFieldConfig.type !== 'media') return;
      if (!relationConfig) return;
      
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
        
        if (junctionTable) {
          const effectiveSourceKey = sourceKey || `${configName}_id`;
          const effectiveTargetKey = targetKey || `${table}_id`;
          
          const { data: junctionData, error: junctionError } = await supabase
            .from(junctionTable)
            .select(`${effectiveTargetKey}`)
            .eq(effectiveSourceKey, recordId)
            .limit(1);
            
          if (!junctionError && junctionData?.length > 0) {
            const mediaId = junctionData[0][effectiveTargetKey];
            
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
        console.error('Error fetching media:', err);
      } finally {
        setImageLoading(false);
      }
    };
    
    fetchMediaData();
  }, [imageField, recordId, configName, fieldValue, imageFieldConfig, relationConfig, record, supabase]);

  // Company thumbnail fallback
  useEffect(() => {
    const fetchCompanyThumbnail = async () => {
      if (resolvedImageUrl || imageLoading) return;
      
      let companyId = null;
      let companyData = null;
      
      if (record?.company_id) {
        companyId = record.company_id;
        companyData = record.company_id_details;
      }
      
      if (!companyId && record?.companies_details?.length > 0) {
        companyData = record.companies_details[0];
        companyId = companyData?.id;
      }
      
      if (!companyId && record?.companies?.length > 0) {
        companyId = record.companies[0];
      }
      
      if (!companyId) return;
      
      if (companyData?.thumbnail_id_details?.url) {
        setResolvedImageUrl(companyData.thumbnail_id_details.url);
      } else if (companyData?.thumbnail_id) {
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
          console.error('Error fetching company thumbnail:', err);
        } finally {
          setImageLoading(false);
        }
      }
    };
    
    const timeoutId = setTimeout(fetchCompanyThumbnail, 100);
    return () => clearTimeout(timeoutId);
  }, [resolvedImageUrl, imageLoading, record, supabase]);

  // Smart image source selection
  const getImageSource = () => {
    if (!imageField) return '/assets/placeholder.png';

    if (resolvedImageUrl) return resolvedImageUrl;

    const imageFieldConfig = config.fields?.find(f => f.name === imageField);
    if (!imageFieldConfig) return '/assets/placeholder.png';

    if (imageFieldConfig.type === 'media') {
      const relationConfig = imageFieldConfig.relation?.relation || imageFieldConfig.relation;
      if (!relationConfig) return '/assets/placeholder.png';

      const { linkTo } = relationConfig;
      const mediaId = record?.[imageField];
      const detailsKey = `${imageField}_details`;
      const resolvedDetails = record?.[detailsKey];
      
      if (resolvedDetails) {
        const imageUrl = resolvedDetails[linkTo] || resolvedDetails.url;
        if (imageUrl) return imageUrl;
      }

      if (mediaId && typeof mediaId === 'object') {
        const imageUrl = mediaId[linkTo] || mediaId.url;
        if (imageUrl) return imageUrl;
      }
    }

    if (imageFieldConfig.type === 'link' || !imageFieldConfig.type) {
      const directImage = record?.[imageField];
      if (directImage && typeof directImage === 'string') {
        return directImage;
      }
    }

    // Company fallbacks
    const companyIdDetails = record?.company_id_details;
    if (companyIdDetails?.thumbnail_id_details?.url) {
      return companyIdDetails.thumbnail_id_details.url;
    }
    
    const companiesDetails = record?.companies_details;
    if (companiesDetails?.length > 0) {
      const firstCompany = companiesDetails[0];
      if (firstCompany?.thumbnail_id_details?.url) {
        return firstCompany.thumbnail_id_details.url;
      }
    }

    return '/assets/placeholder.png';
  };

  const image = getImageSource();
  
  // Get basic content fields
  const title = titleField ? record?.[titleField] : null;
  
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

  // Handle clicking on related items
  const handleRelatedItemClick = (item, relationConfig, fieldName) => {
    const url = getItemUrl(item, relationConfig, fieldName, config.quickView);
    
    if (url) {
      // It's an external URL, open it
      const isExternal = shouldOpenInNewTab(url);
      if (isExternal) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else {
      // It's a collection item, open modal
      const collectionConfig = collections[relationConfig?.table];
      if (collectionConfig) {
        openModal('edit', { 
          config: collectionConfig, 
          id: item.id 
        });
      }
    }
  };

  // Contract regenerate content function
  const handleRegenerateContent = async () => {
    if (!isContract || !record?.id) return;
    
    setRegenerating(true);
    try {
      const relatedData = await fetchContractRelatedData(record, config);
      const compiledContent = await compileContractContent(record, relatedData);
      
      const { error } = await table.contract.updateContractById(record.id, { content: compiledContent });

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

  // Create quick links from related fields
  const quickLinks = useMemo(() => {
    const links = [];
    
    relatedFields.forEach(fieldName => {
      const field = config.fields?.find(f => f.name === fieldName);
      if (!field || field.type !== 'multiRelationship') return;
      
      const relationConfig = field.relation;
      const detailsKey = `${fieldName}_details`;
      const details = record?.[detailsKey] || [];
      
      details.forEach(item => {
        const url = getItemUrl(item, relationConfig, fieldName, config.quickView);
        const isExternal = url && shouldOpenInNewTab(url);
        
        links.push({
          id: `${fieldName}_${item.id}`,
          label: item[relationConfig?.labelField] || item.name || item.title || `ID: ${item.id}`,
          icon: getQuickLinkIcon(item, relationConfig, fieldName),
          isExternal,
          onClick: () => handleRelatedItemClick(item, relationConfig, fieldName)
        });
      });
    });
    
    return links;
  }, [relatedFields, config.fields, record, config.quickView]);

  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Logo/Avatar - Fixed Size */}
          <Box sx={{ flexShrink: 0 }}>
            {imageLoading ? (
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey.100' }}>
                <CircularProgress size={20} />
              </Avatar>
            ) : (
              <Avatar
                src={image}
                alt={title || 'Logo'}
                sx={{ 
                  width: 48, 
                  height: 48,
                  '& img': {
                    objectFit: 'contain'
                  }
                }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/placeholder.png';
                }}
              />
            )}
          </Box>

          {/* Title and Subtitle */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {title && (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {title}
              </Typography>
            )}

            {subtitle && (
              <Chip 
                label={subtitle} 
                size="small" 
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Box>

          {/* Action Buttons */}
          {record?.id && (
            <Box sx={{ flexShrink: 0 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {/* ViewButtons - only show collection-specific actions and exports */}
                <ViewButtons 
                  config={config}
                  id={record.id}
                  record={record}
                  onRefresh={onRefresh}
                  showModal={false} // Don't show modal button - already in full view
                  showFullView={false} // Don't show full view button - already in full view
                  showDelete={true} // Show delete button
                  showExport={true}
                  size="small"
                  isInModal={false}
                />
                
                {/* Contract-specific actions */}
                {isContract && (
                  <>
                    <SignatureButton 
                      contractRecord={record}
                      size="small"
                      onStatusUpdate={(status, data) => {
                        console.log('Signature status updated:', status);
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRegenerateContent}
                      disabled={regenerating}
                      sx={{ p: 0.5 }}
                    >
                      {regenerating ? <CircularProgress size={16} /> : <FileText size={16} />}
                    </IconButton>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </Typography>
        )}

        {/* Quick Links */}
        {quickLinks.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: 'block', mb: 1, fontWeight: 500 }}
              >
                Quick Links
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.5,
                maxHeight: 100,
                overflowY: 'auto'
              }}>
                {quickLinks.map(link => (
                  <Chip
                    key={link.id}
                    clickable
                    size="small"
                    icon={link.icon}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {link.label}
                        {link.isExternal && <ArrowSquareOut size={10} />}
                      </Box>
                    }
                    onClick={link.onClick}
                    sx={{ 
                      height: 24,
                      fontSize: '0.7rem',
                      '& .MuiChip-icon': {
                        fontSize: '0.8rem'
                      },
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Extra Fields */}
        {extraFields && extraFields.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {extraFields.map((fieldName) => {
                if (!fieldName) return null;

                const field = config.fields?.find((f) => f.name === fieldName);
                if (!field) return null;

                const label = field.label || fieldName;

                return (
                  <Box key={fieldName} sx={{ minWidth: 120 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}
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
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickViewCard;