import { fetchData } from './query';
export const centeredCTA = {
  id: 'centered_cta',
  title: 'Centered Call-To-Action',
  fields: ['headline', 'body_text', 'button_text', 'button_url'],
  query: fetchData, // ✅ add this
  render: (data) => (
    <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #aaa' }}>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {data.headline || 'Ready to start?'}
      </div>
      <div style={{ marginTop: 8 }}>
        {data.body_text || 'Let’s get this going.'}
      </div>
      {data.button_text && (
        <div style={{
          marginTop: 16,
          background: '#ddd',
          padding: '0.5rem 1rem',
          display: 'inline-block',
          borderRadius: 4
        }}>
          {data.button_text}
        </div>
      )}
    </div>
  )
};
