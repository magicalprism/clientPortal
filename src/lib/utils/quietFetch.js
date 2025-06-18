/**
 * A wrapper around the fetch API that reduces console logging
 * by setting options that minimize browser-generated logs.
 * 
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise} - The fetch promise
 */
export const quietFetch = (url, options = {}) => {
  // Set keepalive to true to reduce some browser logging
  const quietOptions = {
    ...options,
    keepalive: true,
    // Add a cache option to reduce duplicate requests
    cache: options.cache || 'default',
    // Add credentials option to reduce CORS logs
    credentials: options.credentials || 'same-origin',
  };

  return fetch(url, quietOptions);
};

/**
 * Creates a Supabase client with reduced logging
 * 
 * @param {function} createClientFn - The original createClient function
 * @returns {function} - A wrapped createClient function
 */
export const createQuietSupabaseClient = (createClientFn) => {
  return (...args) => {
    const client = createClientFn(...args);
    
    // Override the fetch method used by Supabase
    const originalFetch = client.fetch;
    if (originalFetch) {
      client.fetch = (url, options) => {
        return quietFetch(url, options);
      };
    }
    
    return client;
  };
};