import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

// Убрали export перед объявлением компонента
const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  className,
  defaultOpen = false,
  disabled = false,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  const toggleCollapsible = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-300",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <button
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
        disabled={disabled}
        className={cn(
          "w-full flex justify-between items-center p-4",
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
          disabled && "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-not-allowed"
        )}
        onClick={toggleCollapsible}
      >
        <span className="font-medium text-left">{title}</span>
        <span className={cn(
          "transform transition-transform duration-300",
          isOpen ? "rotate-180" : "rotate-0"
        )}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      
      <div
        id="collapsible-content"
        ref={contentRef}
        aria-hidden={!isOpen}
        className={cn(
          "bg-white dark:bg-gray-900 overflow-hidden",
          "transition-all duration-300 ease-in-out"
        )}
        style={{
          maxHeight: `${contentHeight}px`,
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// Добавили экспорт по умолчанию
export default Collapsible;