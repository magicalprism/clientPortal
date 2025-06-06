import { fetchData } from './query';
export const featureGrid = {
  id: 'feature_grid',
  title: 'Feature Grid',
  fields: ['headline', 'subheadline', 'features'],
  query: fetchData,
  render: (data) => {
    const features = data.features || [];

    return (
      <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
        <div style={{ fontWeight: 600 }}>{data.headline || 'Section Title'}</div>
        <div style={{ color: '#666' }}>{data.subheadline || 'Supporting text'}</div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: 12 }}>
          {features.length > 0
            ? features.map((f, i) => (
                <div key={i} style={{ flex: 1, background: '#eee', padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{f.title || `Feature ${i + 1}`}</div>
                  <div style={{ fontSize: 12 }}>{f.description || 'Brief description'}</div>
                </div>
              ))
            : [1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, background: '#eee', padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>Feature {i}</div>
                  <div style={{ fontSize: 12 }}>Brief description</div>
                </div>
              ))}
        </div>
      </div>
    );
  }
};
