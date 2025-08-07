import * as React from "react";

// Расширенный интерфейс контекста
interface CollapsibleContextValue {
  // Базовые свойства
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Дополнительные состояния
  isAnimating: boolean;
  isDisabled?: boolean;
  
  // Метаданные
  id?: string;
  level?: number;
  
  // Методы управления
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  
  // Конфигурация
  animationDuration: number;
  persistent?: boolean;
  
  // Дополнительные callbacks
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

// Начальное состояние контекста
const initialState: CollapsibleContextValue = {
  open: false,
  isAnimating: false,
  animationDuration: 300,
  onOpenChange: () => {},
  toggle: () => {},
  expand: () => {},
  collapse: () => {},
};

// Создание контекста с начальным состоянием
const CollapsibleContext = React.createContext<CollapsibleContextValue>(initialState);

// Интерфейс для провайдера
interface CollapsibleProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  id?: string;
  level?: number;
  persistent?: boolean;
  animationDuration?: number;
  onOpenChange?: (open: boolean) => void;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

export const CollapsibleProvider: React.FC<CollapsibleProviderProps> = ({
  children,
  defaultOpen = false,
  isDisabled = false,
  id,
  level = 0,
  persistent = false,
  animationDuration = 300,
  onOpenChange,
  onAnimationStart,
  onAnimationComplete,
}) => {
  // Состояния
  const [open, setOpen] = React.useState<boolean>(() => {
    if (persistent && id) {
      const saved = localStorage.getItem(`collapsible-${id}`);
      return saved ? JSON.parse(saved) : defaultOpen;
    }
    return defaultOpen;
  });
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Эффект для сохранения состояния
  React.useEffect(() => {
    if (persistent && id) {
      localStorage.setItem(`collapsible-${id}`, JSON.stringify(open));
    }
  }, [open, persistent, id]);

  // Обработчики анимации
  const handleAnimationStart = React.useCallback(() => {
    setIsAnimating(true);
    onAnimationStart?.();
  }, [onAnimationStart]);

  const handleAnimationComplete = React.useCallback(() => {
    setIsAnimating(false);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  // Методы управления
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (isDisabled) return;
    
    handleAnimationStart();
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    
    // Устанавливаем таймер для завершения анимации
    setTimeout(handleAnimationComplete, animationDuration);
  }, [isDisabled, animationDuration, onOpenChange, handleAnimationStart, handleAnimationComplete]);

  const toggle = React.useCallback(() => {
    handleOpenChange(!open);
  }, [open, handleOpenChange]);

  const expand = React.useCallback(() => {
    handleOpenChange(true);
  }, [handleOpenChange]);

  const collapse = React.useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Мемоизированное значение контекста
  const value = React.useMemo(() => ({
    open,
    onOpenChange: handleOpenChange,
    isAnimating,
    isDisabled,
    id,
    level,
    toggle,
    expand,
    collapse,
    animationDuration,
    persistent,
    onAnimationStart,
    onAnimationComplete,
  }), [
    open,
    handleOpenChange,
    isAnimating,
    isDisabled,
    id,
    level,
    toggle,
    expand,
    collapse,
    animationDuration,
    persistent,
    onAnimationStart,
    onAnimationComplete,
  ]);

  return (
    <CollapsibleContext.Provider value={value}>
      {children}
    </CollapsibleContext.Provider>
  );
};

// Хук с проверкой типов
export function useCollapsible() {
  const context = React.useContext(CollapsibleContext);

  if (!context) {
    throw new Error("useCollapsible must be used within a CollapsibleProvider");
  }
  
  return context;
}

// Дополнительные хуки для конкретных значений
export function useCollapsibleState() {
  const { open, isAnimating } = useCollapsible();
  return { open, isAnimating };
}

export function useCollapsibleControls() {
  const { toggle, expand, collapse } = useCollapsible();
  return { toggle, expand, collapse };
}

export function useCollapsibleConfig() {
  const { animationDuration, persistent, level, id } = useCollapsible();
  return { animationDuration, persistent, level, id };
}

export default CollapsibleContext;