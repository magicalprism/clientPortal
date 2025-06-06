import { fetchData } from './query';
export const logoBar = {
  id: 'logo_bar',
  title: 'Logo Bar or Image Link Grid',
  fields: ['headline', 'media_items'],
  query: fetchData,
  render: (data) => (
    <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
      {data.headline && (
        <div style={{ fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
          {data.headline}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {data.images?.length > 0
          ? data.images.map((img, i) => (
              <a key={i} href={img.link || '#'} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.url}
                  alt={img.alt || `Logo ${i + 1}`}
                  style={{ width: 80, height: 40, objectFit: 'contain', borderRadius: 4 }}
                />
              </a>
            ))
          : [1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: 80, height: 40, background: '#ccc', borderRadius: 4 }} />
            ))}
      </div>
    </div>
  )
};
