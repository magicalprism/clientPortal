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

  if (!project?.id) {
    console.error('[Project] Missing project ID');
    return new Response(JSON.stringify({
      error: 'Missing project ID'
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const companyTitle = project?.company_id?.title || 
                      project?.company_id_details?.title ||
                      project?.companyTitle;

  if (!companyTitle) {
    console.error('[Project] Missing company title');
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
    console.log(`[Project] Processing project folder for: ${companyTitle} / ${project.title} (ID: ${project.id})`);

    // Get folder structure (using basic getOrCreateFolder)
    const companyDrive = await getOrCreateFolder(companyTitle);
    const projectsFolder = await getOrCreateFolder('Projects', companyDrive.id);
    
    // ✅ FIXED: Create project folder WITH record tracking
    const projectFolder = await getOrCreateFolder(
      project.title, 
      projectsFolder.id,
      project.id,     // Record ID for database saving
      'project'       // Record type for database saving
    );

    console.log(`[Project] ✅ Project folder created: ${projectFolder.id}`);

    return new Response(JSON.stringify({
      message: 'Project folder processed',
      folder: {
        id: projectFolder.id,
        name: projectFolder.name,
        url: `https://drive.google.com/drive/folders/${projectFolder.id}`
      },
      folders: {
        main: {
          id: projectFolder.id,
          name: projectFolder.name
        }
      },
      structure: `${companyTitle}/Projects/${project.title}/`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Project] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process project folder',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}