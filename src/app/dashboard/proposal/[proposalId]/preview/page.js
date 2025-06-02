'use client';
import React from 'react'; 
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Button, Card, CardContent,
  Avatar, List, ListItem, ListItemText,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableHead, TableRow, Paper
} from '@mui/material';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import ProposalPricingCards from '@/components/dashboard/proposals/ProposalPricingCards';



const AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
];



export default function ProposalPreviewPage() {
  const { proposalId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
const [activeProductId, setActiveProductId] = useState(null);

  useEffect(() => {
    if (!proposalId) return;

    const loadProposal = async () => {
      try {
        const { getProposalPreviewData } = await import('@/lib/utils/proposals/getProposalPreviewData');
        const res = await getProposalPreviewData(proposalId);

        if (!res || !res.proposal) {
          throw new Error('Proposal not found');
        }

        setData(res);
      } catch (err) {
        console.error('[ProposalPreviewPage] Error loading proposal data:', err);
        setError(err.message ?? 'Failed to load proposal.');
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [proposalId]);

  const {
    proposal = {},
    contact = {},
    problems = [],
    features = [],
    products = [],
    addOns = [],
    faqs = [],
    testimonials = {}
  } = data ?? {};



const getUniqueItems = (products, key) => {
  const seen = new Set();
  const all = [];

  products.forEach(product => {
    (product[key] || []).forEach(item => {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    });
  });

  return all;
};

const groupFeaturesByType = (features = []) => {
  const groups = {};
  features.forEach((f) => {
    const type = f.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(f);
  });
  return groups;
};

const groupByType = (items = []) => {
  const groups = {};
  items.forEach(item => {
    const type = item.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
  });
  return groups;
};


const renderGroupedFeatureTable = (label, groupedFeatures, itemKey, products) => (
  <>
    <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>{label}</Typography>
    <Paper sx={{ mb: 6 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{label}</TableCell>
            {products.map(p => (
              <TableCell key={p.id} align="center">{p.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(groupedFeatures).map(([type, features]) => (
            <React.Fragment key={type}>
              {/* Type Header Row */}
              <TableRow>
                <TableCell colSpan={products.length + 1} sx={{ backgroundColor: '#f5f5f5', fontWeight: 600 }}>
                  {type}
                </TableCell>
              </TableRow>

              {/* Feature Rows */}
              {features.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.title}</TableCell>
                  {products.map((p) => {
                    const included = (p[itemKey] || []).some(i => i.id === f.id);
                    return (
                      <TableCell key={`cell-${f.id}-${p.id}`} align="center" sx={{color: 'primary.500', fontSize: '1.5rem'}}>
                        {included ? '✓' : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </>
);



const groupDeliverablesByType = (deliverables = []) => {
  const groups = {};
  deliverables.forEach((d) => {
    const type = d.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(d);
  });
  return groups;
};
const renderGroupedDeliverableTable = (label, groupedDeliverables, itemKey, products) => (
  <>
    <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>{label}</Typography>
    <Paper sx={{ mb: 6 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{label}</TableCell>
            {products.map(p => (
              <TableCell key={p.id} align="center">{p.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(groupedDeliverables).map(([type, deliverables]) => (
            <React.Fragment key={type}>
              {/* Type Header Row */}
              <TableRow>
                <TableCell colSpan={products.length + 1} sx={{ backgroundColor: '#f5f5f5', fontWeight: 600 }}>
                  {type}
                </TableCell>
              </TableRow>

              {/* Deliverable Rows */}
              {deliverables.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.title}</TableCell>
                  {products.map((p) => {
                    const included = (p[itemKey] || []).some(i => i.id === d.id);
                    return (
                      <TableCell key={`cell-${d.id}-${p.id}`} align="center" sx={{ color: 'primary.500', fontSize: '1.5rem' }}>
                        {included ? '✓' : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </>
);





const coreProducts = products;
const allDeliverables = getUniqueItems(coreProducts, 'deliverables');
const addOnProducts = products.filter(p => p.type === 'addon');
const allAddOns = addOns;
const allFeatures = getUniqueItems(coreProducts, 'features');





  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}>Loading proposal...</Box>;
  if (error) return <Box sx={{ p: 6, textAlign: 'center', color: 'error.main' }}>{error}</Box>;

console.log('[DATA] proposal:', proposal);

const renderComparisonTable = (label, items, itemKey, products) => (
  <>
    <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>{label}</Typography>
    <Paper sx={{ mb: 6 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{label}</TableCell>
            {products.map(p => (
              <TableCell key={p.id} align="center">{p.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              {products.map(p => {
                const included = (p[itemKey] || []).some(i => i.id === item.id);
                return (
                  <TableCell key={`cell-${item.id}-${p.id}`} align="center" sx={{color: 'primary.500', fontSize: '1.5rem'}}>
                    {included ? '✓' : ''}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </>
);



  return (
    <Grid>
      {/* Hero Section */}
      <Box sx={{ bgcolor: 'black', color: 'white', py: 12, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            {proposal.headline ?? 'Performance Alignment'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: '#ccc' }}>
            {proposal.subheadline ?? 'Enhance your online presence through strategy and design.'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {proposal.cta_button_label && (
              <Button variant="contained" color="primary" size="large">
                {proposal.cta_button_label}
              </Button>
            )}
            {proposal.cta_download_url && (
              <Button variant="outlined" size="large" href={proposal.cta_download_url}>
                Download
              </Button>
            )}
          </Box>

          {proposal.video_url && (
            <Box
              sx={{
                mt: 6,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(186, 85, 211, 0.6)',
                maxWidth: 720,
                mx: 'auto'
              }}
            >
              <iframe
                src={proposal.video_url}
                width="100%"
                height="400"
                title="Proposal Video"
                style={{ border: 'none' }}
                allowFullScreen
              />
            </Box>
          )}

          {/* Avatar Row */}
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            {AVATARS.map((src, idx) => (
              <Avatar key={src} src={src} sx={{ width: 56, height: 56 }} />
            ))}
            <Typography sx={{ fontWeight: 600, color: '#aaa' }}>★★★★★ Loved by industry leaders</Typography>
          </Box>
        </Container>
      </Box>

      {/* Summary Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Dear {contact?.title ?? '[Client’s Name]'},
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {proposal?.note_from_me ??
                'Thank you for considering our services. Below is a detailed quote for our proposed collaboration.'}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontFamily: 'cursive', mt: 4 }}>
              — {proposal?.signature ?? 'Our Team'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Table of Contents</Typography>
              <Typography variant="body2">01. Executive Summary</Typography>
              <Typography variant="body2">02. The Challenge</Typography>
              <Typography variant="body2">03. Goals</Typography>
              <Typography variant="body2">04. Strategy</Typography>
              <Typography variant="body2">05. Deliverables</Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Problems & Solutions */}
      {Array.isArray(problems) && problems.length > 0 ? (
        problems.map((p, idx) => {
          const title = p?.title || `[Untitled Problem ${idx + 1}]`;
          const description = p?.description || 'No description provided.';
          const solutions = Array.isArray(p?.solutions) ? p.solutions : [];

          return (
        <Container key={p?.id ?? `problem-${idx}`} maxWidth="md" sx={{ py: 8 }}>
          
          <Grid container spacing={4}>
            <Grid container>
            <Typography variant="h2" sx={{ mb: 5 }}>
                The Challenge
              </Typography>
              </Grid>
               <Grid container>
              <Typography variant="h4" sx={{ mb: 5, color: 'primary.500', fontSize: 'medium' }}>
                Key Priorities
              </Typography>
              <Typography variant="h4" sx={{ mb: 5, color: 'primary.500', fontSize: 'medium' }}>
                {p.challenges_description}
              </Typography>
              </Grid>
            <Card sx={{ p: 5, mb: 2 }}>
              <Typography variant="h5" fontWeight="600" sx={{ mb: 1 }}>
                {p.title}
              </Typography>

              <Typography variant="body1" sx={{ my: 2 }}>
                {p.description}
              </Typography>
              </Card>
               <Typography variant="h4" sx={{ my: 5, color: 'primary.500', fontSize: 'medium' }}>
                Solutions
              </Typography>
              {solutions.length > 0 ? (
                <List>
                  {solutions.map((s, sIdx) => (                   
                   <ListItem key={s?.id ?? `solution-${sIdx}`} disableGutters sx={{ mb: 4 }}>
                    <Grid container spacing={3}>
                      
                      {/* Left: Solution info */}
                      <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="flex-start">
                          <Typography color="primary" fontSize="1.7rem" sx={{ mr: 2, mt: -1.5 }}>
                            →
                          </Typography>
                          <Box>
                            <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                              {s?.title || `[Untitled Solution ${sIdx + 1}]`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {s?.description || 'No description available.'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Right: Features */}
                      <Grid item xs={12} md={7}>
                        {Array.isArray(s.features) && s.features.length > 0 ? (
                         <Grid container spacing={2}>
                            {s.features.map((f, fIdx) => (
                              <Grid item key={f.id ?? `feature-${idx}`} xs={{alignContent: 'start'}}>
                                <Accordion
                                  sx={{               
                                    borderRadius: 0,
                                    border: '1px solid #00000010'
                                  }}
                                >
                                  <AccordionSummary
                                    expandIcon={
                                    <CaretDownIcon 
                                    size={16} 
                                    color='black'
                                      
                                    />
                                  }
                                    sx={{
                                     alignItems: 'flex-start',
                                      fontWeight: 600,
                                      py: '20px',
                                      '& .MuiAccordionSummary-content': {
                                      marginY: 0,
                                      padding: 0,        // ✅ remove padding
                                      margin: 0,         // ✅ remove margin
                                    },
                                    '& .MuiAccordionSummary-contentGutters': {
                                      padding: 0,        // ✅ handles extra gutter padding
                                    },
                                      
                                    }}
                                  >
                                    <Typography fontWeight="600"  mr= "15px" color='primary.500' mt="0">
                                       ✓
                                    </Typography>
                                   
                                    <Typography fontWeight="600"  mr= "10px">
                                      {f.title || `Feature ${fIdx + 1}`}
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Typography variant="body2">
                                      {f.description || 'No description available.'}
                                    </Typography>
                                  </AccordionDetails>
                                </Accordion>
                              </Grid>
                            ))}
                          </Grid>


                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              No features linked to this solution.
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </ListItem>

                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No solutions provided for this problem.
                </Typography>
              )}
 
            </Grid>
            </Container>

          );
        })
      ) : (
        <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
          No problems found for this proposal.
        </Typography>
      )}

{products?.length > 0 && (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Typography variant="h4" sx={{ mb: 4 }}>Compare Packages</Typography>
    {renderGroupedDeliverableTable(
  'Deliverables',
  groupDeliverablesByType(allDeliverables),
  'deliverables',
  coreProducts
)}

    {renderGroupedFeatureTable('Features', groupFeaturesByType(allFeatures), 'features', coreProducts)}

    {renderComparisonTable('Add-ons', allAddOns, 'deliverables', addOnProducts)}
  </Container>
)}

{addOns.length > 0 && (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Typography variant="h4" sx={{ mb: 4 }}>Optional Add-ons</Typography>
    <Grid container spacing={4}>
      {addOns.map(addOn => {
        const groupedDeliverables = groupByType(addOn.deliverables);
        const groupedFeatures = groupByType(addOn.features);

        return (
          <Grid item xs={12} md={6} key={addOn.id}>
            <Card
              sx={{
                p: 4,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                transition: '0.3s ease',
                '&:hover': {
                  boxShadow: 6,
                  borderColor: 'primary.main',
                }
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.500', mb: 1 }}>
                  {addOn.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                  {addOn.description}
                </Typography>

                <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.700' }}>
                  {addOn.price ? `$${addOn.price}` : 'Pricing TBD'}
                </Typography>
              </Box>

             {Object.keys(groupedDeliverables).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: 'primary.700' }}>
                  Deliverables
                </Typography>
                {Object.entries(groupedDeliverables).map(([type, items]) => (
                  <Box key={type} sx={{ mb: 1 }}>
                    <Typography fontSize="0.85rem" fontWeight="600" sx={{ color: 'grey.600', mb: 0.5 }}>
                      {type}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      {items.map(d => d.title).join(', ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}


             {Object.keys(groupedFeatures).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: 'primary.700' }}>
                    Features
                  </Typography>
                  {Object.entries(groupedFeatures).map(([type, items]) => (
                    <Box key={type} sx={{ mb: 1 }}>
                      <Typography fontSize="0.85rem" fontWeight="600" sx={{ color: 'grey.600', mb: 0.5 }}>
                        {type}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                        {items.map(f => f.title).join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

            </Card>
          </Grid>

        );
      })}
    </Grid>
  </Container>
)}





      {/* FAQ */}
      {faqs?.length > 0 && (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>FAQs</Typography>
          {faqs.map((faq) => (
            <Accordion key={faq.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<CaretDownIcon size={16} />}>
                <Typography>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      )}

{products?.length > 0 && (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Typography variant="h4" sx={{ mb: 4 }}>Compare Packages</Typography>
    {renderGroupedDeliverableTable(
      'Deliverables',
      groupDeliverablesByType(allDeliverables),
      'deliverables',
      coreProducts
    )}

    {renderGroupedFeatureTable(
      'Features',
      groupFeaturesByType(allFeatures),
      'features',
      coreProducts
    )}

    {renderComparisonTable(
      'Add-ons',
      allAddOns,
      'deliverables',
      addOnProducts
    )}
  </Container>
)}

{/* Add the new pricing card component here */}
<ProposalPricingCards products={products} setActiveProductId={setActiveProductId} activeProductId={activeProductId} />




    </Grid>
  );
}
