import React, { PropsWithChildren, forwardRef } from 'react';
import classNames from 'classnames';

interface TriggerProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  className?: string; 
  disabled?: boolean; 
  ariaControls?: string; 
}

const CollapsibleTrigger = forwardRef<HTMLButtonElement, PropsWithChildren<TriggerProps>>(
  ({ children, isOpen, setIsOpen, className, disabled, ariaControls }, ref) => {
    const handleClick = () => {
      if (setIsOpen) {
        setIsOpen(!isOpen);
      } else {
        console.warn(
          "CollapsibleTrigger: setIsOpen prop is not provided. The trigger will not toggle the collapsible."
        );
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        className={classNames('collapsible-trigger', className, {
          'cursor-not-allowed opacity-50': disabled,
        })}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={ariaControls}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {children}
      </button>
    );
  }
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export default CollapsibleTrigger;
