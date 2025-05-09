import { IconButton, Button } from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useModal } from '@/components/modals/ModalContext';

export default function AddRecordButton({
  config,
  defaultValues = {},
  label,
  variant = 'icon'
}) {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal('create', {
      config,
      defaultValues
    });
  };

  if (variant === 'icon') {
    return (
      <IconButton onClick={handleClick}>
        <Plus />
      </IconButton>
    );
  }

  // Use "Add [SingularLabel]" fallback if no label prop
  const buttonLabel = label || `Add ${config?.singularLabel || config?.label || 'Item'}`;

  return (
    <Button onClick={handleClick} startIcon={<Plus />}>
      {buttonLabel}
    </Button>
  );
}
