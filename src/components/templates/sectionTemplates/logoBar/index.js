import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const logoBar = {
  id: 'logo_bar',
  title: 'Logo Bar or Image Link Grid',
  fields: ['headline', 'media_items'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    // Use images from data.images or data.media_items, fallback to empty array
    const logos = data.images || data.media_items || [];

    if (editable) {
      // Helper function to update a specific logo
      const updateLogo = (index, field, value) => {
        const updatedLogos = [...logos];
        if (!updatedLogos[index]) {
          updatedLogos[index] = { url: '', link: '', alt: '' };
        }
        updatedLogos[index][field] = value;
        return updatedLogos;
      };

      // Helper function to add a new logo
      const addLogo = () => {
        const updatedLogos = [...logos, { url: '', link: '', alt: 'New Logo' }];
        // Save to both possible field names for compatibility
        onFieldSave?.('images', updatedLogos);
        onFieldSave?.('media_items', updatedLogos);
      };

      // Helper function to remove a logo
      const removeLogo = (index) => {
        const updatedLogos = logos.filter((_, i) => i !== index);
        onFieldSave?.('images', updatedLogos);
        onFieldSave?.('media_items', updatedLogos);
      };

      return (
        <div style={{ padding: '1rem', border: '1px dashed #aaa', position: 'relative' }}>
          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h6"
              placeholder="Enter logo bar headline (optional)"
              sx={{ fontWeight: 600 }}
            />
          </div>

          {/* Logo Grid */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem', 
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            {/* Render existing logos or default placeholders */}
            {(logos.length > 0 ? logos : Array(5).fill(null).map((_, i) => ({ url: '', link: '', alt: `Logo ${i + 1}` }))).map((logo, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#fafafa',
                  position: 'relative',
                  minWidth: '120px'
                }}
              >
                {/* Remove button for existing logos */}
                {logos.length > 0 && i < logos.length && (
                  <button
                    onClick={() => removeLogo(i)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                  >
                    ×
                  </button>
                )}

                {/* Logo Image */}
                <div style={{ width: 80, height: 40, position: 'relative' }}>
                  {logo.url ? (
                    <img
                      src={logo.url}
                      alt={logo.alt || `Logo ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: '#e0e0e0', 
                        borderRadius: 4,
                        border: '1px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#666',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const url = prompt('Enter logo image URL:');
                        if (url) {
                          const updatedLogos = updateLogo(i, 'url', url);
                          onFieldSave?.('images', updatedLogos);
                          onFieldSave?.('media_items', updatedLogos);
                        }
                      }}
                    >
                      📷
                    </div>
                  )}
                </div>

                {/* Logo URL Field */}
                <InlineEditableField
                  value={logo.url || ''}
                  onChange={(value) => onFieldChange?.('images', updateLogo(i, 'url', value))}
                  onSave={(value) => {
                    const updatedLogos = updateLogo(i, 'url', value);
                    onFieldSave?.('images', updatedLogos);
                    onFieldSave?.('media_items', updatedLogos);
                  }}
                  variant="caption"
                  placeholder="Logo URL"
                  sx={{ fontSize: '9px', width: '100%', textAlign: 'center' }}
                />

                {/* Logo Link Field */}
                <InlineEditableField
                  value={logo.link || ''}
                  onChange={(value) => onFieldChange?.('images', updateLogo(i, 'link', value))}
                  onSave={(value) => {
                    const updatedLogos = updateLogo(i, 'link', value);
                    onFieldSave?.('images', updatedLogos);
                    onFieldSave?.('media_items', updatedLogos);
                  }}
                  variant="caption"
                  placeholder="Click URL (optional)"
                  sx={{ fontSize: '9px', width: '100%', textAlign: 'center', color: '#0066cc' }}
                />

                {/* Alt Text Field */}
                <InlineEditableField
                  value={logo.alt || ''}
                  onChange={(value) => onFieldChange?.('images', updateLogo(i, 'alt', value))}
                  onSave={(value) => {
                    const updatedLogos = updateLogo(i, 'alt', value);
                    onFieldSave?.('images', updatedLogos);
                    onFieldSave?.('media_items', updatedLogos);
                  }}
                  variant="caption"
                  placeholder="Alt text"
                  sx={{ fontSize: '8px', width: '100%', textAlign: 'center', color: '#666' }}
                />
              </div>
            ))}
          </div>

          {/* Add Logo Button */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={addLogo}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              + Add Logo
            </button>
            
            <button
              onClick={() => {
                const count = parseInt(prompt('How many placeholder logos? (1-10)', '5') || '5');
                if (count && count > 0 && count <= 10) {
                  const placeholders = Array(count).fill(null).map((_, i) => ({
                    url: '',
                    link: '',
                    alt: `Logo ${i + 1}`
                  }));
                  onFieldSave?.('images', placeholders);
                  onFieldSave?.('media_items', placeholders);
                }
              }}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Reset Grid
            </button>
          </div>

          {/* Logo Bar Tip */}
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
              🏢 <strong>Logo Bar Tips:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Use consistent logo sizes (80x40px works well)</li>
                <li>Add click URLs to make logos linkable</li>
                <li>Include alt text for accessibility</li>
                <li>Works great for partners, clients, or certifications</li>
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Regular non-editable render
    return (
      <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
        {data.headline && (
          <div style={{ fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
            {data.headline}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {logos.length > 0
            ? logos.map((img, i) => (
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
    );
  }
};