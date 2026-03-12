import React from "react";
import { cva, type VariantProps } from "class-variance-authority"; 
import { Slot } from '@radix-ui/react-slot';

// Define button variants using cva
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        md: "h-10 px-5 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10 p-0 flex items-center justify-center", // Добавлено выравнивание по центру
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Экспорт типов для использования в других компонентах
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    icon,
    children, 
    ...props 
  }, ref) => {
    
    const Comp = asChild ? Slot : "button";
    const isIconOnly = size === "icon" && !children;
    
    return (
      <Comp
        className={buttonVariants({ 
          variant, 
          size, 
          className,
          // Автоматическое определение icon-only
          ...(isIconOnly && { size: "icon" }) 
        })}
        ref={ref}
        disabled={props.disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
            {children}
          </span>
        ) : (
          <>
            {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
            {children}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";