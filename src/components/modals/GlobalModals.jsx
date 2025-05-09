'use client';
import { useModal } from '@/components/modals/ModalContext';
import CollectionModal from '@/components/modals/CollectionModal';

export default function GlobalModals() {
  const { modal, closeModal } = useModal();

  if (!modal) return null;

  if (modal.type === 'create' || modal.type === 'edit') {
    return (
      <CollectionModal
        open
        onClose={closeModal}
        config={modal.props.config}
        defaultValues={modal.props.defaultValues}
        record={modal.type === 'edit' ? modal.props.defaultValues : {}}
      />
    );
  }
  

  return null;
}
