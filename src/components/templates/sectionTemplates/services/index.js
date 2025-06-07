import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

// 1. SERVICES GRID - Icon + text services
export const servicesGrid = {
  id: 'services_grid',
  title: 'Services Grid (Icon + Text)',
  category: 'Services',
  fields: ['headline', 'subheadline', 'services'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const services = data.services || [];

    if (editable) {
      const updateService = (index, field, value) => {
        const updatedServices = [...services];
        if (!updatedServices[index]) {
          updatedServices[index] = { title: '', description: '', icon: '⚡' };
        }
        updatedServices[index][field] = value;
        return updatedServices;
      };

      const addService = () => {
        const updatedServices = [...services, { 
          title: 'New Service', 
          description: 'Service description here...', 
          icon: '🔧' 
        }];
        onFieldSave?.('services', updatedServices);
      };

      const removeService = (index) => {
        const updatedServices = services.filter((_, i) => i !== index);
        onFieldSave?.('services', updatedServices);
      };

      return (
        <div style={{ padding: '3rem 2rem', border: '1px dashed #aaa' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h3"
              placeholder="Our Services"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="We provide comprehensive solutions to help your business grow"
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          {/* Services Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {(services.length > 0 ? services : Array(3).fill(null).map((_, i) => ({ 
              title: '', 
              description: '', 
              icon: ['🚀', '💡', '⚡'][i] || '🔧'
            }))).map((service, i) => (
              <div 
                key={i} 
                style={{ 
                  textAlign: 'center',
                  padding: '2rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  background: '#fafafa',
                  position: 'relative'
                }}
              >
                {services.length > 0 && i < services.length && (
                  <button
                    onClick={() => removeService(i)}
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
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                )}

                {/* Icon */}
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  <InlineEditableField
                    value={service.icon}
                    onChange={(value) => onFieldChange?.('services', updateService(i, 'icon', value))}
                    onSave={(value) => onFieldSave?.('services', updateService(i, 'icon', value))}
                    variant="body1"
                    placeholder="🔧"
                    component="span"
                    sx={{ fontSize: '3rem' }}
                  />
                </div>

                {/* Title */}
                <InlineEditableField
                  value={service.title}
                  onChange={(value) => onFieldChange?.('services', updateService(i, 'title', value))}
                  onSave={(value) => onFieldSave?.('services', updateService(i, 'title', value))}
                  variant="h6"
                  placeholder={`Service ${i + 1}`}
                  sx={{ fontWeight: 600, mb: 1 }}
                />

                {/* Description */}
                <InlineEditableField
                  value={service.description}
                  onChange={(value) => onFieldChange?.('services', updateService(i, 'description', value))}
                  onSave={(value) => onFieldSave?.('services', updateService(i, 'description', value))}
                  variant="body2"
                  placeholder="Brief description of this service..."
                  multiline
                  sx={{ color: '#666', lineHeight: 1.6 }}
                />
              </div>
            ))}
          </div>

          {/* Add Service Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={addService}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add Service
            </button>
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ padding: '3rem 2rem', border: '1px dashed #aaa' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            {data.headline || 'Our Services'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || 'We provide comprehensive solutions to help your business grow'}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem'
        }}>
          {services.length > 0 ? services.map((service, i) => (
            <div 
              key={i} 
              style={{ 
                textAlign: 'center',
                padding: '2rem',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                background: '#fafafa'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {service.icon || '🔧'}
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
                {service.title || `Service ${i + 1}`}
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                {service.description || 'Brief description of this service...'}
              </p>
            </div>
          )) : [
            { icon: '🚀', title: 'Fast Delivery', description: 'Quick and efficient service delivery' },
            { icon: '💡', title: 'Innovation', description: 'Cutting-edge solutions for your needs' },
            { icon: '⚡', title: 'Performance', description: 'High-performance results guaranteed' }
          ].map((service, i) => (
            <div 
              key={i} 
              style={{ 
                textAlign: 'center',
                padding: '2rem',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                background: '#f5f5f5'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {service.icon}
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
                {service.title}
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

// 2. PROCESS STEPS - Step-by-step process
export const processSteps = {
  id: 'process_steps',
  title: 'Process Steps',
  category: 'Services',
  fields: ['headline', 'subheadline', 'steps'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const steps = data.steps || [];

    if (editable) {
      const updateStep = (index, field, value) => {
        const updatedSteps = [...steps];
        if (!updatedSteps[index]) {
          updatedSteps[index] = { title: '', description: '' };
        }
        updatedSteps[index][field] = value;
        return updatedSteps;
      };

      const addStep = () => {
        const updatedSteps = [...steps, { 
          title: 'New Step', 
          description: 'Step description...' 
        }];
        onFieldSave?.('steps', updatedSteps);
      };

      const removeStep = (index) => {
        const updatedSteps = steps.filter((_, i) => i !== index);
        onFieldSave?.('steps', updatedSteps);
      };

      return (
        <div style={{ padding: '3rem 2rem', border: '1px dashed #aaa' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h3"
              placeholder="How It Works"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="Our simple 3-step process to get you started"
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          {/* Steps */}
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {(steps.length > 0 ? steps : Array(3).fill(null).map((_, i) => ({ 
              title: '', 
              description: '' 
            }))).map((step, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: i < steps.length - 1 ? '3rem' : '2rem',
                  position: 'relative'
                }}
              >
                {/* Remove button */}
                {steps.length > 0 && i < steps.length && (
                  <button
                    onClick={() => removeStep(i)}
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
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

                {/* Step Number */}
                <div style={{
                  background: '#007bff',
                  color: 'white',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginRight: '2rem',
                  flexShrink: 0
                }}>
                  {i + 1}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  <InlineEditableField
                    value={step.title}
                    onChange={(value) => onFieldChange?.('steps', updateStep(i, 'title', value))}
                    onSave={(value) => onFieldSave?.('steps', updateStep(i, 'title', value))}
                    variant="h5"
                    placeholder={`Step ${i + 1} Title`}
                    sx={{ fontWeight: 600, mb: 1 }}
                  />

                  <InlineEditableField
                    value={step.description}
                    onChange={(value) => onFieldChange?.('steps', updateStep(i, 'description', value))}
                    onSave={(value) => onFieldSave?.('steps', updateStep(i, 'description', value))}
                    variant="body1"
                    placeholder="Description of what happens in this step..."
                    multiline
                    sx={{ color: '#666', lineHeight: 1.6 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Step Button */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={addStep}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add Step
            </button>
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ padding: '3rem 2rem', border: '1px dashed #aaa' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            {data.headline || 'How It Works'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || 'Our simple 3-step process to get you started'}
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {steps.length > 0 ? steps.map((step, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: i < steps.length - 1 ? '3rem' : '0'
              }}
            >
              <div style={{
                background: '#007bff',
                color: 'white',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                marginRight: '2rem',
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {step.title || `Step ${i + 1}`}
                </h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  {step.description || 'Step description...'}
                </p>
              </div>
            </div>
          )) : [
            { title: 'Consultation', description: 'We analyze your needs and create a customized plan' },
            { title: 'Implementation', description: 'Our team executes the plan with precision and care' },
            { title: 'Results', description: 'You see measurable results and ongoing support' }
          ].map((step, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: i < 2 ? '3rem' : '0'
              }}
            >
              <div style={{
                background: '#007bff',
                color: 'white',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                marginRight: '2rem',
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};