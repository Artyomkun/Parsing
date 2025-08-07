import React, { PropsWithChildren } from 'react';

interface TriggerProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  className?: string; // Для добавления дополнительных стилей
  disabled?: boolean; // Для отключения кнопки
  ariaControls?: string; // For accessibility
}

const CollapsibleTrigger: React.FC<PropsWithChildren<TriggerProps>> = ({
  children,
  isOpen,
  setIsOpen,
  className,
  disabled,
  ariaControls,
}) => {
  const handleClick = () => {
    if (setIsOpen) {
      setIsOpen(!isOpen);
    } else {
      console.warn(
        "CollapsibleTrigger: setIsOpen prop is not provided.  The trigger will not toggle the collapsible."
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
      type="button" // Явно указываем type
      className={`collapsible-trigger ${className || ''}`} // Добавляем возможность стилизации
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-controls={ariaControls}
      disabled={disabled}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown} // Обрабатываем события клавиатуры
    >
      {children}
    </button>
  );
};

export default CollapsibleTrigger;