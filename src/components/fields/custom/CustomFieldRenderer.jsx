'use client';

import { Box, Typography } from '@mui/material';
import { BrandBoardPreview } from '@/components/fields/custom/BrandBoardPreview';
import { ElementMap } from '@/components/fields/custom/ElementMap';
import { TimeTrackerField } from '@/components/fields/dateTime/timer/TimeTrackerField';

/**
 * Custom field renderer for handling embedded components.
 */
export const CustomFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const component = field.component;

  if (!component) return null;

  switch (component) {
    case 'BrandBoardPreview':
      return <BrandBoardPreview brand={record} />;

    case 'ElementMap':
      return record?.id ? (
        <ElementMap projectId={record.id} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Loading map...
        </Typography>
      );

    case 'TimeTrackerField':
      return <TimeTrackerField task={record} />;

    case 'ReverseOneToOneField':
      return (
        <ReverseOneToOneField
          record={record}
          field={field}
          value={value}
          onChange={onChange}
          editable={editable}
          mode={mode}
        />
      );

    default:
      return (
        <Typography variant="body2" color="error">
          Unknown custom component: {component}
        </Typography>
      );
  }
};

export default CustomFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const CustomFieldCase = {
  type: 'custom',
  Component: CustomFieldRenderer
};
