import { handleCompanyDrive } from '@/app/api/integrations/google-drive/company';
import { handleProjectFolder } from '@/app/api/integrations/google-drive/project';
import { handleElementFolder } from '@/app/api/integrations/google-drive/element';

export async function POST(req) {
  try {
    const { type, payload } = await req.json(); // ← FIRST
    console.log('[API] Incoming Google Drive request:', { type, payload }); // ← THEN LOG IT

    switch (type) {
      case 'company':
        return handleCompanyDrive(payload);
      case 'project':
        return handleProjectFolder(payload);
      case 'element':  // ← ADD THIS CASE
        return handleElementFolder(payload);

      default:
        return new Response(JSON.stringify({ error: 'Unsupported type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (err) {
    console.error('[API] Error handling Google Drive:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}