import { getOrCreateFolder } from '@/app/api/lib/driveUtils';

/**
 * Handles folder creation for a Project row when create_folder is set to true.
 *
 * @param {Object} project - Supabase row object for the project.
 * @returns {Response}
 */
export async function handleProjectFolder(project) {
  if (!project?.create_folder || !project?.title || !project?.company_id?.title) {
    console.log('[Project] Skipped: Missing create_folder, project.title, or company_id.title');
    return new Response('No action taken', { status: 204 });
  }

  try {
    const companyTitle = project.company_id.title;
    const projectTitle = project.title;

    console.log(`[Project] Processing project folder for: ${companyTitle} / ${projectTitle}`);

    // Get or create the base folder structure: company > Projects > project
    const companyDrive = await getOrCreateFolder(companyTitle);
    const projectsFolder = await getOrCreateFolder('Projects', companyDrive.id);
    const projectFolder = await getOrCreateFolder(projectTitle, projectsFolder.id);

    // Here you can add Supabase save logic if desired
    // e.g., await saveProjectFolderId(project.id, projectFolder.id)

    return new Response('Project folder processed', { status: 200 });
  } catch (error) {
    console.error('[Project] Error:', error);
    return new Response('Failed to process project folder', { status: 500 });
  }
}
