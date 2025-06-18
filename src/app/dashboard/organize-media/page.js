'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Autocomplete,
  Chip,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowCounterClockwise } from '@phosphor-icons/react';

export default function OrganizeMediaPage() {
  const supabase = createClient();
  
  // State for media items
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for new media form
  const [newUrl, setNewUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTitle, setNewTitle] = useState('');
  
  // State for dropdown options
  const [allCompanies, setAllCompanies] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [allElements, setAllElements] = useState([]);

  // Undo functionality state
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [showRecentActions, setShowRecentActions] = useState(true);

  // Fetch all reference data with better error handling
  const fetchOptions = useCallback(async () => {
    try {
      console.log('Fetching reference data...');
      
      // Test basic connectivity first
      const { data: testData, error: testError } = await supabase
        .from('company')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connectivity test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      // Fetch all data in parallel with detailed error checking
      const queries = [
        { 
          name: 'companies',
          query: supabase.from('company').select('id, title').eq('is_client', true).order('title')
        },
        { 
          name: 'projects',
          query: supabase.from('project').select('id, title, company_id').order('title')
        },
        { 
          name: 'contacts',
          query: supabase.from('contact').select('id, title, email').order('title')
        },
        { 
          name: 'elements',
          query: supabase.from('element').select('id, title, project_id, company_id').order('title')
        }
      ];

      const results = await Promise.all(queries.map(async ({ name, query }) => {
        try {
          const result = await query;
          if (result.error) {
            console.error(`Error fetching ${name}:`, result.error);
            throw new Error(`Failed to fetch ${name}: ${result.error.message}`);
          }
          console.log(`Successfully fetched ${result.data?.length || 0} ${name}`);
          return { name, data: result.data || [] };
        } catch (err) {
          console.error(`Exception fetching ${name}:`, err);
          throw new Error(`Exception fetching ${name}: ${err.message}`);
        }
      }));

      // Set the data
      results.forEach(({ name, data }) => {
        switch (name) {
          case 'companies':
            setAllCompanies(data);
            break;
          case 'projects':
            setAllProjects(data);
            break;
          case 'contacts':
            setAllContacts(data);
            break;
          case 'elements':
            setAllElements(data);
            break;
        }
      });

      console.log('All reference data loaded successfully');
    } catch (err) {
      console.error('Error in fetchOptions:', err);
      setError(`Failed to load reference data: ${err.message}`);
    }
  }, [supabase]);

  // Fetch unsorted media (excluding deleted items)
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching unsorted media...');
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .in('status', ['unsorted', 'pending'])
        .neq('is_deleted', true) // Exclude deleted items
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching media:', error);
        throw new Error(`Failed to fetch media: ${error.message}`);
      }

      console.log(`Found ${data?.length || 0} unsorted media items`);

      if (data && data.length > 0) {
        await enhanceWithGuesses(data);
      } else {
        setMediaItems([]);
      }
    } catch (err) {
      console.error('Error in fetchMedia:', err);
      setError(`Failed to load media items: ${err.message}`);
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, allCompanies, allContacts]);

  // Enhanced version with better guessing logic
  const enhanceWithGuesses = async (mediaItems) => {
    try {
      const enhanced = mediaItems.map((item) => {
        let guessedCompany = null;
        let guessedContact = null;

        // Try to guess company by email domain against company title
        if (item.source_email && allCompanies.length > 0) {
          const domain = item.source_email.split('@')[1];
          if (domain) {
            // Simple heuristic: check if domain matches company title
            guessedCompany = allCompanies.find(company => 
              company.title && company.title.toLowerCase().includes(domain.split('.')[0].toLowerCase())
            );
          }
        }

        // Try to guess contact by email
        if (item.source_email && allContacts.length > 0) {
          guessedContact = allContacts.find(contact => 
            contact.email && contact.email.toLowerCase() === item.source_email.toLowerCase()
          );
        }

        return {
          ...item,
          guessedCompany,
          guessedContact,
          selectedCompanies: guessedCompany ? [guessedCompany] : [],
          selectedProjects: [],
          selectedContacts: guessedContact ? [guessedContact] : [],
          selectedElements: []
        };
      });

      console.log(`Enhanced ${enhanced.length} media items with guesses`);
      setMediaItems(enhanced);
    } catch (err) {
      console.error('Error enhancing media items:', err);
      setMediaItems(mediaItems); // Fallback to unenhanced items
    }
  };

  // Get filtered projects based on selected companies
  const getFilteredProjects = (selectedCompanies) => {
    if (!selectedCompanies || selectedCompanies.length === 0) {
      return allProjects;
    }
    const companyIds = selectedCompanies.map(company => company.id);
    return allProjects.filter(project => 
      companyIds.includes(project.company_id)
    );
  };

  // Get filtered elements based on selected projects
  const getFilteredElements = (selectedProjects) => {
    if (!selectedProjects || selectedProjects.length === 0) {
      return allElements;
    }
    const projectIds = selectedProjects.map(project => project.id);
    return allElements.filter(element => 
      projectIds.includes(element.project_id)
    );
  };

  // Handle adding new media
  const handleAddMedia = async () => {
    if (!newUrl.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('media').insert({
        url: newUrl.trim(),
        source_email: newEmail.trim() || null,
        title: newTitle.trim() || null,
        status: 'unsorted',
        source_type: 'drive_link',
        received_at: new Date().toISOString(),
        is_deleted: false
      });

      if (error) throw error;

      // Clear form
      setNewUrl('');
      setNewEmail('');
      setNewTitle('');
      
      // Refresh media list
      await fetchMedia();
    } catch (err) {
      console.error('Error adding media:', err);
      setError(`Failed to add media item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes with cascading filters
  const handleFieldChange = (index, field, value) => {
    const updated = [...mediaItems];
    updated[index][field] = value;

    // Handle cascading filters
    if (field === 'selectedCompanies') {
      // Clear projects and elements when company changes
      updated[index].selectedProjects = [];
      updated[index].selectedElements = [];
    } else if (field === 'selectedProjects') {
      // Clear elements when project changes
      updated[index].selectedElements = [];
    }

    setMediaItems(updated);
  };

  // Handle approval with database operations and undo capability
  const handleApprove = async (item, index) => {
    try {
      // Remove from display immediately
      const updated = mediaItems.filter((_, i) => i !== index);
      setMediaItems(updated);

      // Execute approval in database
      const success = await executeApprovalInDatabase(item);
      
      if (success) {
        // Add to recently deleted for undo
        setRecentlyDeleted(prev => [{
          ...item,
          action: 'approve',
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]); // Keep last 5 for undo

        // Show success message
        setNotificationMessage(`Media approved and saved.`);
        setNotificationType('success');
        setNotificationOpen(true);
      } else {
        // On failure, add back to list
        setMediaItems(prev => [item, ...prev]);
        setError('Failed to approve media item');
      }
    } catch (err) {
      console.error('Error approving media:', err);
      // On error, add back to list
      setMediaItems(prev => [item, ...prev]);
      setError(`Failed to approve media: ${err.message}`);
    }
  };

  // Handle rejection by marking as deleted in database
  const handleReject = async (item, index) => {
    try {
      // Remove from display immediately
      const updated = mediaItems.filter((_, i) => i !== index);
      setMediaItems(updated);

      // Mark as deleted in database
      const { error } = await supabase
        .from('media')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          status: 'rejected'
        })
        .eq('id', item.id);

      if (error) throw error;

      // Add to recently deleted for undo
      setRecentlyDeleted(prev => [{
        ...item,
        action: 'reject',
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]); // Keep last 5 for undo

      // Show success message
      setNotificationMessage(`Media rejected. Will be permanently deleted after 24 hours.`);
      setNotificationType('warning');
      setNotificationOpen(true);

    } catch (err) {
      console.error('Error rejecting media:', err);
      // On error, add back to list
      setMediaItems(prev => [item, ...prev]);
      setError(`Failed to reject media: ${err.message}`);
    }
  };

  // Execute approval in database with relationships
  const executeApprovalInDatabase = async (item) => {
    try {
      const mediaId = item.id;
      const relationshipInserts = [];

      // Company relationships
      if (item.selectedCompanies?.length > 0) {
        const companyInserts = item.selectedCompanies.map(company => ({
          company_id: company.id,
          media_id: mediaId
        }));
        relationshipInserts.push(
          supabase.from('company_media').upsert(companyInserts, { onConflict: 'company_id,media_id' })
        );
      }

      // Project relationships
      if (item.selectedProjects?.length > 0) {
        const projectInserts = item.selectedProjects.map(project => ({
          project_id: project.id,
          media_id: mediaId
        }));
        relationshipInserts.push(
          supabase.from('media_project').upsert(projectInserts, { onConflict: 'media_id,project_id' })
        );
      }

      // Contact relationships
      if (item.selectedContacts?.length > 0) {
        const contactInserts = item.selectedContacts.map(contact => ({
          contact_id: contact.id,
          media_id: mediaId
        }));
        relationshipInserts.push(
          supabase.from('contact_media').upsert(contactInserts, { onConflict: 'contact_id,media_id' })
        );
      }

      // Element relationships
      if (item.selectedElements?.length > 0) {
        const elementInserts = item.selectedElements.map(element => ({
          element_id: element.id,
          media_id: mediaId
        }));
        relationshipInserts.push(
          supabase.from('element_media').upsert(elementInserts, { onConflict: 'element_id,media_id' })
        );
      }

      // Update media status
      relationshipInserts.push(
        supabase
          .from('media')
          .update({
            status: 'approved',
            title: item.title?.trim() || null,
            source_email: item.source_email?.trim() || null,
            updated_at: new Date().toISOString(),
            is_deleted: false
          })
          .eq('id', mediaId)
      );

      // Execute all operations
      const results = await Promise.all(relationshipInserts);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to save some relationships: ${errors.map(e => e.error.message).join(', ')}`);
      }

      return true;
    } catch (err) {
      console.error('Error in executeApprovalInDatabase:', err);
      throw err;
    }
  };

  // Undo the last action
  const handleUndo = async (deletedItem) => {
    try {
      if (deletedItem.action === 'approve') {
        // For approval undo, mark as unsorted again and remove relationships
        await supabase
          .from('media')
          .update({
            status: 'unsorted',
            is_deleted: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedItem.id);

        // Remove all relationships (you might want to be more selective)
        await Promise.all([
          supabase.from('company_media').delete().eq('media_id', deletedItem.id),
          supabase.from('media_project').delete().eq('media_id', deletedItem.id),
          supabase.from('contact_media').delete().eq('media_id', deletedItem.id),
          supabase.from('element_media').delete().eq('media_id', deletedItem.id)
        ]);

      } else if (deletedItem.action === 'reject') {
        // For rejection undo, unmark as deleted
        await supabase
          .from('media')
          .update({
            is_deleted: false,
            deleted_at: null,
            status: 'unsorted',
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedItem.id);
      }

      // Remove from recently deleted
      setRecentlyDeleted(prev => prev.filter(item => item.id !== deletedItem.id));
      
      // Refresh the media list to show the restored item
      await fetchMedia();
      
      setNotificationMessage('Action undone successfully');
      setNotificationType('info');
      setNotificationOpen(true);

    } catch (err) {
      console.error('Error undoing action:', err);
      setError(`Failed to undo action: ${err.message}`);
    }
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notificationOpen) {
      const timer = setTimeout(() => {
        setNotificationOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationOpen]);

  // Initial load
  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (allCompanies.length > 0 || allContacts.length > 0) {
      fetchMedia();
    }
  }, [allCompanies, allContacts, fetchMedia]);

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Organize Unsorted Media
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loaded: {allCompanies.length} companies, {allProjects.length} projects, {allContacts.length} contacts, {allElements.length} elements
          </Alert>
        )}

        {/* Add New Media Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add New Media Item
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Drive or File URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Source Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Optional title"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddMedia}
                  disabled={loading || !newUrl.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Media Items */}
        {loading && mediaItems.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading media items...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {mediaItems.map((item, index) => {
              const filteredProjects = getFilteredProjects(item.selectedCompanies);
              const filteredElements = getFilteredElements(item.selectedProjects);

              return (
                <Grid item xs={12} key={`media-${item.id}-${index}`}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={2}>
                        {/* Basic Info */}
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Title"
                            value={item.title || ''}
                            onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                            placeholder="Enter title"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Source Email"
                            value={item.source_email || ''}
                            onChange={(e) => handleFieldChange(index, 'source_email', e.target.value)}
                            placeholder="source@example.com"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          {(() => {
                            try {
                              const urlObj = new URL(item.url);
                              const domain = urlObj.hostname.replace('www.', '');
                              const displayUrl = domain + (item.url.length > 60 ? '…' : '');
                              
                              return (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    URL:
                                  </Typography>
                                  <Link 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener"
                                    sx={{ 
                                      display: 'block',
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    {displayUrl}
                                  </Link>
                                </Box>
                              );
                            } catch (e) {
                              return <Typography color="error">Invalid URL: {item.url}</Typography>;
                            }
                          })()}
                        </Grid>

                        {/* Relationship Fields */}
                        <Grid item xs={12} sm={6} md={3}>
                          <Autocomplete
                            multiple
                            options={allCompanies}
                            getOptionLabel={(option) => option.title || 'Untitled'}
                            value={item.selectedCompanies || []}
                            onChange={(e, value) => handleFieldChange(index, 'selectedCompanies', value)}
                            renderTags={(value, getTagProps) =>
                              value.map((option, i) => {
                                const { key, ...tagProps } = getTagProps({ index: i });
                                return (
                                  <Chip 
                                    key={key}
                                    label={option.title} 
                                    {...tagProps} 
                                  />
                                );
                              })
                            }
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                label="Companies"
                                helperText={item.guessedCompany ? `Suggested: ${item.guessedCompany.title}` : ''}
                              />
                            )}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Autocomplete
                            multiple
                            options={filteredProjects}
                            getOptionLabel={(option) => option.title || 'Untitled'}
                            value={item.selectedProjects || []}
                            onChange={(e, value) => handleFieldChange(index, 'selectedProjects', value)}
                            renderTags={(value, getTagProps) =>
                              value.map((option, i) => {
                                const { key, ...tagProps } = getTagProps({ index: i });
                                return (
                                  <Chip 
                                    key={key}
                                    label={option.title} 
                                    {...tagProps} 
                                  />
                                );
                              })
                            }
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                label="Projects"
                                helperText={item.selectedCompanies?.length > 0 ? `Filtered by company` : 'Select company first'}
                              />
                            )}
                            disabled={!item.selectedCompanies?.length}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Autocomplete
                            multiple
                            options={allContacts}
                            getOptionLabel={(option) => option.title || 'Untitled'}
                            value={item.selectedContacts || []}
                            onChange={(e, value) => handleFieldChange(index, 'selectedContacts', value)}
                            renderTags={(value, getTagProps) =>
                              value.map((option, i) => {
                                const { key, ...tagProps } = getTagProps({ index: i });
                                return (
                                  <Chip 
                                    key={key}
                                    label={option.title} 
                                    {...tagProps} 
                                  />
                                );
                              })
                            }
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                label="Contacts"
                                helperText={item.guessedContact ? `Suggested: ${item.guessedContact.title}` : ''}
                              />
                            )}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Autocomplete
                            multiple
                            options={filteredElements}
                            getOptionLabel={(option) => option.title || 'Untitled'}
                            value={item.selectedElements || []}
                            onChange={(e, value) => handleFieldChange(index, 'selectedElements', value)}
                            renderTags={(value, getTagProps) =>
                              value.map((option, i) => {
                                const { key, ...tagProps } = getTagProps({ index: i });
                                return (
                                  <Chip 
                                    key={key}
                                    label={option.title} 
                                    {...tagProps} 
                                  />
                                );
                              })
                            }
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                label="Elements"
                                helperText={item.selectedProjects?.length > 0 ? `Filtered by project` : 'Select project first'}
                              />
                            )}
                            disabled={!item.selectedProjects?.length}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                          />
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12}>
                          <Box display="flex" gap={2}>
                            <Button 
                              onClick={() => handleApprove(item, index)} 
                              variant="contained" 
                              color="success"
                              disabled={loading}
                            >
                              Approve & Save
                            </Button>
                            <Button 
                              onClick={() => handleReject(item, index)} 
                              variant="outlined" 
                              color="error"
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && mediaItems.length === 0 && recentlyDeleted.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No unsorted media items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add new media items using the form above
            </Typography>
          </Box>
        )}

        {/* Notification Alert */}
        {notificationOpen && (
          <Box
            position="fixed"
            top={20}
            right={20}
            zIndex={2000}
            sx={{ minWidth: 300 }}
          >
            <Alert 
              severity={notificationType}
              onClose={() => setNotificationOpen(false)}
              action={
                recentlyDeleted.length > 0 ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      handleUndo(recentlyDeleted[0]);
                      setNotificationOpen(false);
                    }}
                    startIcon={<ArrowCounterClockwise size={16} />}
                  >
                    Undo
                  </Button>
                ) : null
              }
            >
              {notificationMessage}
            </Alert>
          </Box>
        )}

        {/* Recently Deleted Items */}
        {recentlyDeleted.length > 0 && showRecentActions && (
          <Box 
            position="fixed" 
            bottom={80} 
            right={20} 
            zIndex={1000}
          >
            <Card sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption">
                  Recent Actions ({recentlyDeleted.length}):
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => setShowRecentActions(false)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  ✕
                </Button>
              </Box>
              {recentlyDeleted.slice(0, 3).map((item, i) => (
                <Box key={item.id} display="flex" alignItems="center" gap={1} mt={1}>
                  <Typography variant="caption">
                    {item.action === 'approve' ? 'Approved' : 'Rejected'}: {item.title || 'Untitled'}
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => handleUndo(item)}
                    startIcon={<ArrowCounterClockwise size={12} />}
                  >
                    Undo
                  </Button>
                </Box>
              ))}
            </Card>
          </Box>
        )}
      </Box>
    </Container>
  );
}