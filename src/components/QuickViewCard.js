'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';

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
                const value = record[fieldName];

                return (
                  <Box key={fieldName}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {field?.label || fieldName}
                    </Typography>

                    <Box sx={{ display: 'block' }}>
                      <FieldRenderer
                        value={value}
                        field={field || { name: fieldName }}
                        record={record}
                      />
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
