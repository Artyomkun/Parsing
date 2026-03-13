import React from "react";
import cn from "classnames";

interface TableIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const TableIcon = React.forwardRef<SVGSVGElement, TableIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-table", className)} // теперь cn работает
      {...props}
    >
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  )
);

TableIcon.displayName = "TableIcon";

export { TableIcon };
