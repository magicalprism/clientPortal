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

  if (!company?.id) {
    console.error('[Company] Missing company ID');
    return new Response(JSON.stringify({
      error: 'Missing company ID'
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`[Company] Processing drive for company: ${company.title} (ID: ${company.id})`);

    // Create or get root shared drive folder - NOW WITH RECORD TRACKING
    const companyDrive = await getOrCreateFolder(
      company.title, 
      null,           // No parent (root level)
      company.id,     // Record ID for database saving
      'company'       // Record type for database saving
    );
    console.log('[Company] Company folder created/found:', companyDrive.id);

    // Ensure subfolders exist
    const [projectsFolder, brandFolder] = await Promise.all([
      getOrCreateFolder('Projects', companyDrive.id),
      getOrCreateFolder('Brand', companyDrive.id)
    ]);
    
    console.log('[Company] Subfolders created:', {
      projects: projectsFolder.id,
      brand: brandFolder.id
    });

    console.log(`[Company] ✅ Folders created or reused for "${company.title}"`);

    // ✅ FIXED: Return consistent format that matches client expectations
    return new Response(JSON.stringify({
      message: 'Company drive folders handled',
      folder: {
        id: companyDrive.id,
        name: companyDrive.name,
        url: `https://drive.google.com/drive/folders/${companyDrive.id}`
      },
      folders: {
        main: {
          id: companyDrive.id,
          name: companyDrive.name
        },
        projects: {
          id: projectsFolder.id,
          name: projectsFolder.name
        },
        brand: {
          id: brandFolder.id,
          name: brandFolder.name
        }
      },
      structure: `${company.title}/`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Company] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process company drive',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}