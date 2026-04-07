import React, { createContext, useContext, type ReactNode } from 'react';

export type SalesLeadFormPayload = {
  name: string;
  whatsapp: string;
  city: string;
  needs: string;
  size: string;
  notes: string;
};

type LandingIntegrationValue = {
  persistLead: ((payload: SalesLeadFormPayload) => Promise<void>) | null;
  openCheckoutModal: (() => void) | null;
};

const LandingIntegrationContext = createContext<LandingIntegrationValue>({
  persistLead: null,
  openCheckoutModal: null,
});

export function LandingIntegrationProvider({
  children,
  persistLead,
  openCheckoutModal,
}: {
  children: ReactNode;
  persistLead: (payload: SalesLeadFormPayload) => Promise<void>;
  openCheckoutModal?: () => void;
}) {
  return (
    <LandingIntegrationContext.Provider value={{ persistLead, openCheckoutModal: openCheckoutModal ?? null }}>
      {children}
    </LandingIntegrationContext.Provider>
  );
}

export function useLandingIntegration(): LandingIntegrationValue {
  return useContext(LandingIntegrationContext);
}
