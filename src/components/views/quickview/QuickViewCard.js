// Enhanced QuickViewCard.jsx with fixed select fields and relationship linking

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
  Divider,
  Link as MuiLink
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { ArrowSquareOut, FolderOpen, Globe, User, FileText, Link as LinkIcon } from '@phosphor-icons/react';
import SignatureButton from '@/components/dashboard/contract/parts/SignatureButton';
import { useState, useEffect, useMemo } from 'react';
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { compileContractContent } from '@/lib/utils/contractContentCompiler';
import { useModal } from '@/components/modals/ModalContext';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';
import { table } from '@/lib/supabase/queries';
import { getCompanyLogoUrl } from '@/lib/supabase/queries/utils/getCompanyLogoUrl';
import { useRouter } from 'next/navigation';

const supabase = createClient();

// Helper function to format dates from PostgreSQL timestamps
const formatDate = (dateValue, field) => {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    
    const isDateOnly = field?.dateType === 'date' || field?.showTime === false;
    
    if (isDateOnly) {
      return date.toLocaleDateString();
    } else {
      return date.toLocaleString();
    }
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateValue;
  }
};

// Enhanced helper function to get display value for select/status fields
const getSelectDisplayValue = (value, field) => {
  if (!value) return null;
  
  // Handle array format (common issue with select fields)
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    
    // If array contains objects with value/label
    if (typeof value[0] === 'object' && value[0] !== null) {
      return value[0].label || value[0].value;
    }
    
    // If array contains raw values, take the first one
    const firstValue = value[0];
    if (field?.options && Array.isArray(field.options)) {
      const option = field.options.find(opt => opt.value === firstValue);
      return option?.label || firstValue;
    }
    
    return firstValue;
  }
  
  // Handle hydrated object format: {value: "active", label: "Active"}
  if (typeof value === 'object' && value !== null) {
    return value.label || value.value;
  }
  
  // Handle raw value - look up in options
  if (field?.options && Array.isArray(field.options)) {
    const option = field.options.find(opt => opt.value === value);
    return option?.label || value;
  }
  
  return value;
};

// Universal function to handle any field value that might be a hydrated object
const extractDisplayValue = (value, field = null) => {
  if (!value) return null;
  
  // Check if it's a hydrated object from your system first
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Handle hydrated format: {value: "status", label: "Status Label"}
    if (value.hasOwnProperty('label') || value.hasOwnProperty('value')) {
      return value.label || value.value;
    }
  }
  
  // Check if it's an array that might contain hydrated objects
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return extractDisplayValue(value[0], field);
  }
  
  // If we have field options, try to find the label
  if (field?.options && Array.isArray(field.options)) {
    const option = field.options.find(opt => opt.value === value);
    if (option) return option.label;
  }
  
  // Return raw value as fallback
  return value;
};

// Enhanced field value processor
const processFieldValue = (value, field, record) => {
  if (value === null || value === undefined) return null;
  
  // First, try to extract display value for any hydrated objects
  // This handles cases where the field type might not be detected correctly
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.hasOwnProperty('label') || value.hasOwnProperty('value')) {
      return value.label || value.value;
    }
  }
  
  switch (field?.type) {
    case 'select':
      return getSelectDisplayValue(value, field);
      
    case 'multiSelect':
      if (Array.isArray(value)) {
        return value.map(v => getSelectDisplayValue(v, field)).filter(Boolean).join(', ');
      }
      return getSelectDisplayValue(value, field);
      
    case 'date':
    case 'datetime':
    case 'timestamp':
      return formatDate(value, field);
      
    case 'boolean':
      return value ? 'Yes' : 'No';
      
    case 'number':
    case 'currency':
      if (typeof value === 'number') {
        return field?.type === 'currency' 
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
          : value.toLocaleString();
      }
      return value;
      
    case 'tags':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
      
    case 'link':
    case 'url':
      return value; // Will be handled specially in FieldDisplay
      
    case 'media':
      const mediaDetails = record?.[`${field.name}_details`];
      if (mediaDetails?.url) {
        return 'Media attached';
      }
      return value ? 'Media ID: ' + value : null;
      
    case 'relationship':
      const relDetails = record?.[`${field.name}_details`];
      if (relDetails) {
        const labelField = field.relation?.labelField || 'title' || 'name';
        return relDetails[labelField] || `ID: ${relDetails.id}`;
      }
      return value ? `ID: ${value}` : null;
      
    case 'multiRelationship':
      const multiDetails = record?.[`${field.name}_details`];
      if (multiDetails && Array.isArray(multiDetails)) {
        const labelField = field.relation?.labelField || 'title' || 'name';
        return multiDetails.map(item => item[labelField] || `ID: ${item.id}`).join(', ');
      }
      if (Array.isArray(value)) {
        return `${value.length} item(s)`;
      }
      return value ? `ID: ${value}` : null;
      
    default:
      // Fallback: try to extract display value for any unrecognized field types
      return extractDisplayValue(value, field);
  }
};

