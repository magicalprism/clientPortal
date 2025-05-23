// src/data/mediaFieldConfig.js

export const defaultMediaFields = () => ({
  title: '',
  altText: '',
  description: '',
  originalTitle: '',
  copyright: '',
  mime_type: '',
  is_folder: false,
  tags: [],
  url: '',
  previewUrl: '',
  file: null
});

export const getInitialMedia = (type = 'file') => {
  const base = defaultMediaFields();
  if (type === 'manual') {
    delete base.previewUrl;
    delete base.file;
  }
  return base;
};



export const allEditableMediaKeys = [
  'title',
  'altText',
  'description',
  'originalTitle',
  'copyright',
  'mime_type',
  'is_folder',
  'tags'
];

export const manualOnlyKeys = ['url'];
export const uploadOnlyKeys = ['previewUrl', 'file'];

export const getMediaTitle = (media, fallback = 'Unnamed file') =>
  media?.title || media?.alt_text || fallback;

export const getMediaAltText = (media, fallback = 'Media') =>
  media?.altText || media?.alt_text || fallback;



