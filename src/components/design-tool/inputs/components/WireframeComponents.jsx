import {
  Box,
  Typography,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  Paper
} from '@mui/material';
import { Image } from '@phosphor-icons/react';

// Semantic element component with proper HTML labels
export const SemanticElement = ({ element, showTag = true }) => {
  const getTagColor = (tag) => {
    const colors = {
      h1: '#1976d2', h2: '#1976d2', h3: '#1976d2', h4: '#1976d2', h5: '#1976d2', h6: '#1976d2',
      p: '#666',
      ul: '#4caf50', ol: '#4caf50', li: '#4caf50',
      strong: '#ff9800', b: '#ff9800'
    };
    return colors[tag] || '#666';
  };

  const getElementHeight = (element) => {
    if (element.type === 'heading') return '40px';
    if (element.type === 'list_container') return '30px';
    if (element.type === 'list_item') return '32px';
    return 'auto';
  };

  return (
    <Box sx={{ mb: 1 }}>
      {/* Semantic Tag Label */}
      {showTag && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Chip 
            label={`<${element.tag}>`} 
            size="small" 
            sx={{ 
              fontSize: '9px', 
              height: '20px',
              backgroundColor: getTagColor(element.tag),
              color: 'white',
              fontFamily: 'monospace'
            }} 
          />
          {element.type === 'heading' && (
            <Chip 
              label={`Level ${element.level}`} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '8px', height: '18px' }}
            />
          )}
          {element.type === 'list_item' && (
            <Chip 
              label={`Item ${element.itemNumber}`} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '8px', height: '18px' }}
            />
          )}
        </Box>
      )}
      
      {/* Element Content Box */}
      {element.type !== 'list_container' && (
        <Box sx={{
          minHeight: getElementHeight(element),
          backgroundColor: element.type === 'heading' ? '#e3f2fd' : 
                         element.type === 'list_item' ? '#f1f8e9' : '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '8px',
          fontSize: element.type === 'heading' ? '13px' : '11px',
          fontWeight: element.type === 'heading' ? 600 : 
                     element.type === 'list_item' ? 500 : 400,
          lineHeight: 1.4,
          color: '#333'
        }}>
          {element.type === 'list_item' && '• '}
          {element.content}
        </Box>
      )}
      
      {/* List Container (just shows metadata) */}
      {element.type === 'list_container' && (
        <Box sx={{
          height: '30px',
          backgroundColor: '#f1f8e9',
          border: '1px dashed #4caf50',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: '#2e7d32',
          fontWeight: 500
        }}>
          {element.listType === 'bulleted' ? 'Bulleted' : 'Numbered'} List ({element.itemCount} items)
        </Box>
      )}
    </Box>
  );
};

// Image placeholder component
export const ImagePlaceholder = ({ width = '100%', height = '160px', label = 'Image Placeholder' }) => (
  <Box sx={{
    width,
    height,
    backgroundColor: '#f0f0f0',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '12px'
  }}>
    <Image size={24} />
    <Typography variant="caption" sx={{ mt: 1 }}>{label}</Typography>
    <Typography variant="caption" sx={{ fontSize: '10px' }}>400x300</Typography>
  </Box>
);

// Button placeholder component
export const ButtonPlaceholder = () => (
  <Box sx={{
    width: '140px',
    height: '36px',
    backgroundColor: '#1976d2',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    mx: 'auto'
  }}>
    Call to Action
  </Box>
);

