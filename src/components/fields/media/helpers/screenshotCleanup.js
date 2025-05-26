// Add this to your media deletion handler or create a utility function

import { createClient } from '@/lib/supabase/browser';

/**
 * Clean up screenshot file when media record is deleted
 * Call this before or after deleting a media record
 */
export const cleanupMediaScreenshot = async (mediaRecord) => {
  const supabase = createClient();
  
  if (!mediaRecord?.screenshot_url) {
    console.log('[Cleanup] No screenshot to cleanup for media:', mediaRecord?.id);
    return;
  }

  try {
    // Extract file path from screenshot URL
    const screenshotUrl = mediaRecord.screenshot_url;
    console.log('[Cleanup] Processing screenshot URL:', screenshotUrl);
    
    // Extract path after '/storage/v1/object/public/media/'
    const match = screenshotUrl.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
    
    if (!match || !match[1]) {
      console.error('[Cleanup] Could not extract file path from URL:', screenshotUrl);
      return;
    }
    
    const filePath = match[1]; // e.g., "screenshots/example-com-123456.png"
    console.log('[Cleanup] Extracted file path:', filePath);
    
    // Delete the file from Supabase Storage
    const { error } = await supabase.storage
      .from('media') // Your storage bucket name
      .remove([filePath]);
    
    if (error) {
      console.error('[Cleanup] Failed to delete screenshot file:', error);
      console.error('[Cleanup] File path was:', filePath);
    } else {
      console.log('[Cleanup] ✅ Successfully deleted screenshot file:', filePath);
    }
    
  } catch (error) {
    console.error('[Cleanup] Screenshot cleanup error:', error);
  }
};

/**
 * Enhanced media deletion function that includes screenshot cleanup
 */
export const deleteMediaWithCleanup = async (mediaId) => {
  const supabase = createClient();
  
  try {
    // 1. First, get the media record to check for screenshot
    const { data: mediaRecord, error: fetchError } = await supabase
      .from('media')
      .select('id, screenshot_url, url, title')
      .eq('id', mediaId)
      .single();
    
    if (fetchError) {
      console.error('[Delete] Failed to fetch media record:', fetchError);
      throw fetchError;
    }
    
    console.log('[Delete] Deleting media record:', mediaRecord);
    
    // 2. Clean up screenshot file if it exists
    await cleanupMediaScreenshot(mediaRecord);
    
    // 3. Delete the media record from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId);
    
    if (deleteError) {
      console.error('[Delete] Failed to delete media record:', deleteError);
      throw deleteError;
    }
    
    console.log('[Delete] ✅ Successfully deleted media and cleaned up files');
    return true;
    
  } catch (error) {
    console.error('[Delete] Media deletion failed:', error);
    throw error;
  }
};

/**
 * Batch cleanup for orphaned screenshot files
 * Run this periodically to clean up any missed files
 */
export const cleanupOrphanedScreenshots = async () => {
  const supabase = createClient();
  
  try {
    console.log('[Cleanup] Starting orphaned screenshot cleanup...');
    
    // 1. Get all files in the screenshots folder
    const { data: files, error: listError } = await supabase.storage
      .from('media')
      .list('screenshots');
    
    if (listError) {
      console.error('[Cleanup] Failed to list screenshot files:', listError);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log('[Cleanup] No screenshot files found');
      return;
    }
    
    console.log(`[Cleanup] Found ${files.length} screenshot files`);
    
    // 2. Get all screenshot URLs from media table
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('media')
      .select('screenshot_url')
      .not('screenshot_url', 'is', null);
    
    if (mediaError) {
      console.error('[Cleanup] Failed to fetch media screenshot URLs:', mediaError);
      return;
    }
    
    // Extract filenames from URLs
    const referencedFiles = new Set();
    mediaRecords?.forEach(record => {
      if (record.screenshot_url) {
        const match = record.screenshot_url.match(/\/screenshots\/([^\/]+)$/);
        if (match && match[1]) {
          referencedFiles.add(match[1]);
        }
      }
    });
    
    console.log(`[Cleanup] Found ${referencedFiles.size} referenced screenshot files`);
    
    // 3. Find orphaned files
    const orphanedFiles = files.filter(file => !referencedFiles.has(file.name));
    
    if (orphanedFiles.length === 0) {
      console.log('[Cleanup] No orphaned files found');
      return;
    }
    
    console.log(`[Cleanup] Found ${orphanedFiles.length} orphaned files:`, orphanedFiles.map(f => f.name));
    
    // 4. Delete orphaned files
    const filesToDelete = orphanedFiles.map(file => `screenshots/${file.name}`);
    
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove(filesToDelete);
    
    if (deleteError) {
      console.error('[Cleanup] Failed to delete orphaned files:', deleteError);
    } else {
      console.log(`[Cleanup] ✅ Successfully deleted ${filesToDelete.length} orphaned files`);
    }
    
  } catch (error) {
    console.error('[Cleanup] Orphaned cleanup failed:', error);
  }
};

/**
 * Hook into your existing media deletion handlers
 * Add this to wherever you handle media record deletions
 */
export const useMediaDeletion = () => {
  const handleDelete = async (mediaId) => {
    try {
      await deleteMediaWithCleanup(mediaId);
      // Refresh your UI or call your existing refresh logic
    } catch (error) {
      console.error('Failed to delete media:', error);
      // Show error to user
    }
  };
  
  return { handleDelete };
};