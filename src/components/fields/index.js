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