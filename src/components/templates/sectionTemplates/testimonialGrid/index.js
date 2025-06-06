import { fetchData } from './query';
export const testimonialGrid = {
  id: 'testimonial_grid',
  title: 'Testimonial Grid',
  fields: ['headline', 'subheadline', 'testimonials'], // testimonials injected externally
  query: fetchData,
  render: (data) => {
    const testimonials = data.testimonials || [];

    return (
      <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
        <div style={{ fontWeight: 600, textAlign: 'center' }}>
          {data.headline || 'What People Are Saying'}
        </div>
        <div style={{ color: '#666', textAlign: 'center' }}>
          {data.subheadline || 'Client reviews and testimonials'}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: 16 }}>
          {testimonials.length > 0
            ? testimonials.map((t, i) => (
                <div key={i} style={{ flex: 1, background: '#f4f4f4', padding: '1rem', borderRadius: 4 }}>
                  <div style={{ fontStyle: 'italic', marginBottom: 8 }}>"{t.quote}"</div>
                  <div style={{ fontWeight: 500 }}>
                    – {t.title || 'Name'}{t.role && `, ${t.role}`}{t.company && ` (${t.company})`}
                  </div>
                  {t.rating && (
                    <div style={{ fontSize: 12, marginTop: 4, color: '#999' }}>
                      ⭐ {t.rating}/5
                    </div>
                  )}
                  {t.video_url && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      🎥 <a href={t.video_url} target="_blank" rel="noreferrer">Watch Video</a>
                    </div>
                  )}
                </div>
              ))
            : [1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, background: '#f4f4f4', padding: '1rem', borderRadius: 4 }}>
                  <div style={{ fontStyle: 'italic' }}>"Great experience working with this team."</div>
                  <div style={{ fontWeight: 500, marginTop: 8 }}>– Client {i}</div>
                </div>
              ))}
        </div>
      </div>
    );
  }
};
