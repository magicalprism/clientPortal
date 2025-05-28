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

// NEW: Rename folder function
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

  const existing = await listFolders(name, parentId);
  if (existing.length > 0) {
    console.log(`[Drive] Folder already exists: ${existing[0].id}`);
    
    // Save folder ID to database if provided
    if (recordId && recordType) {
      await saveFolderIdToDatabase(recordType, recordId, existing[0].id);
    }
    
    return existing[0];
  }

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

  const json = await res.json();
  console.log('[Drive] Created folder:', json);
  
  // Save folder ID to database if provided
  if (recordId && recordType && json.id) {
    await saveFolderIdToDatabase(recordType, recordId, json.id);
  }
  
  return json;
}

// NEW: Save folder ID to database
async function saveFolderIdToDatabase(recordType, recordId, folderId) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    
    const { error } = await supabase
      .from(recordType)
      .update({ drive_folder_id: folderId })
      .eq('id', recordId);
    
    if (error) {
      console.error(`[Drive] Failed to save folder ID to ${recordType}:`, error);
    } else {
      console.log(`[Drive] ✅ Saved folder ID ${folderId} to ${recordType} ${recordId}`);
    }
  } catch (error) {
    console.error('[Drive] Error saving folder ID:', error);
  }
}