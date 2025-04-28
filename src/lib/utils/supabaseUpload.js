'use client';

import { createClient } from '@/lib/supabase/browser';

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')           // replace spaces with hyphens
    .replace(/[^a-z0-9.-]/g, '')     // allow a-z, 0-9, dots, hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^\-+|\-+$/g, '');      // trim start/end hyphens
}

export const uploadToSupabase = async ({ file, bucket = 'media', record = {}, field = {}, baseFolder = '' }) => {
  if (!(file instanceof File)) {
    console.error('❌ Invalid file passed to uploader:', file);
    throw new Error('Invalid file');
  }

  const supabase = createClient();

  const resolveFolderPath = () => {
    if (!baseFolder) return '';

    return baseFolder.split('/').map((segment) => {
      if (record[segment]) {
        return sanitizeFileName(record[segment].toString());
      }
      return sanitizeFileName(segment);
    }).join('/');
  };

  const folderPath = resolveFolderPath();
  const sanitizedFileName = sanitizeFileName(file.name);
  const fileName = `${Date.now()}-${sanitizedFileName}`;
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Upload Error:', uploadError.message);
    return { url: '', error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: urlData?.publicUrl || '',
  };
};
