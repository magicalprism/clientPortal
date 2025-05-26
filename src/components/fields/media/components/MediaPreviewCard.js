'use client';

import React, { useState, useEffect } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import { X as XIcon, DownloadSimple, LinkSimple, Copy, PencilSimple, Eye } from '@phosphor-icons/react';
import { fileTypeIcons } from '@/data/fileTypeIcons';

/**
 * Hook to fetch meta preview image for external URLs
 */
const useMetaPreview = (url, isExternal) => {
  const [metaImage, setMetaImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isExternal || !url) {
      setMetaImage(null);
      return;
    }

    const fetchMetaImage = async () => {
      setLoading(true);
      try {
        // Try screenshot services first, then fallback to meta images
        const services = [
          {
            url: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=false&viewport.width=1200&viewport.height=800`,
            name: 'Microlink Screenshot',
            extractImage: (data) => data?.data?.screenshot?.url
          },
          {
            url: `https://shot.screenshotapi.net/screenshot?token=YOUR_TOKEN&url=${encodeURIComponent(url)}&width=1200&height=800`,
            name: 'ScreenshotAPI',
            extractImage: (data) => data?.screenshot || url // Returns the screenshot URL directly
          },
          {
            url: `https://htmlcsstoimage.com/demo_run?url=${encodeURIComponent(url)}&selector=body&ms_delay=1500&viewport_width=1200&viewport_height=800`,
            name: 'HTML/CSS to Image',
            extractImage: (data) => data?.url
          },
          // Fallback to meta images if screenshots fail
          {
            url: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&meta=true&embed=false`,
            name: 'Microlink Meta',
            extractImage: (data) => data?.data?.image?.url
          }
        ];

        for (const service of services) {
          try {
            console.log(`[MetaPreview] Trying ${service.name} for URL: ${url}`);
            
            // Skip services that require API tokens we don't have
            if (service.url.includes('YOUR_TOKEN')) {
              console.log(`[MetaPreview] ⏭️ Skipping ${service.name} - requires API token`);
              continue;
            }
            
            const response = await fetch(service.url);
            
            if (response.ok) {
              const data = await response.json();
              const image = service.extractImage(data);
              
              if (image && image !== url) { // Make sure we got an actual image URL
                console.log(`[MetaPreview] ✅ Found image via ${service.name}:`, image);
                setMetaImage(image);
                return; // Success - exit the loop
              } else {
                console.log(`[MetaPreview] ❌ No image found via ${service.name}`);
              }
            } else {
              console.log(`[MetaPreview] ❌ ${service.name} responded with status:`, response.status);
            }
          } catch (serviceError) {
            console.log(`[MetaPreview] ❌ ${service.name} service error:`, serviceError.message);
            continue;
          }
        }
        
        console.log(`[MetaPreview] ❌ No preview image found from any service for: ${url}`);
      } catch (error) {
        console.log('[MetaPreview] ❌ Preview fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchMetaImage, 300);
    return () => clearTimeout(timeoutId);
  }, [url, isExternal]);

  return { metaImage, loading };
};

/**
 * Get media title based on config field priority
 */
const getMediaTitle = (media, config) => {
  const titleField = config?.fields?.find(f => f.name === 'title');
  const altTextField = config?.fields?.find(f => f.name === 'alt_text');
  
  if (titleField && media?.title) {
    return media.title;
  }
  
  if (altTextField && media?.alt_text) {
    return media.alt_text;
  }
  
  return media?.title || media?.alt_text || media?.original_title || `ID: ${media?.id}`;
};

/**
 * Get media subtitle/description based on config
 */
const getMediaSubtitle = (media, config) => {
  const descriptionField = config?.fields?.find(f => f.name === 'description');
  const copyrightField = config?.fields?.find(f => f.name === 'copyright');
  
  if (descriptionField && media?.description) {
    return media.description;
  }
  
  if (copyrightField && media?.copyright) {
    return `© ${media.copyright}`;
  }
  
  return null;
};

export const MediaPreviewCard = ({ 
  media, 
  onRemove, 
  onEdit,
  field, 
  config = {},
  showControls = true,
  showTitle = true,
  showSubtitle = true,
  aspectRatio = 'auto'
}) => {
  if (!media) return null;

  const previewUrl = media?.url || '';
  const isImage = media?.mime_type?.startsWith('image');
  const isFolder = media?.is_folder === true;
  const isExternal = media?.is_external === true || media?.mime_type?.startsWith('external/');
  const mime = media?.mime_type || '';
  
  const title = getMediaTitle(media, config);
  const subtitle = getMediaSubtitle(media, config);
  
  // ✅ NEW: Fetch meta preview for external links
  const { metaImage, loading: metaLoading } = useMetaPreview(previewUrl, isExternal);
  
  // Get file type icon based on config or fallback
  const FileIcon = isFolder 
    ? fileTypeIcons?.folder 
    : fileTypeIcons?.[mime] || fileTypeIcons?.default;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
  };

  // Get display preferences from config
  const statusField = config?.fields?.find(f => f.name === 'status');
  const showStatus = statusField && media?.status;

  // ✅ NEW: Determine what to show in preview area
  const renderPreviewContent = () => {
    if (isFolder) {
      return (
        <Box textAlign="center" sx={{ width: '100%', px: 1 }}>
          {FileIcon && <FileIcon size={48} weight="duotone" />}
          <Typography variant="body2" fontWeight={500} noWrap>
            Folder
          </Typography>
        </Box>
      );
    }

    if (isImage && !isExternal) {
      return (
        <CardMedia
          component="img"
          image={previewUrl}
          alt={media?.alt_text || field?.label || 'Media preview'}
          sx={{ 
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            position: aspectRatio !== 'auto' ? 'absolute' : 'static',
            top: 0,
            left: 0
          }}
        />
      );
    }

    if (isExternal && metaImage) {
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <CardMedia
            component="img"
            image={metaImage}
            alt={`Preview of ${title}`}
            sx={{ 
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              position: aspectRatio !== 'auto' ? 'absolute' : 'static',
              top: 0,
              left: 0
            }}
          />
          {/* Overlay to indicate it's external screenshot */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <LinkSimple size={12} />
            Screenshot
          </Box>
        </Box>
      );
    }

    if (isExternal && metaLoading) {
      return (
        <Box textAlign="center" sx={{ width: '100%', px: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 8px',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Loading preview...
          </Typography>
        </Box>
      );
    }

    // Fallback to icon
    return (
      <Box textAlign="center" sx={{ width: '100%', px: 1 }}>
        {FileIcon && <FileIcon size={48} weight="duotone" />}
        <Typography variant="body2" fontWeight={500} noWrap>
          {isExternal ? 'External Link' : title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {mime || 'Unknown type'}
        </Typography>
      </Box>
    );
  };

  return (
    <Card 
      sx={{ 
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...(isExternal && {
          border: '2px solid',
          borderColor: 'info.main',
          '&::before': {
            content: '"External"',
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'primary.main',
            color: 'white',
            fontSize: '0.75rem',
            px: 1,
            py: 0.8,
            borderRadius: 1,
            zIndex: 1
          }
        })
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          height: aspectRatio === 'auto' ? 200 : 0,
          paddingTop: aspectRatio !== 'auto' ? aspectRatio : 0,
          backgroundColor: '#f9f6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {renderPreviewContent()}

        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(event) => {
                    onEdit(media, event.currentTarget);
                  }}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                      color: 'primary.main'
                    }
                  }}
                >
                  <PencilSimple size={16} />
                </IconButton>
              </Tooltip>
            )}
            
            {onRemove && (
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={onRemove}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                    }
                  }}
                >
                  <XIcon size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Content section - unchanged */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          p: 1.5, 
          pb: 0.5,
          width: '100%',
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        {showTitle && (
          <Typography 
            variant="subtitle2" 
            fontWeight={500} 
            sx={{ 
              mb: 0.5,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {title}
          </Typography>
        )}
        
        {showSubtitle && subtitle && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mb: 0.5,
              display: 'block',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
          >
            {subtitle}
          </Typography>
        )}
        
        {showStatus && (
          <Box sx={{ mt: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: media.status === 'uploaded' ? 'success.light' : 'primary.main',
                color: media.status === 'uploaded' ? 'success.contrastText' : 'info.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                textTransform: 'capitalize',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {media.status}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action buttons - unchanged */}
      {showControls && (
        <Box sx={{ display: 'flex', p: 0.5, pt: 0, justifyContent: 'space-between', gap: 0.5 }}>
          <Tooltip title={isFolder ? "Open folder" : isExternal ? "Open link" : "View file"}>
            <IconButton
              component="a"
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ 
                color: 'primary.main',
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100'
                }
              }}
            >
              {isFolder || isExternal ? <LinkSimple size={18} /> : <Eye size={18} />}
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy URL">
              <IconButton
                size="small"
                onClick={copyToClipboard}
                sx={{ color: 'text.secondary' }}
              >
                <Copy size={16} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isExternal ? "Open in new tab" : "Download file"}>
              <IconButton
                component="a"
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <DownloadSimple size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Card>
  );
};