'use client';
import React, { useState, useEffect } from 'react';
import { useModal } from '@/components/modals/ModalContext';
import CollectionModal from '@/components/modals/CollectionModal';
import { TaskModal } from '@/components/dashboard/tasks/modal';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

export default function GlobalModals() {
  const { modal, closeModal, closeModalWithRefresh, openModal } = useModal();
  
  // Always define hooks at the top level, even if they're only used conditionally
  const [taskRecord, setTaskRecord] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch task data when needed
  useEffect(() => {
    // Only fetch if we have a modal and it's a task edit
    if (!modal) return;
    
    const isTaskModal = 
      modal.type === 'task' || 
      (modal.type === 'edit' && modal.props.config && modal.props.config.name === 'task');
      
    if (!isTaskModal) return;
    
    // Initialize the record based on modal type
    if (modal.type === 'task') {
      setTaskRecord(modal.props.record || {});
      return; // No need to fetch for 'task' type
    }
    
    // For 'edit' type with task config, fetch the data
    if (modal.type === 'edit' && modal.props.recordId) {
      const fetchTaskData = async () => {
        try {
          setIsLoading(true);
          // Import the fetchTaskById function
          const { fetchTaskById } = await import('@/lib/supabase/queries/table/task');
          const { data, error } = await fetchTaskById(modal.props.recordId);
          
          if (error) {
            console.error('Error fetching task data:', error);
            return;
          }
          
          if (data) {
            setTaskRecord({ 
              ...data,
              // Add any additional fields from defaultValues
              ...(modal.props.defaultValues || {})
            });
          }
        } catch (error) {
          console.error('Error fetching task data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTaskData();
    }
  }, [modal]);
  
  if (!modal) return null;
  
  // Determine if this is a task modal
  const isTaskModal = 
    modal.type === 'task' || 
    (modal.type === 'edit' && modal.props.config && modal.props.config.name === 'task');
  
  // Show loading state while fetching task data
  if (isTaskModal && isLoading) {
    return (
      <Dialog
        maxWidth="md"
        open={true}
        sx={{
          "& .MuiDialog-container": { justifyContent: "center" },
          "& .MuiDialog-paper": { height: "90%", width: "90%", maxWidth: "1200px" },
        }}
      >
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }
  
  // Render task modal
  if (isTaskModal) {
    return (
      <TaskModal
        open
        onClose={closeModal}
        config={modal.props.config}
        record={taskRecord}
        onUpdate={(updatedRecord) => {
          // Check if this is a special update to open a subtask
          if (updatedRecord && updatedRecord.__openSubtask) {
            console.log("GlobalModals: Opening subtask:", updatedRecord.subtaskId);
            
            // Close the current modal first
            closeModal();
            
            // Then open the subtask modal
            setTimeout(() => {
              // Use the extracted openModal function
              openModal('edit', {
                config: modal.props.config,
                recordId: updatedRecord.subtaskId,
                // Pass the parent task info for breadcrumbs
                parentTask: updatedRecord.parentTask,
                onRefresh: modal.props.onRefresh
              });
            }, 100);
            
            return;
          }
          
          // Normal update handling
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
          console.log('GlobalModals: Task deleted:', deletedId);
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

  // Standard collection modals for non-task collections
  if (modal.type === 'create' || modal.type === 'edit') {
    return (
      <CollectionModal
        open
        onClose={closeModal}
        config={modal.props.config}
        defaultValues={modal.props.defaultValues}
        record={modal.type === 'edit' ? { id: modal.props.recordId, ...(modal.props.defaultValues || {}) } : {}}
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