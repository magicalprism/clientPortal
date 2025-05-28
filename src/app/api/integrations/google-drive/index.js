import { handleCompanyDrive } from './company';
import { handleProjectFolder } from './project';
import { handleElementFolder } from './element';

/**
 * Entrypoint to route Google Drive-related events.
 * @param {Object} body - Event payload with { type, payload }
 * @returns {Response}
 */
export async function handleGoogleDriveEvent(body) {
  const { type, payload } = body;

  if (!type || !payload) {
    return new Response('Missing type or payload', { status: 400 });
  }

  switch (type) {
    case 'company':
      return handleCompanyDrive(payload);
    case 'project':
      return handleProjectFolder(payload);
    case 'element':
      return handleElementFolder(payload);
    default:
      return new Response(`Unknown drive type: ${type}`, { status: 400 });
  }
}
