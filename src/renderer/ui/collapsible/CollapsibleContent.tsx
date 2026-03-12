import cn from "@/lib/cn";
import * as React from "react";

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { className, children, ...rest } = props;
  const { open } = useCollapsibleContext();

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        {
          "animate-collapsible-down": open,
          "animate-collapsible-up": !open,
        },
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

// Типы для состояний анимации
type AnimationState = "idle" | "entering" | "entered" | "exiting" | "exited";

// Типы для истории изменений
interface StateChange {
  timestamp: string;
  previousState: boolean;
  newState: boolean;
  triggeredBy?: string;
}

// Расширенный интерфейс контекста
interface CollapsibleContextValue {
  // Основные состояния
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Состояния анимации
  animationState: AnimationState;
  animationDuration: number;
  
  // Метаданные
  id?: string;
  level: number;
  depth: number;
  path: string[];
  
  // Дополнительные состояния
  isDisabled: boolean;
  isMounted: boolean;
  isHovered: boolean;
  isFocused: boolean;
  
  // История изменений
  stateHistory: StateChange[];
  
  // Методы управления
  toggle: (options?: { skipAnimation?: boolean }) => void;
  expand: (options?: { immediate?: boolean }) => void;
  collapse: (options?: { immediate?: boolean }) => void;
  reset: () => void;
  
  // Настройки
  settings: {
    persistent: boolean;
    autoExpand: boolean;
    nestedBehavior: "independent" | "cascade" | "restrict";
    transitionTiming: "ease" | "linear" | "ease-in" | "ease-out";
    expandOnHover: boolean;
    keyboard: boolean;
  };
  
  // Метрики
  metrics: {
    toggleCount: number;
    lastToggled: string | null;
    mountedAt: string;
    renderCount: number;
  };
}

// Начальное состояние
const initialState: CollapsibleContextValue = {
  open: false,
  onOpenChange: () => {},
  animationState: "idle",
  animationDuration: 300,
  level: 0,
  depth: 0,
  path: [],
  isDisabled: false,
  isMounted: false,
  isHovered: false,
  isFocused: false,
  stateHistory: [],
  toggle: () => {},
  expand: () => {},
  collapse: () => {},
  reset: () => {},
  settings: {
    persistent: false,
    autoExpand: false,
    nestedBehavior: "independent",
    transitionTiming: "ease",
    expandOnHover: false,
    keyboard: true,
  },
  metrics: {
    toggleCount: 0,
    lastToggled: null,
    mountedAt: new Date().toISOString(),
    renderCount: 0,
  }
};

// Создание контекста
const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

// Опции для провайдера
interface CollapsibleProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
  level?: number;
  disabled?: boolean;
  persistent?: boolean;
  autoExpand?: boolean;
  nestedBehavior?: "independent" | "cascade" | "restrict";
  transitionTiming?: "ease" | "linear" | "ease-in" | "ease-out";
  expandOnHover?: boolean;
  keyboard?: boolean;
  onStateChange?: (change: StateChange) => void;
}

