'use client';

import { createClient } from '@/lib/supabase/browser';
import { uploadToSupabase } from './supabaseUpload';
import { getMimeTypeFromUrl } from '@/data/fileTypes';

export const uploadAndCreateSectionRecord = async ({
  file,
  bucket = 'section',
  record = {},
  field = {},
  baseFolder = '',
  altText = '',
  copyright = ''
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

  // Step 2: Insert uploaded file info into 'section' table
  const sectionPayload = {
    url: publicUrl,
    file_path: filePath,
    size: file.size || null,
    mime_type: field?.is_folder === true ? 'folder' : (file.type || getMimeTypeFromUrl(file.name)),
    alt_text: effectiveAltText || '',
    copyright: copyright || '',
    width: null,
    height: null,
    created_at: new Date().toISOString(),
    is_folder: field?.is_folder === true,
    
  };
  sectionPayload.mime_type = field?.is_folder === true
  ? 'folder'
  : (file.type || getMimeTypeFromUrl(file.name));


  const { data: insertedSection, error: insertError } = await supabase
    .from('section')
    .insert(sectionPayload)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to create section database record:', insertError.message);
    throw insertError;
  }

  console.log('✅ Section record created_at:', insertedSection);

  return insertedSection; // { id, url, alt_text, copyright, etc. }
};
