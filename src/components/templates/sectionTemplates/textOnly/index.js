import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const textOnly = {
  id: 'text_only',
  title: 'Text Only Section',
  fields: ['headline', 'subheadline', 'body_text'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;

    if (editable) {
      return (
        <div style={{ padding: '1rem', border: '1px dashed #aaa', position: 'relative' }}>
          <InlineEditableField
            value={data.headline}
            onChange={(value) => onFieldChange?.('headline', value)}
            onSave={(value) => onFieldSave?.('headline', value)}
            variant="h4"
            placeholder="Enter main headline"
            sx={{ mb: 2, fontWeight: 600 }}
          />
          
          <InlineEditableField
            value={data.subheadline}
            onChange={(value) => onFieldChange?.('subheadline', value)}
            onSave={(value) => onFieldSave?.('subheadline', value)}
            variant="h6"
            placeholder="Enter subheadline (optional)"
            sx={{ mb: 2, color: '#666', fontWeight: 400 }}
          />
          
          <InlineEditableField
            value={data.body_text}
            onChange={(value) => onFieldChange?.('body_text', value)}
            onSave={(value) => onFieldSave?.('body_text', value)}
            variant="body1"
            placeholder="Enter your main content text here..."
            multiline
            sx={{ lineHeight: 1.6 }}
          />

          {/* Text Only Tip */}
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
              📝 <strong>Text Only:</strong> Perfect for explanations, introductions, and content-heavy sections. Use clear hierarchy with headline → subheadline → body text.
            </div>
          )}
        </div>
      );
    }

    // Regular non-editable render
    return (
      <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
        {data.headline && (
          <div style={{ 
            fontWeight: 600, 
            fontSize: '2rem', 
            marginBottom: '1rem' 
          }}>
            {data.headline}
          </div>
        )}
        
        {data.subheadline && (
          <div style={{ 
            fontSize: '1.25rem', 
            color: '#666', 
            marginBottom: '1rem' 
          }}>
            {data.subheadline}
          </div>
        )}
        
        {data.body_text && (
          <div style={{ 
            lineHeight: 1.6,
            fontSize: '1rem'
          }}>
            {data.body_text}
          </div>
        )}
        
        {/* Show placeholder if all fields are empty */}
        {!data.headline && !data.subheadline && !data.body_text && (
          <div style={{ color: '#999', fontStyle: 'italic' }}>
            Text content will appear here...
          </div>
        )}
      </div>
    );
  }
};