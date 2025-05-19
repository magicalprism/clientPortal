'use client';
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Handle, Position } from 'reactflow';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';

export const NODE_THEME_COLOR = '#6366f1';

const NodeWrapper = ({
  id,
  mode,
  config,
  data = {},
  isConnectable,
  collectionName,   // <-- NEW
  refField,          // <-- NEW
  backgroundColor = 'background.paper',
  label,
  textColor = "#201e1e",
  hasImage = true,
  width = 140,
  height = 170,
  centerContentVertically = false,
  icon,
  onClick
}) => {
    const { openModal } = useModal();
    const supabase = createClient();
    const fullConfig = config?.name ? collections[config.name] || config : collections[collectionName];

const handleClick = async (e) => {
  if (mode === 'edit') {
    e.stopPropagation();

    const { data, error } = await supabase
      .from(fullConfig.name)
      .select('*')
      .eq('id', id)
      .single();


    openModal('edit', {
      config: fullConfig,
      defaultValues: data,

    });
  }
};
    
  const titleWords = (data?.title || label || 'Untitled').split(' ');
const formattedTitle = titleWords.slice(0, 2).join(' ') + (titleWords.length > 2 ? '…' : '');

      
      

  return (
    <Box
      onClick={(e) => {
        if (mode === 'edit') {
          e.stopPropagation();
          onClick?.(id); // 👈 enable external click handling
          handleClick?.(e); // 👈 retain internal modal logic
        }
      }}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: mode === 'edit' ? 'pointer' : 'move',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: backgroundColor,
          borderRadius: 1,
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          textAlign: 'center',
          px: 1,
     
        }}
      >
        {/* Top handle + add icon */}
        <Box sx={{ position: 'absolute', top: -15, left: 'calc(50% - 12px)', width: 24, height: 24 }}>
          <Handle
            type="target"
            position={Position.Top}
            isConnectable
            style={{ background: 'transparent', width: '100%', height: '100%', border: 'none' }}
          />
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 24,
              height: 24,
              backgroundColor: '#e0f2fe',
              color: NODE_THEME_COLOR,
              fontSize: 16,
              fontWeight: 'bold',
              zIndex: 20,
              lineHeight: 1,
              borderRadius: '50%',
              p: 0,
              '&:hover': {
                backgroundColor: '#bfdbfe',
              },
            }}
            disableRipple
          >
            +
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            alignItems: centerContentVertically ? 'center' : 'stretch',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Box
  sx={{
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: hasImage && data.thumbnailUrl ? 'space-between' : 'center', // ⬅️ key change
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'hidden',
  }}
>
      {/* Icon or image */}
      {icon ? (
        <Box sx={{ mt: 2, mb: 0 }}>
          {icon}
        </Box>
      ) : hasImage && data.thumbnailUrl ? (
        <Box sx={{ width: '100%', height: '120px', overflow: 'hidden' }}>
          <img
            src={data.thumbnailUrl}
            alt={data.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      ) : null}


  {/* Always show title */}
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '40px',
      width: '100%',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        lineHeight: 1.1,
        fontWeight: 500,
        fontSize: '0.75rem',
        color: textColor,
        whiteSpace: 'normal',
        textAlign: 'center',
        display: '-webkit-box',
        WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    textOverflow: 'ellipsis',
      }}
    >
      {formattedTitle}
    </Typography>
  </Box>
</Box>

        </Box>

        {/* Status bar */}
        {data?.status && (
          <Box
            sx={{
              width: '100%',
              height: 4,
              backgroundColor: data.backgroundColor,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              position: 'relative',
   
            }}
          />
        )}

        {/* Bottom handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable
          style={{
            background: 'gray',
            zIndex: 20,
            width: 10,
            height: 10,
            borderRadius: '50%',
            marginTop: '6px',
          }}
        />
      </Box>
    </Box>
  );
};

export default NodeWrapper;
