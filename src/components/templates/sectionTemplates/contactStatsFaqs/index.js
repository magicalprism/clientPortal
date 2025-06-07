import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

// 1. CONTACT SECTION - Contact info with form
export const contactSection = {
  id: 'contact_section',
  title: 'Contact Section',
  category: 'Contact',
  fields: ['headline', 'subheadline', 'contact_info', 'form_fields'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const contactInfo = data.contact_info || {};

    if (editable) {
      const updateContactInfo = (field, value) => {
        const updatedInfo = { ...contactInfo, [field]: value };
        onFieldSave?.('contact_info', updatedInfo);
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
              placeholder="Get In Touch"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="We'd love to hear from you. Send us a message and we'll respond as soon as possible."
              multiline
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Contact Info */}
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
                Contact Information
              </h4>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>📍</span>
                  <div>
                    <strong>Address</strong><br/>
                    <InlineEditableField
                      value={contactInfo.address}
                      onChange={(value) => onFieldChange?.('contact_info', { ...contactInfo, address: value })}
                      onSave={(value) => updateContactInfo('address', value)}
                      variant="body2"
                      placeholder="123 Business St, City, State 12345"
                      multiline
                      sx={{ color: '#666' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>📞</span>
                  <div>
                    <strong>Phone</strong><br/>
                    <InlineEditableField
                      value={contactInfo.phone}
                      onChange={(value) => onFieldChange?.('contact_info', { ...contactInfo, phone: value })}
                      onSave={(value) => updateContactInfo('phone', value)}
                      variant="body2"
                      placeholder="+1 (555) 123-4567"
                      sx={{ color: '#666' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>✉️</span>
                  <div>
                    <strong>Email</strong><br/>
                    <InlineEditableField
                      value={contactInfo.email}
                      onChange={(value) => onFieldChange?.('contact_info', { ...contactInfo, email: value })}
                      onSave={(value) => updateContactInfo('email', value)}
                      variant="body2"
                      placeholder="hello@company.com"
                      sx={{ color: '#666' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>🕒</span>
                  <div>
                    <strong>Hours</strong><br/>
                    <InlineEditableField
                      value={contactInfo.hours}
                      onChange={(value) => onFieldChange?.('contact_info', { ...contactInfo, hours: value })}
                      onSave={(value) => updateContactInfo('hours', value)}
                      variant="body2"
                      placeholder="Mon-Fri: 9AM-6PM"
                      sx={{ color: '#666' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Send Message
              </h4>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Subject" 
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <textarea 
                  placeholder="Your Message" 
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button style={{
                width: '100%',
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Send Message
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ padding: '3rem 2rem', border: '1px dashed #aaa' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            {data.headline || 'Get In Touch'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
              Contact Information
            </h4>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>📍</span>
                <div>
                  <strong>Address</strong><br/>
                  <span style={{ color: '#666' }}>
                    {contactInfo.address || '123 Business St, City, State 12345'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>📞</span>
                <div>
                  <strong>Phone</strong><br/>
                  <span style={{ color: '#666' }}>
                    {contactInfo.phone || '+1 (555) 123-4567'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>✉️</span>
                <div>
                  <strong>Email</strong><br/>
                  <span style={{ color: '#666' }}>
                    {contactInfo.email || 'hello@company.com'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.5rem' }}>🕒</span>
                <div>
                  <strong>Hours</strong><br/>
                  <span style={{ color: '#666' }}>
                    {contactInfo.hours || 'Mon-Fri: 9AM-6PM'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Send Message
            </h4>

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Your Name" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="email" 
                placeholder="Your Email" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Subject" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <textarea 
                placeholder="Your Message" 
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <button style={{
              width: '100%',
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  }
};

// 2. STATS COUNTER - Animated number counters
export const statsCounter = {
  id: 'stats_counter',
  title: 'Stats Counter',
  category: 'Stats',
  fields: ['headline', 'stats'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const stats = data.stats || [];

    if (editable) {
      const updateStat = (index, field, value) => {
        const updatedStats = [...stats];
        if (!updatedStats[index]) {
          updatedStats[index] = { number: '', label: '', suffix: '' };
        }
        updatedStats[index][field] = value;
        return updatedStats;
      };

      const addStat = () => {
        const updatedStats = [...stats, { 
          number: '100', 
          label: 'New Stat',
          suffix: '+'
        }];
        onFieldSave?.('stats', updatedStats);
      };

      const removeStat = (index) => {
        const updatedStats = stats.filter((_, i) => i !== index);
        onFieldSave?.('stats', updatedStats);
      };

      return (
        <div style={{ 
          padding: '4rem 2rem', 
          border: '1px dashed #aaa',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '3rem' }}>
            <InlineEditableField
              value={data.headline}
              onChange={(value) => onFieldChange?.('headline', value)}
              onSave={(value) => onFieldSave?.('headline', value)}
              variant="h3"
              placeholder="Our Impact in Numbers"
              sx={{ fontWeight: 600, color: 'white', mb: 2 }}
            />
          </div>

          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto 2rem'
          }}>
            {(stats.length > 0 ? stats : Array(4).fill(null).map((_, i) => ({ 
              number: ['500', '99', '24', '15'][i] || '100',
              label: ['Happy Clients', 'Success Rate', 'Hours Support', 'Team Members'][i] || 'Stat',
              suffix: ['+', '%', '/7', '+'][i] || '+'
            }))).map((stat, i) => (
              <div 
                key={i} 
                style={{ 
                  position: 'relative',
                  padding: '1rem'
                }}
              >
                {/* Remove button */}
                {stats.length > 0 && i < stats.length && (
                  <button
                    onClick={() => removeStat(i)}
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

                {/* Number */}
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
                  <InlineEditableField
                    value={stat.number}
                    onChange={(value) => onFieldChange?.('stats', updateStat(i, 'number', value))}
                    onSave={(value) => onFieldSave?.('stats', updateStat(i, 'number', value))}
                    variant="h2"
                    placeholder="100"
                    component="span"
                    sx={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}
                  />
                  <InlineEditableField
                    value={stat.suffix}
                    onChange={(value) => onFieldChange?.('stats', updateStat(i, 'suffix', value))}
                    onSave={(value) => onFieldSave?.('stats', updateStat(i, 'suffix', value))}
                    variant="h3"
                    placeholder="+"
                    component="span"
                    sx={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginLeft: '4px' }}
                  />
                </div>

                {/* Label */}
                <InlineEditableField
                  value={stat.label}
                  onChange={(value) => onFieldChange?.('stats', updateStat(i, 'label', value))}
                  onSave={(value) => onFieldSave?.('stats', updateStat(i, 'label', value))}
                  variant="body1"
                  placeholder="Stat Label"
                  sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                />
              </div>
            ))}
          </div>

          {/* Add Stat Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={addStat}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add Stat
            </button>
          </div>
        </div>
      );
    }

    // Non-editable render
    return (
      <div style={{ 
        padding: '4rem 2rem', 
        border: '1px dashed #aaa',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            {data.headline || 'Our Impact in Numbers'}
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {stats.length > 0 ? stats.map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {stat.number}{stat.suffix}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          )) : [
            { number: '500', label: 'Happy Clients', suffix: '+' },
            { number: '99', label: 'Success Rate', suffix: '%' },
            { number: '24', label: 'Hours Support', suffix: '/7' },
            { number: '15', label: 'Team Members', suffix: '+' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {stat.number}{stat.suffix}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

// 3. FAQ ACCORDION - Frequently asked questions
export const faqAccordion = {
  id: 'faq_accordion',
  title: 'FAQ Accordion',
  category: 'FAQ',
  fields: ['headline', 'subheadline', 'faqs'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const faqs = data.faqs || [];

    if (editable) {
      const updateFaq = (index, field, value) => {
        const updatedFaqs = [...faqs];
        if (!updatedFaqs[index]) {
          updatedFaqs[index] = { question: '', answer: '' };
        }
        updatedFaqs[index][field] = value;
        return updatedFaqs;
      };

      const addFaq = () => {
        const updatedFaqs = [...faqs, { 
          question: 'New Question?', 
          answer: 'Answer to the question...'
        }];
        onFieldSave?.('faqs', updatedFaqs);
      };

      const removeFaq = (index) => {
        const updatedFaqs = faqs.filter((_, i) => i !== index);
        onFieldSave?.('faqs', updatedFaqs);
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
              placeholder="Frequently Asked Questions"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="Find answers to common questions about our services"
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          {/* FAQs */}
          <div style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
            {(faqs.length > 0 ? faqs : Array(5).fill(null).map((_, i) => ({ 
              question: '',
              answer: ''
            }))).map((faq, i) => (
              <div 
                key={i} 
                style={{ 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  position: 'relative'
                }}
              >
                {/* Remove button */}
                {faqs.length > 0 && i < faqs.length && (
                  <button
                    onClick={() => removeFaq(i)}
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

                {/* Question */}
                <div style={{ 
                  padding: '1.5rem 3rem 1.5rem 1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <InlineEditableField
                    value={faq.question}
                    onChange={(value) => onFieldChange?.('faqs', updateFaq(i, 'question', value))}
                    onSave={(value) => onFieldSave?.('faqs', updateFaq(i, 'question', value))}
                    variant="h6"
                    placeholder={`Question ${i + 1}?`}
                    sx={{ fontWeight: 600, flex: 1 }}
                  />
                  <span style={{ marginLeft: '1rem', fontSize: '1.5rem', color: '#666' }}>
                    ▼
                  </span>
                </div>

                {/* Answer */}
                <div style={{ padding: '1.5rem', background: 'white' }}>
                  <InlineEditableField
                    value={faq.answer}
                    onChange={(value) => onFieldChange?.('faqs', updateFaq(i, 'answer', value))}
                    onSave={(value) => onFieldSave?.('faqs', updateFaq(i, 'answer', value))}
                    variant="body1"
                    placeholder="Answer to the question..."
                    multiline
                    sx={{ color: '#666', lineHeight: 1.6 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add FAQ Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={addFaq}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add FAQ
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
            {data.headline || 'Frequently Asked Questions'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || 'Find answers to common questions about our services'}
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {faqs.length > 0 ? faqs.map((faq, i) => (
            <div 
              key={i} 
              style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            >
              <div style={{ 
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                  {faq.question || `Question ${i + 1}?`}
                </h3>
                <span style={{ fontSize: '1.5rem', color: '#666' }}>▼</span>
              </div>

              <div style={{ padding: '1.5rem', background: 'white' }}>
                <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>
                  {faq.answer || 'Answer to the question...'}
                </p>
              </div>
            </div>
          )) : [
            { question: 'What services do you offer?', answer: 'We offer a comprehensive range of services including web design, development, digital marketing, and ongoing support to help your business grow online.' },
            { question: 'How long does a typical project take?', answer: 'Project timelines vary depending on scope and complexity. A typical website project takes 4-8 weeks from start to finish, including design, development, and testing phases.' },
            { question: 'Do you offer ongoing support?', answer: 'Yes! We provide ongoing maintenance, updates, and technical support to ensure your website continues to perform optimally after launch.' },
            { question: 'What is your pricing structure?', answer: 'Our pricing is project-based and depends on your specific requirements. We provide detailed quotes after understanding your needs and objectives.' },
            { question: 'Can you work with existing websites?', answer: 'Absolutely! We can redesign, optimize, or add new features to existing websites. We work with various platforms and technologies.' }
          ].map((faq, i) => (
            <div 
              key={i} 
              style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            >
              <div style={{ 
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                  {faq.question}
                </h3>
                <span style={{ fontSize: '1.5rem', color: '#666' }}>▼</span>
              </div>

              <div style={{ padding: '1.5rem', background: 'white' }}>
                <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};