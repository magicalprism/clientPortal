'use client';
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Handle, Position } from 'reactflow';
import NodeWrapper from './NodeWrapper';

const PageNode = React.memo(({ data, id, isConnectable, mode }) => {
  const handleClick = (e) => {
    if (mode === 'edit') {
      e.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('modal', 'edit');
      url.searchParams.set('id', id);
      window.history.pushState({}, '', url);
    }
  };

  return (
    
    <Box
      onClick={handleClick}
      
      sx={{
        width: '100%',
        height: '100%',
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: mode === 'edit' ? 'pointer' : 'move',
      }}
    >
      <Box
        sx={{
          width: 140,
          height: 170,
          bgcolor: 'background.paper',
          padding: '0 0 10px',
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
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            left: 'calc(50% - 12px)',
            width: 24,
            height: 24,
            zIndex: 10,
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={true}
            style={{
              background: 'transparent',
              width: '100%',
              height: '100%',
              border: 'none',
            }}
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
              color: '#3b82f6',
              fontSize: 16,
              fontWeight: 'bold',
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

        <Box
          sx={{
            mt: 1,
            width: '100%',
            height: '100%',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {data.thumbnailUrl ? (
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 4 }}
            >
              No image
            </Typography>
          )}
        </Box>

        <Typography
          variant="caption"
          sx={{
            mt: 1,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.secondary',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            maxWidth: 120,
          }}
        >
          {data.title}
        </Typography>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={true}
          style={{
            background: 'gray',
            zIndex: 10,
            width: 10,
            height: 10,
            borderRadius: '50%',
            marginTop: '6px',
          }}
        />
        {data?.backgroundColor && (
  <Box
    sx={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: data.backgroundColor,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    }}
  />
)}
      </Box>
    </Box>
  );
});

export default PageNode;
