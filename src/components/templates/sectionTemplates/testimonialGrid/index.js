import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const testimonialGrid = {
  id: 'testimonial_grid',
  title: 'Testimonial Grid',
  fields: ['headline', 'subheadline', 'testimonials'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const testimonials = data.testimonials || [];

    if (editable) {
      // Helper function to update a specific testimonial
      const updateTestimonial = (index, field, value) => {
        const updatedTestimonials = [...testimonials];
        if (!updatedTestimonials[index]) {
          updatedTestimonials[index] = { name: '', text: '', avatar: null };
        }
        updatedTestimonials[index][field] = value;
        return updatedTestimonials;
      };

      // Helper function to add a new testimonial
      const addTestimonial = () => {
        const updatedTestimonials = [...testimonials, { 
          name: 'Customer Name', 
          text: 'Add your testimonial text here...', 
          avatar: null 
        }];
        onFieldSave?.('testimonials', updatedTestimonials);
      };

      // Helper function to remove a testimonial
      const removeTestimonial = (index) => {
        const updatedTestimonials = testimonials.filter((_, i) => i !== index);
        onFieldSave?.('testimonials', updatedTestimonials);
      };

      return (
        <div style={{ padding: '1rem', border: '1px dashed #aaa', position: 'relative' }}>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h5"
              placeholder="Enter testimonials headline"
              sx={{ mb: 1, fontWeight: 600 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="subtitle1"
              placeholder="Supporting text for testimonials"
              sx={{ color: '#666' }}
            />
          </div>

          {/* Testimonials Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Render existing testimonials or default placeholders */}
            {(testimonials.length > 0 ? testimonials : Array(3).fill(null).map((_, i) => ({ 
              name: '', 
              text: '', 
              avatar: null 
            }))).map((testimonial, i) => (
              <div 
                key={i} 
                style={{ 
                  border: '1px solid #e0e0e0', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  background: '#fafafa',
                  position: 'relative'
                }}
              >
                {/* Remove button for existing testimonials */}
                {testimonials.length > 0 && i < testimonials.length && (
                  <button
                    onClick={() => removeTestimonial(i)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                  >
                    ×
                  </button>
                )}

                {/* Testimonial Text */}
                <div style={{ marginBottom: '1rem' }}>
                  <InlineEditableField
                    value={testimonial.text}
                    onChange={(value) => onFieldChange?.('testimonials', updateTestimonial(i, 'text', value))}
                    onSave={(value) => onFieldSave?.('testimonials', updateTestimonial(i, 'text', value))}
                    variant="body2"
                    placeholder="Enter testimonial text..."
                    multiline
                    sx={{ fontStyle: 'italic', lineHeight: 1.6 }}
                  />
                </div>

                {/* Customer Name */}
                <div style={{ 
                  borderTop: '1px solid #e0e0e0', 
                  paddingTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {/* Avatar placeholder */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#666',
                    flexShrink: 0
                  }}>
                    {testimonial.name ? testimonial.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  <InlineEditableField
                    value={testimonial.name}
                    onChange={(value) => onFieldChange?.('testimonials', updateTestimonial(i, 'name', value))}
                    onSave={(value) => onFieldSave?.('testimonials', updateTestimonial(i, 'name', value))}
                    variant="caption"
                    placeholder="Customer name"
                    sx={{ fontWeight: 600, flex: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Testimonial Button */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={addTestimonial}
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
              + Add Testimonial
            </button>
            
            <button
              onClick={() => {
                const count = parseInt(prompt('How many testimonial placeholders? (1-6)', '3') || '3');
                if (count && count > 0 && count <= 6) {
                  const placeholders = Array(count).fill(null).map((_, i) => ({
                    name: '',
                    text: '',
                    avatar: null
                  }));
                  onFieldSave?.('testimonials', placeholders);
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

          {/* Testimonials Tip */}
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
              💬 <strong>Testimonials Tips:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Keep testimonials concise and impactful</li>
                <li>Include full name and title/company for credibility</li>
                <li>Use specific results and benefits when possible</li>
                <li>3-6 testimonials work best for most layouts</li>
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
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {data.headline}
            </div>
            {data.subheadline && (
              <div style={{ color: '#666', fontSize: '1rem' }}>
                {data.subheadline}
              </div>
            )}
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {testimonials.length > 0
            ? testimonials.map((testimonial, i) => (
                <div 
                  key={i} 
                  style={{ 
                    border: '1px solid #e0e0e0', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    background: '#fafafa'
                  }}
                >
                  <div style={{ 
                    fontStyle: 'italic', 
                    marginBottom: '1rem',
                    lineHeight: 1.6
                  }}>
                    "{testimonial.text || 'Great testimonial text goes here.'}"
                  </div>
                  <div style={{ 
                    borderTop: '1px solid #e0e0e0', 
                    paddingTop: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    {testimonial.name || `Customer ${i + 1}`}
                  </div>
                </div>
              ))
            : [1, 2, 3].map(i => (
                <div 
                  key={i} 
                  style={{ 
                    border: '1px solid #e0e0e0', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    background: '#f5f5f5'
                  }}
                >
                  <div style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
                    "Testimonial {i} text goes here..."
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Customer {i}
                  </div>
                </div>
              ))}
        </div>
      </div>
    );
  }
};