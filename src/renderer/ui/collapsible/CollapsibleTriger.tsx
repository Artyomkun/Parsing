import React, { PropsWithChildren } from 'react';

interface TriggerProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const CollapsibleTrigger: React.FC<PropsWithChildren<TriggerProps>> = ({ 
  children, 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <button 
      className="collapsible-trigger" 
      onClick={() => setIsOpen?.(!isOpen)}
      aria-expanded={isOpen}
    >
      {children}
    </button>
  );
};

export default CollapsibleTrigger;