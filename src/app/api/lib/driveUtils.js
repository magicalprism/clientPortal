import { getAccessToken } from '@/app/api/lib/googleAuth';

const SHARED_DRIVE_ID = process.env.CLIENTS_DRIVE_ID;

async function listFolders(name, parentId = null) {
  const accessToken = await getAccessToken();
  const q = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${name}'`,
    'trashed=false',
    ...(parentId ? [`'${parentId}' in parents`] : [])
  ];

  const query = q.join(' and ');
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&driveId=${SHARED_DRIVE_ID}&includeItemsFromAllDrives=true&corpora=drive&supportsAllDrives=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  return data.files || [];
}

// Rename folder function
export async function renameFolder(folderId, newName) {
  console.log(`[Drive] Renaming folder ${folderId} to: ${newName}`);
  
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: newName
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to rename folder: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log(`[Drive] ✅ Folder renamed successfully:`, result);
  return result;
}

// Enhanced getOrCreateFolder with ID tracking
export async function getOrCreateFolder(name, parentId = null, recordId = null, recordType = null) {
  console.log(`[Drive] Creating or finding folder: ${name}, parent: ${parentId || 'ROOT'}`);
  
  // ✅ IMPROVED: Add debug logging for database saving parameters
  if (recordId && recordType) {
    console.log(`[Drive] Will save folder ID to database: ${recordType}.${recordId}`);
  }

  const existing = await listFolders(name, parentId);
  if (existing.length > 0) {
    console.log(`[Drive] Folder already exists: ${existing[0].id}`);
    
    // Save folder ID to database if provided (even for existing folders)
    if (recordId && recordType) {
      console.log(`[Drive] Saving existing folder ID to database: ${existing[0].id}`);
      await saveFolderIdToDatabase(recordType, recordId, existing[0].id);
    }
    
    return existing[0];
  }

  console.log(`[Drive] Creating new folder: ${name}`);
  
  const accessToken = await getAccessToken();
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId
      ? { parents: [parentId] }
      : { parents: [SHARED_DRIVE_ID] }
    ),
  };

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&corpora=drive&includeItemsFromAllDrives=true&driveId=${SHARED_DRIVE_ID}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[Drive] Failed to create folder:', error);
    throw new Error(`Failed to create folder: ${error.error?.message || 'Unknown error'}`);
  }

  const json = await res.json();
  console.log('[Drive] ✅ Created folder:', json);
  
  // Save folder ID to database if provided
  if (recordId && recordType && json.id) {
    console.log(`[Drive] Saving new folder ID to database: ${json.id}`);
    await saveFolderIdToDatabase(recordType, recordId, json.id);
  }
  
  return json;
}

// ✅ IMPROVED: Enhanced database saving with better error handling and logging
async function saveFolderIdToDatabase(recordType, recordId, folderId) {
  console.log(`[Drive] 🔄 Attempting to save folder ID to database:`, {
    recordType,
    recordId,
    folderId
  });

  try {
    // ✅ IMPROVED: Use dynamic import to avoid server/client import issues
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    console.log(`[Drive] 📝 Updating ${recordType} table, record ${recordId} with folder ID ${folderId}`);
    
    const { data, error } = await supabase
      .from(recordType)
      .update({ 
        drive_folder_id: folderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select(); // ✅ IMPROVED: Return the updated data for verification

    if (error) {
      console.error(`[Drive] ❌ Failed to save folder ID to ${recordType}:`, error);
      console.error(`[Drive] Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log(`[Drive] ✅ Successfully saved folder ID ${folderId} to ${recordType} ${recordId}`);
      if (data && data.length > 0) {
        console.log(`[Drive] 📊 Updated record:`, data[0]);
      }
    }
  } catch (error) {
    console.error('[Drive] ❌ Unexpected error saving folder ID:', error);
    console.error('[Drive] Error stack:', error.stack);
  }
}

// ✅ NEW: Get folder info function for debugging
export async function getFolderInfo(folderId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true&fields=id,name,parents,mimeType,createdTime,modifiedTime`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get folder info: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log(`[Drive] Folder info for ${folderId}:`, result);
    return result;
  } catch (error) {
    console.error('[Drive] Error getting folder info:', error);
    throw error;
  }
}