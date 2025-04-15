'use client';

import { IconButton } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';

export const EditButton = ({ record, config }) => {
  const router = useRouter();
  const pathname = usePathname();

  const openMode = config?.openMode || 'page';
  const href = config?.editPathPrefix
    ? `${config.editPathPrefix}/${record.id}`
    : `/${config.name}/${record.id}`;

  const handleClick = () => {
    if (openMode === 'modal') {
      router.push(`${pathname}?modal=edit&id=${record.id}`);
    } else {
      router.push(href);
    }
  };

  return (
    <IconButton onClick={handleClick} size="small">
      <PencilIcon size={16} />
    </IconButton>
  );
};
