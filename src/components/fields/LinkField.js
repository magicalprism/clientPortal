'use client';

import { ArrowSquareOut } from '@phosphor-icons/react';

export const LinkField = ({ value, field }) => {
  if (!value) return '—';

  // If displayLabel is a string, use it; otherwise fallback to the actual URL
  const label = typeof field.displayLabel === 'string' ? field.displayLabel : value;

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#1976d2',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        wordBreak: 'break-word',
        textDecoration: 'none',
      }}
    >
      {label}
      <ArrowSquareOut size={14} />
    </a>
  );
};
