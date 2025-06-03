// /app/api/google-drive/rename/route.js
import { renameFolder } from '@/app/api/lib/driveUtils';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const { type, folderId, newName, oldName, recordId } = await req.json();
    
    console.log('[Rename API] Processing rename request:', { 
      type, 
      folderId, 
      oldName: oldName?.substring(0, 50), 
      newName: newName?.substring(0, 50),
      recordId 
    });

    // Validate required parameters
    if (!type || !folderId || !newName) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: type, folderId, and newName are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate collection type
    const supportedTypes = ['company', 'project', 'element'];
    if (!supportedTypes.includes(type)) {
      return new Response(JSON.stringify({
        error: `Unsupported type: ${type}. Supported types: ${supportedTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform the rename operation
    console.log(`[Rename API] Renaming ${type} folder ${folderId} to: ${newName}`);
    
    const result = await renameFolder(folderId, newName);
    
    console.log('[Rename API] Rename successful:', result.name);

    // Update the database record to track the new original name
    if (recordId) {
      try {
        const supabase = await createClient();
        
        const { error: updateError } = await supabase
          .from(type)
          .update({
            drive_original_name: newName,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId);

        if (updateError) {
          console.error('[Rename API] Database update failed:', updateError);
          // Don't fail the whole operation for database update errors
        } else {
          console.log('[Rename API] Database record updated successfully');
        }
      } catch (dbError) {
        console.error('[Rename API] Database update error:', dbError);
        // Continue despite database errors
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Folder renamed successfully`,
      oldName,
      newName,
      folderId,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Rename API] Error:', error);
    
    // Handle specific Google Drive API errors
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('File not found')) {
      errorMessage = 'The Google Drive folder could not be found. It may have been deleted or moved.';
      statusCode = 404;
    } else if (error.message.includes('Permission denied')) {
      errorMessage = 'Permission denied. The service account may not have access to this folder.';
      statusCode = 403;
    } else if (error.message.includes('Invalid argument')) {
      errorMessage = 'Invalid folder name or ID provided.';
      statusCode = 400;
    }

    return new Response(JSON.stringify({
      error: 'Failed to rename folder',
      details: errorMessage,
      type,
      folderId,
      newName
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for checking rename status or folder info
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const folderId = url.searchParams.get('folderId');
    const action = url.searchParams.get('action');

    if (action === 'check' && folderId) {
      // Check if folder exists and get its current name
      // This would require implementing a new function in driveUtils.js
      return new Response(JSON.stringify({
        message: 'Folder check functionality not yet implemented',
        folderId
      }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid parameters. Use action=check&folderId=xxx to check folder status'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Rename API GET] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}