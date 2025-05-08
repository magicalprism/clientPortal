export function modalCreateWithRef({ refField, id, fields = {} }) {
  const base = `?modal=create&refField=${refField}&id=${id}`;
  const fieldParams = Object.entries(fields)
    .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
    .join('');
  return base + fieldParams;
}
