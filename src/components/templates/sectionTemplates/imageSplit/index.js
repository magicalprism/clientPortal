import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const imageSplit = {
  id: 'image_split',
  title: 'Image + Text Split (Left or Right)',
  fields: ['headline', 'body_text', 'button_text', 'button_url', 'media_items', 'layout_variant'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const isLeft = data.layout_variant !== 'right';

    if (editable) {
      return (
        <div style={{ border: '1px dashed #aaa', padding: '1rem', position: 'relative' }}>
          {/* Layout Controls */}
          <div style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            background: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            padding: '4px',
            fontSize: '12px'
          }}>
            <label style={{ marginRight: '8px' }}>Split Layout:</label>
            <select
              value={data.layout_variant || 'left'}
              onChange={(e) => {
                onFieldChange?.('layout_variant', e.target.value);
                onFieldSave?.('layout_variant', e.target.value);
              }}
              style={{ fontSize: '12px', padding: '2px' }}
            >
              <option value="left">Image Left</option>
              <option value="right">Image Right</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: isLeft ? 'row' : 'row-reverse',
              gap: '1rem',
              alignItems: 'flex-start',
              marginTop: '24px'
            }}
          >
            {/* Image Section */}
            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
              {data.image_url ? (
                <div style={{ position: 'relative' }}>
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
                      top: '4px',
                      right: '4px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer'
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
                    fontSize: '10px',
                    color: '#666',
                    textAlign: 'center',
                    padding: '4px'
                  }}
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) {
                      onFieldChange?.('image_url', url);
                      onFieldSave?.('image_url', url);
                    }
                  }}
                >
                  <div>🖼️</div>
                  <div>Click to split with image</div>
                </div>
              )}
              
              {/* Image URL field */}
              <div style={{ marginTop: '8px' }}>
                <InlineEditableField
                  value={data.image_url || ''}
                  onChange={(value) => onFieldChange?.('image_url', value)}
                  onSave={(value) => onFieldSave?.('image_url', value)}
                  variant="caption"
                  placeholder="Image URL"
                  sx={{ fontSize: '10px', width: '100%' }}
                />
              </div>
            </div>

            {/* Content Section */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <InlineEditableField
                value={data.headline}
                onChange={(value) => onFieldChange?.('headline', value)}
                onSave={(value) => onFieldSave?.('headline', value)}
                variant="h6"
                placeholder="Enter split headline"
                sx={{ fontWeight: 600, mb: 1 }}
              />
              
              <InlineEditableField
                value={data.body_text}
                onChange={(value) => onFieldChange?.('body_text', value)}
                onSave={(value) => onFieldSave?.('body_text', value)}
                variant="body2"
                placeholder="Descriptive content for this split section..."
                multiline
                sx={{ mb: 2 }}
              />

              {/* Button Section */}
              {(data.button_text || editable) && (
                <div>
                  <div
                    style={{
                      marginTop: 8,
                      padding: '0.25rem 0.5rem',
                      background: '#eee',
                      display: 'inline-block',
                      borderRadius: '4px',
                      minWidth: '80px'
                    }}
                  >
                    <InlineEditableField
                      value={data.button_text}
                      onChange={(value) => onFieldChange?.('button_text', value)}
                      onSave={(value) => onFieldSave?.('button_text', value)}
                      variant="body2"
                      placeholder="Button text"
                      component="span"
                    />
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <InlineEditableField
                      value={data.button_url}
                      onChange={(value) => onFieldChange?.('button_url', value)}
                      onSave={(value) => onFieldSave?.('button_url', value)}
                      variant="caption"
                      placeholder="Button URL (https://...)"
                      sx={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}
                    />
                  </div>
                </div>
              )}

              {/* Add Button Option */}
              {!data.button_text && editable && (
                <button
                  onClick={() => {
                    onFieldChange?.('button_text', 'Learn More');
                    onFieldSave?.('button_text', 'Learn More');
                  }}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  + Add Action Button
                </button>
              )}
            </div>
          </div>

          {/* Split Layout Tip */}
          {editable && (
            <div style={{
              marginTop: '16px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#666',
              border: '1px solid #e9ecef'
            }}>
              📐 <strong>Split Layout:</strong> Perfect for breaking up content with visual elements. Try switching between left/right layouts to see what works best!
            </div>
          )}
        </div>
      );
    }

    // Regular non-editable render
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