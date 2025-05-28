import { getOrCreateFolder } from '@/app/api/lib/driveUtils';

export async function handleElementFolder(element) {
  console.log('[Element] Received payload:', JSON.stringify(element, null, 2));
  
  const { create_folder, title: elementTitle } = element;

  if (!create_folder || !elementTitle) {
    console.log('[Element] Skipped: Missing create_folder or title');
    return new Response('No action taken', { status: 204 });
  }

  // ✅ FIXED: Get company and project titles from the correct fields
  const companyTitle = element?.company_id_details?.title || 
                      element?.companyTitle;
  
  const projectTitle = element?.project_id_details?.title || 
                      element?.projectTitle;

  console.log('[Element] Extracted titles:', {
    companyTitle,
    projectTitle,
    elementTitle,
    company_id_details: element?.company_id_details,
    project_id_details: element?.project_id_details
  });

  if (!companyTitle || !projectTitle) {
    return new Response(JSON.stringify({
      error: 'Missing company or project title',
      received: { 
        companyTitle, 
        projectTitle,
        company_id_details: element?.company_id_details,
        project_id_details: element?.project_id_details
      }
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`[Element] Creating page element folder for: ${companyTitle} / ${projectTitle} / pages / ${elementTitle}`);

    // Get folder structure
    const companyDrive = await getOrCreateFolder(companyTitle);
    console.log('[Element] Company folder:', companyDrive.id);
    
    const projectsFolder = await getOrCreateFolder('Projects', companyDrive.id);
    console.log('[Element] Projects folder:', projectsFolder.id);
    
    const projectFolder = await getOrCreateFolder(projectTitle, projectsFolder.id);
    console.log('[Element] Project folder:', projectFolder.id);
    
    const pagesFolder = await getOrCreateFolder('pages', projectFolder.id);
    console.log('[Element] Pages folder:', pagesFolder.id);
    
    // Main element folder
    const elementFolder = await getOrCreateFolder(elementTitle, pagesFolder.id);
    console.log('[Element] Element folder:', elementFolder.id);

    // Create subfolders
    const copyDraftsFolder = await getOrCreateFolder(`Copy Drafts | ${elementTitle}`, elementFolder.id);
    const finalDeliverablesFolder = await getOrCreateFolder(`Final Deliverables | ${elementTitle}`, elementFolder.id);
    
    console.log('[Element] Subfolders created:', {
      copyDrafts: copyDraftsFolder.id,
      finalDeliverables: finalDeliverablesFolder.id
    });

    console.log(`[Element] ✅ Element folder structure created for: ${elementTitle}`);

    return new Response(JSON.stringify({
      message: 'Element folder structure created',
      folders: {
        main: elementFolder,
        copyDrafts: copyDraftsFolder,
        finalDeliverables: finalDeliverablesFolder
      },
      structure: `${companyTitle}/Projects/${projectTitle}/pages/${elementTitle}/`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Element] ❌ Error creating element folders:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process element folders',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}