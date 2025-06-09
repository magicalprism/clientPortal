// app/dashboard/organize-media/page.js
'use client';

import { useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

export default function OrganizeMediaPage() {
  const supabase = createClient();
  const [mediaItems, setMediaItems] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

const fetchMedia = async () => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .in('status', ['unsorted', 'pending'])
    .order('created_at', { ascending: false });

  if (!error && data) {
    await enhanceWithGuesses(data);
  }
};

const enhanceWithGuesses = async (mediaItems) => {
  const enhanced = await Promise.all(
    mediaItems.map(async (item) => {
      const domain = item.source_email?.split('@')[1] || null;
      let guessedCompany = null;
      let guessedContact = null;

      if (domain) {
        const { data: company } = await supabase
          .from('company')
          .select('id, title, domain')
          .ilike('domain', `%${domain}%`)
          .single();

        if (company) guessedCompany = company;
      }

      if (item.source_email) {
        const { data: contact } = await supabase
          .from('contact')
          .select('id, title, email')
          .ilike('email', item.source_email)
          .single();

        if (contact) guessedContact = contact;
      }

      return {
        ...item,
        guessedCompanyTitle: guessedCompany?.title || null,
        guessedContactTitle: guessedContact?.title || null,
      };
    })
  );

  setMediaItems(enhanced);
};


  const handleAddMedia = async () => {
    if (!newUrl) return;
    setLoading(true);

    const { error } = await supabase.from('media').insert({
      url: newUrl,
      source_email: newEmail,
      title: newTitle,
      status: 'unsorted',
      source_type: 'drive_link',
      received_at: new Date().toISOString()
    });

    if (!error) {
      setNewUrl('');
      setNewEmail('');
      setNewTitle('');
      fetchMedia();
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Organize Unsorted Media
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Drive or File URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Source Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddMedia}
                  disabled={loading || !newUrl}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Guessed Company</TableCell>
<TableCell>Guessed Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mediaItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title || 'Untitled'}</TableCell>
                  <TableCell>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.url?.slice(0, 40)}...
                    </a>
                  </TableCell>
                  <TableCell>{item.source_email}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{new Date(item.received_at).toLocaleString()}</TableCell>
                  <TableCell>{item.guessedCompanyTitle || '—'}</TableCell>
<TableCell>{item.guessedContactTitle || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Container>
  );
}
