import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

export const featureGrid = {
  id: 'feature_grid',
  title: 'Feature Grid',
  fields: ['headline', 'subheadline', 'features'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const features = data.features || [];

    if (editable) {
      // Helper function to update a specific feature
      const updateFeature = (index, field, value) => {
        const updatedFeatures = [...features];
        if (!updatedFeatures[index]) {
          updatedFeatures[index] = {};
        }
        updatedFeatures[index][field] = value;
        return updatedFeatures;
      };

      // Helper function to add a new feature
      const addFeature = () => {
        const updatedFeatures = [...features, { title: 'New Feature', description: 'Feature description' }];
        onFieldSave?.('features', updatedFeatures);
      };

      // Helper function to remove a feature
      const removeFeature = (index) => {
        const updatedFeatures = features.filter((_, i) => i !== index);
        onFieldSave?.('features', updatedFeatures);
      };

      return (
        <div style={{ padding: '1rem', border: '1px dashed #aaa', position: 'relative' }}>
          <InlineEditableField
            value={data.headline}
            onChange={(value) => onFieldChange?.('headline', value)}
            onSave={(value) => onFieldSave?.('headline', value)}
            variant="h5"
            placeholder="Enter section title"
            sx={{ mb: 1, fontWeight: 600 }}
          />
          
          <InlineEditableField
            value={data.subheadline}
            onChange={(value) => onFieldChange?.('subheadline', value)}
            onSave={(value) => onFieldSave?.('subheadline', value)}
            variant="body2"
            placeholder="Enter supporting text"
            sx={{ color: '#666', mb: 2 }}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: 12, flexWrap: 'wrap' }}>
            {/* Render existing features or default placeholders */}
            {(features.length > 0 ? features : [{ title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }]).map((feature, i) => (
              <div 
                key={i} 
                style={{ 
                  flex: '1 1 300px', 
                  minWidth: '250px',
                  background: '#eee', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  position: 'relative'
                }}
              >
                {/* Remove button for existing features */}
                {features.length > 0 && i < features.length && (
                  <button
                    onClick={() => removeFeature(i)}
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                )}

                <InlineEditableField
                  value={feature.title}
                  onChange={(value) => onFieldChange?.('features', updateFeature(i, 'title', value))}
                  onSave={(value) => onFieldSave?.('features', updateFeature(i, 'title', value))}
                  variant="subtitle1"
                  placeholder={`Feature ${i + 1} title`}
                  sx={{ fontWeight: 500, mb: 1 }}
                />
                
                <InlineEditableField
                  value={feature.description}
                  onChange={(value) => onFieldChange?.('features', updateFeature(i, 'description', value))}
                  onSave={(value) => onFieldSave?.('features', updateFeature(i, 'description', value))}
                  variant="body2"
                  placeholder="Brief description"
                  multiline
                  sx={{ fontSize: 12 }}
                />
              </div>
            ))}
          </div>

          {/* Add Feature Button */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={addFeature}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + Add Feature
            </button>
          </div>
        </div>
      );
    }

    // Regular non-editable render
    return (
      <div style={{ padding: '1rem', border: '1px dashed #aaa' }}>
        <div style={{ fontWeight: 600 }}>{data.headline || 'Section Title'}</div>
        <div style={{ color: '#666' }}>{data.subheadline || 'Supporting text'}</div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: 12, flexWrap: 'wrap' }}>
          {features.length > 0
            ? features.map((f, i) => (
                <div key={i} style={{ flex: '1 1 300px', minWidth: '250px', background: '#eee', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 500 }}>{f.title || `Feature ${i + 1}`}</div>
                  <div style={{ fontSize: 12 }}>{f.description || 'Brief description'}</div>
                </div>
              ))
            : [1, 2, 3].map((i) => (
                <div key={i} style={{ flex: '1 1 300px', minWidth: '250px', background: '#eee', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 500 }}>Feature {i}</div>
                  <div style={{ fontSize: 12 }}>Brief description</div>
                </div>
              ))}
        </div>
      </div>
    );
  }
};