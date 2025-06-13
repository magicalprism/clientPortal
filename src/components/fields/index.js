import TextFieldRenderer from '@/components/fields/text/TextFieldRenderer';
import SelectFieldRenderer from '@/components/fields/select/SelectFieldRenderer';
import RelationshipFieldRenderer from '@/components/fields/relationships/RelationshipFieldRenderer';
import MultiRelationshipFieldRenderer from '@/components/fields/relationships/multi/MultiRelationshipFieldRenderer';
import MediaFieldRenderer from '@/components/fields/media/MediaFieldRenderer';
import DateFieldRenderer from '@/components/fields/dateTime/DateFieldRenderer';
import BooleanFieldRenderer from '@/components/fields/boolean/BooleanFieldRenderer';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';
import TimestampFieldRenderer from '@/components/fields/dateTime/timestamp/TimestampFieldRenderer';
import LinkFieldRenderer from '@/components/fields/link/LinkFieldRenderer';
import ColorFieldRenderer from '@/components/fields/color/ColorFieldRenderer';
import CustomFieldRenderer from '@/components/fields/custom/CustomFieldRenderer';
import GalleryRelationshipFieldRenderer from '@/components/fields/media/GalleryRelationshipFieldRenderer';
import TimezoneFieldRenderer from '@/components/fields/dateTime/TimezoneFieldRenderer';
import { CommentThread } from '@/components/fields/custom/comments/CommentThread';
import { SectionThread } from '@/components/fields/custom/sections/SectionThread';
import { PaymentThread } from '@/components/fields/custom/payments/PaymentThread';
import { ColorTokenEditor } from '@/components/fields/custom/brand/colors/ColorTokenEditor';
import { TypographyTokenEditor } from '@/components/fields/custom/brand/typography/TypographyTokenEditor';
import KanbanFieldRenderer from '@/components/views/kanban/KanbanFieldRenderer';
import ChecklistField from '@/components/fields/custom/checklist/ChecklistField';

const CommentsFieldRenderer = ({ field, record }) => {
  return (
    <CommentThread
      entity={field.props?.entity}
      entityId={record?.id}
    />
  );
};

const SectionsFieldRenderer = ({ field, record }) => {
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
};
const PaymentsFieldRenderer = ({ field, record }) => {
  return (
    <PaymentThread
      pivotTable={field.props?.pivotTable || 'contract_payment'}
      entityField={field.props?.entityField || 'contract_id'}
      entityId={record?.id}
      label={field.label || 'Payment Schedule'}
      record={record}
      showInvoiceButton={field.props?.showInvoiceButton !== false}
    />
  );
};

const ColorTokensFieldRenderer = ({ field, record, editable }) => {
  return (
    <ColorTokenEditor
      record={record}
      field={field}
      editable={editable}
    />
  );
};

const TypographyTokensFieldRenderer = ({ field, record, editable }) => {
  return (
    <TypographyTokenEditor
      record={record}
      field={field}
      editable={editable}
    />
  );
};
const ChecklistFieldRenderer = ({ field, record, value, onChange, editable }) => {
  return (
    <ChecklistField
      entityType={field.props?.entityType || 'event'}
      entityId={record?.id}
      field={field}
      value={value}
      editable={editable}
      onChange={onChange}
      variant={field.props?.variant || 'embedded'}
      title={field.label}
      allowCreate={field.props?.allowCreate !== false}
      allowReorder={field.props?.allowReorder !== false}
      defaultChecklistName={field.props?.defaultChecklistName}
      assignableContacts={
        // Get assignable contacts based on entity type
        field.props?.entityType === 'event' 
          ? record?.contacts_details || []
          : field.props?.entityType === 'project'
          ? record?.project_members_details || []
          : []
      }
      maxChecklists={field.props?.maxChecklists}
      showProgress={field.props?.showProgress !== false}
      {...field.props}
    />
  );
};

const RENDERERS = {
  select: SelectFieldRenderer,
  status: SelectFieldRenderer,
  relationship: RelationshipFieldRenderer,
  multiRelationship: MultiRelationshipFieldRenderer,
  media: MediaFieldRenderer,
  date: DateFieldRenderer,
  boolean: BooleanFieldRenderer,
  richText: RichTextFieldRenderer,
  timestamp: TimestampFieldRenderer,
  link: LinkFieldRenderer,
  color: ColorFieldRenderer,
  custom: CustomFieldRenderer,
  default: TextFieldRenderer,
  galleryRelationship: GalleryRelationshipFieldRenderer,
  timezone: TimezoneFieldRenderer,
  comments: CommentsFieldRenderer, 
  sections: SectionsFieldRenderer,
  payments: PaymentsFieldRenderer,
  colorTokens: ColorTokensFieldRenderer,
  typographyTokens: TypographyTokensFieldRenderer,
  kanban: KanbanFieldRenderer,
  checklist: ChecklistFieldRenderer,
};

export const getRendererForField = (type) => {
  return RENDERERS[type] || RENDERERS.default;
};

export { RENDERERS };