// Main wireframe section component
export const WireframeSection = ({ section, index }) => {
  const layout = section.wireframeLayout;
  const elements = section.elements || [];
  const template = section.template;

  const renderLayout = () => {
    switch (layout.layout) {
      case 'image_text_split':
        return (
          <Grid container spacing={2}>
            {layout.imagePos === 'left' && (
              <>
                <Grid item xs={5}>
                  <ImagePlaceholder height="200px" label="Hero Image" />
                </Grid>
                <Grid item xs={7}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {elements.map((element, idx) => (
                      <SemanticElement key={idx} element={element} />
                    ))}
                  </Box>
                </Grid>
              </>
            )}
            {layout.imagePos === 'right' && (
              <>
                <Grid item xs={7}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {elements.map((element, idx) => (
                      <SemanticElement key={idx} element={element} />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={5}>
                  <ImagePlaceholder height="160px" label="Profile Photo" />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 'centered_hero':
        return (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ textAlign: 'left' }}>
                  <SemanticElement element={element} />
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'centered_bio':
        return (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <ImagePlaceholder height="200px" label="Profile Photo" width="200px" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ textAlign: 'left' }}>
                  <SemanticElement element={element} />
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'full_width_hero':
        return (
          <Box sx={{ 
            backgroundColor: '#1976d2', 
            color: 'white', 
            p: 4, 
            borderRadius: '8px',
            backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: '800px', mx: 'auto' }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ color: 'white' }}>
                  <SemanticElement element={element} showTag={false} />
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'centered_emphasis':
        return (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ textAlign: 'left' }}>
                  <SemanticElement element={element} />
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'callout_box':
        return (
          <Box sx={{ maxWidth: '500px', mx: 'auto' }}>
            <Box sx={{ 
              border: '2px solid #4caf50', 
              borderRadius: '8px', 
              p: 2, 
              backgroundColor: '#f1f8e9'
            }}>
              {elements.map((element, idx) => (
                <SemanticElement key={idx} element={element} />
              ))}
            </Box>
          </Box>
        );
        
      case 'numbered_steps':
        return (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            {elements.map((element, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <SemanticElement element={element} showTag={idx === 0} />
                </Box>
              </Box>
            ))}
          </Box>
        );

      case 'icon_grid':
        return (
          <Box>
            {/* Group elements - headings followed by list items */}
            {(() => {
              const grouped = [];
              let currentGroup = { heading: null, items: [] };
              
              elements.forEach((element, idx) => {
                if (element.type === 'heading') {
                  // Save previous group
                  if (currentGroup.heading || currentGroup.items.length > 0) {
                    grouped.push(currentGroup);
                  }
                  currentGroup = { heading: element, items: [] };
                } else if (element.type === 'list_item') {
                  currentGroup.items.push(element);
                } else {
                  // Paragraph - could be description
                  if (!currentGroup.heading && element.content.length < 150) {
                    currentGroup.heading = element;
                  } else {
                    currentGroup.items.push(element);
                  }
                }
              });
              
              if (currentGroup.heading || currentGroup.items.length > 0) {
                grouped.push(currentGroup);
              }
              
              return (
                <Box>
                  {/* Main heading */}
                  {grouped[0]?.heading && (
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <SemanticElement element={grouped[0].heading} showTag={false} />
                    </Box>
                  )}
                  
                  {/* Grid of items */}
                  <Grid container spacing={3}>
                    {grouped.flatMap(group => group.items).map((element, idx) => (
                      <Grid item xs={4} key={idx}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 2, 
                          border: '1px solid #e0e0e0', 
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa',
                          minHeight: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}>
                          <ImagePlaceholder width="60px" height="60px" label="Icon" />
                          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '11px', 
                              lineHeight: 1.3,
                              textAlign: 'center'
                            }}>
                              {element.content}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })()}
          </Box>
        );
        
      case 'bullet_list':
        return (
          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            {(() => {
              let currentHeading = null;
              const listItems = [];
              
              elements.forEach((element, idx) => {
                if (element.type === 'heading') {
                  currentHeading = element;
                } else if (element.type === 'list_item') {
                  listItems.push(element);
                }
              });
              
              return (
                <Box>
                  {currentHeading && (
                    <Box sx={{ mb: 3 }}>
                      <SemanticElement element={currentHeading} />
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    p: 3
                  }}>
                    {listItems.map((item, idx) => (
                      <Box key={idx} sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2, 
                        mb: 2,
                        pb: 2,
                        borderBottom: idx < listItems.length - 1 ? '1px solid #e0e0e0' : 'none'
                      }}>
                        <Box sx={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                          mt: '2px'
                        }}>
                          ✓
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: '13px', 
                            lineHeight: 1.5,
                            color: '#333'
                          }}>
                            {item.content}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })()}
          </Box>
        );
        
      case 'two_column_list':
      case 'three_column_list':
        return (
          <Box>
            {/* Group consecutive list items together */}
            {(() => {
              const grouped = [];
              let currentGroup = { heading: null, items: [] };
              
              elements.forEach((element, idx) => {
                if (element.type === 'heading') {
                  // Save previous group if it has items
                  if (currentGroup.items.length > 0) {
                    grouped.push(currentGroup);
                  }
                  // Start new group with heading
                  currentGroup = { heading: element, items: [] };
                } else if (element.type === 'list_item') {
                  currentGroup.items.push(element);
                } else if (element.type === 'paragraph') {
                  // Treat paragraphs as potential headings if they're short
                  if (element.content.length < 100 && currentGroup.items.length === 0) {
                    currentGroup.heading = { ...element, type: 'heading', tag: 'h3' };
                  } else {
                    currentGroup.items.push(element);
                  }
                }
              });
              
              // Don't forget the last group
              if (currentGroup.items.length > 0 || currentGroup.heading) {
                grouped.push(currentGroup);
              }
              
              const cols = layout.layout === 'three_column_list' ? 4 : 6;
              
              return grouped.map((group, groupIdx) => (
                <Box key={groupIdx} sx={{ mb: 3 }}>
                  {/* Group heading */}
                  {group.heading && (
                    <Box sx={{ mb: 2 }}>
                      <SemanticElement element={group.heading} />
                    </Box>
                  )}
                  
                  {/* List items in grid */}
                  <Grid container spacing={2}>
                    {group.items.map((item, itemIdx) => (
                      <Grid item xs={cols} key={itemIdx}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 1, 
                          p: 1,
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <Box sx={{ 
                            width: '8px', 
                            height: '8px', 
                            backgroundColor: '#4caf50', 
                            borderRadius: '50%',
                            mt: '6px',
                            flexShrink: 0
                          }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.4 }}>
                              {item.content}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ));
            })()}
          </Box>
        );

      case 'centered_cta':
        return (
          <Box sx={{ textAlign: 'center', maxWidth: '400px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ textAlign: 'left' }}>
                  <SemanticElement element={element} />
                </Box>
              ))}
            </Box>
            <ButtonPlaceholder />
          </Box>
        );
        
      case 'cta_banner':
        return (
          <Box sx={{ 
            backgroundColor: '#1976d2', 
            color: 'white', 
            p: 3, 
            borderRadius: '8px',
            textAlign: 'center',
            backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {elements.map((element, idx) => (
                <Box key={idx} sx={{ color: 'white' }}>
                  <SemanticElement element={element} showTag={false} />
                </Box>
              ))}
            </Box>
            <Box sx={{
              backgroundColor: 'white',
              color: '#1976d2',
              px: 3,
              py: 1.5,
              borderRadius: '4px',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: 600
            }}>
              Call to Action Button
            </Box>
          </Box>
        );

      case 'text_block':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {elements.map((element, idx) => (
              <SemanticElement key={idx} element={element} />
            ))}
          </Box>
        );

      case 'text_sidebar':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography variant="caption">Note: Converted sidebar layout to text block for landing page</Typography>
            </Alert>
            {elements.map((element, idx) => (
              <SemanticElement key={idx} element={element} />
            ))}
          </Box>
        );

      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {elements.map((element, idx) => (
              <SemanticElement key={idx} element={element} />
            ))}
          </Box>
        );
    }
  };

  return (
    <Paper elevation={1} sx={{ mb: 3, p: 2, backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Chip label={section.templateName} size="small" color="primary" sx={{ fontSize: '10px' }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={layout.layout} size="small" variant="outlined" sx={{ fontSize: '9px' }} />
          {section.hasSemanticStructure && (
            <Chip label="Semantic HTML" size="small" color="success" sx={{ fontSize: '8px' }} />
          )}
          {template && (
            <Chip label={section.templateKey} size="small" color="secondary" sx={{ fontSize: '8px' }} />
          )}
        </Box>
      </Box>

      {/* WIREFRAME LAYOUT */}
      <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: '4px', border: '1px solid #e0e0e0' }}>
        {renderLayout()}
      </Box>

      {/* Section Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '9px' }}>
          Section {index + 1} • {elements.length} elements • {layout.layout}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {layout.hasImage && (
            <Chip label="Image Required" size="small" variant="outlined" sx={{ fontSize: '8px' }} />
          )}
          <Chip 
            label={`${elements.filter(e => e.type === 'heading').length} headings`} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '8px' }} 
          />
          <Chip 
            label={`${elements.filter(e => e.type === 'list_item').length} list items`} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '8px' }} 
          />
        </Box>
      </Box>
    </Paper>
  );
};

// Wireframe analysis component
export const WireframeAnalysis = ({ wireframeData }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>🔬 Framework Analysis & Research Patterns</Typography>
      
      {wireframeData.stats && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>📊 Universal Analysis:</strong> {wireframeData.stats.totalLines} total lines • {wireframeData.stats.bulletLines} bullets • {wireframeData.stats.headingLines} headings • {wireframeData.stats.paragraphLines} paragraphs
            <br />
            <strong>🔬 Framework Patterns:</strong> {wireframeData.stats.frameworkPatterns || 'Multiple patterns detected'}
          </Typography>
        </Alert>
      )}
      
      {wireframeData.sections.map((section, index) => (
        <Card key={section.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip label={section.templateName} color="primary" size="small" />
              <Chip label={`${section.elements.length} elements`} variant="outlined" size="small" />
              <Chip label={`${section.contentAnalysis?.totalWords || 0} words`} variant="outlined" size="small" />
              {section.contentAnalysis?.frameworkPattern && (
                <Chip 
                  label={section.contentAnalysis.frameworkPattern.toUpperCase()} 
                  color="secondary" 
                  size="small" 
                />
              )}
            </Box>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Template: {section.template?.description}</Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Research-Based Metrics:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip 
                label={`${section.contentAnalysis?.bulletCount || 0} bullets`}
                size="small"
                variant="outlined"
                color={section.contentAnalysis?.bulletCount > 0 ? 'success' : 'default'}
              />
              <Chip 
                label={`${section.contentAnalysis?.headingCount || 0} headings`}
                size="small"
                variant="outlined"
                color={section.contentAnalysis?.headingCount > 0 ? 'primary' : 'default'}
              />
              <Chip 
                label={`${section.contentAnalysis?.totalWords || 0} words`}
                size="small"
                variant="outlined"
                color={section.contentAnalysis?.totalWords > 100 ? 'warning' : 'default'}
              />
              {section.contentAnalysis?.dominantFramework && (
                <Chip 
                  label={`${section.contentAnalysis.dominantFramework} framework`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
              <strong>Framework Detection:</strong> Selected {section.templateName} using {section.contentAnalysis?.frameworkPattern || 'generic'} patterns
              {section.contentAnalysis?.bulletCount >= 3 && ' • 3+ bullets detected = list layout'}
              {section.contentAnalysis?.dominantFramework === 'aida' && ' • AIDA framework patterns'}
              {section.contentAnalysis?.dominantFramework === 'pas' && ' • PAS framework patterns'}
              {section.type === 'hero' && ' • Hero section patterns from landing page research'}
              {section.type === 'cta' && ' • Call-to-action patterns detected'}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};