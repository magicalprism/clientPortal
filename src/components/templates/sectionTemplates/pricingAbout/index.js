import { fetchData } from './query';
import { InlineEditableField } from '@/components/fields/InlineEditableField';

// 1. PRICING TABLE - Standard pricing plans
export const pricingTable = {
  id: 'pricing_table',
  title: 'Pricing Table',
  category: 'Pricing',
  fields: ['headline', 'subheadline', 'pricing_plans'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const plans = data.pricing_plans || [];

    if (editable) {
      const updatePlan = (index, field, value) => {
        const updatedPlans = [...plans];
        if (!updatedPlans[index]) {
          updatedPlans[index] = { 
            name: '', 
            price: '', 
            period: 'month', 
            features: [],
            featured: false,
            button_text: 'Get Started'
          };
        }
        updatedPlans[index][field] = value;
        return updatedPlans;
      };

      const updatePlanFeature = (planIndex, featureIndex, value) => {
        const updatedPlans = [...plans];
        if (!updatedPlans[planIndex].features) {
          updatedPlans[planIndex].features = [];
        }
        updatedPlans[planIndex].features[featureIndex] = value;
        return updatedPlans;
      };

      const addFeature = (planIndex) => {
        const updatedPlans = [...plans];
        if (!updatedPlans[planIndex].features) {
          updatedPlans[planIndex].features = [];
        }
        updatedPlans[planIndex].features.push('New feature');
        onFieldSave?.('pricing_plans', updatedPlans);
      };

      const addPlan = () => {
        const updatedPlans = [...plans, { 
          name: 'New Plan', 
          price: '99', 
          period: 'month',
          features: ['Feature 1', 'Feature 2'],
          featured: false,
          button_text: 'Get Started'
        }];
        onFieldSave?.('pricing_plans', updatedPlans);
      };

      const removePlan = (index) => {
        const updatedPlans = plans.filter((_, i) => i !== index);
        onFieldSave?.('pricing_plans', updatedPlans);
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
              placeholder="Choose Your Plan"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="Simple, transparent pricing for every need"
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          {/* Pricing Plans */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto 2rem'
          }}>
            {(plans.length > 0 ? plans : Array(3).fill(null).map((_, i) => ({ 
              name: ['Basic', 'Pro', 'Enterprise'][i] || 'Plan',
              price: ['29', '99', '199'][i] || '99',
              period: 'month',
              features: ['Feature 1', 'Feature 2', 'Feature 3'],
              featured: i === 1,
              button_text: 'Get Started'
            }))).map((plan, i) => (
              <div 
                key={i} 
                style={{ 
                  border: plan.featured ? '3px solid #007bff' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '2rem',
                  background: plan.featured ? '#f8f9ff' : 'white',
                  position: 'relative',
                  textAlign: 'center'
                }}
              >
                {/* Remove button */}
                {plans.length > 0 && i < plans.length && (
                  <button
                    onClick={() => removePlan(i)}
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

                {/* Featured badge */}
                {plan.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#007bff',
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    POPULAR
                  </div>
                )}

                {/* Plan Name */}
                <InlineEditableField
                  value={plan.name}
                  onChange={(value) => onFieldChange?.('pricing_plans', updatePlan(i, 'name', value))}
                  onSave={(value) => onFieldSave?.('pricing_plans', updatePlan(i, 'name', value))}
                  variant="h5"
                  placeholder="Plan Name"
                  sx={{ fontWeight: 600, mb: 1 }}
                />

                {/* Price */}
                <div style={{ marginBottom: '2rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 700 }}>$</span>
                  <InlineEditableField
                    value={plan.price}
                    onChange={(value) => onFieldChange?.('pricing_plans', updatePlan(i, 'price', value))}
                    onSave={(value) => onFieldSave?.('pricing_plans', updatePlan(i, 'price', value))}
                    variant="h3"
                    placeholder="99"
                    component="span"
                    sx={{ fontSize: '3rem', fontWeight: 700 }}
                  />
                  <span style={{ color: '#666' }}>/</span>
                  <InlineEditableField
                    value={plan.period}
                    onChange={(value) => onFieldChange?.('pricing_plans', updatePlan(i, 'period', value))}
                    onSave={(value) => onFieldSave?.('pricing_plans', updatePlan(i, 'period', value))}
                    variant="body1"
                    placeholder="month"
                    component="span"
                    sx={{ color: '#666' }}
                  />
                </div>

                {/* Features */}
                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                  {(plan.features || []).map((feature, featureIndex) => (
                    <div key={featureIndex} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                      <InlineEditableField
                        value={feature}
                        onChange={(value) => onFieldChange?.('pricing_plans', updatePlanFeature(i, featureIndex, value))}
                        onSave={(value) => onFieldSave?.('pricing_plans', updatePlanFeature(i, featureIndex, value))}
                        variant="body2"
                        placeholder="Feature description"
                        sx={{ flex: 1 }}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addFeature(i)}
                    style={{
                      background: 'transparent',
                      border: '1px dashed #ccc',
                      color: '#666',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginTop: '8px'
                    }}
                  >
                    + Add Feature
                  </button>
                </div>

                {/* Featured Toggle */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={plan.featured || false}
                      onChange={(e) => {
                        const updatedPlans = updatePlan(i, 'featured', e.target.checked);
                        onFieldSave?.('pricing_plans', updatedPlans);
                      }}
                      style={{ marginRight: '4px' }}
                    />
                    Featured Plan
                  </label>
                </div>

                {/* Button */}
                <div style={{
                  background: plan.featured ? '#007bff' : '#f8f9fa',
                  color: plan.featured ? 'white' : '#333',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  border: plan.featured ? 'none' : '1px solid #e0e0e0'
                }}>
                  <InlineEditableField
                    value={plan.button_text}
                    onChange={(value) => onFieldChange?.('pricing_plans', updatePlan(i, 'button_text', value))}
                    onSave={(value) => onFieldSave?.('pricing_plans', updatePlan(i, 'button_text', value))}
                    variant="body2"
                    placeholder="Get Started"
                    component="span"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Plan Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={addPlan}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add Plan
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
            {data.headline || 'Choose Your Plan'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || 'Simple, transparent pricing for every need'}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {plans.length > 0 ? plans.map((plan, i) => (
            <div 
              key={i} 
              style={{ 
                border: plan.featured ? '3px solid #007bff' : '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '2rem',
                background: plan.featured ? '#f8f9ff' : 'white',
                position: 'relative',
                textAlign: 'center'
              }}
            >
              {plan.featured && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#007bff',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700 }}>
                  ${plan.price}
                </span>
                <span style={{ color: '#666' }}>/{plan.period}</span>
              </div>

              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                {(plan.features || []).map((feature, featureIndex) => (
                  <div key={featureIndex} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{
                background: plan.featured ? '#007bff' : '#f8f9fa',
                color: plan.featured ? 'white' : '#333',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                border: plan.featured ? 'none' : '1px solid #e0e0e0'
              }}>
                {plan.button_text || 'Get Started'}
              </div>
            </div>
          )) : [
            { name: 'Basic', price: '29', period: 'month', features: ['5 Projects', 'Email Support', '2GB Storage'], featured: false },
            { name: 'Pro', price: '99', period: 'month', features: ['Unlimited Projects', 'Priority Support', '50GB Storage', 'Advanced Analytics'], featured: true },
            { name: 'Enterprise', price: '199', period: 'month', features: ['Everything in Pro', 'Dedicated Support', 'Unlimited Storage', 'Custom Integrations'], featured: false }
          ].map((plan, i) => (
            <div 
              key={i} 
              style={{ 
                border: plan.featured ? '3px solid #007bff' : '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '2rem',
                background: plan.featured ? '#f8f9ff' : 'white',
                position: 'relative',
                textAlign: 'center'
              }}
            >
              {plan.featured && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#007bff',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700 }}>
                  ${plan.price}
                </span>
                <span style={{ color: '#666' }}>/{plan.period}</span>
              </div>

              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{
                background: plan.featured ? '#007bff' : '#f8f9fa',
                color: plan.featured ? 'white' : '#333',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                border: plan.featured ? 'none' : '1px solid #e0e0e0'
              }}>
                Get Started
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

// 2. TEAM GRID - Team member cards
export const teamGrid = {
  id: 'team_grid',
  title: 'Team Grid',
  category: 'About',
  fields: ['headline', 'subheadline', 'team_members'],
  query: fetchData,
  render: (data, options = {}) => {
    const { editable = false, onFieldChange, onFieldSave } = options;
    const team = data.team_members || [];

    if (editable) {
      const updateMember = (index, field, value) => {
        const updatedTeam = [...team];
        if (!updatedTeam[index]) {
          updatedTeam[index] = { name: '', role: '', bio: '', avatar: '', social: {} };
        }
        updatedTeam[index][field] = value;
        return updatedTeam;
      };

      const addMember = () => {
        const updatedTeam = [...team, { 
          name: 'Team Member', 
          role: 'Position',
          bio: 'Brief bio...',
          avatar: '',
          social: {}
        }];
        onFieldSave?.('team_members', updatedTeam);
      };

      const removeMember = (index) => {
        const updatedTeam = team.filter((_, i) => i !== index);
        onFieldSave?.('team_members', updatedTeam);
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
              placeholder="Meet Our Team"
              sx={{ fontWeight: 600, mb: 2 }}
            />
            
            <InlineEditableField
              value={data.subheadline}
              onChange={(value) => onFieldChange?.('subheadline', value)}
              onSave={(value) => onFieldSave?.('subheadline', value)}
              variant="body1"
              placeholder="The talented people behind our success"
              sx={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}
            />
          </div>

          {/* Team Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {(team.length > 0 ? team : Array(4).fill(null).map((_, i) => ({ 
              name: '', 
              role: '', 
              bio: '',
              avatar: ''
            }))).map((member, i) => (
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
                {/* Remove button */}
                {team.length > 0 && i < team.length && (
                  <button
                    onClick={() => removeMember(i)}
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

                {/* Avatar */}
                <div style={{ marginBottom: '1rem' }}>
                  {member.avatar ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '4px solid white'
                        }}
                      />
                      <button
                        onClick={() => {
                          const updatedTeam = updateMember(i, 'avatar', '');
                          onFieldSave?.('team_members', updatedTeam);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
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
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        background: '#e0e0e0',
                        border: '2px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        margin: '0 auto',
                        fontSize: '12px',
                        color: '#666'
                      }}
                      onClick={() => {
                        const url = prompt('Enter avatar image URL:');
                        if (url) {
                          const updatedTeam = updateMember(i, 'avatar', url);
                          onFieldSave?.('team_members', updatedTeam);
                        }
                      }}
                    >
                      👤<br/>Click to add photo
                    </div>
                  )}
                  
                  <div style={{ marginTop: '8px' }}>
                    <InlineEditableField
                      value={member.avatar || ''}
                      onChange={(value) => onFieldChange?.('team_members', updateMember(i, 'avatar', value))}
                      onSave={(value) => onFieldSave?.('team_members', updateMember(i, 'avatar', value))}
                      variant="caption"
                      placeholder="Avatar URL"
                      sx={{ fontSize: '10px', color: '#666' }}
                    />
                  </div>
                </div>

                {/* Name */}
                <InlineEditableField
                  value={member.name}
                  onChange={(value) => onFieldChange?.('team_members', updateMember(i, 'name', value))}
                  onSave={(value) => onFieldSave?.('team_members', updateMember(i, 'name', value))}
                  variant="h6"
                  placeholder="Team Member Name"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                />

                {/* Role */}
                <InlineEditableField
                  value={member.role}
                  onChange={(value) => onFieldChange?.('team_members', updateMember(i, 'role', value))}
                  onSave={(value) => onFieldSave?.('team_members', updateMember(i, 'role', value))}
                  variant="subtitle2"
                  placeholder="Job Title"
                  sx={{ color: '#007bff', mb: 1, fontWeight: 500 }}
                />

                {/* Bio */}
                <InlineEditableField
                  value={member.bio}
                  onChange={(value) => onFieldChange?.('team_members', updateMember(i, 'bio', value))}
                  onSave={(value) => onFieldSave?.('team_members', updateMember(i, 'bio', value))}
                  variant="body2"
                  placeholder="Brief bio or description..."
                  multiline
                  sx={{ color: '#666', lineHeight: 1.6, fontSize: '0.875rem' }}
                />
              </div>
            ))}
          </div>

          {/* Add Member Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={addMember}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + Add Team Member
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
            {data.headline || 'Meet Our Team'}
          </h2>
          <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {data.subheadline || 'The talented people behind our success'}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem'
        }}>
          {team.length > 0 ? team.map((member, i) => (
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
              <div style={{ marginBottom: '1rem' }}>
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '4px solid white'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    background: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: '2rem'
                  }}>
                    👤
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {member.name || 'Team Member'}
              </h3>

              <div style={{ color: '#007bff', marginBottom: '1rem', fontWeight: 500 }}>
                {member.role || 'Position'}
              </div>

              <p style={{ color: '#666', lineHeight: 1.6, fontSize: '0.875rem' }}>
                {member.bio || 'Team member bio...'}
              </p>
            </div>
          )) : [
            { name: 'Sarah Johnson', role: 'CEO & Founder', bio: 'Visionary leader with 10+ years of industry experience' },
            { name: 'Mike Chen', role: 'CTO', bio: 'Tech innovator passionate about scalable solutions' },
            { name: 'Emily Rodriguez', role: 'Lead Designer', bio: 'Creative problem-solver focused on user experience' },
            { name: 'David Kim', role: 'Head of Marketing', bio: 'Growth strategist with data-driven approach' }
          ].map((member, i) => (
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
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                background: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem'
              }}>
                👤
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {member.name}
              </h3>

              <div style={{ color: '#007bff', marginBottom: '1rem', fontWeight: 500 }}>
                {member.role}
              </div>

              <p style={{ color: '#666', lineHeight: 1.6, fontSize: '0.875rem' }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
};