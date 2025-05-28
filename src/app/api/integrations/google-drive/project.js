import { getOrCreateFolder } from '@/app/api/lib/driveUtils';

/**
 * Handles folder creation for a Project row when create_folder is set to true.
 *
 * @param {Object} project - Supabase row object for the project.
 * @returns {Response}
 */
export async function handleProjectFolder(project) {
  if (!project?.create_folder || !project?.title) {
    console.log('[Project] Skipped: Missing create_folder or title');
    return new Response('No action taken', { status: 204 });
  }

  const companyTitle = project?.company_id?.title || 
                      project?.company_id_details?.title ||
                      project?.companyTitle;

  if (!companyTitle) {
    console.error('[Project] Missing company title');
    // ✅ FIXED: Return JSON error instead of plain text
    return new Response(JSON.stringify({
      error: 'Missing company title',
      received: {
        company_id: project?.company_id,
        company_id_details: project?.company_id_details,
        companyTitle: project?.companyTitle
      }
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`[Project] Processing project folder for: ${companyTitle} / ${project.title}`);

    // ✅ REMOVED: Advanced rename functionality that doesn't exist yet
    // if (project.drive_folder_id && project.original_title && project.original_title !== project.title) {
    //   await renameFolder(project.drive_folder_id, project.title);
    // }

    // Get folder structure (using basic getOrCreateFolder)
    const companyDrive = await getOrCreateFolder(companyTitle);
    const projectsFolder = await getOrCreateFolder('Projects', companyDrive.id);
    
    // ✅ FIXED: Use basic getOrCreateFolder without extra parameters
    const projectFolder = await getOrCreateFolder(project.title, projectsFolder.id);

    console.log(`[Project] ✅ Project folder created: ${projectFolder.id}`);

    // ✅ ALREADY CORRECT: JSON response format
    return new Response(JSON.stringify({
      message: 'Project folder processed',
      folder: projectFolder
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Project] Error:', error);
    // ✅ FIXED: Return JSON error instead of plain text
    return new Response(JSON.stringify({
      error: 'Failed to process project folder',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}