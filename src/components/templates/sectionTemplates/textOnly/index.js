import { fetchData } from './query';
export const textOnly = {
  id: 'text_only',
  title: 'Text Only',
  fields: ['eyebrow', 'headline', 'body_text'],
  query: fetchData,
  render: (data) => (
    <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
      {data.eyebrow && <div style={{ fontSize: 12, color: '#999' }}>{data.eyebrow}</div>}
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{data.headline || 'Headline'}</div>
      <div style={{ fontSize: 14, marginTop: 8 }}>{data.body_text || 'Body content here...'}</div>
    </div>
  )
};
