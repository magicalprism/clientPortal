'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { useEffect, useCallback, useRef } from 'react';

export const RichTextField = ({ value = '', editable = false, onChange = () => {} }) => {
  const ignoreNextUpdate = useRef(false);

  const editor = useEditor({
    content: value || '',
    editable,
    extensions: [StarterKit],
    onUpdate: ({ editor }) => {
      if (ignoreNextUpdate.current) {
        ignoreNextUpdate.current = false;
        return;
      }
      const html = editor.getHTML();
      onChange(html); // ✅ Just updates parent state
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      ignoreNextUpdate.current = true;
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) return null;

  const Toolbar = () => (
    <ButtonGroup size="small" sx={{ mb: 1 }}>
      <Button onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'contained' : 'outlined'}>Bold</Button>
      <Button onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'contained' : 'outlined'}>Italic</Button>
      <Button onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'contained' : 'outlined'}>List</Button>
      <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}>H2</Button>
      <Button onClick={() => editor.chain().focus().undo().run()}>Undo</Button>
      <Button onClick={() => editor.chain().focus().redo().run()}>Redo</Button>
    </ButtonGroup>
  );

  return (
    <Box sx={{
      border: editable ? '1px solid #ddd' : 'none',
      borderRadius: 1,
      p: editable ? 2 : 0,
      backgroundColor: editable ? '#fafafa' : 'transparent'
    }}>
      {editable && <Toolbar />}
      {editable ? (
        <EditorContent editor={editor} className="tiptap" />
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
