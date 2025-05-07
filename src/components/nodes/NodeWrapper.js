'use client';
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Handle, Position } from 'reactflow';
import { useRouter } from 'next/navigation';

export const NODE_THEME_COLOR = '#6366f1';

const NodeWrapper = ({
  id,
  mode,
  data = {},
  isConnectable,
  backgroundColor = 'background.paper',
  label,
  textColor = "#201e1e",
  hasImage = true,
  width = 140,
  height = 170,
  centerContentVertically = false
}) => {

    const router = useRouter(); 

    const handleClick = (e) => {
        if (mode === 'edit') {
          e.stopPropagation();
          const url = new URL(window.location.href);
          url.searchParams.set('modal', 'edit');
          url.searchParams.set('id', id);
          url.searchParams.set('refField', 'elements'); // <-- Use your actual field name here
          router.push(url.toString());
        }
      };
      

  return (
    <Box
      onClick={handleClick}
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
          {hasImage && data.thumbnailUrl ? (
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography
             
              color={textColor}
              sx={{
                fontWeight: '600',
   
              }}
            >
              {label}
            </Typography>
          )}
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
