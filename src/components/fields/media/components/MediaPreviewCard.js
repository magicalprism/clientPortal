'use client';

import { Box, Card, CardMedia, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import { X as XIcon, DownloadSimple, LinkSimple, Copy } from '@phosphor-icons/react';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { getMediaTitle } from '@/components/fields/media/data/mediaFieldConfig';


export const MediaPreviewCard = ({ media, onRemove, field, showControls = true }) => {
  if (!media) return null;

  const previewUrl = media?.url || '';
  const isImage = media?.mime_type?.startsWith('image');
  const isFolder = media?.is_folder === true;
  const mime = media?.mime_type || '';
  const title = getMediaTitle(media);
  
  const FileIcon = media?.is_folder === true || mime === 'folder'
    ? fileTypeIcons.folder
    : fileTypeIcons[mime] || fileTypeIcons.default;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          height: 200,
          backgroundColor: '#f9f6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isFolder ? (
          <Box textAlign="center">
            <FileIcon size={48} weight="duotone" />
            <Typography variant="body2" fontWeight={500}>
              Folder
            </Typography>
          </Box>
        ) : isImage ? (
          <CardMedia
            component="img"
            image={previewUrl}
            alt={media?.alt_text || field?.label || 'Media preview'}
            sx={{ 
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Box textAlign="center">
            <FileIcon size={48} weight="duotone" />
            <Typography variant="body2" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mime || 'Unknown type'}
            </Typography>
          </Box>
        )}

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
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={500} noWrap>
          {title}
        </Typography>
        {media?.copyright && (
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            © {media.copyright}
          </Typography>
        )}
      </CardContent>

      {showControls && (
        <Box sx={{ display: 'flex', p: 1, pt: 0, justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Copy URL">
            <IconButton
              size="small"
              onClick={copyToClipboard}
              sx={{ color: 'text.secondary' }}
            >
              <Copy size={16} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFolder ? "Open folder" : "Download file"}>
            <IconButton
              component="a"
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: 'primary.main' }}
            >
              {isFolder ? <LinkSimple size={16} /> : <DownloadSimple size={16} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Card>
  );
};