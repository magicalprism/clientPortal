'use client';

import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic'; 
import { BrandBoardPreview } from '@/components/fields/custom/brand/brandBoard/BrandBoardPreview';
import { ElementMap } from '@/components/fields/custom/ElementMap';
import { TimeTrackerField } from '@/components/fields/dateTime/timer/TimeTrackerField';
import { CommentThread } from '@/components/fields/custom/comments/CommentThread';
import { SectionThread } from '@/components/fields/custom/sections/SectionThread';
import { PaymentThread } from '@/components/fields/custom/payments/PaymentThread';
import { ColorTokenEditor } from '@/components/fields/custom/brand/colors/ColorTokenEditor';
import { TypographyTokenEditor } from '@/components/fields/custom/brand/typography/TypographyTokenEditor';
// Dynamic import for kanban board
const ProjectKanbanBoard = dynamic(() => import('@/components/kanban/ProjectKanbanBoard'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Typography variant="body2" color="text.secondary">Loading kanban board...</Typography>
    </Box>
  ),
});

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

        case 'ColorTokenEditor':  // ADD THIS CASE
      return <ColorTokenEditor record={record} field={field} editable={editable} />;

    case 'ProjectKanbanBoard':
    case 'KanbanBoard':
      if (!record?.id) {
        return (
          <Typography variant="body2" color="text.secondary">
            Record ID required for kanban board
          </Typography>
        );
      }

      case 'TypographyTokenEditor':
  return <TypographyTokenEditor record={record} field={field} editable={editable} />;

      case 'CommentThread':
      return (
         <CommentThread
            entity={field.props?.entity}
            entityId={record?.id}
          />
            );

        case 'SectionThread':
      return (
        <SectionThread
          pivotTable={field.props?.pivotTable}
          entityField={field.props?.entityField}
          entityId={record?.id}
          label={field.label}
          record={record}
          mediaPivotTable={field.props?.mediaPivotTable || 'media_section'}
        />
      );

          case 'PaymentThread':
      return (
        <PaymentThread
          pivotTable={field.props?.pivotTable || 'contract_payment'}
          entityField={field.props?.entityField || 'contract_id'}
          entityId={record?.id}
          label={field.label || 'Payment Schedule'}
          record={record}
          showInvoiceButton={field.props?.showInvoiceButton !== false}
          onCreatePendingPayment={(payment) =>
    setPendingPayments(prev => [...prev, payment])
  }
        />
      );

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
