// /app/api/email/route.js
import { extractLinksFromEmailBody } from './utils/parser';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    console.log('[EMAIL API] Incoming request:', { type, payload });

    if (type !== 'gmail') {
      return new Response(JSON.stringify({ error: 'Unsupported email type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { from, subject, body, received_at } = payload;
    if (!from || !body) {
      return new Response(JSON.stringify({ error: 'Missing from or body in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawLinks = extractLinksFromEmailBody(body);
    if (!rawLinks.length) {
      return new Response(JSON.stringify({ message: 'No links found in email body' }), {
        status: 204
      });
    }

    const domain = from.split('@')[1];
    const supabase = await createClient();

    let guessedCompanyId = null;
    const { data: companyMatch } = await supabase
      .from('company')
      .select('id, title, domain')
      .ilike('domain', `%${domain}%`)
      .single();

    if (companyMatch) {
      guessedCompanyId = companyMatch.id;
      console.log(`[EMAIL API] Matched company: ${companyMatch.title}`);
    }

    const inserts = rawLinks.map(link => ({
      url: link.url,
      source_email: from,
      title: subject || 'Untitled',
      received_at: received_at || new Date().toISOString(),
      source_type: 'email_link',
      status: 'unsorted',
      ...(guessedCompanyId ? { company_id: guessedCompanyId } : {})
    }));

    const { data: inserted, error } = await supabase.from('media').insert(inserts).select('id');
    if (error) {
      console.error('[EMAIL API] Error inserting media:', error);
      return new Response(JSON.stringify({ error: 'Failed to insert media', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If matched, insert pivot row(s)
    if (guessedCompanyId && inserted?.length) {
      const pivots = inserted.map(row => ({
        media_id: row.id,
        company_id: guessedCompanyId
      }));
      await supabase.from('company_media').insert(pivots);
    }

    return new Response(JSON.stringify({ message: 'Media items added', count: inserted.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[EMAIL API] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ready', endpoint: '/api/email' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}