export const CollapsibleProvider: React.FC<CollapsibleProviderProps> = ({
  children,
  defaultOpen = false,
  id,
  level = 0,
  disabled = false,
  persistent = false,
  autoExpand = false,
  nestedBehavior = "independent",
  transitionTiming = "ease",
  expandOnHover = false,
  keyboard = true,
  onStateChange,
}) => {
  // Состояния
  const [open, setOpen] = React.useState<boolean>(() => {
    if (persistent && id) {
      try {
        const saved = localStorage.getItem(`collapsible-${id}`);
        return saved ? JSON.parse(saved) : defaultOpen;
      } catch {
        return defaultOpen;
      }
    }
    return defaultOpen;
  });
  
  const [animationState, setAnimationState] = React.useState<AnimationState>("idle");
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [stateHistory, setStateHistory] = React.useState<StateChange[]>([]);
  const [metrics, setMetrics] = React.useState({
    toggleCount: 0,
    lastToggled: null as string | null,
    mountedAt: new Date().toISOString(),
    renderCount: 0,
  });

  // Refs
  const mounted = React.useRef(false);
  const renderCount = React.useRef(0);

  // Эффекты
  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false };
  }, []);

  React.useEffect(() => {
    renderCount.current += 1;
    setMetrics(prev => ({ ...prev, renderCount: renderCount.current }));
  });

  // Обработка изменений состояния
  const handleStateChange = React.useCallback((newOpen: boolean) => {
    const change: StateChange = {
      timestamp: new Date().toISOString(),
      previousState: open,
      newState: newOpen,
      triggeredBy: "Artyomkun", // Используем текущего пользователя
    };

    setStateHistory(prev => [...prev, change]);
    onStateChange?.(change);

    if (persistent && id) {
      localStorage.setItem(`collapsible-${id}`, JSON.stringify(newOpen));
    }

    setMetrics(prev => ({
      ...prev,
      toggleCount: prev.toggleCount + 1,
      lastToggled: new Date().toISOString(),
    }));
  }, [open, persistent, id, onStateChange]);

  // Методы управления
  const toggle = React.useCallback(({ skipAnimation = false } = {}) => {
    if (disabled) return;
    
    if (!skipAnimation) {
      setAnimationState(open ? "exiting" : "entering");
    }
    
    setOpen(prev => {
      const newState = !prev;
      handleStateChange(newState);
      return newState;
    });
  }, [open, disabled, handleStateChange]);

  const expand = React.useCallback(({ immediate = false } = {}) => {
    if (disabled || open) return;
    
    if (!immediate) {
      setAnimationState("entering");
    }
    
    setOpen(true);
    handleStateChange(true);
  }, [open, disabled, handleStateChange]);

  const collapse = React.useCallback(({ immediate = false } = {}) => {
    if (disabled || !open) return;
    
    if (!immediate) {
      setAnimationState("exiting");
    }
    
    setOpen(false);
    handleStateChange(false);
  }, [open, disabled, handleStateChange]);

  const reset = React.useCallback(() => {
    setOpen(defaultOpen);
    setAnimationState("idle");
    setStateHistory([]);
    setMetrics({
      toggleCount: 0,
      lastToggled: null,
      mountedAt: new Date().toISOString(),
      renderCount: renderCount.current,
    });
  }, [defaultOpen]);

  // Собираем значение контекста
  const value = React.useMemo(() => ({
    open,
    onOpenChange: (newOpen: boolean) => {
      if (newOpen !== open) {
        if (newOpen) expand();
        else collapse();
      }
    },
    animationState,
    animationDuration: 300,
    id,
    level,
    depth: level,
    path: id ? id.split('/') : [],
    isDisabled: disabled,
    isMounted: mounted.current,
    isHovered,
    isFocused,
    stateHistory,
    toggle,
    expand,
    collapse,
    reset,
    settings: {
      persistent,
      autoExpand,
      nestedBehavior,
      transitionTiming,
      expandOnHover,
      keyboard,
    },
    metrics,
  }), [
    open, animationState, id, level, disabled,
    isHovered, isFocused, stateHistory,
    toggle, expand, collapse, reset,
    persistent, autoExpand, nestedBehavior,
    transitionTiming, expandOnHover, keyboard,
    metrics,
  ]);

  return (
    <CollapsibleContext.Provider value={value}>
      {children}
    </CollapsibleContext.Provider>
  );
};

// Хук для использования контекста
export function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  
  if (!context) {
    throw new Error(
      "useCollapsibleContext must be used within a CollapsibleProvider"
    );
  }
  
  return context;
}

// Дополнительные специализированные хуки
export function useCollapsibleState() {
  const { open, animationState, isDisabled } = useCollapsibleContext();
  return { open, animationState, isDisabled };
}

export function useCollapsibleControls() {
  const { toggle, expand, collapse, reset } = useCollapsibleContext();
  return { toggle, expand, collapse, reset };
}

export function useCollapsibleMetrics() {
  const { metrics, stateHistory } = useCollapsibleContext();
  return { metrics, stateHistory };
}

export default CollapsibleContext;

CollapsibleContent.displayName = "CollapsibleContent";

export { CollapsibleContent };