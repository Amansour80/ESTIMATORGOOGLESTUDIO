import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Organization, Subscription, getCurrentUserOrganization, getOrganizationSubscription } from '../utils/organizationDatabase';

interface OrganizationContextType {
  organization: Organization | null;
  currentOrganization: Organization | null;
  subscription: Subscription | null;
  loading: boolean;
  refreshOrganization: () => Promise<void>;
  refreshSubscription: (orgId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async (orgId: string) => {
    const result = await getOrganizationSubscription(orgId);
    if (result.success && result.data) {
      setSubscription(result.data);
    }
  }, []);

  const refreshOrganization = useCallback(async () => {
    try {
      const result = await getCurrentUserOrganization();
      if (result.success && result.data) {
        setOrganization(result.data);
        await refreshSubscription(result.data.id);
      } else {
        console.error('Failed to load organization:', result.error);
        setOrganization(null);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      setOrganization(null);
    }
  }, [refreshSubscription]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      let retries = 0;
      const maxRetries = 3;
      const retryDelay = 1000;

      while (retries < maxRetries) {
        try {
          await refreshOrganization();
          if (organization !== null) {
            break;
          }
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } catch (error) {
          console.error(`Error in loadData (attempt ${retries + 1}):`, error);
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const value = useMemo(
    () => ({
      organization,
      currentOrganization: organization,
      subscription,
      loading,
      refreshOrganization,
      refreshSubscription
    }),
    [organization, subscription, loading, refreshOrganization, refreshSubscription]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
