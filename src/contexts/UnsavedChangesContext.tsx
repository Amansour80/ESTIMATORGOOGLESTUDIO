import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type EstimatorType = 'hk' | 'fm' | 'retrofit' | null;

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  currentEstimator: EstimatorType;
  setUnsavedChanges: (estimator: EstimatorType, hasChanges: boolean) => void;
  checkUnsavedBeforeNavigation: (targetTab: string) => boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentEstimator, setCurrentEstimator] = useState<EstimatorType>(null);

  const setUnsavedChanges = (estimator: EstimatorType, hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
    setCurrentEstimator(hasChanges ? estimator : null);
  };

  const checkUnsavedBeforeNavigation = (targetTab: string): boolean => {
    if (hasUnsavedChanges && currentEstimator && targetTab !== currentEstimator) {
      const estimatorName = currentEstimator === 'hk' ? 'HK Estimator' :
                           currentEstimator === 'fm' ? 'FM Estimator' :
                           'Retrofit Estimator';
      return confirm(`You have unsaved changes in the ${estimatorName}. Are you sure you want to leave? All unsaved changes will be lost.`);
    }
    return true;
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentEstimator) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentEstimator]);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, currentEstimator, setUnsavedChanges, checkUnsavedBeforeNavigation }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return context;
}
