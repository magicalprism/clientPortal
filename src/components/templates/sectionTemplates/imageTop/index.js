import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const imageTop = {
  id: 'image_top',
  title: 'Image Above Text',
  fields: ['media_items', 'headline', 'subheadline', 'body_text'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;

    if (editable) {
      return (
        <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #aaa', position: 'relative' }}>
          {/* Image Section */}
          <div style={{ width: '100%', height: 150, marginBottom: 12, position: 'relative' }}>
            {data.image_url ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={data.image_url}
                  alt={data.headline || 'Image'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                />
                <button
                  onClick={() => {
                    onFieldChange?.('image_url', '');
                    onFieldSave?.('image_url', '');
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: '#f0f0f0', 
                  borderRadius: 4,
                  border: '2px dashed #ccc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  gap: '8px'
                }}
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) {
                    onFieldChange?.('image_url', url);
                    onFieldSave?.('image_url', url);
                  }
                }}
              >
                <div style={{ fontSize: '24px' }}>🖼️</div>
                <div>Click to add hero image</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Best size: 800x150px</div>
              </div>
            )}
          </div>

          {/* Image URL Field */}
          <div style={{ marginBottom: '16px' }}>
            <InlineEditableField
              value={data.image_url || ''}
              onChange={(value) => onFieldChange?.('image_url', value)}
              onSave={(value) => onFieldSave?.('image_url', value)}
              variant="caption"
              placeholder="Image URL (https://...)"
              sx={{ fontSize: '11px', color: '#666', fontStyle: 'italic', width: '100%' }}
            />
          </div>

          {/* Content Section */}
          <div>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h5"
              placeholder="Enter main headline"
              sx={{ fontWeight: 600, mb: 1 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="subtitle1"
              placeholder="Enter supporting subheadline"
              sx={{ fontSize: 14, color: '#666', mb: 1 }}
            />
            
            <InlineEditableField
              value={data.body_text}
              onChange={(value) => onFieldChange?.('body_text', value)}
              onSave={(value) => onFieldSave?.('body_text', value)}
              variant="body2"
              placeholder="Descriptive text goes here..."
              multiline
              sx={{ mt: 1 }}
            />
          </div>

          {/* Hero Layout Tip */}
          {editable && (
            <div style={{
              marginTop: '16px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#666',
              border: '1px solid #e9ecef',
              textAlign: 'left'
            }}>
              🎯 <strong>Hero Layout:</strong> Perfect for introductory sections! The top image creates visual impact while the centered text hierarchy guides readers through your message.
            </div>
          )}
        </div>
      );
    }

    // Regular non-editable render
    return (
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
    );
  }
};