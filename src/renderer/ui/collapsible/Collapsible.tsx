import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import * as React from 'react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  onToggle?: (isOpen: boolean) => void;
  itemCount?: number;
  level?: number;
  lazy?: boolean;
  id?: string;
  persistState?: boolean;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  className,
  defaultOpen = false,
  disabled = false,
  onToggle,
  itemCount,
  level = 0,
  lazy = false,
  id,
  persistState = false,
  expandIcon,
  collapseIcon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // Инициализация состояния из localStorage
  useEffect(() => {
    if (id && persistState) {
      const savedState = localStorage.getItem(`collapsible-${id}`);
      if (savedState) {
        setIsOpen(JSON.parse(savedState));
      }
    }
    setIsMounted(true);
  }, [id, persistState]);

  // Сохранение состояния в localStorage
  useEffect(() => {
    if (id && persistState) {
      localStorage.setItem(`collapsible-${id}`, JSON.stringify(isOpen));
    }
  }, [isOpen, id, persistState]);

  // Управление видимостью контента
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Обновление высоты контента
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  // Вызов callback'а при изменении состояния
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCollapsible();
    }
  };

  const shouldRenderContent = !lazy || isOpen || isOpen === undefined;

  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-300",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        `ml-${level * 4}`,
        !isMounted && "opacity-0",
        className
      )}
    >
      <button
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full flex justify-between items-center p-4",
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "transition-colors duration-200 focus:outline-none",
          isFocused && "ring-2 ring-primary ring-offset-2",
          disabled && "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-not-allowed"
        )}
        onClick={toggleCollapsible}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {itemCount !== undefined && (
            <span className="text-sm text-gray-500">({itemCount})</span>
          )}
        </div>
        <span className={cn(
          "transform transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          {expandIcon && collapseIcon ? (
            isOpen ? collapseIcon : expandIcon
          ) : (
            isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
          )}
        </span>
      </button>
      
      {shouldRenderContent && (
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
            opacity: isVisible ? 1 : 0
          }}
        >
          <div className="p-4">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Collapsible;