// src/contexts/collection-selection-context.js
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSelection } from '@/hooks/use-selection';


function noop() {}

const CollectionSelectionContext = createContext({
  deselectAll: noop,
  deselectOne: noop,
  selectAll: noop,
  selectOne: noop,
  selected: new Set(),
  selectedAny: false,
  selectedAll: false,
});

export function CollectionSelectionProvider({ children, ids = [] }) {
  const selection = useSelection(ids);

  return (
    <CollectionSelectionContext.Provider value={selection}>
      {children}
    </CollectionSelectionContext.Provider>
  );
}

export function useCollectionSelection() {
  return useContext(CollectionSelectionContext);
}
