'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SubmitPostContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SubmitPostContext = createContext<SubmitPostContextType | undefined>(undefined);

export function SubmitPostProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <SubmitPostContext.Provider
      value={{
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </SubmitPostContext.Provider>
  );
}

export function useSubmitPost() {
  const context = useContext(SubmitPostContext);
  if (context === undefined) {
    throw new Error('useSubmitPost must be used within a SubmitPostProvider');
  }
  return context;
}
