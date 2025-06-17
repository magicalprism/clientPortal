import { createClient } from '@/lib/supabase/browser';

/**
 * Fetches the contact thumbnail URL from joined details or Supabase media.
 * Focuses on direct media fetch from thumbnail_id.
 */
export async function getContactThumbnailUrl(contact) {
  if (!contact) return null;
  const supabase = createClient();



  // Case 1: Direct URL in thumbnail_media (from task join)
  if (contact.thumbnail_media?.url) {

    return contact.thumbnail_media.url;
  }

  // Case 2: URL in thumbnail_id_details (from expanded join)
  if (contact.thumbnail_id_details?.url) {

    return contact.thumbnail_id_details.url;
  }

  // Case 3: Direct media relationship
  if (contact.media?.url) {

    return contact.media.url;
  }

  // Case 4: Fetch directly from media table using thumbnail_id (MAIN APPROACH)
  if (contact.thumbnail_id) {
    let mediaId = contact.thumbnail_id;
    
    // Handle if thumbnail_id is an object with id property
    if (typeof mediaId === 'object' && mediaId !== null) {
      mediaId = mediaId.id;

    }
    
    try {

      
      // Use a more detailed select to ensure we get the URL
      const { data: media, error } = await supabase
        .from('media')
        .select('id, url, title, file_path, storage_path')
        .eq('id', mediaId)
        .single();

      if (error) {

      } else if (media) {

        
        // Try different possible URL fields
        const mediaUrl = media.url || media.file_path || media.storage_path;
        
        if (mediaUrl) {

          return mediaUrl;
        } else {

        }
      } else {

      }
    } catch (err) {

    }
  }


  return null;
}