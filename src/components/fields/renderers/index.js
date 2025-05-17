import TextFieldRenderer from './TextFieldRenderer';
import SelectFieldRenderer from './SelectFieldRenderer';
import RelationshipFieldRenderer from './RelationshipFieldRenderer';
import MultiRelationshipFieldRenderer from './MultiRelationshipFieldRenderer';
import MediaFieldRenderer from './MediaFieldRenderer';
import DateFieldRenderer from './DateFieldRenderer';
import BooleanFieldRenderer from './BooleanFieldRenderer';
import RichTextFieldRenderer from './RichTextFieldRenderer';
import TimestampFieldRenderer from './TimestampFieldRenderer';
import LinkFieldRenderer from './LinkFieldRenderer';
import ColorFieldRenderer from './ColorFieldRenderer';
import CustomFieldRenderer from './CustomFieldRenderer';
import GalleryRelationshipFieldRenderer from './GalleryRelationshipFieldRenderer';
import TimezoneFieldRenderer from './TimezoneFieldRenderer';

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
};

export const getRendererForField = (type) => {
  return RENDERERS[type] || RENDERERS.default;
};

export { RENDERERS };