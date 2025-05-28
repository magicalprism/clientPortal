import { getOrCreateFolder } from '@/app/api/lib/driveUtils';

/**
 * Handles folder setup for a Company row when create_folder is set to true.
 * 
 * @param {Object} company - Supabase row object for the company.
 * @returns {Response}
 */
export async function handleCompanyDrive(company) {
  if (!company?.create_folder || !company?.title) {
    console.log('[Company] Skipped: Missing create_folder or title');
    return new Response('No action taken', { status: 204 });
  }

  try {
    console.log(`[Company] Processing drive for company: ${company.title}`);

    // Create or get root shared drive folder (fake "shared drive" as folder under root)
    const companyDrive = await getOrCreateFolder(company.title);
    console.log('[Drive] Created folder:', JSON.stringify(companyDrive, null, 2));

    // Ensure subfolders exist
    await Promise.all([
      getOrCreateFolder('Projects', companyDrive.id),
      getOrCreateFolder('Brand', companyDrive.id)
    ]);
    

    console.log(`[Company] Folders created or reused for "${company.title}"`);

    // ✅ FIXED: Return JSON instead of plain text
    return new Response(JSON.stringify({
      message: 'Company drive folders handled',
      companyFolder: companyDrive
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Company] Error:', error);
    // ✅ FIXED: Return JSON error instead of plain text
    return new Response(JSON.stringify({
      error: 'Failed to process company drive',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}