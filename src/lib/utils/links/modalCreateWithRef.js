import { useSearchParams } from 'next/navigation';

export function modalCreateLink({ type, fields = {} }) {
  if (!type) {
    console.warn('modalCreateLink called with missing "type"');
    return '?modal=create';
  }

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  // Set modal params
  params.set('modal', 'create');
  params.set('type', type);

  // Add all provided fields
  Object.entries(fields).forEach(([key, value]) => {
    params.set(key, value);
  });

  return `${url.pathname}?${params.toString()}`;
}
