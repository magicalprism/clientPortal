'use client';

import { useEffect, useRef } from 'react';
import { Typography } from '@mui/material';

function getPostgresTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}+00`;
}

export const TimestampField = ({ field, mode, editable, onChange, value }) => {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!editable || triggeredRef.current) return;

    const now = getPostgresTimestamp();

    if (
      (field.name === 'created_on' && mode === 'create' && !value) ||
      (field.name === 'updated_on' && value !== now)
    ) {
      console.log(`🕒 Setting ${field.name} to ${now}`);
      triggeredRef.current = true;
      onChange(field, now);
    }
  }, [editable, mode, field.name, onChange, value]);

  if (!value) {
    return <Typography variant="body2">—</Typography>;
  }

  return (
    <Typography variant="body2">
      {typeof value === 'string' || typeof value === 'number'
        ? new Date(value).toLocaleString()
        : '—'}
    </Typography>
  );
};
