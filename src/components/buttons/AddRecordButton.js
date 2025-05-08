import { useRouter } from 'next/navigation';
import { modalCreateWithRef } from '@/lib/utils/links/modalCreateWithRef';
import { IconButton, Button } from '@mui/material';
import { Plus } from '@phosphor-icons/react';

export default function AddRecordButton({
  refField,
  id,
  label,
  variant = 'icon',
  fields = {},
  type = 'task' // ✅ Add support for modal type
}) {
  const router = useRouter();

  const handleClick = () => {
    console.log('🧪 AddRecordButton clicked!');

    const fieldParams = Object.entries(fields)
      .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
      .join('');

    let url;

    if (refField) {
      url = `?modal=create&type=${type}&refField=${refField}&id=${id}${fieldParams}`;
    } else {
      url = `?modal=create&type=${type}${fieldParams}`;
    }

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    console.log('🧭 Computed URL:', `${currentPath}${url}`);
    router.push(`${currentPath}${url}`);
  };

  if (variant === 'icon') {
    return (
      <IconButton onClick={handleClick}>
        <Plus />
      </IconButton>
    );
  }

  return (
    <Button onClick={handleClick} startIcon={<Plus />}>
      {label || 'Add'}
    </Button>
  );
}
