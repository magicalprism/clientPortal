import { fetchData } from './query';
export const imageTop = {
  id: 'image_top',
  title: 'Image Above Text',
  fields: ['media_items', 'headline', 'subheadline', 'body_text'],
  query: fetchData,
  render: (data) => (
    <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #aaa' }}>
      <div style={{ width: '100%', height: 150, marginBottom: 12 }}>
        {data.image_url ? (
          <img
            src={data.image_url}
            alt={data.headline || 'Image'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#ccc', borderRadius: 4 }} />
        )}
      </div>
      <div style={{ fontWeight: 600 }}>{data.headline || 'Headline'}</div>
      <div style={{ fontSize: 14, color: '#666' }}>{data.subheadline || 'Subheadline'}</div>
      <div style={{ marginTop: 8 }}>{data.body_text || 'Descriptive text goes here...'}</div>
    </div>
  )
};
