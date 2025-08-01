import * as React from "react";
import { useCollapsibleContext } from "./CollapsibleContext";
import { cn } from '@/lib/cn';

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

CollapsibleContent.displayName = "CollapsibleContent";

export { CollapsibleContent };