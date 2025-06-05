'use client';
import { useModal } from '@/components/modals/ModalContext';
import CollectionModal from '@/components/modals/CollectionModal';

export default function GlobalModals() {
  const { modal, closeModal, closeModalWithRefresh } = useModal();

  if (!modal) return null;

  if (modal.type === 'create' || modal.type === 'edit') {
    return (
      <CollectionModal
        open
        onClose={closeModal}
        config={modal.props.config}
        defaultValues={modal.props.defaultValues}
        record={modal.type === 'edit' ? modal.props.defaultValues : {}}
        // Pass through refresh callbacks from the modal props
        onRefresh={modal.props.onRefresh}
        onUpdate={(updatedRecord) => {
          // Call the original update callback if provided
          if (modal.props.onUpdate) {
            modal.props.onUpdate(updatedRecord);
          }
          // Always trigger refresh after update
          if (modal.props.onRefresh) {
            modal.props.onRefresh();
          }
        }}
        onDelete={(deletedId) => {
          console.log('GlobalModals: Record deleted:', deletedId);
          // Call the original delete callback if provided
          if (modal.props.onDelete) {
            modal.props.onDelete(deletedId);
          }
          // Always trigger refresh after delete
          if (modal.props.onRefresh) {
            modal.props.onRefresh();
          }
          // Close modal
          closeModal();
        }}
      />
    );
  }
  

  return null;
}