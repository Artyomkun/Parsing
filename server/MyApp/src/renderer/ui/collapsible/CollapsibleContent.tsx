import React from "react";
import classNames from 'classnames';

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { className, children, ...rest } = props;

  return (
    <div
      ref={ref}
      className={classNames(
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
