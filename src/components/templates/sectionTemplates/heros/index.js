import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

// 1. HERO BANNER - Full width hero with background
export const heroBanner = {
  id: 'hero_banner',
  title: 'Hero Banner (Full Width)',
  category: 'Hero Sections',
  fields: ['eyebrow', 'headline', 'subheadline', 'button_text', 'button_url', 'background_image'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;

    if (editable) {
      return (
        <div style={{ 
          position: 'relative',
          minHeight: '400px',
          padding: '4rem 2rem',
          border: '1px dashed #aaa',
          background: data.background_image ? `url(${data.background_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center'
        }}>
          {/* Background overlay for better text readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1
          }} />
          
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
            {/* Background Image URL Field */}
            <div style={{ marginBottom: '2rem' }}>
              <InlineEditableField
                value={data.background_image || ''}
                onChange={(value) => onFieldChange?.('background_image', value)}
                onSave={(value) => onFieldSave?.('background_image', value)}
                variant="caption"
                placeholder="Background image URL"
                sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}
              />
            </div>

            <InlineEditableField
              value={data.eyebrow}
              onChange={(value) => onFieldChange?.('eyebrow', value)}
              onSave={(value) => onFieldSave?.('eyebrow', value)}
              variant="subtitle2"
              placeholder="EYEBROW TEXT"
              sx={{ letterSpacing: 2, textTransform: 'uppercase', mb: 1, color: 'rgba(255,255,255,0.9)' }}
            />

            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h2"
              placeholder="Your Powerful Hero Headline"
              sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
            />

            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="h6"
              placeholder="Supporting text that explains the value proposition"
              multiline
              sx={{ fontWeight: 400, mb: 3, maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}
            />

            {(data.button_text || editable) && (
              <div>
                <div style={{
                  display: 'inline-block',
                  background: '#ff6b35',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}>
                  <InlineEditableField
                    value={data.button_text}
                    onChange={(value) => onFieldChange?.('button_text', value)}
                    onSave={(value) => onFieldSave?.('button_text', value)}
                    variant="body1"
                    placeholder="Get Started Now"
                    component="span"
                    sx={{ color: 'white' }}
                  />
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <InlineEditableField
                    value={data.button_url}
                    onChange={(value) => onFieldChange?.('button_url', value)}
                    onSave={(value) => onFieldSave?.('button_url', value)}
                    variant="caption"
                    placeholder="Button URL"
                    sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ 
        position: 'relative',
        minHeight: '400px',
        padding: '4rem 2rem',
        border: '1px dashed #aaa',
        background: data.background_image ? `url(${data.background_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
          {data.eyebrow && (
            <div style={{ letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {data.eyebrow}
            </div>
          )}
          
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            {data.headline || 'Your Powerful Hero Headline'}
          </h1>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            {data.subheadline || 'Supporting text that explains the value proposition'}
          </h2>
          
          {data.button_text && (
            <div style={{
              display: 'inline-block',
              background: '#ff6b35',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600
            }}>
              {data.button_text}
            </div>
          )}
        </div>
      </div>
    );
  }
};

// 2. HERO SPLIT - Two column hero with image
export const heroSplit = {
  id: 'hero_split',
  title: 'Hero Split (Text + Image)',
  category: 'Hero Sections',
  fields: ['headline', 'subheadline', 'button_text', 'button_url', 'image_url', 'layout_variant'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const isImageRight = data.layout_variant === 'right';

    if (editable) {
      return (
        <div style={{ padding: '2rem', border: '1px dashed #aaa', position: 'relative' }}>
          {/* Layout Control */}
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
            <label>Layout:</label>
            <select
              value={data.layout_variant || 'left'}
              onChange={(e) => {
                onFieldChange?.('layout_variant', e.target.value);
                onFieldSave?.('layout_variant', e.target.value);
              }}
              style={{ fontSize: '12px', marginLeft: '4px' }}
            >
              <option value="left">Image Left</option>
              <option value="right">Image Right</option>
            </select>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'center',
            marginTop: '24px'
          }}>
            {/* Content Side */}
            <div style={{ order: isImageRight ? 1 : 2 }}>
              <InlineEditableField
                value={data.headline}
                onChange={(value) => onFieldChange?.('headline', value)}
                onSave={(value) => onFieldSave?.('headline', value)}
                variant="h3"
                placeholder="Transform Your Business Today"
                sx={{ fontWeight: 700, mb: 2 }}
              />

              <InlineEditableField
                value={data.subheadline}
                onChange={(value) => onFieldChange?.('subheadline', value)}
                onSave={(value) => onFieldSave?.('subheadline', value)}
                variant="body1"
                placeholder="Detailed explanation of your value proposition and how it benefits your customers"
                multiline
                sx={{ mb: 3, lineHeight: 1.6, color: '#666' }}
              />

              {(data.button_text || editable) && (
                <div>
                  <div style={{
                    display: 'inline-block',
                    background: '#007bff',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    <InlineEditableField
                      value={data.button_text}
                      onChange={(value) => onFieldChange?.('button_text', value)}
                      onSave={(value) => onFieldSave?.('button_text', value)}
                      variant="body2"
                      placeholder="Get Started"
                      component="span"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Side */}
            <div style={{ order: isImageRight ? 2 : 1 }}>
              {data.image_url ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={data.image_url}
                    alt={data.headline || 'Hero Image'}
                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }}
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
                    height: '300px', 
                    background: '#f0f0f0', 
                    borderRadius: '12px',
                    border: '2px dashed #ccc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const url = prompt('Enter hero image URL:');
                    if (url) {
                      onFieldChange?.('image_url', url);
                      onFieldSave?.('image_url', url);
                    }
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🖼️</div>
                  <div>Click to add hero image</div>
                </div>
              )}

              <div style={{ marginTop: '8px' }}>
                <InlineEditableField
                  value={data.image_url || ''}
                  onChange={(value) => onFieldChange?.('image_url', value)}
                  onSave={(value) => onFieldSave?.('image_url', value)}
                  variant="caption"
                  placeholder="Hero image URL"
                  sx={{ fontSize: '11px', color: '#666' }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ padding: '2rem', border: '1px dashed #aaa' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'center'
        }}>
          <div style={{ order: isImageRight ? 1 : 2 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
              {data.headline || 'Transform Your Business Today'}
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#666', marginBottom: '2rem' }}>
              {data.subheadline || 'Detailed explanation of your value proposition'}
            </p>
            {data.button_text && (
              <div style={{
                display: 'inline-block',
                background: '#007bff',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                {data.button_text}
              </div>
            )}
          </div>

          <div style={{ order: isImageRight ? 2 : 1 }}>
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={data.headline || 'Hero Image'}
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '300px', 
                background: '#f0f0f0', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                Hero Image Placeholder
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

// 3. HERO MINIMAL - Clean, minimal hero
export const heroMinimal = {
  id: 'hero_minimal',
  title: 'Hero Minimal (Clean)',
  category: 'Hero Sections',
  fields: ['headline', 'subheadline', 'button_text', 'button_url'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;

    if (editable) {
      return (
        <div style={{ 
          padding: '6rem 2rem',
          border: '1px dashed #aaa',
          textAlign: 'center',
          background: '#fafafa'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h2"
              placeholder="Simple. Powerful. Effective."
              sx={{ fontWeight: 300, mb: 3, fontSize: '3rem' }}
            />

            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="h6"
              placeholder="A clean, minimal approach to showcasing your core message"
              sx={{ fontWeight: 400, mb: 4, color: '#666', lineHeight: 1.6 }}
            />

            {(data.button_text || editable) && (
              <div style={{
                border: '2px solid #333',
                display: 'inline-block',
                padding: '12px 32px',
                borderRadius: '0',
                background: 'transparent'
              }}>
                <InlineEditableField
                  value={data.button_text}
                  onChange={(value) => onFieldChange?.('button_text', value)}
                  onSave={(value) => onFieldSave?.('button_text', value)}
                  variant="body2"
                  placeholder="Learn More"
                  component="span"
                  sx={{ color: '#333', fontWeight: 500, letterSpacing: 1 }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ 
        padding: '6rem 2rem',
        border: '1px dashed #aaa',
        textAlign: 'center',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 300, marginBottom: '2rem' }}>
            {data.headline || 'Simple. Powerful. Effective.'}
          </h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, color: '#666', marginBottom: '3rem', lineHeight: 1.6 }}>
            {data.subheadline || 'A clean, minimal approach to showcasing your core message'}
          </h2>
          {data.button_text && (
            <div style={{
              border: '2px solid #333',
              display: 'inline-block',
              padding: '12px 32px',
              color: '#333',
              fontWeight: 500,
              letterSpacing: 1
            }}>
              {data.button_text}
            </div>
          )}
        </div>
      </div>
    );
  }
};