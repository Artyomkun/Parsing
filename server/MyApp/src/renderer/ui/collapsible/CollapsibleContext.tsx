import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import classNames from "classnames";

// ---- 1. Создаём контекст ----
interface CollapsibleContextType {
  open: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

export const CollapsibleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(prev => !prev);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      {children}
    </CollapsibleContext.Provider>
  );
};

// ---- 2. Хуки для использования контекста ----
export const useCollapsibleState = () => {
  const context = useContext(CollapsibleContext);
  if (!context) throw new Error("useCollapsibleState must be used within CollapsibleProvider");
  return { open: context.open, isAnimating: false }; // можно добавить анимацию
};

export const useCollapsibleControls = () => {
  const context = useContext(CollapsibleContext);
  if (!context) throw new Error("useCollapsibleControls must be used within CollapsibleProvider");
  return { toggle: context.toggle };
};

// ---- 3. Компонент Collapsible ----
interface CollapsibleProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ title, children, className }) => {
  const { open: contextOpen } = useCollapsibleState();
  const { toggle } = useCollapsibleControls();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);

  // Автоматически обновляем высоту контента при раскрытии
  useEffect(() => {
    if (contextOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [contextOpen, children]);

  return (
    <div className={classNames("border rounded-md overflow-hidden", className)}>
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary rounded-t-md"
      >
        <span className="font-medium">{title}</span>
        <span className={classNames("transition-transform duration-300", { "rotate-180": contextOpen })}>
          {contextOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-900"
        style={{ maxHeight: height === "auto" ? "auto" : `${height}px` }}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
