import * as React from "react";


interface TableIconProps {
  size?: number; // Пропс size с типом number, опциональный
}

export const TableIcon: React.FC<TableIconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3h18v18H3z" />
  </svg>
);