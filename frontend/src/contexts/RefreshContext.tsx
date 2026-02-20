/**
 * Refresh context for triggering data reload across screens.
 *
 * Provides a shared state to signal that data should be refreshed,
 * used after create/update/delete operations to keep all screens in sync.
 *
 * @module RefreshContext
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Shape of the refresh context value.
 */
type RefreshContextType = {
  refreshTrigger: number;
  isRefreshing: boolean;
  triggerRefresh: () => void;
  setIsRefreshing: (value: boolean) => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return (
    <RefreshContext.Provider value={{ refreshTrigger, isRefreshing, triggerRefresh, setIsRefreshing }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }
  return context;
};
