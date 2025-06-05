'use client';
import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const openModal = (type, props = {}) => {
    setModal({ type, props });
  };

  const closeModal = () => {
    setModal(null);
  };

  // New function to close modal and trigger refresh
  const closeModalWithRefresh = () => {
    // Trigger refresh callback if provided
    if (modal?.props?.onRefresh) {
      modal.props.onRefresh();
    }
    setModal(null);
  };

  return (
    <ModalContext.Provider value={{ 
      modal, 
      openModal, 
      closeModal,
      closeModalWithRefresh 
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);