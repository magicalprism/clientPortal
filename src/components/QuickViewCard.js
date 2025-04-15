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

  const image = record[imageField];
  const title = record[titleField];
  const subtitle = record[subtitleField];
  const description = record[descriptionField];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        {image && (
          <Box
            component="img"
            src={image}
            alt={title || 'Preview image'}
            sx={{ width: '100%', borderRadius: 2, mb: 2 }}
            onError={(e) => (e.target.style.display = 'none')}
          />
        )}

        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}

        {subtitle && (
          <Chip
            label={subtitle}
            size="small"
            sx={{ mb: 2 }}
            color="primary"
          />
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
                const field = config.fields.find(f => f.name === fieldName);
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
