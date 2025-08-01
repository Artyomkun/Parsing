import React from 'react';

interface ChevronUpProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const ChevronUp = ({
  size = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}: ChevronUpProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`chevron-up-icon ${className}`}
    aria-hidden="true"
    {...props}
  >
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

export default ChevronUp;