// Custom Field Display Component with enhanced relationship and link handling
const FieldDisplay = ({ value, field, record, config, mode = "view", onRelatedItemClick, onSingleRelationClick }) => {
  const processedValue = processFieldValue(value, field, record);
  
  if (processedValue === null || processedValue === undefined) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }
  
  // Handle link/url fields with proper styling and icons
  if ((field?.type === 'link' || field?.type === 'url') && processedValue) {
    const url = processedValue.startsWith('http') ? processedValue : `https://${processedValue}`;
    const isExternal = !url.startsWith(window.location.origin);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LinkIcon size={14} />
        <MuiLink
          href={url}
          target={isExternal ? "_blank" : "_self"}
          rel={isExternal ? "noopener noreferrer" : undefined}
          sx={{
            fontSize: '0.875rem',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          {processedValue}
        </MuiLink>
        {isExternal && <ArrowSquareOut size={12} />}
      </Box>
    );
  }
  
  // Handle single relationship fields with click navigation
  if (field?.type === 'relationship' && record?.[`${field.name}_details`]) {
    const relDetails = record[`${field.name}_details`];
    const labelField = field.relation?.labelField || 'title' || 'name';
    const label = relDetails[labelField] || `ID: ${relDetails.id}`;
    
    return (
      <Chip 
        label={label}
        size="small" 
        clickable
        onClick={() => onSingleRelationClick && onSingleRelationClick(relDetails, field.relation, field.name)}
        sx={{ 
          height: 20, 
          fontSize: '0.75rem',
          bgcolor: 'secondary.50',
          color: 'secondary.700',
          borderColor: 'secondary.200',
          '&:hover': {
            bgcolor: 'secondary.100',
            color: 'secondary.800'
          }
        }}
      />
    );
  }
  
  // For select/status fields, show as chip with proper color
  if ((field?.type === 'select' || field?.type === 'status') && processedValue) {
    // Try to get the raw value for color determination
    let rawValue = value;
    if (Array.isArray(value) && value.length > 0) {
      rawValue = typeof value[0] === 'object' ? value[0].value : value[0];
    } else if (typeof value === 'object' && value !== null) {
      rawValue = value.value;
    }
    
    const chipColor = field?.type === 'status' ? 'primary' : 'default';
    return (
      <Chip 
        label={processedValue} 
        size="small" 
        color={chipColor}
        variant="outlined"
        sx={{ height: 20, fontSize: '0.75rem' }}
      />
    );
  }
  
  // For boolean fields, show as chip
  if (field?.type === 'boolean') {
    return (
      <Chip 
        label={processedValue} 
        size="small" 
        color={value ? 'success' : 'default'}
        variant="outlined"
        sx={{ height: 20, fontSize: '0.75rem' }}
      />
    );
  }
  
  // For tags, show as chips
  if (field?.type === 'tags' && Array.isArray(value)) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {value.slice(0, 3).map((tag, idx) => (
          <Chip 
            key={idx}
            label={tag} 
            size="small" 
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem' }}
          />
        ))}
        {value.length > 3 && (
          <Typography variant="caption" color="text.secondary">
            +{value.length - 3} more
          </Typography>
        )}
      </Box>
    );
  }
  
  // For multi-relationships, show as clickable chips
  if (field?.type === 'multiRelationship') {
    const details = record?.[`${field.name}_details`];
    if (details && Array.isArray(details) && details.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {details.map((item, idx) => {
            const labelField = field.relation?.labelField || 'title' || 'name';
            const label = item[labelField] || item.name || item.title || `ID: ${item.id}`;
            
            return (
              <Chip 
                key={`${field.name}_${item.id}_${idx}`}
                label={label}
                size="small" 
                clickable
                onClick={() => onRelatedItemClick && onRelatedItemClick(item, field.relation, field.name)}
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: 'primary.50',
                  color: 'primary.700',
                  borderColor: 'primary.200',
                  '&:hover': {
                    bgcolor: 'primary.100',
                    color: 'primary.800'
                  }
                }}
              />
            );
          })}
        </Box>
      );
    }
  }
  
  // For other fields, show as text
  return (
    <Typography variant="body2" color="text.primary">
      {processedValue}
    </Typography>
  );
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
    if (overrideField.includes('.')) {
      url = getNestedValue(item, overrideField);
    } else {
      url = item[overrideField];
    }

    if (url) {
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
  
  return null;
};

