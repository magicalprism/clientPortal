/**
 * Extracts links from email body text.
 * Returns array of objects with guessed domain for company association
 * @param {string} body - The email text body
 * @returns {{ url: string, guessed_company_domain?: string }[]}
 */
export function extractLinksFromEmailBody(body) {
  if (!body || typeof body !== 'string') return [];

  const urlRegex = /https?:\/\/[\w\-\.]+\.[a-z]{2,}(?:\/[^\s]*)?/gi;
  const matches = body.match(urlRegex);

  if (!matches) return [];

  return [...new Set(matches)].map((rawUrl) => {
    const url = rawUrl.replace(/[.,)\]]+$/, ''); // trim trailing punctuation
    return { url };
  });
}
