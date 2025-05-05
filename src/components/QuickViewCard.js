'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip,
  IconButton
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ArrowSquareOut } from '@phosphor-icons/react';

export const QuickViewCard = ({ config, record }) => {
  if (!config?.quickView?.enabled) return null;

  const {
    imageField,
    titleField,
    subtitleField,
    descriptionField,
    extraFields = []
  } = config.quickView;

  // --- Smart fallback image handling ---
  const directImage =
    record?.[`${imageField}_details`]?.url || record?.[imageField];

  const companyThumbnail =
    record?.company_id_details?.thumbnail_id_details?.url;

  const fallbackImage = '/assets/placeholder.png';

  const image = directImage || companyThumbnail || fallbackImage;
  const title = record[titleField];
  const subtitle = record[subtitleField];
  const description = record[descriptionField];

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
              const fallback = fallbackImage;
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

{extraFields.length > 0 && (
  <>
    <Divider sx={{ my: 2 }} />
    <Stack spacing={2}>
      {extraFields.map((fieldName) => {
        const field = config.fields.find((f) => f.name === fieldName);
        if (!field) return null;

        const label = field.label || fieldName;

        if (field.type === 'media') {
          const media = record[`${field.name}_details`] || {};
          const hasUrl = !!media.url;
          const hasAlt = !!media.alt_text?.trim();
        
          return (
            <Box key={fieldName}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                {hasUrl && (
                  <IconButton
                    component="a"
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <ArrowSquareOut size={14} />
                  </IconButton>
                )}
              </Box>
        
              {hasAlt && (
                <Typography variant="body2" color="text.secondary">
                  {media.alt_text}
                </Typography>
              )}
        
              {!hasUrl && (
                <Typography variant="body2" color="text.secondary">
                  N/A
                </Typography>
              )}
            </Box>
          );
        }
        
        

        if (field.type === 'relationship') {
          const related = record[`${field.name}_details`] || {};
          const relatedId = record[field.name];
          const labelText = related?.[field.relation?.labelField] || `ID: ${relatedId}`;
          const href = `/${field.relation?.table}/${relatedId}`;
          return (
            <Box key={fieldName}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
              </Typography>
              <Typography
                component="a"
                href={href}
                variant="body2"
                color="primary"
              >
                {labelText}
              </Typography>
            </Box>
          );
        }

        if (field.type === 'multiRelationship') {
          const relatedList = record[`${field.name}_details`] || [];
          return (
            <Box key={fieldName}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
              </Typography>
              <Stack spacing={0.5}>
                {relatedList.map((item) => (
                  <Typography
                    key={item.id}
                    component="a"
                    href={`/${field.relation?.table}/${item.id}`}
                    variant="body2"
                    color="primary"
                  >
                    {item[field.relation?.labelField] || `ID: ${item.id}`}
                  </Typography>
                ))}
              </Stack>
            </Box>
          );
        }

        // Default fallback
        return (
          <Box key={fieldName}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="body2">
              {record[field.name] ?? '—'}
            </Typography>
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
