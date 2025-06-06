import { fetchData } from './query';
export const imageBlock = {
  id: 'image_block',
  title: 'Image + Text Block (Left/Right)',
  fields: ['headline', 'body_text', 'button_text', 'button_url', 'media_items', 'layout_variant'],
   query: fetchData,
  render: (data) => {
    const isLeft = data.layout_variant !== 'right'; // default to left if undefined

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: isLeft ? 'row' : 'row-reverse',
          gap: '1rem',
          alignItems: 'center',
          border: '1px dashed #aaa',
          padding: '1rem'
        }}
      >
        <div style={{ width: 120, height: 120 }}>
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
        <div>
          <div style={{ fontWeight: 600 }}>{data.headline || 'Headline'}</div>
          <div>{data.body_text || 'Descriptive content goes here...'}</div>
          {data.button_text && (
            <div
              style={{
                marginTop: 8,
                padding: '0.25rem 0.5rem',
                background: '#eee',
                display: 'inline-block'
              }}
            >
              {data.button_text}
            </div>
          )}
        </div>
      </div>
    );
  }
};
