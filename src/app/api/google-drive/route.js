// Enhanced /app/api/google-drive/route.js
import { handleCompanyDrive } from '@/app/api/integrations/google-drive/company';
import { handleProjectFolder } from '@/app/api/integrations/google-drive/project';
import { handleElementFolder } from '@/app/api/integrations/google-drive/element';
import { createClient } from '@/lib/supabase/server';

/**
 * Enhanced API route that properly handles relationship data fetching
 */
export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    console.log('[API] Incoming Google Drive request:', { type, payload });

    if (!type || !payload) {
      return new Response(JSON.stringify({ 
        error: 'Missing type or payload' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enhance payload with relationship data if missing
    const enhancedPayload = await enhancePayloadWithRelationships(type, payload);
    console.log('[API] Enhanced payload prepared');

    switch (type) {
      case 'company':
        return handleCompanyDrive(enhancedPayload);
      case 'project':
        return handleProjectFolder(enhancedPayload);
      case 'element':
        return handleElementFolder(enhancedPayload);
      default:
        return new Response(JSON.stringify({ 
          error: `Unsupported type: ${type}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (err) {
    console.error('[API] Error handling Google Drive:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Enhances the payload with missing relationship data
 * This ensures handlers have all the data they need
 */
async function enhancePayloadWithRelationships(type, payload) {
  const supabase = await createClient();
  let enhanced = { ...payload };

  try {
    switch (type) {
      case 'project':
        // Ensure company details are available
        if (enhanced.company_id && !enhanced.company_id_details && !enhanced.companyTitle) {
          console.log('[API] Fetching company details for project');
          const { data: company, error } = await supabase
            .from('company')
            .select('id, title')
            .eq('id', enhanced.company_id)
            .single();

          if (!error && company) {
            enhanced.company_id_details = company;
            enhanced.companyTitle = company.title; // Fallback format
            console.log('[API] Company details added:', company.title);
          } else {
            console.warn('[API] Failed to fetch company details:', error);
          }
        }
        break;

      case 'element':
        // Ensure both company and project details are available
        if (enhanced.company_id && !enhanced.company_id_details && !enhanced.companyTitle) {
          console.log('[API] Fetching company details for element');
          const { data: company, error } = await supabase
            .from('company')
            .select('id, title')
            .eq('id', enhanced.company_id)
            .single();

          if (!error && company) {
            enhanced.company_id_details = company;
            enhanced.companyTitle = company.title;
            console.log('[API] Company details added:', company.title);
          }
        }

        if (enhanced.project_id && !enhanced.project_id_details && !enhanced.projectTitle) {
          console.log('[API] Fetching project details for element');
          const { data: project, error } = await supabase
            .from('project')
            .select('id, title')
            .eq('id', enhanced.project_id)
            .single();

          if (!error && project) {
            enhanced.project_id_details = project;
            enhanced.projectTitle = project.title;
            console.log('[API] Project details added:', project.title);
          }
        }
        break;

      case 'company':
        // Company doesn't need additional relationship data
        break;

      default:
        console.warn('[API] Unknown type for relationship enhancement:', type);
    }

    return enhanced;

  } catch (error) {
    console.error('[API] Error enhancing payload with relationships:', error);
    // Return original payload if enhancement fails
    return payload;
  }
}

/**
 * Health check endpoint for Google Drive integration
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      // Basic health check
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        supportedTypes: ['company', 'project', 'element'],
        version: '1.0.0'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'validate') {
      // Validate Google Drive configuration
      const hasApiKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
      const hasDriveId = !!process.env.CLIENTS_DRIVE_ID;

      return new Response(JSON.stringify({
        configured: hasApiKey && hasPrivateKey && hasDriveId,
        checks: {
          serviceAccountEmail: hasApiKey,
          privateKey: hasPrivateKey,
          clientsDriveId: hasDriveId
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action parameter' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[API] Error in GET handler:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}