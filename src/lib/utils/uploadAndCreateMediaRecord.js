'use client';

import { createClient } from '@/lib/supabase/browser';
import { uploadToSupabase } from './supabaseUpload';
import { getMimeTypeFromUrl } from '@/data/fileTypes';

export const uploadAndCreateMediaRecord = async ({
  file,
  bucket = 'media',
  record = {},
  field = {},
  baseFolder = '',
  altText = '',
  copyright = '',
    originalTitle = '',
  description = '',
  mimeTypeOverride = null,
  isFolder = false,
  tags = [],
}) => {
  if (!(file instanceof File)) {
    console.error('❌ Invalid file provided to upload:', file);
    throw new Error('Invalid file input');
  }

  const supabase = createClient();

  // Step 1: Upload file to Supabase Storage
  const { publicUrl, filePath, error: uploadError } = await uploadToSupabase({
    file,
    bucket,
    record,
    field,
    baseFolder,
  });

  if (uploadError) {
    console.error('❌ Upload to Supabase Storage failed:', uploadError.message);
    throw uploadError;
  }

  if (!publicUrl || !filePath) {
    throw new Error('Upload failed, missing URL or filePath');
  }

  const mimeType =
  field?.is_folder === true
    ? 'folder'
    : file?.type || getMimeTypeFromUrl(file?.name);


// Use provided alt text, or fallback for non-images
let effectiveAltText = altText?.trim();
if (!effectiveAltText && !mimeType.startsWith('image/')) {
  effectiveAltText = `Uploaded file: ${file.name}`;
}

  // Step 2: Insert uploaded file info into 'media' table
const mediaPayload = {
  url: publicUrl,
  file_path: filePath,
  size: file.size || null,
  mime_type: mimeType,
  alt_text: effectiveAltText,
  copyright,
  description,
  original_title: originalTitle,
  is_folder: isFolder,
  tags, // JSONB array expected
  width: null,
  height: null,
  created_at: new Date().toISOString()
};
  mediaPayload.mime_type = field?.is_folder === true
  ? 'folder'
  : (file.type || getMimeTypeFromUrl(file.name));


  const { data: insertedMedia, error: insertError } = await supabase
    .from('media')
    .insert(mediaPayload)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to create media database record:', insertError.message);
    throw insertError;
  }

  console.log('✅ Media record created_at:', insertedMedia);

  return insertedMedia; // { id, url, alt_text, copyright, etc. }
};
