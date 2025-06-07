import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField'
export const centeredCTA = {
  id: 'centered_cta',
  title: 'Centered Call-To-Action',
  fields: ['headline', 'body_text', 'button_text', 'button_url'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
     // ✅ add this
    if (editable) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #aaa' }}>
          <InlineEditableField
            value={data.headline}
            onChange={(value) => onFieldChange?.('headline', value)}
            onSave={(value) => onFieldSave?.('headline', value)}
            variant="h4"
            placeholder="Enter headline"
            sx={{ mb: 2 }}
          />
          
          <InlineEditableField
            value={data.body_text}
            onChange={(value) => onFieldChange?.('body_text', value)}
            onSave={(value) => onFieldSave?.('body_text', value)}
            variant="body1"
            placeholder="Enter body text"
            multiline
            sx={{ mb: 3 }}
          />
          
          {(data.button_text || editable) && (
            <div style={{
              marginTop: 16,
              background: '#ddd',
              padding: '0.5rem 1rem',
              display: 'inline-block',
              borderRadius: 4
            }}>
              <InlineEditableField
                value={data.button_text}
                onChange={(value) => onFieldChange?.('button_text', value)}
                onSave={(value) => onFieldSave?.('button_text', value)}
                variant="body2"
                placeholder="Button text"
                component="span"
              />
            </div>
          )}
        </div>
      );
    }
    
    // Regular non-editable render
    return (
      <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #aaa' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {data.headline || 'Ready to start?'}
        </div>
        <div style={{ marginTop: 8 }}>
          {data.body_text || "Let's get this going."}
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
    );
  }
};

