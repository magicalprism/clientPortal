'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { useEffect, useCallback } from 'react';

export const RichTextField = ({ value = '', editable = false, onChange = () => {} }) => {
  // Create a memoized update handler to prevent unnecessary re-renders
  const handleUpdate = useCallback(({ editor }) => {
    const html = editor.getHTML();
    // Only trigger onChange if content actually changed
    if (html !== value) {
      console.log('Rich text content updated, triggering onChange');
      onChange(html);
    }
  }, [onChange, value]);

  const editor = useEditor({
    content: value || '',
    editable,
    extensions: [StarterKit],
    onUpdate: handleUpdate
  });

  // Force update the editor when the value prop changes from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      console.log('Updating editor content from prop');
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // Make sure we update the editable state if it changes
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) return null;

  const Toolbar = () => (
    <ButtonGroup size="small" sx={{ mb: 1 }}>
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive('bold') ? 'contained' : 'outlined'}
      >
        Bold
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive('italic') ? 'contained' : 'outlined'}
      >
        Italic
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editor.isActive('bulletList') ? 'contained' : 'outlined'}
      >
        List
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}
      >
        H2
      </Button>
      <Button onClick={() => editor.chain().focus().undo().run()}>Undo</Button>
      <Button onClick={() => editor.chain().focus().redo().run()}>Redo</Button>
    </ButtonGroup>
  );

  // Add a save button for explicit saving in addition to automatic updates
  const SaveButton = () => (
    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
      <Button 
        variant="contained" 
        size="small"
        onClick={() => {
          const html = editor.getHTML();
          console.log('Manual save triggered');
          onChange(html);
        }}
      >
        Save
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        border: editable ? '1px solid #ddd' : 'none',
        borderRadius: 1,
        p: editable ? 2 : 0,
        backgroundColor: editable ? '#fafafa' : 'transparent'
      }}
    >
      {editable && <Toolbar />}

      {editable ? (
        <>
          <EditorContent editor={editor} className="tiptap" />
          <SaveButton />
        </>
      ) : (
        <Typography
          variant="body2"
          component="div"
          className="tiptap"
          sx={{ whiteSpace: 'normal' }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
    </Box>
  );
};