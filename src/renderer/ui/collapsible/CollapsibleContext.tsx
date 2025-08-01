// src/renderer/ui/collapsible/CollapsibleContext.tsx
import * as React from "react";

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

export const CollapsibleProvider = CollapsibleContext.Provider;

export function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "useCollapsibleContext must be used within a Collapsible"
    );
  }
  return context;
}

export default CollapsibleContext;