// Helper function to determine if URL should open in new tab
const shouldOpenInNewTab = (url) => {
  return url && url.includes('://') && !url.startsWith(window.location.origin);
};

// Icon mapping for different field types and content
const getQuickLinkIcon = (item, relationConfig, fieldName) => {
  if (fieldName.includes('folder') || fieldName.includes('drive')) {
    return <FolderOpen size={16} />;
  }
  if (fieldName.includes('url') || fieldName.includes('link') || fieldName.includes('website')) {
    return <Globe size={16} />;
  }
  if (fieldName.includes('contact') || fieldName.includes('user') || fieldName.includes('assigned')) {
    return <User size={16} />;
  }
  if (item?.url || item?.website || item?.link) {
    return <Globe size={16} />;
  }
  if (item?.is_folder) {
    return <FolderOpen size={16} />;
  }
  return <FileText size={16} />;
};

export const QuickViewCard = ({ config, record, onRefresh }) => {
  const [regenerating, setRegenerating] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [queryOperations, setQueryOperations] = useState(null);
  const { openModal } = useModal();
  const router = useRouter();

  // Initialize query operations
  useEffect(() => {
    const initializeQueries = async () => {
      try {
        const { table } = await import('@/lib/supabase/queries');
        setQueryOperations(table);
      } catch (error) {
        console.error('[QuickViewCard] Failed to load query operations:', error);
      }
    };
    initializeQueries();
  }, []);

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

  // Enhanced image handling that understands your hydration
  useEffect(() => {
    const resolveImageFromHydration = () => {
      if (!imageField || !record) return;
      
      const imageFieldConfig = config.fields?.find(f => f.name === imageField);
      if (!imageFieldConfig) return;
      
      if (imageFieldConfig.type === 'media') {
        const mediaDetails = record[`${imageField}_details`];
        if (mediaDetails?.url) {
          setResolvedImageUrl(mediaDetails.url);
          return;
        }
      }
      
      if (imageFieldConfig.type === 'link' || !imageFieldConfig.type) {
        const directImage = record[imageField];
        if (directImage && typeof directImage === 'string') {
          setResolvedImageUrl(directImage);
          return;
        }
      }
    };

    resolveImageFromHydration();
  }, [imageField, record, config.fields]);

  // Company thumbnail fallback
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (resolvedImageUrl || imageLoading) return;

      setImageLoading(true);
      const url = await getCompanyLogoUrl(record);
      if (url) setResolvedImageUrl(url);
      setImageLoading(false);
    };

    const timeoutId = setTimeout(fetchCompanyLogo, 100);
    return () => clearTimeout(timeoutId);
  }, [resolvedImageUrl, imageLoading, record]);

  // Smart image source selection
  const getImageSource = () => {
    if (!imageField) return '/assets/placeholder.png';
    if (resolvedImageUrl) return resolvedImageUrl;

    const imageFieldConfig = config.fields?.find(f => f.name === imageField);
    if (!imageFieldConfig) return '/assets/placeholder.png';

    if (imageFieldConfig.type === 'media') {
      const mediaDetails = record?.[`${imageField}_details`];
      if (mediaDetails?.url) return mediaDetails.url;
    }

    if (imageFieldConfig.type === 'link' || !imageFieldConfig.type) {
      const directImage = record?.[imageField];
      if (directImage && typeof directImage === 'string') {
        return directImage;
      }
    }

    const companyDetails = record?.company_id_details || record?.companies_details?.[0];
    if (companyDetails?.thumbnail_id_details?.url) {
      return companyDetails.thumbnail_id_details.url;
    }

    return '/assets/placeholder.png';
  };

  const image = getImageSource();

  // Get basic content fields with enhanced processing
  const title = titleField ? processFieldValue(record?.[titleField], config.fields?.find(f => f.name === titleField), record) : null;
  
  let subtitle = null;
  if (subtitleField && record?.[subtitleField] !== undefined) {
    const subtitleFieldConfig = config.fields?.find(f => f.name === subtitleField);
    subtitle = processFieldValue(record[subtitleField], subtitleFieldConfig, record);
  }
  
  const description = descriptionField ? processFieldValue(record?.[descriptionField], config.fields?.find(f => f.name === descriptionField), record) : null;

  // Handle clicking on single relationship items
  const handleSingleRelationClick = (item, relationConfig, fieldName) => {
    const url = getItemUrl(item, relationConfig, fieldName, config.quickView);
    if (url) {
      const isExternal = shouldOpenInNewTab(url);
      if (isExternal) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else {
      // Navigate to dashboard page for the related item
      const tableName = relationConfig?.table;
      if (tableName && item?.id) {
        const dashboardPath = `/dashboard/${tableName}/${item.id}`;
        router.push(dashboardPath);
      }
    }
  };

  // Handle clicking on multi-relationship items
  const handleRelatedItemClick = (item, relationConfig, fieldName) => {
    const url = getItemUrl(item, relationConfig, fieldName, config.quickView);
    if (url) {
      const isExternal = shouldOpenInNewTab(url);
      if (isExternal) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else {
      // Navigate to dashboard page for the related item
      const tableName = relationConfig?.table;
      if (tableName && item?.id) {
        const dashboardPath = `/dashboard/${tableName}/${item.id}`;
        router.push(dashboardPath);
      }
    }
  };

  // Contract regenerate content function
  const handleRegenerateContent = async () => {
    if (!isContract || !record?.id || !queryOperations) return;
    setRegenerating(true);
    try {
      const relatedData = await fetchContractRelatedData(record, config);
      const compiledContent = await compileContractContent(record, relatedData);
      
      if (queryOperations.contract?.updateContractById) {
        const { error } = await queryOperations.contract.updateContractById(record.id, { 
          content: compiledContent 
        });

        if (error) {
          console.error('[RegenerateContent] Update failed:', error);
          alert('Failed to regenerate contract content.');
        } else {
          alert('Contract content regenerated successfully!');
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        }
      } else {
        console.error('[RegenerateContent] updateContractById function not available');
        alert('Contract update functionality not available.');
      }
    } catch (err) {
      console.error('[RegenerateContent] Unexpected error:', err);
      alert('An unexpected error occurred while regenerating content.');
    } finally {
      setRegenerating(false);
    }
  };

  // Create quick links from related fields using hydrated data
  const quickLinks = useMemo(() => {
    const links = [];
    relatedFields.forEach(fieldName => {
      const field = config.fields?.find(f => f.name === fieldName);
      if (!field || field.type !== 'multiRelationship') return;
      
      const relationConfig = field.relation;
      const details = record?.[`${fieldName}_details`] || [];
      
      details.forEach(item => {
        const url = getItemUrl(item, relationConfig, fieldName, config.quickView);
        const isExternal = url && shouldOpenInNewTab(url);
        
        const labelField = relationConfig?.labelField || 'title' || 'name';
        const label = item[labelField] || item.name || item.title || `ID: ${item.id}`;
        
        links.push({
          id: `${fieldName}_${item.id}`,
          label,
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
                <ViewButtons 
                  config={config}
                  id={record.id}
                  record={record}
                  onRefresh={onRefresh}
                  showModal={false}
                  showFullView={false}
                  showDelete={true}
                  showExport={true}
                  size="small"
                  isInModal={false}
                />
                
                {isContract && (
                  <>
                    <SignatureButton 
                      contractRecord={record}
                      size="small"
                      onStatusUpdate={(status, data) => {
                        console.log('Signature status updated:', status);
                        if (onRefresh) onRefresh();
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRegenerateContent}
                      disabled={regenerating || !queryOperations}
                      sx={{ p: 0.5 }}
                      title="Regenerate Contract Content"
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
                    <FieldDisplay
                      value={record?.[field.name]}
                      field={field}
                      record={record}
                      config={config}
                      mode="view"
                      onRelatedItemClick={handleRelatedItemClick}
                      onSingleRelationClick={handleSingleRelationClick}
                    />
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Query operations loading state */}
        {!queryOperations && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Loading query operations...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickViewCard;