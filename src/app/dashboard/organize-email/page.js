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

export default function OrganizeEmailPage() {
  const supabase = createClient();
  
  // State for email items
  const [emailItems, setEmailItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for new email form
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  
  // State for dropdown options
  const [allCompanies, setAllCompanies] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

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
          name: 'categories',
          query: supabase.from('category').select('id, title').order('title')
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
          case 'categories':
            setAllCategories(data);
            break;
        }
      });

      console.log('All reference data loaded successfully');
    } catch (err) {
      console.error('Error in fetchOptions:', err);
      setError(`Failed to load reference data: ${err.message}`);
    }
  }, [supabase]);

  // Fetch unsorted emails (excluding deleted items)
  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching unsorted emails...');
      const { data, error } = await supabase
        .from('email')
        .select('*')
        .in('status', ['unsorted', 'pending'])
        .neq('is_deleted', true) // Exclude deleted items
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching emails:', error);
        throw new Error(`Failed to fetch emails: ${error.message}`);
      }

      console.log(`Found ${data?.length || 0} unsorted email items`);

      if (data && data.length > 0) {
        await enhanceWithGuesses(data);
      } else {
        setEmailItems([]);
      }
    } catch (err) {
      console.error('Error in fetchEmails:', err);
      setError(`Failed to load email items: ${err.message}`);
      setEmailItems([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Enhanced version with better guessing logic
  const enhanceWithGuesses = async (emailItems) => {
    try {
      const enhanced = emailItems.map((item) => {
        let guessedCompany = null;
        let guessedContact = null;

        // Try to guess company from title or summary
        if ((item.title || item.summary) && allCompanies.length > 0) {
          const searchText = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
          guessedCompany = allCompanies.find(company => 
            company.title && searchText.includes(company.title.toLowerCase())
          );
        }

        // Try to guess contact from title or summary
        if ((item.title || item.summary) && allContacts.length > 0) {
          const searchText = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
          guessedContact = allContacts.find(contact => 
            contact.title && searchText.includes(contact.title.toLowerCase()) ||
            contact.email && searchText.includes(contact.email.toLowerCase())
          );
        }

        return {
          ...item,
          guessedCompany,
          guessedContact,
          selectedCompanies: guessedCompany ? [guessedCompany] : [],
          selectedProjects: [],
          selectedContacts: guessedContact ? [guessedContact] : [],
          selectedCategories: []
        };
      });

      console.log(`Enhanced ${enhanced.length} email items with guesses`);
      setEmailItems(enhanced);
    } catch (err) {
      console.error('Error enhancing email items:', err);
      setEmailItems(emailItems); // Fallback to unenhanced items
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

  // Handle adding new email
  const handleAddEmail = async () => {
    if (!newTitle.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('email').insert({
        url: newUrl.trim() || null,
        title: newTitle.trim(),
        summary: newSummary.trim() || null,
        status: 'unsorted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      });

      if (error) throw error;

      // Clear form
      setNewUrl('');
      setNewTitle('');
      setNewSummary('');
      
      // Refresh email list
      await fetchEmails();
    } catch (err) {
      console.error('Error adding email:', err);
      setError(`Failed to add email item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes with cascading filters
  const handleFieldChange = (index, field, value) => {
    const updated = [...emailItems];
    updated[index][field] = value;

    // Handle cascading filters
    if (field === 'selectedCompanies') {
      // Clear projects when company changes
      updated[index].selectedProjects = [];
    }

    setEmailItems(updated);
  };

  // Handle approval with database operations and undo capability
  const handleApprove = async (item, index) => {
    try {
      // Remove from display immediately
      const updated = emailItems.filter((_, i) => i !== index);
      setEmailItems(updated);

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
        setNotificationMessage(`Email approved and saved.`);
        setNotificationType('success');
        setNotificationOpen(true);
      } else {
        // On failure, add back to list
        setEmailItems(prev => [item, ...prev]);
        setError('Failed to approve email item');
      }
    } catch (err) {
      console.error('Error approving email:', err);
      // On error, add back to list
      setEmailItems(prev => [item, ...prev]);
      setError(`Failed to approve email: ${err.message}`);
    }
  };

  // Handle rejection by changing status to rejected
  const handleReject = async (item, index) => {
    try {
      // Remove from display immediately
      const updated = emailItems.filter((_, i) => i !== index);
      setEmailItems(updated);

      // Change status to rejected in database
      const { error } = await supabase
        .from('email')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
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
      setNotificationMessage(`Email rejected.`);
      setNotificationType('warning');
      setNotificationOpen(true);

    } catch (err) {
      console.error('Error rejecting email:', err);
      // On error, add back to list
      setEmailItems(prev => [item, ...prev]);
      setError(`Failed to reject email: ${err.message}`);
    }
  };

  // Execute approval in database with relationships
  const executeApprovalInDatabase = async (item) => {
    try {
      const emailId = item.id;
      const relationshipInserts = [];

      // Company relationships
      if (item.selectedCompanies?.length > 0) {
        const companyId = item.selectedCompanies[0].id;
        
        // Update the email with the company_id
        relationshipInserts.push(
          supabase
            .from('email')
            .update({ company_id: companyId })
            .eq('id', emailId)
        );
      }

      // Project relationships
      if (item.selectedProjects?.length > 0) {
        const projectInserts = item.selectedProjects.map(project => ({
          email_id: emailId,
          project_id: project.id,
          created_at: new Date().toISOString()
        }));
        relationshipInserts.push(
          supabase.from('email_project').upsert(projectInserts, { onConflict: 'email_id,project_id' })
        );
      }

      // Contact relationships
      if (item.selectedContacts?.length > 0) {
        const contactInserts = item.selectedContacts.map(contact => ({
          email_id: emailId,
          contact_id: contact.id,
          created_at: new Date().toISOString()
        }));
        relationshipInserts.push(
          supabase.from('contact_email').upsert(contactInserts, { onConflict: 'email_id,contact_id' })
        );
      }

      // Category (tag) relationships
      if (item.selectedCategories?.length > 0) {
        const categoryInserts = item.selectedCategories.map(category => ({
          email_id: emailId,
          category_id: category.id,
          created_at: new Date().toISOString()
        }));
        relationshipInserts.push(
          supabase.from('category_email').upsert(categoryInserts, { onConflict: 'email_id,category_id' })
        );
      }

      // Update email status
      relationshipInserts.push(
        supabase
          .from('email')
          .update({
            status: 'processed',
            title: item.title?.trim() || null,
            summary: item.summary?.trim() || null,
            updated_at: new Date().toISOString(),
            is_deleted: false
          })
          .eq('id', emailId)
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
          .from('email')
          .update({
            status: 'unsorted',
            is_deleted: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedItem.id);

        // Remove all relationships
        await Promise.all([
          supabase.from('email_project').delete().eq('email_id', deletedItem.id),
          supabase.from('contact_email').delete().eq('email_id', deletedItem.id),
          supabase.from('category_email').delete().eq('email_id', deletedItem.id)
        ]);

      } else if (deletedItem.action === 'reject') {
        // For rejection undo, change status back to unsorted
        await supabase
          .from('email')
          .update({
            status: 'unsorted',
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedItem.id);
      }

      // Remove from recently deleted
      setRecentlyDeleted(prev => prev.filter(item => item.id !== deletedItem.id));
      
      // Refresh the email list to show the restored item
      await fetchEmails();
      
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
      fetchEmails();
    }
  }, [allCompanies, allContacts, fetchEmails]);

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Organize Unsorted Emails
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loaded: {allCompanies.length} companies, {allProjects.length} projects, {allContacts.length} contacts, {allCategories.length} categories
          </Alert>
        )}

        {/* Add New Email Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add New Email
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Email subject"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Summary"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief summary of email content"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="URL (optional)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://mail.google.com/..."
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddEmail}
                  disabled={loading || !newTitle.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Email Items */}
        {loading && emailItems.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading email items...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {emailItems.map((item, index) => {
              const filteredProjects = getFilteredProjects(item.selectedCompanies);

              return (
                <Grid item xs={12} key={`email-${item.id}-${index}`}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={2}>
                        {/* Basic Info */}
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Subject"
                            value={item.title || ''}
                            onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                            placeholder="Enter subject"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Summary"
                            value={item.summary || ''}
                            onChange={(e) => handleFieldChange(index, 'summary', e.target.value)}
                            placeholder="Brief summary"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          {item.url ? (
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
                                {item.url}
                              </Link>
                            </Box>
                          ) : (
                            <Typography color="text.secondary">No URL provided</Typography>
                          )}
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
                            options={allCategories}
                            getOptionLabel={(option) => option.title || 'Untitled'}
                            value={item.selectedCategories || []}
                            onChange={(e, value) => handleFieldChange(index, 'selectedCategories', value)}
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
                                label="Tags"
                              />
                            )}
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

        {!loading && emailItems.length === 0 && recentlyDeleted.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No unsorted email items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add new email items using the form above
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