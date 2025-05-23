// Main unified media field system
export { UnifiedMediaField } from './components/UnifiedMediaField';

// Sub-components for single and multi modes
export { SingleMediaField } from './old/SingleMediaField';
export { MultiMediaField } from './old/MultiMediaField';

// Field renderers for integration with your existing system
export { 
  MediaFieldRenderer, 
  MediaGalleryFieldRenderer,
  MediaFieldCase,
  MediaGalleryFieldCase,
  GalleryRelationshipFieldCase
} from './MediaFieldRenderers';

// Modal components
export { ExternalLinkModal } from './modals/ExternalLinkModal';
export { DynamicMediaModal } from './old/DynamicMediaModal'; // New dynamic modal

// Legacy components (keep for backward compatibility)
export { MediaField } from './MediaField';
export { MediaFieldGallery } from './MediaFieldGallery';
export { MediaPreviewCard } from './components/MediaPreviewCard';
export { MediaLibraryPicker } from './MediaLibraryPicker';

// Legacy modals
export { MediaUploadSingleModal } from './old/modals/MediaUploadSingleModal';
export { MediaUploadGalleryModal } from './old/modals/MediaUploadGalleryModal';

// Hooks and utilities
export { useUploadFormState, useUploadHandlers, useMediaPreview } from './old/helpers/useMediaUploadHelpers';